import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";

// Storage is shared between tests here: start each with no Schools and an
// empty cache.
beforeEach(async () => {
  await env.DB.exec("DELETE FROM school");
  for (const k of (await env.CACHE.list()).keys) {
    await env.CACHE.delete(k.name);
  }
});

const ORIGIN = "http://example.com";
type SchoolJson = { school: { id: string; name: string } };

const create = (name: string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}/schools`, {
    method: "POST",
    headers: cookie ? { cookie } : {},
    body: new URLSearchParams({ name }),
    redirect: "manual",
  });
const suggest = (q: string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}/schools?q=${encodeURIComponent(q)}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
const names = async (res: Response) =>
  ((await res.json()) as { schools: { name: string }[] }).schools.map(
    (s) => s.name,
  );
const created = async (name: string, cookie: string) =>
  ((await (await create(name, cookie)).json()) as SchoolJson).school;

describe("School find-or-create (POST /schools)", () => {
  it("is login-walled", async () => {
    expect((await create("রূপনগর হাই স্কুল")).status).toBe(302);
    expect((await suggest("রূপ")).status).toBe(302);
  });

  it("creates a School and returns it", async () => {
    const { cookie } = await signInAs();
    const res = await create("রূপনগর হাই স্কুল", cookie);
    expect(res.status).toBe(200);
    const { school } = (await res.json()) as SchoolJson;
    expect(school.name).toBe("রূপনগর হাই স্কুল");
    expect(school.id).toBeTruthy();
  });

  it("resolves whitespace variants to the same School", async () => {
    const { cookie } = await signInAs();
    const ids = new Set<string>();
    for (const n of ["রূপনগর হাই স্কুল", "  রূপনগর   হাই স্কুল ", "রূপনগর\tহাই\nস্কুল"]) {
      ids.add((await created(n, cookie)).id);
    }
    expect(ids.size).toBe(1);
  });

  it("resolves Unicode variants (NFC vs NFD) to the same School", async () => {
    const { cookie } = await signInAs();
    const a = await created("Café School", cookie);
    const b = await created("Café School", cookie);
    expect(a.id).toBe(b.id);
    expect(b.name).toBe("Café School".normalize("NFC"));
  });

  it("rejects an empty name", async () => {
    const { cookie } = await signInAs();
    expect((await create("   ", cookie)).status).toBe(400);
  });

  it("creates distinct Schools for distinct names", async () => {
    const { cookie } = await signInAs();
    const a = await created("School A", cookie);
    const b = await created("School B", cookie);
    expect(a.id).not.toBe(b.id);
  });
});

describe("School suggestions (GET /schools?q=)", () => {
  it("returns Schools whose name contains the query", async () => {
    const { cookie } = await signInAs();
    await created("রূপনগর হাই স্কুল", cookie);
    await created("রূপনগর সরকারি কলেজ", cookie);
    await created("মতিঝিল মডেল স্কুল", cookie);
    const res = await suggest("রূপনগর", cookie);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect((await names(res)).sort()).toEqual(
      ["রূপনগর সরকারি কলেজ", "রূপনগর হাই স্কুল"].sort(),
    );
  });

  it("matches substrings and normalises the query", async () => {
    const { cookie } = await signInAs();
    await created("মতিঝিল মডেল স্কুল", cookie);
    expect(await names(await suggest("  মডেল  ", cookie))).toEqual([
      "মতিঝিল মডেল স্কুল",
    ]);
  });

  it("treats % and _ in the query literally", async () => {
    const { cookie } = await signInAs();
    await created("School A", cookie);
    expect(await names(await suggest("%", cookie))).toEqual([]);
    expect(await names(await suggest("_", cookie))).toEqual([]);
  });

  it("returns some Schools for an empty query", async () => {
    const { cookie } = await signInAs();
    await created("School A", cookie);
    expect(await names(await suggest("", cookie))).toEqual(["School A"]);
  });
});

describe("English names", () => {
  const withEn = async (name: string, nameEn: string | null) => {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO school (id, name, name_en) VALUES (?, ?, ?)",
    )
      .bind(id, name, nameEn)
      .run();
  };

  it("find-or-create reuses a School when the English name matches", async () => {
    const { cookie } = await signInAs();
    await withEn("ফরিদপুর জিলা স্কুল", "Faridpur Zilla School");
    const row = await created("faridpur zilla school", cookie);
    expect(row.name).toBe("ফরিদপুর জিলা স্কুল");
  });

  it("finds the Bangla-named School by an English query", async () => {
    const { cookie } = await signInAs();
    await withEn("ফরিদপুর জিলা স্কুল", "Faridpur Zilla School");
    expect(await names(await suggest("zilla", cookie))).toEqual([
      "ফরিদপুর জিলা স্কুল",
    ]);
    expect(await names(await suggest("  ZILLA  sch", cookie))).toEqual([
      "ফরিদপুর জিলা স্কুল",
    ]);
    expect(await names(await suggest("ZILLA", cookie))).toEqual([
      "ফরিদপুর জিলা স্কুল",
    ]);
  });

  it("still matches Bangla queries", async () => {
    const { cookie } = await signInAs();
    await withEn("ফরিদপুর জিলা স্কুল", "Faridpur Zilla School");
    expect(await names(await suggest("জিলা", cookie))).toEqual([
      "ফরিদপুর জিলা স্কুল",
    ]);
  });

  it("is fine with a null English name", async () => {
    const { cookie } = await signInAs();
    await withEn("রূপনগর হাই স্কুল", null);
    expect(await names(await suggest("zilla", cookie))).toEqual([]);
    expect(await names(await suggest("রূপনগর", cookie))).toEqual([
      "রূপনগর হাই স্কুল",
    ]);
  });

  it("escapes % and _ on the English side", async () => {
    const { cookie } = await signInAs();
    await withEn("স্কুল", "Plain School");
    expect(await names(await suggest("%", cookie))).toEqual([]);
    expect(await names(await suggest("_", cookie))).toEqual([]);
  });

  it("leaves name_en null for Schools created through POST", async () => {
    const { cookie } = await signInAs();
    const s = await created("School A", cookie);
    const row = await env.DB.prepare("SELECT name_en FROM school WHERE id = ?")
      .bind(s.id)
      .first<{ name_en: string | null }>();
    expect(row?.name_en).toBeNull();
  });
});

describe("suggestion cache", () => {
  it("stores results in KV", async () => {
    const { cookie } = await signInAs();
    await created("Cached School", cookie);
    await suggest("Cached", cookie);
    const keys = await env.CACHE.list({ prefix: "schools:suggest:" });
    expect(keys.keys.length).toBe(1);
  });

  it("is invalidated when a School is created", async () => {
    const { cookie } = await signInAs();
    await created("Rupnagar High", cookie);
    expect(await names(await suggest("Rupnagar", cookie))).toEqual([
      "Rupnagar High",
    ]);
    await created("Rupnagar College", cookie);
    expect((await names(await suggest("Rupnagar", cookie))).sort()).toEqual([
      "Rupnagar College",
      "Rupnagar High",
    ]);
  });

  it("stays correct when the cache is unavailable", async () => {
    const { cookie } = await signInAs();
    await created("Plain School", cookie);
    const get = env.CACHE.get;
    const put = env.CACHE.put;
    // biome-ignore lint/suspicious/noExplicitAny: simulate a KV outage
    (env.CACHE as any).get = () => Promise.reject(new Error("kv down"));
    // biome-ignore lint/suspicious/noExplicitAny: simulate a KV outage
    (env.CACHE as any).put = () => Promise.reject(new Error("kv down"));
    try {
      expect(await names(await suggest("Plain", cookie))).toEqual([
        "Plain School",
      ]);
      expect((await create("Plain School", cookie)).status).toBe(200);
    } finally {
      env.CACHE.get = get;
      env.CACHE.put = put;
    }
  });
});
