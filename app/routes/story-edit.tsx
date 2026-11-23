import { useState } from "react";
import { data, redirect, useNavigation } from "react-router";
import { CloseIcon } from "~/components/icons";
import { SchoolSheet } from "~/components/school-sheet";
import { StoryForm } from "~/components/story-form";
import { cloudflareContext } from "~/context";
import { overLimit } from "~/lib/rate-limit";
import { requireWriter } from "~/lib/require-writer";
import type { ShellHandle } from "~/lib/shell";
import {
  canEditStory,
  canReadStory,
  getStoryById,
  updateStory,
} from "~/lib/stories";
import { parseStoryForm, storyFormRateLimited } from "~/lib/story-form";
import { strings } from "~/strings";
import type { Route } from "./+types/story-edit";

const t = strings.manage;

export const handle = {
  shellClass: ["tb-app--reading"],
} as const satisfies ShellHandle;

export function meta(_: Route.MetaArgs) {
  return [{ title: strings.meta.pageTitle(t.editTitle) }];
}

/** The Story to edit: 404 when unknown or unreadable, 403 unless the owner. */
async function loadOwnStory(args: {
  request: Request;
  context: Route.LoaderArgs["context"];
  id: string;
}) {
  const { user } = await requireWriter(args);
  const { env } = args.context.get(cloudflareContext);
  const found = await getStoryById(env, args.id);
  const reader = user as { id: string; role?: string };
  if (!found || !canReadStory(found, reader)) {
    throw new Response("Not Found", { status: 404 });
  }
  if (!canEditStory(found, reader)) {
    throw new Response("Forbidden", { status: 403 });
  }
  return { env, found, user };
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const { found } = await loadOwnStory({ request, context, id: params.id });
  return {
    id: found.id,
    title: found.title,
    body: found.body,
    school: found.school,
    coverKey: found.coverKey,
  };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const { env, found, user } = await loadOwnStory({
    request,
    context,
    id: params.id,
  });
  const form = await request.formData();
  if (await overLimit(env, "edit", user.id)) {
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
  await updateStory(env, found, {
    ...parsed.input,
    schoolId: parsed.school.id,
    cover: parsed.cover,
    removeCover: parsed.removeCover,
  });
  return redirect(`/stories/${found.id}`);
}

export default function EditStory({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const returned = actionData?.values;
  const errors: Record<string, string | undefined> = actionData?.errors ?? {};
  const [title, setTitle] = useState(returned?.title ?? loaderData.title);
  const [body, setBody] = useState(returned?.body ?? loaderData.body);
  const [school, setSchool] = useState(returned?.school ?? loaderData.school);
  const [sheetOpen, setSheetOpen] = useState(false);
  const navigation = useNavigation();
  const saving = navigation.state !== "idle";

  return (
    <>
      <header
        className="tb-header tb-header--reading"
        style={{ padding: "10px 12px 10px 8px" }}
      >
        <a
          className="tb-icon-btn"
          href={`/stories/${loaderData.id}`}
          aria-label={strings.common.close}
        >
          <CloseIcon size={22} color="#1E2A25" />
        </a>
        <span className="tb-header__title">{t.editTitle}</span>
        <button
          type="submit"
          form="tb-edit-form"
          className="tb-btn tb-btn--primary tb-btn--pill"
          style={{ fontSize: 16, padding: "0 18px" }}
          disabled={saving}
        >
          {saving ? t.saving : t.save}
        </button>
      </header>

      <StoryForm
        id="tb-edit-form"
        title={title}
        onTitleChange={setTitle}
        body={body}
        onBodyChange={setBody}
        school={school}
        onOpenSheet={() => setSheetOpen(true)}
        errors={errors}
        existingCoverKey={loaderData.coverKey}
      />

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
