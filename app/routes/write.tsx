import { SiteHeader } from "~/components/site-header";
import { requireWriter } from "~/lib/require-writer";
import { strings } from "~/strings";
import type { Route } from "./+types/write";

const t = strings.write;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(t.title) }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  return { writer: { name: user.name, image: user.image } };
}

// Placeholder until the Write a Story ticket.
export default function Write({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <SiteHeader writer={loaderData.writer} brandHref="/feed" />
      <main className="tb-section">
        <h1 className="tb-h2">{t.title}</h1>
        <p className="tb-lead">{t.placeholder}</p>
      </main>
    </>
  );
}
