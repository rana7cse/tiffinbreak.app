import { and, desc, eq } from "drizzle-orm";
import { getDb } from "~/db";
import { school, story, user } from "~/db/schema";
import { visibleStory } from "./stories";

export type ProfileStory = {
  id: string;
  title: string;
  coverKey: string | null;
  loveTotal: number;
  createdAt: Date;
};

export type WriterProfile = {
  id: string;
  name: string;
  handle: string;
  image: string | null;
  /** Schools derived from the Stories, in order of the newest Story. */
  schools: string[];
  storyCount: number;
  loveTotal: number;
  stories: ProfileStory[];
};

/**
 * A Writer's public profile by @handle, or null when there is none. Hidden
 * Stories are left out (and out of the stats) unless the viewer is the Writer
 * or an Admin.
 */
export async function getWriterProfile(
  env: Pick<Env, "DB">,
  handle: string,
  viewer: { id: string; role?: string | null },
): Promise<WriterProfile | null> {
  const db = getDb(env.DB);
  const writer = await db
    .select({
      id: user.id,
      name: user.name,
      handle: user.handle,
      image: user.image,
    })
    .from(user)
    .where(eq(user.handle, handle))
    .get();
  if (!writer?.handle) return null;

  const seesHidden = viewer.id === writer.id || viewer.role === "admin";
  const rows = await db
    .select({
      id: story.id,
      title: story.title,
      coverKey: story.coverKey,
      loveTotal: story.loveTotal,
      createdAt: story.createdAt,
      schoolName: school.name,
    })
    .from(story)
    .innerJoin(school, eq(story.schoolId, school.id))
    .where(
      seesHidden
        ? eq(story.writerId, writer.id)
        : and(eq(story.writerId, writer.id), visibleStory),
    )
    .orderBy(desc(story.createdAt))
    .all();

  return {
    id: writer.id,
    name: writer.name,
    handle: writer.handle,
    image: writer.image,
    schools: [...new Set(rows.map((r) => r.schoolName))],
    storyCount: rows.length,
    loveTotal: rows.reduce((sum, r) => sum + r.loveTotal, 0),
    stories: rows.map(({ schoolName: _, ...s }) => s),
  };
}
