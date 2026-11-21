import { strings } from "~/strings";
import type { Route } from "./+types/login";

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(strings.login.title) }];
}

// Placeholder until the login tickets build the real screen.
export default function Login() {
  return (
    <main className="tb-section">
      <h1 className="tb-h2">{strings.login.title}</h1>
      <p className="tb-lead">{strings.login.comingSoon}</p>
    </main>
  );
}
