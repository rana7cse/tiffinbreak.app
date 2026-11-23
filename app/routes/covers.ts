import { cloudflareContext } from "~/context";
import { readCover } from "~/lib/cover";
import type { Route } from "./+types/covers";

/**
 * Public cover image (no login wall, so crawlers can fetch it). Keys are
 * random and never change their content, so it caches for a year.
 */
export async function loader({ context, params }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  const cover = await readCover(env, params.name);
  if (!cover) throw new Response("Not Found", { status: 404 });
  return new Response(cover.body, {
    headers: {
      "Content-Type": cover.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
