import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";
const open = (id: string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}/stories/${id}`, {
    headers: cookie ? { cookie } : {},
  });
const readTotal = async (id: string) =>
  (
    await env.DB.prepare("SELECT read_total AS n FROM story WHERE id = ?")
      .bind(id)
      .first<{ n: number }>()
  )?.n;

describe("Read count", () => {
  it("counts a reader once, even when they open the Story twice", async () => {
    const { story } = await createStory();
    const { cookie } = await signInAs();
    await (await open(story.id, cookie)).text();
    await (await open(story.id, cookie)).text();
    expect(await readTotal(story.id)).toBe(1);
    const other = await signInAs();
    await (await open(story.id, other.cookie)).text();
    expect(await readTotal(story.id)).toBe(2);
  });

  it("does not count the Writer or a logged-out visitor", async () => {
    const { story, cookie } = await createStory();
    await (await open(story.id, cookie)).text();
    await (await open(story.id)).text();
    expect(await readTotal(story.id)).toBe(0);
  });

  it("shows the count on the Story page, including this reader", async () => {
    const { story } = await createStory();
    const { cookie } = await signInAs();
    const html = await (await open(story.id, cookie)).text();
    expect(html).toContain('aria-label="১ জন পড়েছে"');
  });

  it("shows the count on the feed card", async () => {
    const { story } = await createStory();
    await env.DB.prepare("UPDATE story SET read_total = 7 WHERE id = ?")
      .bind(story.id)
      .run();
    const { cookie } = await signInAs();
    const html = await (
      await exports.default.fetch(`${ORIGIN}/feed`, { headers: { cookie } })
    ).text();
    expect(html).toContain('aria-label="৭ জন পড়েছে"');
  });
});
