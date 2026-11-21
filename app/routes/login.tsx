import { redirect } from "react-router";
import { FacebookIcon } from "~/components/landing-art";
import { getWriter } from "~/lib/require-writer";
import { sanitizeReturnTo } from "~/lib/return-to";
import { strings } from "~/strings";
import type { Route } from "./+types/login";

const t = strings.login;

const providers = [
  {
    id: "google",
    label: t.withGoogle,
    className: "tb-btn--primary",
    icon: null,
  },
  {
    id: "facebook",
    label: t.withFacebook,
    className: "tb-btn--facebook",
    icon: <FacebookIcon />,
  },
];

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
      <div className="tb-stack" style={{ gap: 12, marginTop: 22 }}>
        {providers.map((p) => (
          <form
            key={p.id}
            method="post"
            action={`/login/${p.id}`}
            style={{ display: "contents" }}
          >
            <input type="hidden" name="returnTo" value={loaderData.returnTo} />
            <button
              className={`tb-btn ${p.className} tb-btn--lg tb-btn--block`}
              type="submit"
            >
              {p.icon}
              {p.label}
            </button>
          </form>
        ))}
      </div>
    </main>
  );
}
