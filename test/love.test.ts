import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";

const love = (id: string, count: number | string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}/stories/${id}/love`, {
    method: "POST",
    headers: cookie ? { cookie } : {},
    body: new URLSearchParams({ count: String(count) }),
    redirect: "manual",
  });
const page = async (id: string, cookie: string) =>
  (
    await exports.default.fetch(`${ORIGIN}/stories/${id}`, {
      headers: { cookie },
    })
  ).text();
const storyTotal = async (id: string) =>
  (
    await env.DB.prepare("SELECT love_total AS t FROM story WHERE id = ?")
      .bind(id)
      .first<{ t: number }>()
  )?.t;

describe("Love (POST /stories/:id/love)", () => {
  it("is login-walled", async () => {
    const { story } = await createStory();
    expect((await love(story.id, 1)).status).toBe(302);
  });

  it("adds Love and returns my count and the Story total", async () => {
    const { story } = await createStory({ loveTotal: 5 });
    const { cookie } = await signInAs();
    const res = await love(story.id, 3, cookie);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ mine: 3, total: 3 });
    expect(await storyTotal(story.id)).toBe(3);
  });

  it("is cumulative per reader and capped at 10", async () => {
    const { story } = await createStory();
    const { cookie } = await signInAs();
    await love(story.id, 6, cookie);
    const res = await love(story.id, 7, cookie);
    expect(await res.json()).toEqual({ mine: 10, total: 10 });
    const again = await love(story.id, 1, cookie);
    expect(await again.json()).toEqual({ mine: 10, total: 10 });
  });

  it("clamps a huge batch to the cap", async () => {
    const { story } = await createStory();
    const { cookie } = await signInAs();
    expect(await (await love(story.id, 500, cookie)).json()).toEqual({
      mine: 10,
      total: 10,
    });
  });

  it("rejects invalid counts and never decreases", async () => {
    const { story } = await createStory();
    const { cookie } = await signInAs();
    await love(story.id, 4, cookie);
    for (const bad of [0, -3, "abc", "1.5", ""]) {
      expect((await love(story.id, bad, cookie)).status).toBe(400);
    }
    expect(await storyTotal(story.id)).toBe(4);
  });

  it("rejects Love on your own Story", async () => {
    const { story, cookie } = await createStory();
    const res = await love(story.id, 1, cookie);
    expect(res.status).toBe(403);
    expect(await storyTotal(story.id)).toBe(0);
  });

  it("404s for a missing Story and a hidden Story the reader cannot read", async () => {
    const { cookie } = await signInAs();
    expect((await love(crypto.randomUUID(), 1, cookie)).status).toBe(404);
    const { story } = await createStory({ hidden: true });
    expect((await love(story.id, 1, cookie)).status).toBe(404);
  });

  it("keeps the total consistent under rapid concurrent requests", async () => {
    const { story } = await createStory();
    const readers = await Promise.all(
      Array.from({ length: 5 }, () => signInAs()),
    );
    await Promise.all(
      readers.flatMap((r) => [3, 4, 5].map((n) => love(story.id, n, r.cookie))),
    );
    // each reader asked for 12, so is capped at 10
    expect(await storyTotal(story.id)).toBe(50);
  });

  it("shows my Love and the total on the Story page", async () => {
    const { story } = await createStory();
    const { cookie } = await signInAs();
    await love(story.id, 2, cookie);
    const other = await signInAs();
    await love(story.id, 3, other.cookie);
    const html = await page(story.id, cookie);
    expect(html).toContain("৫"); // total
    expect(html).toContain("+২"); // mine
  });
});
