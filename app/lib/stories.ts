import { and, eq, sql } from "drizzle-orm";
import { getDb } from "~/db";
import { report, school, story, user } from "~/db/schema";
import { strings } from "~/strings";
import { bn } from "./bangla-digits";

const WORDS_PER_MINUTE = 200;
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

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

/** "২১ নভেম্বর", in Bangladesh time. */
export function formatStoryDate(date: Date): string {
  const d = new Date(date.getTime() + DHAKA_OFFSET_MS);
  return `${bn(d.getUTCDate())} ${strings.story.months[d.getUTCMonth()]}`;
}

/** Splits a Story body into paragraphs on blank lines. */
export function paragraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Where a cover image is served from; the one place to change it (#44). */
export function coverUrl(coverKey: string): string {
  return `/${coverKey}`;
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
