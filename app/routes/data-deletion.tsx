import { LegalPageView } from "~/components/legal-page";
import { dataDeletion } from "~/content/legal";
import { strings } from "~/strings";
import type { Route } from "./+types/data-deletion";

export function meta(_: Route.MetaArgs) {
  return [
    { title: strings.meta.pageTitle(strings.legal.dataDeletionLink) },
    { name: "description", content: strings.legal.dataDeletionDescription },
  ];
}

export default function DataDeletion() {
  return <LegalPageView page={dataDeletion} />;
}
