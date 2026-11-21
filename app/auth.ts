import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "~/db";
import * as schema from "~/db/schema";

/**
 * Social providers. Each entry maps a Better Auth provider id to the Worker
 * env vars holding its credentials. Adding Facebook (#10) is one line here,
 * plus the two env vars in wrangler.jsonc `secrets` and .dev.vars.example.
 */
const socialProviders = {
  google: {
    clientId: "GOOGLE_CLIENT_ID",
    clientSecret: "GOOGLE_CLIENT_SECRET",
  },
} as const;

/**
 * Builds the Better Auth instance for this request's env. Workers have no
 * import-time env, so there is no module-level singleton; construction is
 * cheap. Elsewhere:
 *
 *   const auth = getAuth(env);
 *   const session = await auth.api.getSession({ headers: request.headers });
 *   session?.user  // the Writer (stored in the `user` table)
 */
export function getAuth(env: Env) {
  const providers = Object.fromEntries(
    Object.entries(socialProviders).map(([id, keys]) => [
      id,
      { clientId: env[keys.clientId], clientSecret: env[keys.clientSecret] },
    ]),
  );

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb(env.DB), { provider: "sqlite", schema }),
    socialProviders: providers,
  });
}

export type Auth = ReturnType<typeof getAuth>;
