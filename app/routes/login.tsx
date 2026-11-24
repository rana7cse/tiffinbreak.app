import { redirect } from "react-router";
import { LoginScreen } from "~/components/login-screen";
import { getWriter } from "~/lib/require-writer";
import { sanitizeReturnTo } from "~/lib/return-to";
import type { ShellHandle } from "~/lib/shell";
import { pageShareMeta } from "~/lib/story-share";
import { strings } from "~/strings";
import type { Route } from "./+types/login";

export const handle = {
  shellClass: ["tb-app--ruled", "tb-anim"],
} satisfies ShellHandle;

export function meta({ loaderData, location }: Route.MetaArgs) {
  const title = strings.meta.pageTitle(strings.login.title);
  return [
    { title },
    ...(loaderData
      ? pageShareMeta({
          origin: loaderData.origin,
          path: location.pathname,
          title,
          description: strings.meta.siteDescription,
        })
      : []),
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const returnTo = sanitizeReturnTo(
    new URL(request.url).searchParams.get("returnTo"),
  );
  // Already signed in: skip the login screen.
  if (await getWriter({ request, context })) throw redirect(returnTo);
  const intent = new URL(request.url).searchParams.get("intent");
  return {
    origin: new URL(request.url).origin,
    returnTo,
    write: intent === "write",
  };
}

export default function Login({ loaderData }: Route.ComponentProps) {
  return (
    <LoginScreen returnTo={loaderData.returnTo} write={loaderData.write} />
  );
}
