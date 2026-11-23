import { env } from "cloudflare:workers";

const SESSION_COOKIE = "better-auth.session_token";

/** Better Auth signs the cookie as `token.base64(HMAC-SHA256(secret, token))`. */
async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

/**
 * Creates a Writer (`user` row) and a live session directly in D1 and returns
 * a `Cookie` header value Better Auth accepts:
 *
 *   const { cookie, writer } = await signInAs({ name: "Rafi Ahmed" });
 *   await exports.default.fetch(url, { headers: { cookie } });
 */
export async function signInAs(
  opts: { name?: string; email?: string; image?: string } = {},
) {
  const id = crypto.randomUUID();
  const name = opts.name ?? "Test Writer";
  const email = opts.email ?? `${id}@example.com`;
  const token = crypto.randomUUID().replaceAll("-", "");
  const now = Date.now();

  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, ?)",
    ).bind(id, name, email, opts.image ?? null, now, now),
    env.DB.prepare(
      "INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(
      crypto.randomUUID(),
      now + 7 * 24 * 60 * 60 * 1000,
      token,
      now,
      now,
      id,
    ),
  ]);

  const signed = `${token}.${await sign(token, env.BETTER_AUTH_SECRET)}`;
  return {
    cookie: `${SESSION_COOKIE}=${encodeURIComponent(signed)}`,
    writer: { id, name, email },
  };
}
