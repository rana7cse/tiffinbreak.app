import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";
const BYTES = new Uint8Array([1, 2, 3, 4, 5]);
const webp = () => new File([BYTES], "cover.webp", { type: "image/webp" });

const publish = (cookie: string, schoolId: string, cover?: File) => {
  const form = new FormData();
  form.set("title", "টিফিনের পরোটা");
  form.set("body", "মা গুনে গুনে তিনটা দিতেন।");
  form.set("schoolId", schoolId);
  if (cover) form.set("cover", cover);
  return exports.default.fetch(`${ORIGIN}/write`, {
    method: "POST",
    headers: { cookie },
    body: form,
    redirect: "manual",
  });
};

const coverKeyOf = async (storyId: string) =>
  (
    await env.DB.prepare("SELECT cover_key FROM story WHERE id = ?")
      .bind(storyId)
      .first<{ cover_key: string | null }>()
  )?.cover_key;

const storyIdFrom = (res: Response) =>
  (res.headers.get("location") as string).split("/").pop() as string;

const storyCount = async () =>
  (
    await env.DB.prepare("SELECT count(*) AS n FROM story").first<{
      n: number;
    }>()
  )?.n;

let schoolId: string;

beforeEach(async () => {
  await env.DB.exec("DELETE FROM story");
  const { school } = await createStory();
  schoolId = school.id;
  await env.DB.exec("DELETE FROM story");
});

describe("publishing with a cover photo", () => {
  it("stores a webp cover under a random key and serves it publicly", async () => {
    const { cookie } = await signInAs();
    const res = await publish(cookie, schoolId, webp());
    expect(res.status).toBe(302);
    const key = await coverKeyOf(storyIdFrom(res));
    expect(key).toMatch(/^[0-9a-f]{32}\.webp$/);

    // No cookie: the route is outside the login wall.
    const img = await exports.default.fetch(`${ORIGIN}/covers/${key}`);
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/webp");
    expect(img.headers.get("cache-control")).toContain("public");
    expect(img.headers.get("cache-control")).toContain("immutable");
    expect(new Uint8Array(await img.arrayBuffer())).toEqual(BYTES);
  });

  it("gives two covers different keys", async () => {
    const { cookie } = await signInAs();
    const a = await coverKeyOf(
      storyIdFrom(await publish(cookie, schoolId, webp())),
    );
    const b = await coverKeyOf(
      storyIdFrom(await publish(cookie, schoolId, webp())),
    );
    expect(a).not.toBe(b);
  });

  it("publishes without a cover", async () => {
    const { cookie } = await signInAs();
    const res = await publish(cookie, schoolId);
    expect(res.status).toBe(302);
    expect(await coverKeyOf(storyIdFrom(res))).toBeNull();
  });

  it("rejects a wrong file type and publishes nothing", async () => {
    const { cookie } = await signInAs();
    const res = await publish(
      cookie,
      schoolId,
      new File([BYTES], "x.gif", { type: "image/gif" }),
    );
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("JPG");
    expect(await storyCount()).toBe(0);
  });

  it("rejects an oversized file", async () => {
    const { cookie } = await signInAs();
    const big = new Uint8Array(3 * 1024 * 1024 + 1);
    const res = await publish(
      cookie,
      schoolId,
      new File([big], "big.webp", { type: "image/webp" }),
    );
    expect(res.status).toBe(400);
    expect(await storyCount()).toBe(0);
  });
});

describe("GET /covers/:key", () => {
  it("404s for an unknown key", async () => {
    const res = await exports.default.fetch(
      `${ORIGIN}/covers/${"0".repeat(32)}.webp`,
    );
    expect(res.status).toBe(404);
  });
});

describe("cover on pages", () => {
  it("shows the cover on the Story page", async () => {
    const { cookie } = await signInAs();
    const key = `${"a".repeat(32)}.webp`;
    const { story } = await createStory({ coverKey: key });
    const res = await exports.default.fetch(`${ORIGIN}/stories/${story.id}`, {
      headers: { cookie },
    });
    expect(await res.text()).toContain(`/covers/${key}`);
  });
});
