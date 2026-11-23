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

describe("Merge Schools", () => {
  const merge = (duplicate: string, kept: string, cookie?: string) =>
    exports.default.fetch(`${ORIGIN}/admin`, {
      method: "POST",
      headers: cookie ? { cookie } : {},
      body: new URLSearchParams({ intent: "merge", duplicate, kept }),
      redirect: "manual",
    });
  const schoolPage = (id: string, cookie: string) =>
    exports.default.fetch(`${ORIGIN}/schools/${id}`, {
      headers: { cookie },
      redirect: "manual",
    });
  const suggestions = async (cookie: string) =>
    JSON.stringify(
      await (
        await exports.default.fetch(`${ORIGIN}/schools?q=Merge%20School`, {
          headers: { cookie },
        })
      ).json(),
    );
  const schoolOf = async (storyId: string) =>
    (
      await env.DB.prepare("SELECT school_id AS s FROM story WHERE id = ?")
        .bind(storyId)
        .first<{ s: string }>()
    )?.s;

  it("is Admin only", async () => {
    const { cookie } = await signInAs();
    const a = await createStory();
    const b = await createStory();
    expect((await merge(a.school.id, b.school.id, cookie)).status).toBe(403);
    expect((await merge(a.school.id, b.school.id)).status).toBe(302);
    expect(await schoolOf(a.story.id)).toBe(a.school.id);
  });

  it("moves Stories, deletes the duplicate and 404s its URL", async () => {
    const cookie = await adminCookie();
    const dup = await createStory();
    const dup2 = await createStory({ schoolId: dup.school.id });
    const kept = await createStory();
    expect((await schoolPage(dup.school.id, cookie)).status).toBe(200);

    const res = await merge(dup.school.id, kept.school.id, cookie);
    expect(res.status).toBe(303);
    expect(await schoolOf(dup.story.id)).toBe(kept.school.id);
    expect(await schoolOf(dup2.story.id)).toBe(kept.school.id);
    const left = await env.DB.prepare("SELECT id FROM school WHERE id = ?")
      .bind(dup.school.id)
      .first();
    expect(left).toBeNull();
    const old = await schoolPage(dup.school.id, cookie);
    expect(old.status).toBe(404);
    expect(old.headers.get("location")).toBeNull();
  });

  it("accepts School names and drops the duplicate from suggestions", async () => {
    const cookie = await adminCookie();
    const dup = await createStory({ schoolName: "Dup Merge School" });
    const kept = await createStory({ schoolName: "Kept Merge School" });
    expect(await suggestions(cookie)).toContain("Dup Merge School");

    const res = await merge("Dup Merge School", "Kept Merge School", cookie);
    expect(res.status).toBe(303);
    const text = await suggestions(cookie);
    expect(text).not.toContain("Dup Merge School");
    expect(text).toContain("Kept Merge School");
    expect(await schoolOf(dup.story.id)).toBe(kept.school.id);
  });

  it("rejects the same School and unknown Schools", async () => {
    const cookie = await adminCookie();
    const a = await createStory();
    expect((await merge(a.school.id, a.school.id, cookie)).status).toBe(400);
    expect((await merge(a.school.id, "nope", cookie)).status).toBe(404);
    expect(await schoolOf(a.story.id)).toBe(a.school.id);
  });
});
