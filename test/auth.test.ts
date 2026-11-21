import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://example.com";

afterEach(() => {
  vi.unstubAllGlobals();
});

function b64url(value: object) {
  return btoa(JSON.stringify(value))
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** An unsigned id_token carrying the Google profile claims. */
function googleIdToken(profile: Record<string, unknown>) {
  return `${b64url({ alg: "none", typ: "JWT" })}.${b64url(profile)}.sig`;
}

/** Replaces Google's token endpoint; everything else is left alone. */
function stubGoogle(profile: Record<string, unknown>) {
  const realFetch = globalThis.fetch;
  vi.stubGlobal(
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new Request(input, init).url;
      if (url.startsWith("https://oauth2.googleapis.com/token")) {
        return Response.json({
          access_token: "fake-access-token",
          token_type: "Bearer",
          expires_in: 3600,
          id_token: googleIdToken(profile),
        });
      }
      return realFetch(input, init);
    },
  );
}

function cookieHeader(res: Response) {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
}

function startGoogleSignIn() {
  return exports.default.fetch(`${ORIGIN}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ provider: "google", callbackURL: "/" }),
  });
}

/** Starts Google sign-in and completes the callback, like a browser would. */
async function signInWithGoogle() {
  const start = await startGoogleSignIn();
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get("state");

  return exports.default.fetch(
    `${ORIGIN}/api/auth/callback/google?code=fake-code&state=${state}`,
    { headers: { cookie: cookieHeader(start) }, redirect: "manual" },
  );
}

async function count(table: string) {
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first<{
    n: number;
  }>();
  return row?.n;
}

const rafi = {
  sub: "google-123",
  email: "rafi@example.com",
  email_verified: true,
  name: "Rafi Ahmed",
  picture: "https://lh3.googleusercontent.com/rafi.png",
};

describe("/api/auth", () => {
  it("GET /api/auth/ok returns 200", async () => {
    const res = await exports.default.fetch(`${ORIGIN}/api/auth/ok`);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("POST /api/auth/sign-in/social sends the browser to Google", async () => {
    const res = await startGoogleSignIn();

    expect(res.status).toBe(200);
    const { url } = (await res.json()) as { url: string };
    const target = new URL(url);
    expect(target.host).toBe("accounts.google.com");
    expect(target.searchParams.get("client_id")).toBe("test-google-client-id");
    expect(target.searchParams.get("redirect_uri")).toBe(
      `${ORIGIN}/api/auth/callback/google`,
    );
  });

  it("first Google sign-in creates one Writer with Google name and avatar, the second reuses it", async () => {
    stubGoogle(rafi);

    const first = await signInWithGoogle();
    expect(first.status).toBe(302);
    expect(first.headers.getSetCookie().join(";")).toContain("session_token");
    expect(await count("user")).toBe(1);
    expect(await count("account")).toBe(1);

    const writer = await env.DB.prepare("SELECT name, image FROM user").first();
    expect(writer).toEqual({
      name: "Rafi Ahmed",
      image: "https://lh3.googleusercontent.com/rafi.png",
    });

    const second = await signInWithGoogle();
    expect(second.status).toBe(302);
    expect(await count("user")).toBe(1);
    expect(await count("account")).toBe(1);
    expect(await count("session")).toBe(2);
  });

  it("the session cookie identifies the Writer", async () => {
    stubGoogle(rafi);
    const callback = await signInWithGoogle();

    const res = await exports.default.fetch(`${ORIGIN}/api/auth/get-session`, {
      headers: { cookie: cookieHeader(callback) },
    });

    const body = (await res.json()) as { user: { name: string } };
    expect(body.user.name).toBe("Rafi Ahmed");
  });
});
