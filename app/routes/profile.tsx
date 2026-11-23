import { redirect } from "react-router";
import { requireWriter } from "~/lib/require-writer";
import type { Route } from "./+types/profile";

/** `/profile` is the signed-in Writer's own `/writers/:handle`. */
export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  const handle = (user as { handle?: string | null }).handle;
  throw redirect(handle ? `/writers/${handle}` : "/feed");
}
