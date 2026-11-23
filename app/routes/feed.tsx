import { AppHeader, BottomNav, withNavShell } from "~/components/app-shell";
import { requireWriter } from "~/lib/require-writer";
import type { ShellHandle } from "~/lib/shell";
import { strings } from "~/strings";
import type { Route } from "./+types/feed";

const t = strings.feed;

export const handle = withNavShell satisfies ShellHandle;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(t.title) }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  return { name: user.name, image: user.image };
}

// Placeholder until the Feed ticket.
export default function Feed({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <AppHeader writer={loaderData} />
      <main className="tb-section">
        <h1 className="tb-h2">{t.title}</h1>
        <p className="tb-lead">{t.greeting(loaderData.name)}</p>
        <p className="tb-lead">{t.placeholder}</p>
      </main>
      <BottomNav active="home" />
    </>
  );
}
