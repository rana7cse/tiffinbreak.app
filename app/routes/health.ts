import { cloudflareContext } from "~/context";
import { getDb } from "~/db";
import { appMeta } from "~/db/schema";
import type { Route } from "./+types/health";

/**
 * Liveness check. Resource route (no UI): returns JSON only.
 * `db` is "ok" when D1 answers a query against a migrated table.
 */
export async function loader({ context }: Route.LoaderArgs) {
  const { env } = context.get(cloudflareContext);
  let db: "ok" | "error" = "ok";
  try {
    await getDb(env.DB).select().from(appMeta).limit(1);
  } catch (error) {
    console.error("health: D1 check failed", error);
    db = "error";
  }

  return Response.json(
    { status: db === "ok" ? "ok" : "error", db },
    {
      status: db === "ok" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
