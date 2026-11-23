import { env } from "cloudflare:workers";
import { signInAs } from "./session";

type StoryOptions = {
  /** An existing Writer's id; a new signed-in Writer is created when omitted. */
  writerId?: string;
  /** An existing School's id; a new School is created when omitted. */
  schoolId?: string;
  schoolName?: string;
  title?: string;
  body?: string;
  coverKey?: string | null;
  loveTotal?: number;
  reportCount?: number;
  hidden?: boolean;
  createdAt?: Date;
};

/**
 * Creates a Story (and, unless given, its Writer and School) directly in D1.
 * Later tickets reuse it to set up Stories for Feed, Love, Report, etc.:
 *
 *   const { story, writer, cookie } = await createStory({ hidden: true });
 *   await exports.default.fetch(`http://example.com/stories/${story.id}`, ...);
 *
 * `writer`/`cookie` are only set when the Writer was created here.
 */
export async function createStory(opts: StoryOptions = {}) {
  const created = opts.writerId ? undefined : await signInAs({ name: "গল্পকার" });
  const writerId = (opts.writerId ?? created?.writer.id) as string;

  const schoolId = opts.schoolId ?? crypto.randomUUID();
  const schoolName = opts.schoolName ?? `রূপনগর হাই স্কুল ${schoolId}`;
  if (!opts.schoolId) {
    await env.DB.prepare(
      "INSERT INTO school (id, name, normalized_name) VALUES (?, ?, ?)",
    )
      .bind(schoolId, schoolName, schoolName)
      .run();
  }

  const id = crypto.randomUUID();
  const title = opts.title ?? "টিফিনের পরোটা আর মিঠুর সেই চুরি";
  const body =
    opts.body ??
    "ক্লাস সেভেনে রোজ টিফিন বক্স খুলে দেখতাম একটা পরোটা নেই।\n\nমা গুনে গুনে তিনটা দিতেন।";
  const createdAt = (opts.createdAt ?? new Date()).getTime();
  await env.DB.prepare(
    "INSERT INTO story (id, writer_id, school_id, title, body, cover_key, love_total, report_count, hidden, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(
      id,
      writerId,
      schoolId,
      title,
      body,
      opts.coverKey ?? null,
      opts.loveTotal ?? 0,
      opts.reportCount ?? 0,
      opts.hidden ? 1 : 0,
      createdAt,
      createdAt,
    )
    .run();

  return {
    story: { id, writerId, schoolId, title, body },
    school: { id: schoolId, name: schoolName },
    writer: created?.writer,
    cookie: created?.cookie,
  };
}
