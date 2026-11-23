import { type RouterContextProvider, redirect } from "react-router";
import { getAuth } from "~/auth";
import { cloudflareContext } from "~/context";

type GuardArgs = {
  request: Request;
  context: Readonly<RouterContextProvider>;
};

/** The current session, or null when logged out. */
export async function getWriter({ request, context }: GuardArgs) {
  const { env } = context.get(cloudflareContext);
  return getAuth(env).api.getSession({ headers: request.headers });
}

/**
 * The login wall (ADR-0001). Every route except the landing page, auth
 * routes and share previews calls this first in its loader/action. It is an
 * opt-in guard per route rather than a global middleware: the public
 * exceptions need per-route control (share previews), and a forgotten guard
 * is easy to spot in review.
 *
 *   export async function loader({ request, context }: Route.LoaderArgs) {
 *     const { user } = await requireWriter({ request, context });
 *   }
 *
 * Returns the Better Auth session (`session.user` is the Writer), or throws a
 * redirect to `/login?returnTo=<path+search>` so login lands back here.
 */
export async function requireWriter(args: GuardArgs) {
  const session = await getWriter(args);
  if (!session) {
    const { pathname, search } = new URL(args.request.url);
    throw redirect(`/login?returnTo=${encodeURIComponent(pathname + search)}`);
  }
  return session;
}

/**
 * Gate for Admin routes: the login wall, then a 403 for any Writer whose
 * `role` is not "admin".
 */
export async function requireAdmin(args: GuardArgs) {
  const session = await requireWriter(args);
  if ((session.user as { role?: string | null }).role !== "admin") {
    throw new Response("Forbidden", { status: 403 });
  }
  return session;
}
