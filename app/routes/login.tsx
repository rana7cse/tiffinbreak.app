import { redirect } from "react-router";
import { getWriter } from "~/lib/require-writer";
import { sanitizeReturnTo } from "~/lib/return-to";
import { strings } from "~/strings";
import type { Route } from "./+types/login";

const t = strings.login;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(t.title) }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const returnTo = sanitizeReturnTo(
    new URL(request.url).searchParams.get("returnTo"),
  );
  // Already signed in: skip the login screen.
  if (await getWriter({ request, context })) throw redirect(returnTo);
  return { returnTo };
}

export default function Login({ loaderData }: Route.ComponentProps) {
  return (
    <main className="tb-section">
      <h1 className="tb-h2">{t.title}</h1>
      <p className="tb-lead">{t.lead}</p>
      <form method="post" action="/login/google" style={{ marginTop: 22 }}>
        <input type="hidden" name="returnTo" value={loaderData.returnTo} />
        <button
          className="tb-btn tb-btn--primary tb-btn--lg tb-btn--block"
          type="submit"
        >
          {t.withGoogle}
        </button>
      </form>
    </main>
  );
}
