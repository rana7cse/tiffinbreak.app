import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";

const ORIGIN = "http://example.com";

const get = (path: string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });

const save = (cookie: string, fields: Record<string, string | File>) => {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return exports.default.fetch(`${ORIGIN}/profile/edit`, {
    method: "POST",
    headers: { cookie },
    body: form,
    redirect: "manual",
  });
};

async function writerWithHandle(handle: string, name = "Rafi Ahmed") {
  const s = await signInAs({ name });
  await env.DB.prepare("UPDATE user SET handle = ? WHERE id = ?")
    .bind(handle, s.writer.id)
    .run();
  return s;
}

const row = (id: string) =>
  env.DB.prepare("SELECT name, handle, image FROM user WHERE id = ?")
    .bind(id)
    .first<{ name: string; handle: string; image: string | null }>();

describe("Edit profile (/profile/edit)", () => {
  it("is login-walled", async () => {
    const res = await get("/profile/edit");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("/login?returnTo=");
  });

  it("shows the form prefilled, and the own profile links to it", async () => {
    const { cookie } = await writerWithHandle("edit_me1");
    const html = await (await get("/profile/edit", cookie)).text();
    expect(html).toContain('value="edit_me1"');
    expect(html).toContain('value="Rafi Ahmed"');
    const own = await (await get("/writers/edit_me1", cookie)).text();
    expect(own).toContain('href="/profile/edit"');
  });

  it("does not offer the edit link on another Writer's profile", async () => {
    await writerWithHandle("someone_else");
    const { cookie } = await signInAs();
    const other = await (await get("/writers/someone_else", cookie)).text();
    expect(other).not.toContain("/profile/edit");
  });

  it("changes name and handle, then lands on the new profile URL", async () => {
    const { cookie, writer } = await writerWithHandle("old_handle");
    const res = await save(cookie, { name: "নতুন নাম", handle: "New_Handle9" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/writers/new_handle9");
    expect(await row(writer.id)).toMatchObject({
      name: "নতুন নাম",
      handle: "new_handle9",
    });
    expect((await get("/writers/new_handle9", cookie)).status).toBe(200);
    expect((await get("/writers/old_handle", cookie)).status).toBe(404);
  });

  it("rejects a taken handle with a Bangla error and keeps the input", async () => {
    await writerWithHandle("taken_one", "Other");
    const { cookie, writer } = await writerWithHandle("mine_first");
    const res = await save(cookie, { name: "Kept Name", handle: "taken_one" });
    expect(res.status).toBe(400);
    const html = await res.text();
    expect(html).toContain("হ্যান্ডেলটা আগেই কেউ নিয়ে নিয়েছে");
    expect(html).toContain('value="taken_one"');
    expect(html).toContain('value="Kept Name"');
    expect((await row(writer.id))?.handle).toBe("mine_first");
  });

  it.each([["ab"], ["has space"], ["বাংলা_হ্যান্ডেল"], ["a".repeat(31)]])(
    "rejects invalid handle %j",
    async (handle) => {
      const { cookie, writer } = await writerWithHandle(`keep_${Date.now()}`);
      const before = await row(writer.id);
      const res = await save(cookie, { name: "X Y", handle });
      expect(res.status).toBe(400);
      expect(await res.text()).toContain('role="alert"');
      expect(await row(writer.id)).toEqual(before);
    },
  );

  it("rejects an empty name", async () => {
    const { cookie } = await writerWithHandle("name_empty");
    const res = await save(cookie, { name: "  ", handle: "name_empty" });
    expect(res.status).toBe(400);
  });

  it("keeping the current handle is not a conflict", async () => {
    const { cookie } = await writerWithHandle("same_handle");
    const res = await save(cookie, { name: "New", handle: "same_handle" });
    expect(res.status).toBe(302);
  });

  it("replaces the avatar and shows it in header and profile", async () => {
    const { cookie, writer } = await writerWithHandle("avatar_one");
    const bytes = new Uint8Array([9, 8, 7]);
    const res = await save(cookie, {
      name: "Rafi Ahmed",
      handle: "avatar_one",
      avatar: new File([bytes], "a.png", { type: "image/png" }),
    });
    expect(res.status).toBe(302);
    const { image } = (await row(writer.id)) as { image: string };
    expect(image).toMatch(/^\/covers\/[0-9a-f]{32}\.png$/);
    const img = await get(image);
    expect(img.status).toBe(200);
    expect(new Uint8Array(await img.arrayBuffer())).toEqual(bytes);
    for (const page of ["/writers/avatar_one", "/feed"]) {
      const html = await (await get(page, cookie)).text();
      expect(html).toContain(`src="${image}"`);
    }
  });

  it("rejects a non-image avatar and keeps the old one", async () => {
    const { cookie, writer } = await writerWithHandle("avatar_bad");
    const res = await save(cookie, {
      name: "Rafi",
      handle: "avatar_bad",
      avatar: new File(["x"], "a.txt", { type: "text/plain" }),
    });
    expect(res.status).toBe(400);
    expect((await row(writer.id))?.image).toBeNull();
  });
});
