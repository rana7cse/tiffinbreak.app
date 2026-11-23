import { eq } from "drizzle-orm";
import { getDb } from "~/db";
import { school, story, user } from "~/db/schema";
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

/** Inserts a published Story and returns its id. */
export async function publishStory(
  env: Pick<Env, "DB">,
  input: { writerId: string; schoolId: string; title: string; body: string },
): Promise<string> {
  const id = crypto.randomUUID();
  await getDb(env.DB)
    .insert(story)
    .values({ id, ...input });
  return id;
}
