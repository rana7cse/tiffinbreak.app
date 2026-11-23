import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { publishStory, updateStory } from "~/lib/stories";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";
const get = (path: string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });

beforeEach(async () => {
  await env.DB.exec("DELETE FROM story");
  for (const k of (await env.CACHE.list()).keys) {
    await env.CACHE.delete(k.name);
  }
});

const png = () =>
  new File([new Uint8Array([1, 2, 3])], "c.png", { type: "image/png" });
const coverKeys = async () =>
  (await env.COVERS.list({ prefix: "covers/" })).objects.map((o) => o.key);

/** A D1 stand-in whose every write fails, to exercise cleanup paths. */
const brokenDb = {
  prepare() {
    throw new Error("D1 down");
  },
  batch() {
    throw new Error("D1 down");
  },
} as unknown as D1Database;

describe("cover orphans on a failed write", () => {
  it("publishStory deletes the new cover object and rethrows", async () => {
    const before = await coverKeys();
    await expect(
      publishStory(
        { DB: brokenDb, CACHE: env.CACHE, COVERS: env.COVERS },
        {
          writerId: "w",
          schoolId: "s",
          title: "t",
          body: "b",
          cover: png(),
        },
      ),
    ).rejects.toThrow();
    expect(await coverKeys()).toEqual(before);
  });

  it("updateStory deletes the new cover object and rethrows", async () => {
    const before = await coverKeys();
    await expect(
      updateStory(
        { DB: brokenDb, CACHE: env.CACHE, COVERS: env.COVERS },
        { id: "x", coverKey: null },
        {
          title: "t",
          body: "b",
          schoolId: "s",
          cover: png(),
          removeCover: false,
        },
      ),
    ).rejects.toThrow();
    expect(await coverKeys()).toEqual(before);
  });
});

describe("stale draft School", () => {
  it("falls back to the School name when the posted School id is gone", async () => {
    const { cookie } = await signInAs();
    const res = await exports.default.fetch(`${ORIGIN}/write`, {
      method: "POST",
      headers: { cookie },
      body: new URLSearchParams({
        title: "গল্প",
        body: "লেখা",
        schoolId: crypto.randomUUID(),
        schoolName: "মার্জ হওয়া স্কুল",
      }),
      redirect: "manual",
    });
    expect(res.status).toBe(302);
    const row = await env.DB.prepare(
      "SELECT school.name AS name FROM story JOIN school ON school.id = story.school_id",
    ).first();
    expect(row).toEqual({ name: "মার্জ হওয়া স্কুল" });
  });
});

describe("Story page markup", () => {
  it("never nests the School link inside the Writer link", async () => {
    const { story, cookie } = await createStory();
    const html = await (await get(`/stories/${story.id}`, cookie)).text();
    expect(html).toContain(`href="/schools/${story.schoolId}"`);
    let depth = 0;
    for (const m of html.matchAll(/<(\/?)a[\s>]/g)) {
      depth += m[1] ? -1 : 1;
      expect(depth).toBeLessThanOrEqual(1);
    }
  });

  it("renders the cover in the theme's tb-photo block", async () => {
    const { story, cookie } = await createStory({
      coverKey: `covers/${"b".repeat(32)}.jpg`,
    });
    const html = await (await get(`/stories/${story.id}`, cookie)).text();
    expect(html).toMatch(/class="tb-photo"[^>]*>\s*<img[^>]*covers\/b+\.jpg/);
  });
});

describe("Feed diary card", () => {
  it("shows the diary invitation to a Writer with no Stories even when the Feed has Stories", async () => {
    const { cookie } = await signInAs();
    await createStory({ title: "অন্যের গল্প" });
    const html = await (await get("/feed", cookie)).text();
    expect(html).toContain("অন্যের গল্প");
    expect(html).toContain("ডায়েরির প্রথম পাতাটা এখনো খালি");
  });

  it("hides the diary invitation once the Writer has a Story", async () => {
    const { cookie, writer } = await signInAs();
    await createStory({ writerId: writer.id, title: "আমার গল্প" });
    const html = await (await get("/feed", cookie)).text();
    expect(html).toContain("আমার গল্প");
    expect(html).not.toContain("ডায়েরির প্রথম পাতাটা এখনো খালি");
  });
});

describe("Write page footer", () => {
  it("offers the photo button", async () => {
    const { cookie } = await signInAs();
    const html = await (await get("/write", cookie)).text();
    expect(html).toContain('aria-label="ছবি যোগ করো"');
  });
});

describe("Profile rows without a cover", () => {
  it("show the theme's placeholder tile with an icon", async () => {
    const { cookie, writer } = await signInAs();
    await env.DB.prepare("UPDATE user SET handle = ? WHERE id = ?")
      .bind("tile_writer", writer.id)
      .run();
    await createStory({ writerId: writer.id });
    const html = await (await get("/writers/tile_writer", cookie)).text();
    expect(html).toMatch(/tb-row__thumb"[^>]*background:var\(--tb-/);
    expect(html).toMatch(/tb-row__thumb[^>]*><svg/);
  });
});
