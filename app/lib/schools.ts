import { asc, desc, eq, or, sql } from "drizzle-orm";
import { getDb } from "~/db";
import { school } from "~/db/schema";
import { normalizeSchoolName } from "./school-name";

export type SchoolSummary = { id: string; name: string };

const VERSION_KEY = "schools:version";
const CACHE_TTL_SECONDS = 60; // KV's minimum
const SUGGESTION_LIMIT = 8;

/**
 * Finds the School with this name (after normalisation) or creates it.
 * Returns null when the name is empty. Creating bumps the suggestion cache
 * version so cached lists are never served stale.
 */
export async function findOrCreateSchool(
  env: Pick<Env, "DB" | "CACHE">,
  rawName: string,
): Promise<SchoolSummary | null> {
  const name = normalizeSchoolName(rawName);
  if (!name) return null;
  const db = getDb(env.DB);

  const find = () =>
    db
      .select({ id: school.id, name: school.name })
      .from(school)
      .where(
        or(
          eq(school.name, name),
          sql`lower(${school.nameEn}) = ${name.toLowerCase()}`,
        ),
      )
      .get();

  const existing = await find();
  if (existing) return existing;

  // The unique name index settles races: the loser inserts nothing and
  // re-reads the winner's row.
  const inserted = await db
    .insert(school)
    .values({ id: crypto.randomUUID(), name })
    .onConflictDoNothing()
    .returning({ id: school.id, name: school.name });
  if (inserted[0]) {
    await bumpVersion(env.CACHE);
    return inserted[0];
  }
  return (await find()) ?? null;
}

/** A School by id, or null when it does not exist. */
export async function findSchoolById(
  env: Pick<Env, "DB">,
  id: string,
): Promise<SchoolSummary | null> {
  const row = await getDb(env.DB)
    .select({ id: school.id, name: school.name })
    .from(school)
    .where(eq(school.id, id))
    .get();
  return row ?? null;
}

/**
 * Schools whose Bangla or English name contains the query. An empty query
 * returns the newest Schools. Results are cached in KV for a short TTL;
 * every failure of the cache falls back to D1, so correctness never depends
 * on it.
 */
export async function suggestSchools(
  env: Pick<Env, "DB" | "CACHE">,
  rawQuery: string,
): Promise<SchoolSummary[]> {
  const q = normalizeSchoolName(rawQuery);
  const version = await readVersion(env.CACHE);
  const key = `schools:suggest:v2:${version}:${q}`;

  try {
    const hit = await env.CACHE.get<SchoolSummary[]>(key, "json");
    if (hit) return hit;
  } catch (error) {
    console.error("schools: cache read failed", error);
  }

  const db = getDb(env.DB);
  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const pattern = `%${escaped}%`;
  const patternEn = `%${escaped.toLowerCase()}%`;
  const rows = await db
    .select({ id: school.id, name: school.name })
    .from(school)
    .where(
      q
        ? sql`(${school.name} like ${pattern} escape '\\' or lower(${school.nameEn}) like ${patternEn} escape '\\')`
        : undefined,
    )
    .orderBy(q ? asc(school.name) : desc(school.createdAt))
    .limit(SUGGESTION_LIMIT);

  try {
    await env.CACHE.put(key, JSON.stringify(rows), {
      expirationTtl: CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error("schools: cache write failed", error);
  }
  return rows;
}

/** Cache keys embed a version; bumping it orphans every cached list. */
async function readVersion(cache: KVNamespace): Promise<string> {
  try {
    return (await cache.get(VERSION_KEY)) ?? "0";
  } catch {
    return "0";
  }
}

export async function bumpVersion(cache: KVNamespace) {
  try {
    await cache.put(VERSION_KEY, crypto.randomUUID());
  } catch (error) {
    console.error("schools: cache invalidation failed", error);
  }
}
