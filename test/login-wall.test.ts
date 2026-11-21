import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";

const ORIGIN = "http://example.com";
const get = (path: string, cookie?: string) =>
  exports.default.fetch(`${ORIGIN}${path}`, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
const post = (
  path: string,
  body: Record<string, string> = {},
  cookie?: string,
) =>
  exports.default.fetch(`${ORIGIN}${path}`, {
    method: "POST",
    headers: cookie ? { cookie } : {},
    body: new URLSearchParams(body),
    redirect: "manual",
  });

describe("login wall", () => {
  it("redirects a logged-out GET /feed to login with returnTo", async () => {
    const res = await get("/feed");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/login?returnTo=%2Ffeed");
  });

  it("keeps the query string in returnTo", async () => {
    const res = await get("/feed?x=1");
    expect(res.headers.get("location")).toBe("/login?returnTo=%2Ffeed%3Fx%3D1");
  });

  it("serves /feed to a logged-in Writer, greeting them by name", async () => {
    const { cookie } = await signInAs({ name: "Rafi Ahmed" });
    const res = await get("/feed", cookie);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Rafi Ahmed");
  });

  it("keeps / and /health public", async () => {
    expect((await get("/")).status).toBe(200);
    expect((await get("/health")).status).toBe(200);
  });

  it("sends a logged-in Writer from /login to returnTo", async () => {
    const { cookie } = await signInAs();
    const res = await get("/login?returnTo=%2Ffeed%3Fx%3D1", cookie);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("/feed?x=1");
  });
});

describe("returnTo", () => {
  it.each([
    "//evil.com",
    "https://evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
  ])("falls back to /feed for %s", async (bad) => {
    const page = await get(`/login?returnTo=${encodeURIComponent(bad)}`);
    expect(await page.text()).toMatch(/name="returnTo"[^>]*value="\/feed"/);

    const res = await post("/login/google", { returnTo: bad });
    expect(res.status).toBe(302);
  });

  it("carries a same-origin path through the login page", async () => {
    const page = await get("/login?returnTo=%2Ffeed%3Fx%3D1");
    expect(await page.text()).toMatch(/value="\/feed\?x=1"/);
  });
});

describe("login page providers", () => {
  const formFor = (html: string, provider: string) =>
    html.match(
      new RegExp(`<form[^>]*action="/login/${provider}"[^>]*>.*?</form>`, "s"),
    )?.[0];

  it("offers Google and Facebook with the same returnTo", async () => {
    const html = await (await get("/login?returnTo=%2Ffeed%3Fx%3D1")).text();
    for (const provider of ["google", "facebook"]) {
      const form = formFor(html, provider);
      expect(form, provider).toBeDefined();
      expect(form).toContain('method="post"');
      expect(form).toMatch(/name="returnTo"[^>]*value="\/feed\?x=1"/);
    }
  });

  it("gives the Facebook form /feed for an unsafe returnTo", async () => {
    const html = await (await get("/login?returnTo=//evil.com")).text();
    expect(formFor(html, "facebook")).toMatch(
      /name="returnTo"[^>]*value="\/feed"/,
    );
  });
});

describe("POST /login/:provider", () => {
  it("redirects to Google and sets the OAuth state cookie", async () => {
    const res = await post("/login/google", { returnTo: "/feed" });
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get("location") ?? "").host).toBe(
      "accounts.google.com",
    );
    expect(res.headers.getSetCookie().join(";")).toContain("state");
  });

  it("404s for an unknown provider", async () => {
    expect((await post("/login/unknown")).status).toBe(404);
  });
});

describe("logout", () => {
  it("clears the session, so the next /feed redirects", async () => {
    const { cookie } = await signInAs();
    const out = await post("/logout", {}, cookie);
    expect(out.status).toBe(302);
    expect(out.headers.get("location")).toBe("/");
    expect(out.headers.getSetCookie().join(";")).toContain("session_token=;");

    // The session row is gone, even if the browser replays the old cookie.
    const res = await get("/feed", cookie);
    expect(res.status).toBe(302);
  });
});
