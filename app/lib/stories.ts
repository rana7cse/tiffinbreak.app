import { and, eq, sql } from "drizzle-orm";
import { getDb } from "~/db";
import { report, school, story, user } from "~/db/schema";
import { deleteCover, storeCover } from "~/lib/cover";

const WORDS_PER_MINUTE = 200;

export type StoryView = {
  id: string;
  title: string;
  body: string;
  coverKey: string | null;
  loveTotal: number;
  hidden: boolean;
  createdAt: Date;
  writer: {
    id: string;
    name: string;
    handle: string | null;
    image: string | null;
  };
  school: { id: string; name: string };
};

/** A Story with its Writer and School, or null when there is no such id. */
export async function getStoryById(
  env: Pick<Env, "DB">,
  id: string,
): Promise<StoryView | null> {
  const row = await getDb(env.DB)
    .select({
      id: story.id,
      title: story.title,
      body: story.body,
      coverKey: story.coverKey,
      loveTotal: story.loveTotal,
      hidden: story.hidden,
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
    .where(eq(story.id, id))
    .get();
  return row ?? null;
}

/** Hidden Stories are visible only to their Writer and Admins. */
export function canReadStory(
  s: Pick<StoryView, "hidden" | "writer">,
  reader: { id: string; role?: string | null },
): boolean {
  return !s.hidden || s.writer.id === reader.id || reader.role === "admin";
}

/** Whole minutes (at least 1) to read `body`, at about 200 words a minute. */
export function readingTimeMinutes(body: string): number {
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Splits a Story body into paragraphs on blank lines. */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Stores the cover (if any), inserts a published Story, invalidates the Feed
 * cache and returns its id. If the insert fails, the new cover is deleted.
 */
export async function publishStory(
  env: Pick<Env, "DB" | "CACHE" | "COVERS">,
  input: {
    writerId: string;
    schoolId: string;
    title: string;
    body: string;
    cover?: File | null;
  },
): Promise<string> {
  const { cover, ...fields } = input;
  const coverKey = cover ? await storeCover(env, cover) : null;
  const id = crypto.randomUUID();
  try {
    await getDb(env.DB)
      .insert(story)
      .values({ id, ...fields, coverKey });
  } catch (error) {
    await deleteCover(env, coverKey);
    throw error;
  }
  await bumpFeedVersion(env.CACHE);
  return id;
}

/** Only the Writer of a Story may edit or delete it. */
export function canEditStory(
  s: Pick<StoryView, "writer">,
  reader: { id: string },
): boolean {
  return s.writer.id === reader.id;
}

/**
 * Updates a Story's title, body, School and cover, then invalidates the Feed
 * cache. `cover` stores a new cover; `removeCover` clears it; otherwise the
 * current cover stays. A replaced or removed cover's R2 object is deleted.
 */
export async function updateStory(
  env: Pick<Env, "DB" | "CACHE" | "COVERS">,
  current: Pick<StoryView, "id" | "coverKey">,
  input: {
    title: string;
    body: string;
    schoolId: string;
    cover: File | null;
    removeCover: boolean;
  },
): Promise<void> {
  const { cover, removeCover, ...fields } = input;
  const newKey = cover ? await storeCover(env, cover) : null;
  const coverKey = newKey ?? (removeCover ? null : current.coverKey);
  try {
    await getDb(env.DB)
      .update(story)
      .set({ ...fields, coverKey })
      .where(eq(story.id, current.id));
  } catch (error) {
    await deleteCover(env, newKey);
    throw error;
  }
  if (coverKey !== current.coverKey) await deleteCover(env, current.coverKey);
  await bumpFeedVersion(env.CACHE);
}

/** Deletes a Story with its cover, then invalidates the Feed cache. */
export async function deleteStory(
  env: Pick<Env, "DB" | "CACHE" | "COVERS">,
  current: Pick<StoryView, "id" | "coverKey">,
): Promise<void> {
  await getDb(env.DB).delete(story).where(eq(story.id, current.id));
  await deleteCover(env, current.coverKey);
  await bumpFeedVersion(env.CACHE);
}

/**
 * The shared "exclude hidden" rule: every Story list (Feed, School, profile)
 * must put this in its `where`. Hidden Stories are for the Writer and Admins
 * only (see `canReadStory`).
 */
export const visibleStory = eq(story.hidden, false);

export const REPORTS_TO_HIDE = 3;
const FEED_VERSION_KEY = "feed:version";

/** Feed cache keys embed this version; bumping it orphans every cached Feed. */
export async function readFeedVersion(cache: KVNamespace): Promise<string> {
  try {
    return (await cache.get(FEED_VERSION_KEY)) ?? "0";
  } catch {
    return "0";
  }
}

export async function bumpFeedVersion(cache: KVNamespace) {
  try {
    await cache.put(FEED_VERSION_KEY, crypto.randomUUID());
  } catch (error) {
    console.error("stories: feed cache invalidation failed", error);
  }
}

/** Whether `readerId` has already Reported the Story. */
export async function hasReported(
  env: Pick<Env, "DB">,
  storyId: string,
  readerId: string,
): Promise<boolean> {
  const row = await getDb(env.DB)
    .select({ s: report.storyId })
    .from(report)
    .where(and(eq(report.storyId, storyId), eq(report.readerId, readerId)))
    .get();
  return !!row;
}

/**
 * Records a Report. A repeat by the same reader changes nothing. The count is
 * incremented only when the Report row was newly inserted, and the Story is
 * hidden (and the Feed cache invalidated) once it reaches REPORTS_TO_HIDE.
 */
export async function reportStory(
  env: Pick<Env, "DB" | "CACHE">,
  storyId: string,
  readerId: string,
  reason: string | null,
): Promise<void> {
  const db = getDb(env.DB);
  const inserted = await db
    .insert(report)
    .values({ storyId, readerId, reason })
    .onConflictDoNothing()
    .returning({ s: report.storyId });
  if (!inserted[0]) return;
  const updated = await db
    .update(story)
    .set({
      reportCount: sql`${story.reportCount} + 1`,
      hidden: sql`(${story.reportCount} + 1 >= ${REPORTS_TO_HIDE}) or ${story.hidden}`,
    })
    .where(eq(story.id, storyId))
    .returning({ hidden: story.hidden });
  if (updated[0]?.hidden) await bumpFeedVersion(env.CACHE);
}
