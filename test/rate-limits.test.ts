import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";
const webp = () =>
  new File([new Uint8Array([1, 2, 3])], "c.webp", { type: "image/webp" });

const post = (
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

/** Sends `n` requests in a row and returns every status. */
async function burst(n: number, send: () => Promise<Response>) {
  const statuses: number[] = [];
  for (let i = 0; i < n; i++) statuses.push((await send()).status);
  return statuses;
}

const count = async (sql: string, ...args: unknown[]) =>
  (
    await env.DB.prepare(sql)
      .bind(...args)
      .first<{ n: number }>()
  )?.n;

describe("rate limits", () => {
  it("limits publishing per Writer and changes nothing when over", async () => {
    const { school } = await createStory();
    const { cookie, writer } = await signInAs();
    const other = await signInAs();
    const publish = (c: string) =>
      post("/write", c, { title: "গল্প", body: "লেখা", schoolId: school.id });

    const statuses = await burst(20, () => publish(cookie));
    const ok = statuses.filter((s) => s === 302).length;
    expect(ok).toBeGreaterThan(0);
    expect(statuses.filter((s) => s === 429).length).toBe(20 - ok);
    expect(
      await count(
        "SELECT count(*) AS n FROM story WHERE writer_id = ?",
        writer.id,
      ),
    ).toBe(ok);

    // Another Writer has their own budget.
    expect((await publish(other.cookie)).status).toBe(302);
  });

  it("shows a Bangla message on the Write form when over the limit", async () => {
    const { school } = await createStory();
    const { cookie } = await signInAs();
    let res: Response | undefined;
    for (let i = 0; i < 30 && res?.status !== 429; i++) {
      res = await post("/write", cookie, {
        title: "গল্প",
        body: "লেখা",
        schoolId: school.id,
      });
    }
    expect(res?.status).toBe(429);
    expect(await res?.text()).toContain("একটু পরে আবার চেষ্টা করো");
  });

  it("limits editing per Writer and keeps the Story as it was", async () => {
    const { story, cookie } = await createStory();
    const edit = (title: string) =>
      post(`/stories/${story.id}/edit`, cookie as string, {
        title,
        body: "নতুন লেখা",
        schoolId: story.schoolId,
      });
    const statuses = await burst(60, () => edit("নতুন নাম"));
    expect(statuses).toContain(429);
    const ok = statuses.filter((s) => s === 302).length;
    expect(ok).toBeGreaterThan(0);

    const res = await edit("সীমার পরের নাম");
    expect(res.status).toBe(429);
    const row = await env.DB.prepare("SELECT title FROM story WHERE id = ?")
      .bind(story.id)
      .first<{ title: string }>();
    expect(row?.title).toBe("নতুন নাম");
  });

  it("limits Love per Writer and adds no Love when over", async () => {
    const { story } = await createStory();
    const { cookie } = await signInAs();
    const love = () =>
      post(`/stories/${story.id}/love`, cookie, { count: "1" });
    const statuses = await burst(100, love);
    expect(statuses).toContain(429);

    // Over the limit, a Story this Writer has not loved yet stays untouched.
    const fresh = await createStory();
    const res = await post(`/stories/${fresh.story.id}/love`, cookie, {
      count: "1",
    });
    expect(res.status).toBe(429);
    expect(
      await count(
        "SELECT love_total AS n FROM story WHERE id = ?",
        fresh.story.id,
      ),
    ).toBe(0);
  });

  it("limits Reports per Writer and records nothing when over", async () => {
    const { cookie, writer } = await signInAs();
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      const { story } = await createStory();
      statuses.push(
        (await post(`/stories/${story.id}`, cookie, { intent: "report" }))
          .status,
      );
    }
    const ok = statuses.filter((s) => s === 303).length;
    expect(ok).toBeGreaterThan(0);
    expect(statuses.filter((s) => s === 429).length).toBe(12 - ok);
    expect(
      await count(
        "SELECT count(*) AS n FROM report WHERE reader_id = ?",
        writer.id,
      ),
    ).toBe(ok);
  });

  it("limits School creation per Writer", async () => {
    const { cookie } = await signInAs();
    const statuses = await burst(30, () =>
      post("/schools", cookie, { name: `নতুন স্কুল ${crypto.randomUUID()}` }),
    );
    expect(statuses[0]).toBe(200);
    expect(statuses).toContain(429);
  });

  it("limits photo uploads per Writer", async () => {
    const { cookie } = await signInAs({ name: "ছবিওয়ালা" });
    const statuses = await burst(30, () =>
      post("/profile/edit", cookie, {
        name: "ছবিওয়ালা",
        handle: `h${crypto.randomUUID().slice(0, 8).replaceAll("-", "")}`,
        avatar: webp(),
      }),
    );
    expect(statuses).toContain(429);
  });
});
