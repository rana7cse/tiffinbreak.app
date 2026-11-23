import { cloudflareContext } from "~/context";
import { overLimit, tooManyRequestsJson } from "~/lib/rate-limit";
import { requireWriter } from "~/lib/require-writer";
import { findOrCreateSchool, suggestSchools } from "~/lib/schools";
import type { Route } from "./+types/schools";

/** GET /schools?q=<text>: suggestions for the add-School sheet. Login-walled. */
export async function loader({ request, context }: Route.LoaderArgs) {
  await requireWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(
    { schools: await suggestSchools(env, q) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

/** POST /schools (form field `name`): find or create a School. Login-walled. */
export async function action({ request, context }: Route.ActionArgs) {
  const { user } = await requireWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  if (await overLimit(env, "school", user.id)) return tooManyRequestsJson();
  const form = await request.formData();
  const name = form.get("name");
  const school =
    typeof name === "string" ? await findOrCreateSchool(env, name) : null;
  if (!school)
    return Response.json({ error: "name_required" }, { status: 400 });
  return Response.json({ school });
}
