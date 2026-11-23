import { env, exports } from "cloudflare:workers";
import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGIN = "http://example.com";

afterEach(() => {
  vi.unstubAllGlobals();
});

function b64url(value: object) {
  return btoa(
    String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))),
  )
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** Signs a Writer in through Google; returns the stored handle and role. */
async function signIn(name: string, n: number) {
  const profile = {
    sub: `google-handle-${n}`,
    email: `handle-${n}@example.com`,
    email_verified: true,
    name,
  };
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
          id_token: `${b64url({ alg: "none", typ: "JWT" })}.${b64url(profile)}.sig`,
        });
      }
      return realFetch(input, init);
    },
  );
  const start = await exports.default.fetch(
    `${ORIGIN}/api/auth/sign-in/social`,
    {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: JSON.stringify({ provider: "google", callbackURL: "/" }),
    },
  );
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get("state");
  const cookie = start.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const res = await exports.default.fetch(
    `${ORIGIN}/api/auth/callback/google?code=fake-code&state=${state}`,
    { headers: { cookie }, redirect: "manual" },
  );
  expect(res.status).toBe(302);
  return env.DB.prepare("SELECT handle, role FROM user WHERE email = ?")
    .bind(profile.email)
    .first<{ handle: string; role: string }>();
}

describe("Writer handles", () => {
  it("first sign-in gives a slugified handle and the writer role", async () => {
    expect(await signIn("Rafi Ahmed", 1)).toEqual({
      handle: "rafiahmed",
      role: "writer",
    });
  });

  it("strips accents and punctuation", async () => {
    expect((await signIn("José O'Brien-Smith!", 2))?.handle).toBe(
      "joseobriensmith",
    );
  });

  it("adds a numeric suffix on collision", async () => {
    expect((await signIn("Nusrat Jahan", 3))?.handle).toBe("nusratjahan");
    expect((await signIn("Nusrat Jahan", 4))?.handle).toBe("nusratjahan2");
    expect((await signIn("Nusrat  Jahan", 5))?.handle).toBe("nusratjahan3");
  });

  it("keeps Latin letters from mixed-script names", async () => {
    expect((await signIn("রাফি Rafi", 6))?.handle).toBe("rafi");
  });

  it("falls back to a valid handle for Bangla-only and symbol-only names", async () => {
    expect((await signIn("রাফি আহমেদ", 7))?.handle).toBe("writer");
    expect((await signIn("!!!", 8))?.handle).toBe("writer2");
  });

  it("limits handle length", async () => {
    expect((await signIn("a".repeat(80), 9))?.handle).toBe("a".repeat(30));
  });

  it("a returning Writer keeps their handle", async () => {
    await signIn("Same Person", 10);
    expect((await signIn("Same Person Renamed", 10))?.handle).toBe(
      "sameperson",
    );
  });
});
