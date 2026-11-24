/**
 * Records that `readerId` opened `storyId` and rewrites the Story's
 * `readTotal`. Both statements run in one D1 batch (a transaction). The
 * insert is a no-op for a repeat reader, and the total is recomputed as a row
 * count rather than incremented, so it can never drift. Returns the new total.
 */
export async function recordRead(
  env: Pick<Env, "DB">,
  storyId: string,
  readerId: string,
): Promise<number> {
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO story_read (story_id, reader_id) VALUES (?1, ?2)
       ON CONFLICT (story_id, reader_id) DO NOTHING`,
    ).bind(storyId, readerId),
    env.DB.prepare(
      `UPDATE story SET read_total =
         (SELECT count(*) FROM story_read WHERE story_id = ?1)
       WHERE id = ?1`,
    ).bind(storyId),
  ]);
  const row = await env.DB.prepare(
    "SELECT read_total AS n FROM story WHERE id = ?",
  )
    .bind(storyId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}
