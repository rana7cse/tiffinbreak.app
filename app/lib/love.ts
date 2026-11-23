import { and, eq } from "drizzle-orm";
import { getDb } from "~/db";
import { love } from "~/db/schema";

export const MAX_LOVE = 10;

/** `count` from a request body: a whole number of taps of at least 1, or null. */
export function parseTaps(raw: unknown): number | null {
  if (typeof raw !== "string" || !/^\d{1,9}$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 1 ? n : null;
}

/** How much Love `readerId` has given `storyId` (0 to 10). */
export async function getMyLove(
  env: Pick<Env, "DB">,
  storyId: string,
  readerId: string,
): Promise<number> {
  const row = await getDb(env.DB)
    .select({ count: love.count })
    .from(love)
    .where(and(eq(love.storyId, storyId), eq(love.readerId, readerId)))
    .get();
  return row?.count ?? 0;
}

/**
 * Adds `taps` to the reader's Love for the Story, capped at MAX_LOVE, and
 * rewrites the Story's `loveTotal`. Both statements run in one D1 batch (a
 * transaction). The total is recomputed as the sum of all Love rows rather
 * than incremented, so concurrent batches can never leave it drifting.
 */
export async function giveLove(
  env: Pick<Env, "DB">,
  storyId: string,
  readerId: string,
  taps: number,
): Promise<{ mine: number; total: number }> {
  const add = Math.min(taps, MAX_LOVE);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO love (story_id, reader_id, count) VALUES (?1, ?2, ?3)
       ON CONFLICT (story_id, reader_id) DO UPDATE SET
         count = min(?4, count + ?3),
         updated_at = cast(unixepoch('subsecond') * 1000 as integer)`,
    ).bind(storyId, readerId, add, MAX_LOVE),
    env.DB.prepare(
      `UPDATE story SET love_total =
         (SELECT coalesce(sum(count), 0) FROM love WHERE story_id = ?1)
       WHERE id = ?1`,
    ).bind(storyId),
  ]);
  const row = await env.DB.prepare(
    `SELECT l.count AS mine, s.love_total AS total
     FROM story s JOIN love l ON l.story_id = s.id AND l.reader_id = ?2
     WHERE s.id = ?1`,
  )
    .bind(storyId, readerId)
    .first<{ mine: number; total: number }>();
  return { mine: row?.mine ?? 0, total: row?.total ?? 0 };
}
