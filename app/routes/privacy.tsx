import { LegalPageView } from "~/components/legal-page";
import { privacy } from "~/content/legal";
import { pageShareMeta } from "~/lib/story-share";
import { strings } from "~/strings";
import type { Route } from "./+types/privacy";

export function loader({ request }: Route.LoaderArgs) {
  return { origin: new URL(request.url).origin };
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  const title = strings.meta.pageTitle(strings.legal.privacyLink);
  return [
    { title },
    ...(loaderData
      ? pageShareMeta({
          origin: loaderData.origin,
          path: location.pathname,
          title,
          description: strings.legal.privacyDescription,
        })
      : []),
  ];
}

export default function Privacy() {
  return <LegalPageView page={privacy} />;
}
