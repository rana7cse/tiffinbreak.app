import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";

const publish = (cookie: string, fields: Record<string, string>) =>
  exports.default.fetch(`${ORIGIN}/write`, {
    method: "POST",
    headers: { cookie },
    body: new URLSearchParams(fields),
    redirect: "manual",
  });

const storyCount = async () =>
  (
    await env.DB.prepare("SELECT count(*) AS n FROM story").first<{
      n: number;
    }>()
  )?.n;

beforeEach(async () => {
  await env.DB.exec("DELETE FROM story");
});

describe("GET /write", () => {
  it("renders the write form for a signed-in Writer", async () => {
    const { cookie } = await signInAs();
    const res = await exports.default.fetch(`${ORIGIN}/write`, {
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('id="tb-title"');
    expect(html).toContain('id="tb-body"');
    expect(html).toContain("পোস্ট করো");
  });
});

describe("POST /write", () => {
  it("is login-walled", async () => {
    const res = await exports.default.fetch(`${ORIGIN}/write`, {
      method: "POST",
      body: new URLSearchParams({ title: "ক", body: "খ" }),
      redirect: "manual",
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("publishes under the chosen School and redirects to the Story", async () => {
    const { cookie, writer } = await signInAs();
    const { school } = await createStory();
    const res = await publish(cookie, {
      title: "  টিফিনের পরোটা ",
      body: "আমার গল্প।\r\n\r\nদ্বিতীয় অংশ।",
      schoolId: school.id,
    });
    expect(res.status).toBe(302);
    const location = res.headers.get("location") ?? "";
    expect(location).toMatch(/^\/stories\/[\w-]+$/);

    const page = await exports.default.fetch(`${ORIGIN}${location}`, {
      headers: { cookie },
    });
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("টিফিনের পরোটা");
    expect(html).toContain(school.name);

    const row = await env.DB.prepare(
      "SELECT writer_id, school_id, title, body FROM story WHERE id = ?",
    )
      .bind(location.split("/").pop())
      .first();
    expect(row).toEqual({
      writer_id: writer.id,
      school_id: school.id,
      title: "টিফিনের পরোটা",
      body: "আমার গল্প।\n\nদ্বিতীয় অংশ।",
    });
  });

  it("creates a new School by name when none is chosen by id", async () => {
    const { cookie } = await signInAs();
    const res = await publish(cookie, {
      title: "নতুন",
      body: "গল্প",
      schoolName: "  নতুন   বিদ্যালয় ",
    });
    expect(res.status).toBe(302);
    const row = await env.DB.prepare(
      "SELECT school.name AS name FROM story JOIN school ON school.id = story.school_id",
    ).first();
    expect(row).toEqual({ name: "নতুন বিদ্যালয়" });
  });

  it("re-renders with errors when title and body are empty", async () => {
    const { cookie } = await signInAs();
    const { school } = await createStory();
    const res = await publish(cookie, {
      title: "  ",
      body: "",
      schoolId: school.id,
    });
    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).toContain("গল্পের একটা নাম দাও।");
    expect(html).toContain("গল্পের লেখা খালি রাখা যাবে না।");
    expect(await storyCount()).toBe(1); // only the helper's Story
  });

  it("keeps the typed text when a field is too long", async () => {
    const { cookie } = await signInAs();
    const { school } = await createStory();
    const longTitle = "ক".repeat(121);
    const res = await publish(cookie, {
      title: longTitle,
      body: "বডি টেক্সট",
      schoolId: school.id,
    });
    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).toContain("নাম সর্বোচ্চ ১২০ অক্ষরের হতে পারবে।");
    expect(html).toContain(longTitle);
    expect(html).toContain("বডি টেক্সট");

    const res2 = await publish(cookie, {
      title: "নাম",
      body: "খ".repeat(10001),
      schoolId: school.id,
    });
    expect(res2.status).toBe(400);
    expect(await res2.text()).toContain("গল্প সর্বোচ্চ ১০০০০ অক্ষরের হতে পারবে।");
  });

  it("requires a School", async () => {
    const { cookie } = await signInAs();
    const res = await publish(cookie, { title: "নাম", body: "লেখা" });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("স্কুল বা কলেজ বেছে নাও।");
  });
});
