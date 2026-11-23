import { cloudflareContext } from "~/context";
import { giveLove, parseTaps } from "~/lib/love";
import { overLimit, tooManyRequestsJson } from "~/lib/rate-limit";
import { requireWriter } from "~/lib/require-writer";
import { canReadStory, getStoryById } from "~/lib/stories";
import type { Route } from "./+types/story-love";

/**
 * POST /stories/:id/love (form field `count`): add a batch of Love taps.
 * Login-walled. Returns `{ mine, total }`.
 */
export async function action({ request, context, params }: Route.ActionArgs) {
  const { user } = await requireWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  if (await overLimit(env, "love", user.id)) return tooManyRequestsJson();
  const found = await getStoryById(env, params.id);
  if (!found || !canReadStory(found, user)) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (found.writer.id === user.id) {
    return Response.json({ error: "own_story" }, { status: 403 });
  }
  const taps = parseTaps((await request.formData()).get("count"));
  if (taps === null) {
    return Response.json({ error: "invalid_count" }, { status: 400 });
  }
  return Response.json(await giveLove(env, found.id, user.id, taps), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
