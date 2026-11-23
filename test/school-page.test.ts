import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const get = (path: string, cookie?: string) =>
  exports.default.fetch(`http://example.com${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });

beforeEach(async () => {
  await env.DB.exec("DELETE FROM story");
});

const titlesIn = (html: string) =>
  [...html.matchAll(/<h3 class="tb-story-card__title">([^<]*)<\/h3>/g)].map(
    (m) => m[1],
  );

describe("School page (GET /schools/:id)", () => {
  it("is login-walled", async () => {
    const { school } = await createStory();
    const res = await get(`/schools/${school.id}`);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("returns 404 for an unknown School", async () => {
    const { cookie } = await signInAs();
    const res = await get("/schools/nope", cookie);
    expect(res.status).toBe(404);
  });

  it("lists only that School's visible Stories, newest first, with name and count", async () => {
    const { cookie } = await signInAs();
    const first = await createStory({
      schoolName: "শান্তিনগর গার্লস স্কুল",
      title: "পুরোনো",
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    });
    await createStory({
      schoolId: first.school.id,
      writerId: first.story.writerId,
      title: "নতুন",
    });
    await createStory({
      schoolId: first.school.id,
      writerId: first.story.writerId,
      title: "লুকানো",
      hidden: true,
    });
    await createStory({ title: "অন্য স্কুলের" });

    const res = await get(`/schools/${first.school.id}`, cookie);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(titlesIn(html)).toEqual(["নতুন", "পুরোনো"]);
    expect(html).toContain("শান্তিনগর গার্লস স্কুল");
    expect(html).toContain("২টা গল্প");
  });

  it("paginates by cursor without duplicates", async () => {
    const { cookie } = await signInAs();
    const first = await createStory({ title: "গল্প ০" });
    for (let i = 1; i < 14; i++) {
      await createStory({
        schoolId: first.school.id,
        writerId: first.story.writerId,
        title: `গল্প ${i}`,
        createdAt: new Date(Date.now() - i * 1000),
      });
    }
    const seen: string[] = [];
    let path: string | null = `/schools/${first.school.id}`;
    let pages = 0;
    while (path) {
      const html: string = await (await get(path, cookie)).text();
      seen.push(...(titlesIn(html) as string[]));
      const next: RegExpMatchArray | null = html.match(
        /<a [^>]*href="(\/schools\/[^"]+\?cursor=[^"]+)"/,
      );
      path = next ? (next[1] as string).replaceAll("&amp;", "&") : null;
      pages++;
    }
    expect(pages).toBe(2);
    expect(new Set(seen).size).toBe(14);
  });

  it("is linked from the Story page", async () => {
    const { story, school } = await createStory();
    const { cookie } = await signInAs();
    const html = await (await get(`/stories/${story.id}`, cookie)).text();
    expect(html).toContain(`href="/schools/${school.id}"`);
  });

  it("keeps /schools without an id as the suggestions endpoint", async () => {
    const { cookie } = await signInAs();
    const res = await get("/schools", cookie);
    expect(res.headers.get("content-type")).toContain("json");
  });
});
