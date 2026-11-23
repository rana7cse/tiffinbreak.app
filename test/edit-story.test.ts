import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";
const webp = () =>
  new File([new Uint8Array([1, 2, 3])], "c.webp", { type: "image/webp" });

const send = (
  path: string,
  cookie: string,
  fields: Record<string, string | File>,
) => {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return exports.default.fetch(`${ORIGIN}${path}`, {
    method: "POST",
    headers: { cookie },
    body: form,
    redirect: "manual",
  });
};
const get = (path: string, cookie: string) =>
  exports.default.fetch(`${ORIGIN}${path}`, {
    headers: { cookie },
    redirect: "manual",
  });

const row = (id: string) =>
  env.DB.prepare(
    "SELECT title, body, school_id, cover_key FROM story WHERE id = ?",
  )
    .bind(id)
    .first<{
      title: string;
      body: string;
      school_id: string;
      cover_key: string | null;
    }>();

async function withCover() {
  const key = `covers/${"a".repeat(32)}.webp`;
  await env.COVERS.put(key, new Uint8Array([9]));
  const made = await createStory({ coverKey: key });
  return { ...made, key };
}

beforeEach(async () => {
  await env.DB.exec("DELETE FROM story");
});

describe("edit page", () => {
  it("shows the owner a prefilled form", async () => {
    const { story, cookie } = await createStory();
    const res = await get(`/stories/${story.id}/edit`, cookie as string);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain(story.title);
    expect(html).toContain('id="tb-body"');
  });

  it("refuses a non-owner and the logged-out", async () => {
    const { story } = await createStory();
    const other = await signInAs();
    expect((await get(`/stories/${story.id}/edit`, other.cookie)).status).toBe(
      403,
    );
    const anon = await exports.default.fetch(
      `${ORIGIN}/stories/${story.id}/edit`,
      { redirect: "manual" },
    );
    expect(anon.status).toBe(302);
    expect((await get("/stories/nope/edit", other.cookie)).status).toBe(404);
  });

  it("links to edit only for the owner", async () => {
    const { story, cookie } = await createStory();
    const other = await signInAs();
    const mine = await (
      await get(`/stories/${story.id}`, cookie as string)
    ).text();
    expect(mine).toContain(`/stories/${story.id}/edit`);
    const theirs = await (
      await get(`/stories/${story.id}`, other.cookie)
    ).text();
    expect(theirs).not.toContain("/edit");
  });
});

describe("POST edit", () => {
  it("updates title, body and School and bumps the feed version", async () => {
    const { story, cookie } = await createStory();
    const { school } = await createStory();
    await env.CACHE.put("feed:version", "old");
    const res = await send(`/stories/${story.id}/edit`, cookie as string, {
      title: " নতুন নাম ",
      body: "নতুন লেখা",
      schoolId: school.id,
    });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`/stories/${story.id}`);
    expect(await row(story.id)).toMatchObject({
      title: "নতুন নাম",
      body: "নতুন লেখা",
      school_id: school.id,
    });
    expect(await env.CACHE.get("feed:version")).not.toBe("old");
  });

  it("validates like publishing", async () => {
    const { story, cookie } = await createStory();
    const res = await send(`/stories/${story.id}/edit`, cookie as string, {
      title: " ",
      body: "",
      schoolId: story.schoolId,
    });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("গল্পের একটা নাম দাও।");
    expect((await row(story.id))?.title).toBe(story.title);
  });

  it("rejects a non-owner and changes nothing", async () => {
    const { story } = await createStory();
    const other = await signInAs();
    const res = await send(`/stories/${story.id}/edit`, other.cookie, {
      title: "হ্যাক",
      body: "x",
      schoolId: story.schoolId,
    });
    expect(res.status).toBe(403);
    expect((await row(story.id))?.title).toBe(story.title);
  });

  it("keeps the cover when none is sent", async () => {
    const { story, cookie, key } = await withCover();
    await send(`/stories/${story.id}/edit`, cookie as string, {
      title: "ক",
      body: "খ",
      schoolId: story.schoolId,
    });
    expect((await row(story.id))?.cover_key).toBe(key);
    expect(await env.COVERS.get(key)).not.toBeNull();
  });

  it("replaces a cover and deletes the old object", async () => {
    const { story, cookie, key } = await withCover();
    await send(`/stories/${story.id}/edit`, cookie as string, {
      title: "ক",
      body: "খ",
      schoolId: story.schoolId,
      cover: webp(),
    });
    const next = (await row(story.id))?.cover_key;
    expect(next).toMatch(/^covers\/[0-9a-f]{32}\.webp$/);
    expect(next).not.toBe(key);
    expect(await env.COVERS.get(key)).toBeNull();
    expect(await env.COVERS.get(next as string)).not.toBeNull();
  });

  it("removes a cover and deletes the object", async () => {
    const { story, cookie, key } = await withCover();
    await send(`/stories/${story.id}/edit`, cookie as string, {
      title: "ক",
      body: "খ",
      schoolId: story.schoolId,
      removeCover: "1",
    });
    expect((await row(story.id))?.cover_key).toBeNull();
    expect(await env.COVERS.get(key)).toBeNull();
  });
});

describe("delete", () => {
  it("deletes the Story and its cover, and bumps the feed version", async () => {
    const { story, cookie, key } = await withCover();
    await env.CACHE.put("feed:version", "old");
    const res = await send(`/stories/${story.id}`, cookie as string, {
      intent: "delete",
    });
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/feed");
    expect(await row(story.id)).toBeNull();
    expect(await env.COVERS.get(key)).toBeNull();
    expect(await env.CACHE.get("feed:version")).not.toBe("old");
  });

  it("refuses a non-owner", async () => {
    const { story, key } = await withCover();
    const other = await signInAs();
    const res = await send(`/stories/${story.id}`, other.cookie, {
      intent: "delete",
    });
    expect(res.status).toBe(403);
    expect(await row(story.id)).not.toBeNull();
    expect(await env.COVERS.get(key)).not.toBeNull();
  });
});
