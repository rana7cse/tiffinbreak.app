/**
 * Per-Writer rate limits on the write paths, backed by Cloudflare's Workers
 * Rate Limiting bindings (`ratelimits` in wrangler.jsonc). Each kind has its
 * own binding so budgets are independent; the key is the Writer id.
 *
 * Call `overLimit` after the login wall and before any write:
 *
 *   if (await overLimit(env, "publish", user.id)) return tooManyRequests();
 */
import { strings } from "~/strings";

export type LimitKind =
  | "publish"
  | "edit"
  | "love"
  | "report"
  | "upload"
  | "school";

const BINDING = {
  publish: "RL_PUBLISH",
  edit: "RL_EDIT",
  love: "RL_LOVE",
  report: "RL_REPORT",
  upload: "RL_UPLOAD",
  school: "RL_SCHOOL",
} as const satisfies Record<LimitKind, keyof Env>;

/** True when this Writer has used up their budget for `kind` (and counts this call). */
export async function overLimit(
  env: Env,
  kind: LimitKind,
  writerId: string,
): Promise<boolean> {
  const { success } = await env[BINDING[kind]].limit({ key: writerId });
  return !success;
}

/** The 429 for JSON endpoints. */
export const tooManyRequestsJson = () =>
  Response.json(
    { error: "rate_limited" },
    { status: 429, headers: { "Retry-After": "60" } },
  );

/** The 429 for form posts without their own error slot: plain Bangla text. */
export const tooManyRequestsText = () =>
  new Response(
    `${strings.errors.rateLimited} ${strings.errors.tryAgainLater}`,
    {
      status: 429,
      headers: {
        "Retry-After": "60",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
