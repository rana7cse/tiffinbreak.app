import { and, count, desc, eq, lt, or } from "drizzle-orm";
import { getDb } from "~/db";
import { school, story, user } from "~/db/schema";
import { readFeedVersion, visibleStory } from "./stories";

export const FEED_PAGE_SIZE = 10;
const EXCERPT_LENGTH = 110;
const CACHE_TTL_SECONDS = 60; // KV's minimum

/** A Story as the Feed (and School/Profile lists) show it on a card. */
export type FeedStory = {
  id: string;
  title: string;
  excerpt: string;
  coverKey: string | null;
  loveTotal: number;
  /** Missing in feed pages cached before Read existed; treat as 0. */
  readTotal?: number;
  /** Epoch milliseconds. */
  createdAt: number;
  writer: {
    id: string;
    name: string;
    handle: string | null;
    image: string | null;
  };
  school: { id: string; name: string };
};

export type FeedPage = { stories: FeedStory[]; nextCursor: string | null };

/** The first lines of a body, cut at a word and ended with "…". */
export function excerptOf(body: string, max = EXCERPT_LENGTH): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Cursors are `<createdAt ms>_<id>`: the id breaks ties between equal times. */
function parseCursor(cursor: string | null): { at: number; id: string } | null {
  const m = cursor?.match(/^(\d+)_(.+)$/);
  return m ? { at: Number(m[1]), id: m[2] as string } : null;
}

/**
 * One page of visible Stories, newest first, starting after `cursor`.
 * Hidden Stories are never included.
 */
export async function listFeed(
  env: Pick<Env, "DB" | "CACHE">,
  cursor: string | null,
): Promise<FeedPage> {
  const parsed = parseCursor(cursor);
  if (!parsed) return listFirstPage(env);
  return queryFeed(env, parsed);
}

/** One page of a School's visible Stories, newest first, after `cursor`. */
export function listSchoolStories(
  env: Pick<Env, "DB">,
  schoolId: string,
  cursor: string | null,
): Promise<FeedPage> {
  return queryFeed(env, parseCursor(cursor), schoolId);
}

/** How many visible Stories a School has. */
export async function countSchoolStories(
  env: Pick<Env, "DB">,
  schoolId: string,
): Promise<number> {
  const row = await getDb(env.DB)
    .select({ n: count() })
    .from(story)
    .where(and(visibleStory, eq(story.schoolId, schoolId)))
    .get();
  return row?.n ?? 0;
}

/** How many Stories (hidden ones too) a Writer has written. */
export async function countWriterStories(
  env: Pick<Env, "DB">,
  writerId: string,
): Promise<number> {
  const row = await getDb(env.DB)
    .select({ n: count() })
    .from(story)
    .where(eq(story.writerId, writerId))
    .get();
  return row?.n ?? 0;
}

async function queryFeed(
  env: Pick<Env, "DB">,
  after: { at: number; id: string } | null,
  schoolId?: string,
): Promise<FeedPage> {
  const rows = await getDb(env.DB)
    .select({
      id: story.id,
      title: story.title,
      body: story.body,
      coverKey: story.coverKey,
      loveTotal: story.loveTotal,
      readTotal: story.readTotal,
      createdAt: story.createdAt,
      writer: {
        id: user.id,
        name: user.name,
        handle: user.handle,
        image: user.image,
      },
      school: { id: school.id, name: school.name },
    })
    .from(story)
    .innerJoin(user, eq(story.writerId, user.id))
    .innerJoin(school, eq(story.schoolId, school.id))
    .where(
      and(
        visibleStory,
        schoolId ? eq(story.schoolId, schoolId) : undefined,
        after
          ? or(
              lt(story.createdAt, new Date(after.at)),
              and(
                eq(story.createdAt, new Date(after.at)),
                lt(story.id, after.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(desc(story.createdAt), desc(story.id))
    .limit(FEED_PAGE_SIZE + 1);

  const more = rows.length > FEED_PAGE_SIZE;
  const stories = rows.slice(0, FEED_PAGE_SIZE).map(
    ({ body, createdAt, ...rest }): FeedStory => ({
      ...rest,
      excerpt: excerptOf(body),
      createdAt: createdAt.getTime(),
    }),
  );
  const last = stories.at(-1);
  return {
    stories,
    nextCursor: more && last ? `${last.createdAt}_${last.id}` : null,
  };
}

/**
 * The first page is cached in KV for a short TTL under a versioned key;
 * invalidating bumps the version. Any cache failure falls back to D1, so
 * correctness never depends on the cache.
 */
async function listFirstPage(
  env: Pick<Env, "DB" | "CACHE">,
): Promise<FeedPage> {
  const key = `feed:first:${await readFeedVersion(env.CACHE)}`;
  try {
    const hit = await env.CACHE.get<FeedPage>(key, "json");
    if (hit) return hit;
  } catch (error) {
    console.error("feed: cache read failed", error);
  }
  const page = await queryFeed(env, null);
  try {
    await env.CACHE.put(key, JSON.stringify(page), {
      expirationTtl: CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error("feed: cache write failed", error);
  }
  return page;
}
