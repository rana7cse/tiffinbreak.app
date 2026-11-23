import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const get = (path: string, cookie?: string) =>
  exports.default.fetch(`http://example.com${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });

/** signInAs creates Writers without a handle; give one a handle. */
async function handleOf(id: string) {
  const row = await env.DB.prepare("SELECT handle FROM user WHERE id = ?")
    .bind(id)
    .first<{ handle: string | null }>();
  if (row?.handle) return row.handle;
  const handle = `w${id.slice(0, 8)}`;
  await env.DB.prepare("UPDATE user SET handle = ? WHERE id = ?")
    .bind(handle, id)
    .run();
  return handle;
}

describe("Writer profile (GET /writers/:handle)", () => {
  it("is login-walled", async () => {
    const { writer } = await createStory();
    const res = await get(`/writers/${await handleOf(writer?.id as string)}`);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/login?returnTo=");
  });

  it("returns 404 for an unknown handle", async () => {
    const { cookie } = await signInAs();
    expect((await get("/writers/nobody-here", cookie)).status).toBe(404);
  });

  it("shows name, @handle, stats, Schools and Stories newest first", async () => {
    const { cookie: reader } = await signInAs();
    const first = await createStory({
      title: "পুরোনো গল্প",
      schoolName: "রূপনগর হাই স্কুল",
      loveTotal: 24,
      createdAt: new Date("2026-11-02T06:00:00Z"),
    });
    const writerId = first.writer?.id as string;
    await createStory({
      writerId,
      title: "নতুন গল্প",
      schoolName: "ঢাকা কলেজ",
      loveTotal: 58,
      createdAt: new Date("2026-11-21T06:00:00Z"),
    });
    await createStory({
      writerId,
      title: "আরেকটা পুরোনো",
      schoolId: first.school.id,
      loveTotal: 0,
      createdAt: new Date("2026-11-10T06:00:00Z"),
    });
    const handle = await handleOf(writerId);

    const res = await get(`/writers/${handle}`, reader);
    expect(res.status).toBe(200);
    const html = await res.text();

    expect(html).toContain("গল্পকার");
    expect(html).toContain(`@${handle}`);
    expect(html).toMatch(/tb-stat__num">৩</);
    expect(html).toContain("টা গল্প লিখেছে");
    expect(html).toMatch(/tb-stat__num">৮২</);
    expect(html).toContain("ভালোবাসা পেয়েছে");
    // Schools derived from Stories, each once
    expect(html.match(/রূপনগর হাই স্কুল/g)).toHaveLength(1);
    expect(html).toContain("ঢাকা কলেজ");
    expect(html).toContain("২১ নভেম্বর · ৫৮ ভালোবাসা");
    // newest first
    expect(html.indexOf("নতুন গল্প")).toBeLessThan(html.indexOf("আরেকটা পুরোনো"));
    expect(html.indexOf("আরেকটা পুরোনো")).toBeLessThan(html.indexOf("পুরোনো গল্প"));
    expect(html).toContain(`href="/stories/${first.story.id}"`);
    expect(html).toContain("tb-app tb-app--with-nav");
    // someone else's profile: no logout
    expect(html).not.toContain('action="/logout"');
  });

  it("hides hidden Stories from other viewers, including in stats", async () => {
    const { cookie: reader } = await signInAs();
    const shown = await createStory({ title: "দেখা যায়", loveTotal: 5 });
    const writerId = shown.writer?.id as string;
    await createStory({
      writerId,
      title: "লুকানো গল্প",
      hidden: true,
      loveTotal: 100,
    });
    const handle = await handleOf(writerId);

    const html = await (await get(`/writers/${handle}`, reader)).text();
    expect(html).toContain("দেখা যায়");
    expect(html).not.toContain("লুকানো গল্প");
    expect(html).toMatch(/tb-stat__num">১</);
    expect(html).toMatch(/tb-stat__num">৫</);

    const own = await (await get(`/writers/${handle}`, shown.cookie)).text();
    expect(own).toContain("লুকানো গল্প");
  });

  it("offers logout only on the Writer's own profile", async () => {
    const { writer, cookie } = await createStory();
    const handle = await handleOf(writer?.id as string);
    const html = await (await get(`/writers/${handle}`, cookie)).text();
    expect(html).toContain('action="/logout"');
  });
});

describe("/profile", () => {
  it("redirects to the signed-in Writer's own profile", async () => {
    const { cookie, writer } = await signInAs();
    const handle = await handleOf(writer.id);
    const res = await get("/profile", cookie);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`/writers/${handle}`);
  });

  it("is login-walled", async () => {
    const res = await get("/profile");
    expect(res.headers.get("location")).toContain("/login?returnTo=");
  });
});

describe("app header", () => {
  it("no longer carries a logout pill", async () => {
    const { cookie } = await signInAs();
    const html = await (await get("/feed", cookie)).text();
    expect(html).not.toContain('action="/logout"');
  });
});

describe("Story page Writer links", () => {
  it("point at /writers/:handle", async () => {
    const { cookie: reader } = await signInAs();
    const { story, writer } = await createStory();
    const handle = await handleOf(writer?.id as string);
    const html = await (await get(`/stories/${story.id}`, reader)).text();
    expect(html).toContain(`href="/writers/${handle}"`);
    expect(html).not.toContain('href="/profile"');
  });
});
