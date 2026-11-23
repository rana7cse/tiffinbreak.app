import { data } from "react-router";
import { bn } from "~/lib/bangla-digits";
import { COVER_MAX_BYTES, type CoverError, validateCover } from "~/lib/cover";
import { findOrCreateSchool, findSchoolById } from "~/lib/schools";
import {
  BODY_MAX,
  cleanStoryInput,
  TITLE_MAX,
  validateStoryInput,
} from "~/lib/story-input";
import { strings } from "~/strings";

const t = strings.write;

type School = { id: string; name: string };

export type StoryFormResult =
  | {
      ok: true;
      input: { title: string; body: string };
      school: School;
      cover: File | null;
      removeCover: boolean;
    }
  | {
      ok: false;
      errors: Record<string, string>;
      values: { title: string; body: string; school: School | null };
    };

/**
 * The 429 answer for a Write/Edit post over a rate limit: the same form
 * re-rendered with a Bangla message, keeping what the Writer typed.
 */
export function storyFormRateLimited(
  form: FormData,
  kind: "form" | "cover" = "form",
) {
  const field = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v : "";
  };
  const message = `${strings.errors.rateLimited} ${strings.errors.tryAgainLater}`;
  return data(
    {
      errors: { [kind]: message } as Record<string, string>,
      values: { title: field("title"), body: field("body"), school: null },
    },
    { status: 429, headers: { "Retry-After": "60" } },
  );
}

/**
 * Reads and validates the Write/Edit form: the same rules for publishing and
 * editing. A School arrives by id (chosen in the sheet) or as a bare name,
 * which is found or created, so the form also works without JavaScript.
 */
export async function parseStoryForm(
  env: Pick<Env, "DB" | "CACHE">,
  form: FormData,
): Promise<StoryFormResult> {
  const field = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v : "";
  };

  const rawTitle = field("title");
  const rawBody = field("body");
  const input = cleanStoryInput(rawTitle, rawBody);
  const errors: Record<string, string> = {};
  for (const [name, code] of Object.entries(validateStoryInput(input))) {
    errors[name] =
      code === "titleTooLong"
        ? t.errors.titleTooLong(bn(TITLE_MAX))
        : code === "bodyTooLong"
          ? t.errors.bodyTooLong(bn(BODY_MAX))
          : t.errors[code];
  }

  const schoolId = field("schoolId");
  // A School chosen in the sheet arrives by id. If it was merged away since
  // (a stale draft), fall back to its name rather than losing the choice.
  const school =
    (schoolId ? await findSchoolById(env, schoolId) : null) ??
    (await findOrCreateSchool(env, field("schoolName")));
  if (!school) errors.school = t.errors.schoolRequired;

  const upload = form.get("cover");
  const cover = upload instanceof File && upload.size > 0 ? upload : null;
  const coverError: CoverError | null = cover ? validateCover(cover) : null;
  if (coverError) {
    errors.cover =
      coverError === "coverTooBig"
        ? t.errors.coverTooBig(bn(COVER_MAX_BYTES / (1024 * 1024)))
        : t.errors[coverError];
  }

  if (Object.keys(errors).length > 0 || !school) {
    return {
      ok: false,
      errors,
      values: { title: rawTitle, body: rawBody, school: school ?? null },
    };
  }
  return {
    ok: true,
    input,
    school,
    cover,
    removeCover: field("removeCover") === "1",
  };
}
