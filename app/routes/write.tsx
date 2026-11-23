import { useEffect, useRef, useState } from "react";
import { data, redirect, useNavigation } from "react-router";
import { CloseIcon } from "~/components/icons";
import { SchoolSheet } from "~/components/school-sheet";
import { StoryForm } from "~/components/story-form";
import { cloudflareContext } from "~/context";
import { bn } from "~/lib/bangla-digits";
import { storeCover } from "~/lib/cover";
import { overLimit } from "~/lib/rate-limit";
import { requireWriter } from "~/lib/require-writer";
import type { ShellHandle } from "~/lib/shell";
import { publishStory } from "~/lib/stories";
import { clearDraft, loadDraft, saveDraft, wordCount } from "~/lib/story-draft";
import { parseStoryForm, storyFormRateLimited } from "~/lib/story-form";
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
  if (await overLimit(env, "publish", user.id)) {
    return storyFormRateLimited(form);
  }
  const parsed = await parseStoryForm(env, form);
  if (!parsed.ok) {
    return data(
      { errors: parsed.errors, values: parsed.values },
      { status: 400 },
    );
  }
  if (parsed.cover && (await overLimit(env, "upload", user.id))) {
    return storyFormRateLimited(form, "cover");
  }

  const coverKey = parsed.cover ? await storeCover(env, parsed.cover) : null;
  const id = await publishStory(env, {
    writerId: user.id,
    schoolId: parsed.school.id,
    coverKey,
    ...parsed.input,
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

      <StoryForm
        id="tb-write-form"
        title={title}
        onTitleChange={setTitle}
        body={body}
        onBodyChange={setBody}
        bodyRef={bodyRef}
        school={school}
        onOpenSheet={() => setSheetOpen(true)}
        errors={errors}
      >
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
      </StoryForm>

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
