import { AppHeader, BottomNav, withNavShell } from "~/components/app-shell";
import { requireWriter } from "~/lib/require-writer";
import type { ShellHandle } from "~/lib/shell";
import { strings } from "~/strings";
import type { Route } from "./+types/profile";

export const handle = withNavShell satisfies ShellHandle;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(strings.nav.profile) }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  return { writer: { name: user.name, image: user.image } };
}

// Placeholder until the Profile ticket.
export default function Profile({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <AppHeader writer={loaderData.writer} />
      <main className="tb-section">
        <h1 className="tb-h2">
          {strings.writer.profileOf(loaderData.writer.name)}
        </h1>
        <p className="tb-lead">{strings.feed.placeholder}</p>
      </main>
      <BottomNav active="profile" />
    </>
  );
}
