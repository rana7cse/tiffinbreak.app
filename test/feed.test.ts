import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { bumpFeedVersion } from "~/lib/stories";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";
const get = (path: string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });

// Storage is shared between tests: start each with no Stories and no cache.
beforeEach(async () => {
  await env.DB.exec("DELETE FROM story");
  for (const k of (await env.CACHE.list()).keys) {
    await env.CACHE.delete(k.name);
  }
});

const titlesIn = (html: string) =>
  [...html.matchAll(/<h3 class="tb-story-card__title">([^<]*)<\/h3>/g)].map(
    (m) => m[1],
  );

describe("Feed (GET /feed)", () => {
  it("is login-walled", async () => {
    const res = await get("/feed");
    expect(res.status).toBe(302);
  });

  it("shows the diary empty state, inviting the Writer to write, when there are no Stories", async () => {
    const { cookie } = await signInAs();
    const html = await (await get("/feed", cookie)).text();
    expect(html).toContain("ডায়েরির প্রথম পাতাটা এখনো খালি");
    expect(html).toContain('href="/write"');
    expect(html).not.toContain("tb-story-card__title");
  });

  it("lists Stories newest first as cards with title, excerpt, Writer, School, date and Love", async () => {
    const { cookie } = await signInAs();
    const older = await createStory({
      title: "পুরোনো গল্প",
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    });
    const newer = await createStory({
      title: "নতুন গল্প একটা",
      body: "ক্লাস সেভেনে রোজ টিফিন বক্স খুলে দেখতাম।",
      schoolName: "শান্তিনগর গার্লস স্কুল",
      loveTotal: 24,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
    });
    const html = await (await get("/feed", cookie)).text();

    expect(titlesIn(html)).toEqual(["নতুন গল্প একটা", "পুরোনো গল্প"]);
    expect(html).toContain("ক্লাস সেভেনে রোজ টিফিন বক্স খুলে দেখতাম।");
    expect(html).toContain("গল্পকার");
    expect(html).toContain("শান্তিনগর গার্লস স্কুল");
    expect(html).toContain("২ ঘণ্টা আগে");
    expect(html).toContain("৩ দিন আগে");
    expect(html).toContain('<span class="tb-love__count">২৪</span>');
    expect(html).toContain(`href="/stories/${newer.story.id}"`);
    expect(html).toContain(`href="/schools/${newer.school.id}"`);
    expect(html).toContain(`href="/stories/${older.story.id}"`);
  });

  it("links the Writer to /writers/:handle", async () => {
    const { cookie } = await signInAs();
    const { writer } = await createStory();
    await env.DB.prepare("UPDATE user SET handle = ? WHERE id = ?")
      .bind("gollokar", writer?.id)
      .run();
    const html = await (await get("/feed", cookie)).text();
    expect(html).toContain(`href="/writers/gollokar"`);
  });

  it("shows a cover only for Stories that have one", async () => {
    const { cookie } = await signInAs();
    await createStory({ coverKey: "covers/abc.jpg" });
    await createStory({ title: "ছবি ছাড়া" });
    const html = await (await get("/feed", cookie)).text();
    expect(html.match(/tb-story-card__photo/g)?.length).toBe(1);
    expect(html).toContain("/covers/abc.jpg");
  });

  it("never shows hidden Stories", async () => {
    const { cookie } = await signInAs();
    await createStory({ title: "দেখা যাবে" });
    await createStory({ title: "লুকানো", hidden: true });
    const html = await (await get("/feed", cookie)).text();
    expect(titlesIn(html)).toEqual(["দেখা যাবে"]);
  });

  it("paginates older Stories by cursor without duplicates, even with equal timestamps", async () => {
    const { cookie } = await signInAs();
    const at = Date.now() - 10_000_000;
    for (let i = 0; i < 25; i++) {
      // Pairs share a timestamp to exercise the tie-break.
      await createStory({
        title: `গল্প ${i}`,
        createdAt: new Date(at - Math.floor(i / 2)),
      });
    }

    const seen: string[] = [];
    let path: string | null = "/feed";
    let pages = 0;
    while (path) {
      const html: string = await (await get(path, cookie)).text();
      seen.push(...titlesIn(html));
      const next: RegExpMatchArray | null = html.match(
        /<a [^>]*href="(\/feed\?cursor=[^"]+)"/,
      );
      path = next ? (next[1] as string).replaceAll("&amp;", "&") : null;
      pages++;
    }
    expect(pages).toBeGreaterThan(1);
    expect(seen).toHaveLength(25);
    expect(new Set(seen).size).toBe(25);
  });

  it("shows a newly published Story at the top once the cache is invalidated", async () => {
    const { cookie } = await signInAs();
    await createStory({ title: "আগের গল্প" });
    expect(titlesIn(await (await get("/feed", cookie)).text())).toEqual([
      "আগের গল্প",
    ]);
    await createStory({ title: "এইমাত্র প্রকাশিত" });
    await bumpFeedVersion(env.CACHE);
    expect(titlesIn(await (await get("/feed", cookie)).text())[0]).toBe(
      "এইমাত্র প্রকাশিত",
    );
  });

  it("drops a Story from the cached first page once enough Reports hide it", async () => {
    const { cookie } = await signInAs();
    const { story } = await createStory({ title: "রিপোর্ট হবে" });
    await createStory({ title: "থাকবে" });
    // Warm the cache.
    expect(titlesIn(await (await get("/feed", cookie)).text())).toContain(
      "রিপোর্ট হবে",
    );
    for (let i = 0; i < 3; i++) {
      const reader = await signInAs();
      await exports.default.fetch(`${ORIGIN}/stories/${story.id}`, {
        method: "POST",
        headers: { cookie: reader.cookie },
        body: new URLSearchParams({ intent: "report" }),
        redirect: "manual",
      });
    }
    expect(titlesIn(await (await get("/feed", cookie)).text())).toEqual([
      "থাকবে",
    ]);
  });

  it("shows a Story published through /write at the top immediately, past a warm cache", async () => {
    const { cookie } = await signInAs();
    await createStory({ title: "আগের গল্প" });
    await get("/feed", cookie); // warm the cache
    const res = await exports.default.fetch(`${ORIGIN}/write`, {
      method: "POST",
      headers: { cookie },
      body: new URLSearchParams({
        title: "সদ্য লেখা",
        body: "একটু লেখা।",
        schoolName: "রূপনগর হাই স্কুল",
      }),
      redirect: "manual",
    });
    expect(res.status).toBe(302);
    expect(titlesIn(await (await get("/feed", cookie)).text())[0]).toBe(
      "সদ্য লেখা",
    );
  });
});
