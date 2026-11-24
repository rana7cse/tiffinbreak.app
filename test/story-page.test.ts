import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const get = (id: string, cookie?: string) =>
  exports.default.fetch(`http://example.com/stories/${id}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });

describe("Story page (GET /stories/:id)", () => {
  describe("logged out (public Story pages, temporary owner decision)", () => {
    it("renders the full Story with a login CTA instead of Love", async () => {
      const { story, writer, school } = await createStory({
        title: "টিফিনের পরোটা",
        body: "প্রথম অনুচ্ছেদ।\n\nগোপন নয় এমন দ্বিতীয় অনুচ্ছেদ।",
        coverKey: "covers/abc.jpg",
      });
      const res = await get(story.id);
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain("<h1");
      expect(html).toContain("টিফিনের পরোটা");
      expect(html).toContain("<p>প্রথম অনুচ্ছেদ।</p>");
      expect(html).toContain("<p>গোপন নয় এমন দ্বিতীয় অনুচ্ছেদ।</p>");
      expect(html).toContain("/covers/abc.jpg");
      expect(html).toContain(writer?.name);
      expect(html).toContain(school.name);
      // No Love or Report for a visitor: a login CTA takes their place.
      expect(html).not.toContain('aria-label="ভালোবাসা দাও"');
      expect(html).not.toContain("রিপোর্ট করো");
      expect(html).toContain("লগইন করে ভালোবাসা দাও");
      expect(html).toContain(
        `href="/login?returnTo=${encodeURIComponent(`/stories/${story.id}`)}"`,
      );
    });

    it("redirects a logged-out POST to login", async () => {
      const { story } = await createStory();
      const res = await exports.default.fetch(
        `http://example.com/stories/${story.id}`,
        {
          method: "POST",
          body: new URLSearchParams({ intent: "report" }),
          redirect: "manual",
        },
      );
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toContain("/login?returnTo=");
    });

    it("is a 404 for hidden and unknown Stories", async () => {
      const { story } = await createStory({ hidden: true });
      for (const id of [story.id, "nope"]) {
        expect((await get(id)).status).toBe(404);
      }
    });

    it("serves 200 with tags to Facebook's crawler, no redirect", async () => {
      const { story } = await createStory();
      const res = await exports.default.fetch(
        `http://example.com/stories/${story.id}`,
        {
          headers: { "user-agent": "facebookexternalhit/1.1" },
          redirect: "manual",
        },
      );
      expect(res.status).toBe(200);
      expect(await res.text()).toContain('property="og:title"');
    });
  });

  describe("share metadata", () => {
    const tag = (html: string, key: string) =>
      html.match(
        new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`),
      )?.[1];

    it("describes the Story with an excerpt and the full Writer name", async () => {
      const body = `${Array.from({ length: 80 }, (_, i) => `শব্দ${i}`).join(" ")}\n\nশেষ।`;
      const { story, writer, school } = await createStory({
        title: "টিফিনের পরোটা",
        body,
        coverKey: "covers/abc.jpg",
      });
      const html = await (await get(story.id)).text();
      const id = story.id;

      const description = tag(html, "og:description") ?? "";
      expect(description).toMatch(/^শব্দ0 শব্দ1 /);
      expect(description).toContain("… — ");
      expect(description).toContain(`${writer?.name}, ${school.name}`);
      expect(description).not.toContain("লগইন");
      const excerpt = description.split("… — ")[0] ?? "";
      expect(excerpt.length).toBeLessThanOrEqual(160);
      expect(excerpt).not.toMatch(/\s$/);
      expect(tag(html, "twitter:description")).toBe(description);
      expect(tag(html, "description")).toBe(description);

      expect(tag(html, "og:title")).toBe("টিফিনের পরোটা");
      expect(tag(html, "twitter:title")).toBe("টিফিনের পরোটা");
      expect(html).toContain("<title>টিফিনের পরোটা | টিফিনব্রেক</title>");
      expect(tag(html, "og:site_name")).toBe("টিফিনব্রেক");
      expect(tag(html, "og:locale")).toBe("bn_BD");
      expect(tag(html, "og:type")).toBe("article");
      expect(tag(html, "og:url")).toBe(`http://example.com/stories/${id}`);
      expect(html).toContain(
        `<link rel="canonical" href="http://example.com/stories/${id}"`,
      );
      expect(tag(html, "article:author")).toBe(writer?.name);
      expect(tag(html, "article:published_time")).toMatch(
        /^\d{4}-\d{2}-\d{2}T/,
      );
      expect(tag(html, "og:image")).toBe("http://example.com/covers/abc.jpg");
      expect(tag(html, "og:image:type")).toBe("image/jpeg");
      expect(tag(html, "og:image:alt")).toBe("টিফিনের পরোটা");
      expect(tag(html, "og:image:width")).toBeUndefined();
      expect(tag(html, "twitter:image")).toBe(
        "http://example.com/covers/abc.jpg",
      );
    });

    it("keeps a short body whole, without an ellipsis", async () => {
      const { story } = await createStory({ body: "ছোট\n\n  গল্প।" });
      const html = await (await get(story.id)).text();
      expect(tag(html, "og:description")).toMatch(/^ছোট গল্প। — /);
    });

    it("falls back to the default branded image without a cover", async () => {
      const { story } = await createStory();
      const html = await (await get(story.id)).text();
      expect(tag(html, "og:image")).toBe("http://example.com/og-default.png");
      expect(tag(html, "og:image:type")).toBe("image/png");
      expect(tag(html, "og:image:width")).toBe("1200");
      expect(tag(html, "og:image:height")).toBe("630");
      expect(tag(html, "twitter:image")).toBe(
        "http://example.com/og-default.png",
      );
    });

    it("also carries the tags for a signed-in reader", async () => {
      const { story, cookie } = await createStory();
      const html = await (await get(story.id, cookie)).text();
      expect(html).toContain('property="og:title"');
      expect(html).toContain("বন্ধুদের পাঠাও");
    });
  });

  it("logged-in Story page keeps Love and Report", async () => {
    const { cookie } = await signInAs();
    const { story } = await createStory();
    const html = await (await get(story.id, cookie)).text();
    expect(html).toContain('aria-label="ভালোবাসা দাও"');
    expect(html).toContain("রিপোর্ট করো");
    expect(html).not.toContain("লগইন করে ভালোবাসা দাও");
  });

  it("renders title, body, Writer, School, date and reading time", async () => {
    const { cookie: readerCookie } = await signInAs();
    const { story, school, writer } = await createStory({
      title: "টিফিনের পরোটা",
      body: "প্রথম অনুচ্ছেদ।\n\nদ্বিতীয় অনুচ্ছেদ।",
      schoolName: "রূপনগর হাই স্কুল",
      // 21 Nov 2026, 12:00 in Dhaka
      createdAt: new Date("2026-11-21T06:00:00Z"),
      loveTotal: 24,
    });
    const res = await get(story.id, readerCookie);
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("টিফিনের পরোটা");
    expect(html).toContain("<p>প্রথম অনুচ্ছেদ।</p>");
    expect(html).toContain("<p>দ্বিতীয় অনুচ্ছেদ।</p>");
    expect(html).toContain(writer?.name);
    expect(html).toContain(school.name);
    expect(html).toContain("২১ নভেম্বর");
    expect(html).toContain("১ মিনিটের গল্প");
    expect(html).toContain("২৪"); // love total
    expect(html).toContain("tb-app tb-app--reading");
  });

  it("derives reading time from word count (about 200 words a minute)", async () => {
    const { cookie } = await signInAs();
    const body = Array.from({ length: 450 }, () => "শব্দ").join(" ");
    const { story } = await createStory({ body });
    const html = await (await get(story.id, cookie)).text();
    expect(html).toContain("৩ মিনিটের গল্প");
  });

  it("shows a cover only when the Story has one", async () => {
    const { cookie } = await signInAs();
    const plain = await createStory();
    const covered = await createStory({ coverKey: "covers/abc.jpg" });
    expect(await (await get(plain.story.id, cookie)).text()).not.toContain(
      "covers/abc.jpg",
    );
    expect(await (await get(covered.story.id, cookie)).text()).toContain(
      "covers/abc.jpg",
    );
  });

  it("returns 404 for an unknown id", async () => {
    const { cookie } = await signInAs();
    expect((await get("nope", cookie)).status).toBe(404);
  });

  describe("hidden Story", () => {
    it("is a 404 for other readers", async () => {
      const { cookie } = await signInAs();
      const { story } = await createStory({ hidden: true });
      expect((await get(story.id, cookie)).status).toBe(404);
    });

    it("is visible to its Writer", async () => {
      const { story, cookie } = await createStory({ hidden: true });
      expect((await get(story.id, cookie)).status).toBe(200);
    });

    it("is visible to an Admin", async () => {
      const { cookie, writer } = await signInAs();
      await env.DB.prepare("UPDATE user SET role = 'admin' WHERE id = ?")
        .bind(writer.id)
        .run();
      const { story } = await createStory({ hidden: true });
      expect((await get(story.id, cookie)).status).toBe(200);
    });
  });
});
