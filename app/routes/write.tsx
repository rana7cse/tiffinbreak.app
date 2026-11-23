import { useEffect, useRef, useState } from "react";
import { data, Form, redirect, useNavigation } from "react-router";
import { CloseIcon, SchoolIcon } from "~/components/icons";
import { SchoolSheet } from "~/components/school-sheet";
import { cloudflareContext } from "~/context";
import { bn } from "~/lib/bangla-digits";
import { requireWriter } from "~/lib/require-writer";
import { findOrCreateSchool, findSchoolById } from "~/lib/schools";
import type { ShellHandle } from "~/lib/shell";
import { publishStory } from "~/lib/stories";
import { clearDraft, loadDraft, saveDraft, wordCount } from "~/lib/story-draft";
import {
  BODY_MAX,
  cleanStoryInput,
  TITLE_MAX,
  validateStoryInput,
} from "~/lib/story-input";
import { strings } from "~/strings";
import type { Route } from "./+types/write";

const t = strings.write;

/** The writing page has its own header instead of the bottom nav. */
export const handle = {
  shellClass: ["tb-app--reading"],
} as const satisfies ShellHandle;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(t.title) }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  return { writerId: user.id };
}

export async function action({ request, context }: Route.ActionArgs) {
  const { user } = await requireWriter({ request, context });
  const { env } = context.get(cloudflareContext);
  const form = await request.formData();
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

  // A School chosen in the sheet arrives by id; a bare name is found or
  // created here, so the form also works without JavaScript.
  const schoolId = field("schoolId");
  const school = schoolId
    ? await findSchoolById(env, schoolId)
    : await findOrCreateSchool(env, field("schoolName"));
  if (!school) errors.school = t.errors.schoolRequired;

  if (Object.keys(errors).length > 0 || !school) {
    return data(
      {
        errors,
        values: {
          title: rawTitle,
          body: rawBody,
          school: school ?? null,
        },
      },
      { status: 400 },
    );
  }

  const id = await publishStory(env, {
    writerId: user.id,
    schoolId: school.id,
    ...input,
  });
  return redirect(`/stories/${id}`);
}

type Prompt = (typeof strings.landing.prompts)[number]["question"];
const prompts: readonly Prompt[] = strings.landing.prompts.map(
  (p) => p.question,
);

const AUTOSAVE_DELAY_MS = 500;

export default function Write({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { writerId } = loaderData;
  const returned = actionData?.values;
  const errors: Record<string, string | undefined> = actionData?.errors ?? {};

  const [title, setTitle] = useState(returned?.title ?? "");
  const [body, setBody] = useState(returned?.body ?? "");
  const [school, setSchool] = useState(returned?.school ?? null);
  const [sheetOpen, setSheetOpen] = useState(!returned?.school);
  const [promptIndex, setPromptIndex] = useState(0);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const restored = useRef(false);
  const navigation = useNavigation();

  // Restore the draft once on return, unless the server sent input back.
  useEffect(() => {
    if (returned) {
      restored.current = true;
      return;
    }
    const draft = loadDraft(localStorage, writerId);
    if (draft) {
      setTitle(draft.title);
      setBody(draft.body);
      if (draft.school) {
        setSchool(draft.school);
        setSheetOpen(false);
      }
    }
    restored.current = true;
  }, [returned, writerId]);

  // Autosave, but never before the restore has run (it would wipe the draft).
  useEffect(() => {
    if (!restored.current) return;
    const timer = setTimeout(
      () => saveDraft(localStorage, writerId, { title, body, school }),
      AUTOSAVE_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [title, body, school, writerId]);

  // A successful publish navigates to the new Story; that is when the draft
  // goes. A validation failure stays on /write, so the draft is kept.
  const redirectingToStory =
    navigation.state === "loading" &&
    navigation.formMethod === "POST" &&
    navigation.location.pathname.startsWith("/stories/");
  useEffect(() => {
    if (redirectingToStory) clearDraft(localStorage, writerId);
  }, [redirectingToStory, writerId]);

  const words = wordCount(body);
  const prompt = prompts[promptIndex % prompts.length];
  const publishing = navigation.state !== "idle";

  return (
    <>
      <header
        className="tb-header tb-header--reading"
        style={{ padding: "10px 12px 10px 8px" }}
      >
        <a
          className="tb-icon-btn"
          href="/feed"
          aria-label={strings.common.close}
        >
          <CloseIcon size={22} color="#1E2A25" />
        </a>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: "var(--tb-muted)",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#2E8B57",
            }}
          />
          {t.autosave}
        </span>
        <button
          type="submit"
          form="tb-write-form"
          className="tb-btn tb-btn--primary tb-btn--pill"
          style={{ fontSize: 16, padding: "0 18px" }}
          disabled={publishing}
        >
          {publishing ? t.publishing : strings.story.publish}
        </button>
      </header>

      <Form
        id="tb-write-form"
        method="post"
        style={{
          flex: 1,
          padding: "18px 20px 0",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minHeight: 0,
        }}
      >
        <input type="hidden" name="schoolId" value={school?.id ?? ""} />

        <label className="tb-sr-only" htmlFor="tb-title">
          {t.storyTitle}
        </label>
        <input
          id="tb-title"
          name="title"
          className="tb-field tb-field--title"
          type="text"
          placeholder={strings.story.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={errors.title ? true : undefined}
        />
        {errors.title ? (
          <p className="tb-meta" role="alert">
            {errors.title}
          </p>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            color: "var(--tb-muted)",
          }}
        >
          <SchoolIcon size={16} color="#4F5A54" />
          {school ? (
            <>
              {school.name} ·{" "}
              <button
                type="button"
                className="tb-link"
                onClick={() => setSheetOpen(true)}
              >
                {t.changeSchool}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="tb-link"
              onClick={() => setSheetOpen(true)}
            >
              {t.chooseSchool}
            </button>
          )}
        </div>
        {errors.school ? (
          <p className="tb-meta" role="alert">
            {errors.school}
          </p>
        ) : null}

        <label className="tb-sr-only" htmlFor="tb-body">
          {t.storyBody}
        </label>
        <textarea
          id="tb-body"
          name="body"
          ref={bodyRef}
          className="tb-field tb-field--body"
          placeholder={strings.story.bodyPlaceholder}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          aria-invalid={errors.body ? true : undefined}
        />
        {errors.body ? (
          <p className="tb-meta" role="alert">
            {errors.body}
          </p>
        ) : null}

        {words < 8 ? (
          <section className="tb-prompt" id="tb-prompt">
            <span className="tb-tape" aria-hidden="true" />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#6B4E08" }}>
              {t.promptTitle}
            </p>
            <p
              id="tb-prompt-text"
              style={{
                margin: "4px 0 12px",
                fontSize: 17,
                lineHeight: 1.55,
                fontWeight: 500,
              }}
            >
              {prompt}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="tb-btn tb-btn--dark"
                style={{
                  borderRadius: 12,
                  fontSize: 15,
                  padding: "0 14px",
                  boxShadow: "var(--tb-shadow-sm)",
                }}
                onClick={() => {
                  setBody((b) => `${prompt}\n\n${b}`);
                  bodyRef.current?.focus();
                }}
              >
                {t.usePrompt}
              </button>
              <button
                type="button"
                className="tb-btn"
                style={{
                  borderRadius: 12,
                  fontSize: 15,
                  padding: "0 14px",
                  boxShadow: "var(--tb-shadow-sm)",
                }}
                onClick={() => setPromptIndex((i) => i + 1)}
              >
                {t.nextPrompt}
              </button>
            </div>
          </section>
        ) : null}
      </Form>

      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          marginTop: 14,
          padding: "8px 20px 22px",
          borderTop: "var(--tb-border)",
          background: "var(--tb-paper-2)",
        }}
      >
        <span className="tb-meta">
          <span id="tb-words">{bn(words)}</span> {t.wordsWritten}
        </span>
      </footer>

      <SchoolSheet
        open={sheetOpen}
        onSave={(s) => {
          setSchool(s);
          setSheetOpen(false);
        }}
        onSkip={() => setSheetOpen(false)}
      />
    </>
  );
}
