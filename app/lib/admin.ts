import { asc, desc, eq, gt, inArray, or } from "drizzle-orm";
import { getDb } from "~/db";
import { report, school, story, user } from "~/db/schema";
import { normalizeSchoolName } from "./school-name";
import { bumpVersion as bumpSchoolsVersion } from "./schools";
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

/** Every School name, for the merge form's suggestions. */
export async function listSchoolNames(env: Pick<Env, "DB">) {
  return getDb(env.DB)
    .select({ id: school.id, name: school.name })
    .from(school)
    .orderBy(asc(school.name))
    .limit(1000);
}

export type MergeResult = "merged" | "not-found" | "same";

/** A School by id or by (normalised) name. */
async function resolveSchool(env: Pick<Env, "DB">, ref: string) {
  const db = getDb(env.DB);
  const byId = await db
    .select({ id: school.id })
    .from(school)
    .where(eq(school.id, ref.trim()))
    .get();
  if (byId) return byId.id;
  const byName = await db
    .select({ id: school.id })
    .from(school)
    .where(eq(school.name, normalizeSchoolName(ref)))
    .get();
  return byName?.id ?? null;
}

/**
 * Folds a duplicate School into the kept one: its Stories move over and the
 * duplicate row is deleted, in one D1 batch. Each argument is a School id or
 * name. The duplicate's old URL then 404s (no redirect).
 */
export async function mergeSchools(
  env: Pick<Env, "DB" | "CACHE">,
  duplicateRef: string,
  keptRef: string,
): Promise<MergeResult> {
  const duplicateId = await resolveSchool(env, duplicateRef);
  const keptId = await resolveSchool(env, keptRef);
  if (!duplicateId || !keptId) return "not-found";
  if (duplicateId === keptId) return "same";
  const db = getDb(env.DB);
  await db.batch([
    db
      .update(story)
      .set({ schoolId: keptId })
      .where(eq(story.schoolId, duplicateId)),
    db.delete(school).where(eq(school.id, duplicateId)),
  ]);
  await bumpSchoolsVersion(env.CACHE);
  await bumpFeedVersion(env.CACHE);
  return "merged";
}
