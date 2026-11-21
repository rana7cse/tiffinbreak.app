import { getAuth } from "~/auth";
import { cloudflareContext } from "~/context";
import { redirectWithCookies } from "~/lib/auth-response";
import { sanitizeReturnTo } from "~/lib/return-to";
import type { Route } from "./+types/login-provider";

/** Providers a Writer can sign in with. */
const PROVIDERS = ["google", "facebook"];

// POST /login/:provider starts social sign-in server-side (no client JS) and
// redirects the browser to the provider.
export async function action({ request, context, params }: Route.ActionArgs) {
  if (!PROVIDERS.includes(params.provider)) {
    throw new Response("Not Found", { status: 404 });
  }
  const form = await request.formData();
  const returnTo = sanitizeReturnTo(form.get("returnTo"));
  const { env } = context.get(cloudflareContext);

  const res = await getAuth(env).api.signInSocial({
    body: { provider: params.provider as "google", callbackURL: returnTo },
    headers: request.headers,
    asResponse: true,
  });
  if (!res.ok) throw new Response("Bad Request", { status: 400 });
  const { url } = (await res.json()) as { url: string };
  return redirectWithCookies(url, res);
}
