import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";

const get = (cookie?: string) =>
  exports.default.fetch(`${ORIGIN}/admin`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
const act = (intent: string, storyId: string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}/admin`, {
    method: "POST",
    headers: cookie ? { cookie } : {},
    body: new URLSearchParams({ intent, storyId }),
    redirect: "manual",
  });

async function adminCookie() {
  const { cookie, writer } = await signInAs();
  await env.DB.prepare("UPDATE user SET role = 'admin' WHERE id = ?")
    .bind(writer.id)
    .run();
  return cookie;
}

async function addReport(storyId: string, reason: string | null) {
  const { writer } = await signInAs();
  await env.DB.prepare(
    "INSERT INTO report (story_id, reader_id, reason, created_at) VALUES (?, ?, ?, ?)",
  )
    .bind(storyId, writer.id, reason, Date.now())
    .run();
}

const storyRow = (id: string) =>
  env.DB.prepare(
    "SELECT hidden AS h, report_count AS c FROM story WHERE id = ?",
  )
    .bind(id)
    .first<{ h: number; c: number }>();

const reportCount = async (storyId: string) =>
  (
    await env.DB.prepare("SELECT COUNT(*) AS n FROM report WHERE story_id = ?")
      .bind(storyId)
      .first<{ n: number }>()
  )?.n;

describe("Admin review", () => {
  it("redirects logged-out visitors to login", async () => {
    const res = await get();
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("403s non-Admins on the page and on actions", async () => {
    const { cookie } = await signInAs();
    expect((await get(cookie)).status).toBe(403);
    const { story } = await createStory({ hidden: true });
    expect((await act("remove", story.id, cookie)).status).toBe(403);
    expect((await act("restore", story.id, cookie)).status).toBe(403);
    expect(await storyRow(story.id)).not.toBeNull();
  });

  it("lists hidden and reported Stories with their Report reasons", async () => {
    const hidden = await createStory({ hidden: true, title: "লুকানো গল্প১" });
    await addReport(hidden.story.id, "অনুপযুক্ত ভাষা");
    const reported = await createStory({
      reportCount: 1,
      title: "রিপোর্টেড গল্প২",
    });
    await addReport(reported.story.id, "ভুল তথ্য");
    const clean = await createStory({ title: "পরিষ্কার গল্প৩" });

    const res = await get(await adminCookie());
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("লুকানো গল্প১");
    expect(html).toContain("অনুপযুক্ত ভাষা");
    expect(html).toContain("রিপোর্টেড গল্প২");
    expect(html).toContain("ভুল তথ্য");
    expect(html).not.toContain(clean.story.title);
  });

  it("restores a Story: unhides, clears Reports, bumps the Feed version", async () => {
    const { story } = await createStory({ hidden: true, reportCount: 3 });
    await addReport(story.id, "x");
    const before = await env.CACHE.get("feed:version");
    const res = await act("restore", story.id, await adminCookie());
    expect(res.status).toBe(303);
    expect(await storyRow(story.id)).toEqual({ h: 0, c: 0 });
    expect(await reportCount(story.id)).toBe(0);
    const after = await env.CACHE.get("feed:version");
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
  });

  it("removes a Story permanently, with its cover and Reports", async () => {
    const key = `covers/${"a".repeat(32)}.jpg`;
    await env.COVERS.put(key, new Uint8Array([1, 2, 3]));
    const { story } = await createStory({ hidden: true, coverKey: key });
    await addReport(story.id, "x");
    const before = await env.CACHE.get("feed:version");
    const res = await act("remove", story.id, await adminCookie());
    expect(res.status).toBe(303);
    expect(await storyRow(story.id)).toBeNull();
    expect(await env.COVERS.get(key)).toBeNull();
    expect(await reportCount(story.id)).toBe(0);
    expect(await env.CACHE.get("feed:version")).not.toBe(before);
  });

  it("404s an action on an unknown Story", async () => {
    expect((await act("remove", "nope", await adminCookie())).status).toBe(404);
  });
});
