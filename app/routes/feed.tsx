import { requireWriter } from "~/lib/require-writer";
import { strings } from "~/strings";
import type { Route } from "./+types/feed";

const t = strings.feed;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(t.title) }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  return { name: user.name };
}

// Placeholder until the Feed ticket.
export default function Feed({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <header className="tb-header">
        <a className="tb-brand" href="/feed">
          <span className="tb-brand__name">{strings.brand.name}</span>
        </a>
        <form method="post" action="/logout">
          <button className="tb-btn tb-btn--pill" type="submit">
            {strings.nav.logout}
          </button>
        </form>
      </header>
      <main className="tb-section">
        <h1 className="tb-h2">{t.title}</h1>
        <p className="tb-lead">{t.greeting(loaderData.name)}</p>
        <p className="tb-lead">{t.placeholder}</p>
      </main>
    </>
  );
}
