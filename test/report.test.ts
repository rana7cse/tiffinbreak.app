import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { getDb } from "../app/db";
import { story } from "../app/db/schema";
import { visibleStory } from "../app/lib/stories";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";

const report = (id: string, cookie?: string, reason?: string) =>
  exports.default.fetch(`${ORIGIN}/stories/${id}`, {
    method: "POST",
    headers: cookie ? { cookie } : {},
    body: new URLSearchParams({ intent: "report", reason: reason ?? "" }),
    redirect: "manual",
  });
const get = (id: string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}/stories/${id}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
const row = (id: string) =>
  env.DB.prepare(
    "SELECT report_count AS c, hidden AS h FROM story WHERE id = ?",
  )
    .bind(id)
    .first<{ c: number; h: number }>();

describe("Report a Story", () => {
  it("is login-walled", async () => {
    const { story } = await createStory();
    const res = await report(story.id);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/login");
    expect((await row(story.id))?.c).toBe(0);
  });

  it("counts a Report and stores the reason", async () => {
    const { story } = await createStory();
    const { cookie, writer } = await signInAs();
    const res = await report(story.id, cookie, "অনুপযুক্ত");
    expect(res.status).toBe(303);
    expect(await row(story.id)).toEqual({ c: 1, h: 0 });
    const r = await env.DB.prepare(
      "SELECT reason FROM report WHERE reader_id = ?",
    )
      .bind(writer.id)
      .first<{ reason: string }>();
    expect(r?.reason).toBe("অনুপযুক্ত");
  });

  it("treats a second Report by the same reader as a no-op", async () => {
    const { story } = await createStory();
    const { cookie } = await signInAs();
    await report(story.id, cookie);
    const again = await report(story.id, cookie);
    expect(again.status).toBe(303);
    expect((await row(story.id))?.c).toBe(1);
    expect(await (await get(story.id, cookie)).text()).toContain(
      "রিপোর্ট করা হয়েছে",
    );
  });

  it("does not let a Writer Report their own Story", async () => {
    const { story, cookie } = await createStory();
    const res = await report(story.id, cookie);
    expect(res.status).toBe(403);
    expect((await row(story.id))?.c).toBe(0);
  });

  it("404s for an unknown Story", async () => {
    const { cookie } = await signInAs();
    expect((await report("nope", cookie)).status).toBe(404);
  });

  it("hides the Story at 3 distinct Reports and 404s it for others", async () => {
    const { story, cookie: writerCookie } = await createStory();
    const readers = [await signInAs(), await signInAs(), await signInAs()];
    await report(story.id, readers[0]?.cookie);
    await report(story.id, readers[1]?.cookie);
    expect((await row(story.id))?.h).toBe(0);
    await report(story.id, readers[2]?.cookie);
    expect(await row(story.id)).toEqual({ c: 3, h: 1 });
    expect((await get(story.id, readers[0]?.cookie)).status).toBe(404);
    expect((await get(story.id, writerCookie)).status).toBe(200);
  });

  it("bumps the Feed cache version when a Story is hidden", async () => {
    const { story } = await createStory({ reportCount: 2 });
    const before = await env.CACHE.get("feed:version");
    const { cookie } = await signInAs();
    await report(story.id, cookie);
    const after = await env.CACHE.get("feed:version");
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
  });
});

// The Feed, profile and School lists share `visibleStory`; each list
// ticket's own tests cover its list.
describe("visibleStory rule", () => {
  it("excludes hidden Stories", async () => {
    const a = await createStory({ hidden: true });
    const b = await createStory();
    const ids = (
      await getDb(env.DB)
        .select({ id: story.id })
        .from(story)
        .where(visibleStory)
    ).map((r) => r.id);
    expect(ids).toContain(b.story.id);
    expect(ids).not.toContain(a.story.id);
  });
});
