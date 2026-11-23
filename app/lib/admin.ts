import { desc, eq, gt, inArray, or } from "drizzle-orm";
import { getDb } from "~/db";
import { report, school, story, user } from "~/db/schema";
import { bumpFeedVersion } from "./stories";

export type ReviewItem = {
  id: string;
  title: string;
  hidden: boolean;
  reportCount: number;
  writer: { name: string; handle: string | null };
  school: { name: string };
  reasons: string[];
  /** Reports filed without a reason. */
  blankReports: number;
};

/** Hidden or reported Stories with their Report reasons, newest first. */
export async function listReviewItems(
  env: Pick<Env, "DB">,
): Promise<ReviewItem[]> {
  const db = getDb(env.DB);
  const rows = await db
    .select({
      id: story.id,
      title: story.title,
      hidden: story.hidden,
      reportCount: story.reportCount,
      writerName: user.name,
      writerHandle: user.handle,
      schoolName: school.name,
    })
    .from(story)
    .innerJoin(user, eq(story.writerId, user.id))
    .innerJoin(school, eq(story.schoolId, school.id))
    .where(or(eq(story.hidden, true), gt(story.reportCount, 0)))
    .orderBy(
      desc(story.hidden),
      desc(story.reportCount),
      desc(story.createdAt),
    );
  if (rows.length === 0) return [];

  const reports = await db
    .select({ storyId: report.storyId, reason: report.reason })
    .from(report)
    .where(
      inArray(
        report.storyId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(report.createdAt);

  return rows.map((r) => {
    const mine = reports.filter((x) => x.storyId === r.id);
    const reasons = mine
      .map((x) => x.reason?.trim())
      .filter(Boolean) as string[];
    return {
      id: r.id,
      title: r.title,
      hidden: r.hidden,
      reportCount: r.reportCount,
      writer: { name: r.writerName, handle: r.writerHandle },
      school: { name: r.schoolName },
      reasons,
      blankReports: mine.length - reasons.length,
    };
  });
}

/** Unhides a Story and clears its Reports. False when there is no such Story. */
export async function restoreStory(
  env: Pick<Env, "DB" | "CACHE">,
  storyId: string,
): Promise<boolean> {
  const db = getDb(env.DB);
  const found = await db
    .select({ id: story.id })
    .from(story)
    .where(eq(story.id, storyId))
    .get();
  if (!found) return false;
  await db.batch([
    db.delete(report).where(eq(report.storyId, storyId)),
    db
      .update(story)
      .set({ hidden: false, reportCount: 0 })
      .where(eq(story.id, storyId)),
  ]);
  await bumpFeedVersion(env.CACHE);
  return true;
}

/**
 * Deletes a Story for good (its Reports go with it by cascade) along with
 * its cover in R2. False when there is no such Story.
 */
export async function removeStory(
  env: Pick<Env, "DB" | "CACHE" | "COVERS">,
  storyId: string,
): Promise<boolean> {
  const db = getDb(env.DB);
  const found = await db
    .select({ coverKey: story.coverKey })
    .from(story)
    .where(eq(story.id, storyId))
    .get();
  if (!found) return false;
  await db.delete(story).where(eq(story.id, storyId));
  if (found.coverKey) {
    try {
      await env.COVERS.delete(found.coverKey);
    } catch (error) {
      console.error("admin: cover delete failed", error);
    }
  }
  await bumpFeedVersion(env.CACHE);
  return true;
}
