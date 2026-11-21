import { createContext } from "react-router";

/**
 * Cloudflare request context, set by the Worker entry (workers/app.ts) for
 * every request. In loaders and actions:
 *
 *   const { env } = context.get(cloudflareContext);
 *   const db = getDb(env.DB);
 */
export const cloudflareContext = createContext<{
  env: Env;
  ctx: ExecutionContext;
}>();
