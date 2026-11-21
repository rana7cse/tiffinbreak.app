import { getAuth } from "~/auth";
import { cloudflareContext } from "~/context";
import { redirectWithCookies } from "~/lib/auth-response";
import type { Route } from "./+types/logout";

export async function action({ request, context }: Route.ActionArgs) {
  const { env } = context.get(cloudflareContext);
  const res = await getAuth(env).api.signOut({
    headers: request.headers,
    asResponse: true,
  });
  return redirectWithCookies("/", res);
}
