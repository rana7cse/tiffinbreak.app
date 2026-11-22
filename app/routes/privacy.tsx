import { LegalPageView } from "~/components/legal-page";
import { privacy } from "~/content/legal";
import { strings } from "~/strings";
import type { Route } from "./+types/privacy";

export function meta(_: Route.MetaArgs) {
  return [
    { title: strings.meta.pageTitle(strings.legal.privacyLink) },
    { name: "description", content: strings.legal.privacyDescription },
  ];
}

export default function Privacy() {
  return <LegalPageView page={privacy} />;
}
