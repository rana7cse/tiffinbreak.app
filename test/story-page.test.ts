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
  it("is login-walled", async () => {
    const { story } = await createStory();
    const res = await get(story.id);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/login?returnTo=");
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
