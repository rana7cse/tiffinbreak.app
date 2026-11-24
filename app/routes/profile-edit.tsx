import { useRef, useState } from "react";
import { data, Form, redirect, useNavigation } from "react-router";
import { BottomNav, withNavShell } from "~/components/app-shell";
import { Avatar } from "~/components/avatar";
import { BackIcon } from "~/components/icons";
import { cloudflareContext } from "~/context";
import { bn } from "~/lib/bangla-digits";
import {
  COVER_MAX_BYTES,
  deleteCover,
  ownCoverKey,
  storeCover,
  validateCover,
} from "~/lib/cover";
import {
  cleanHandle,
  HANDLE_MAX,
  HANDLE_MIN,
  NAME_MAX,
  validateHandle,
} from "~/lib/handle";
import { overLimit } from "~/lib/rate-limit";
import { requireWriter } from "~/lib/require-writer";
import type { ShellHandle } from "~/lib/shell";
import { coverUrl, pageShareMeta } from "~/lib/story-share";
import {
  getWriterImage,
  handleTaken,
  updateWriterProfile,
} from "~/lib/writers";
import { strings } from "~/strings";
import type { Route } from "./+types/profile-edit";

const t = strings.editProfile;

export const handle = withNavShell satisfies ShellHandle;

export function meta({ loaderData, location }: Route.MetaArgs) {
  const title = strings.meta.pageTitle(t.title);
  return [
    { title },
    ...(loaderData
      ? pageShareMeta({
          origin: loaderData.origin,
          path: location.pathname,
          title,
          description: strings.meta.siteDescription,
        })
      : []),
  ];
}

type Me = { id: string; name: string; image?: string | null; handle?: string };

export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = await requireWriter({ request, context });
  const me = user as Me;
  return {
    origin: new URL(request.url).origin,
    name: me.name,
    handle: me.handle ?? "",
    image: me.image ?? null,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const { user } = await requireWriter({ request, context });
  const me = user as Me;
  const { env } = context.get(cloudflareContext);
  const form = await request.formData();
  const field = (name: string) => {
    const v = form.get(name);
    return typeof v === "string" ? v : "";
  };

  const name = field("name").trim();
  const handleInput = cleanHandle(field("handle"));
  const errors: Record<string, string> = {};
  const min = bn(HANDLE_MIN);
  const max = bn(HANDLE_MAX);

  if (!name) errors.name = t.errors.nameRequired;
  else if ([...name].length > NAME_MAX) {
    errors.name = t.errors.nameTooLong(bn(NAME_MAX));
  }

  // Keeping the current handle is always fine (older handles may be short).
  if (handleInput !== me.handle) {
    const handleError = validateHandle(handleInput);
    if (handleError === "handleLength") {
      errors.handle = t.errors.handleLength(min, max);
    } else if (handleError) {
      errors.handle = t.errors[handleError];
    } else if (await handleTaken(env, handleInput, me.id)) {
      errors.handle = t.errors.handleTaken;
    }
  }

  const upload = form.get("avatar");
  const avatar = upload instanceof File && upload.size > 0 ? upload : null;
  const avatarError = avatar ? validateCover(avatar) : null;
  if (avatarError === "coverType") errors.avatar = t.errors.avatarType;
  else if (avatarError) {
    errors.avatar = t.errors.avatarTooBig(bn(COVER_MAX_BYTES / (1024 * 1024)));
  }

  const failed = (errs: Record<string, string>) =>
    data(
      {
        errors: errs,
        values: { name: field("name"), handle: field("handle") },
      },
      { status: 400 },
    );
  if (Object.keys(errors).length > 0) return failed(errors);
  if (avatar && (await overLimit(env, "upload", me.id))) {
    return data(
      {
        errors: {
          avatar: `${strings.errors.rateLimited} ${strings.errors.tryAgainLater}`,
        },
        values: { name: field("name"), handle: field("handle") },
      },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const newKey = avatar ? await storeCover(env, avatar) : null;
  const oldImage = newKey ? await getWriterImage(env, me.id) : null;
  let saved = false;
  try {
    saved = await updateWriterProfile(env, me.id, {
      name,
      handle: handleInput,
      image: coverUrl("", newKey) ?? undefined,
    });
  } catch (error) {
    await deleteCover(env, newKey);
    throw error;
  }
  if (!saved) {
    await deleteCover(env, newKey);
    return failed({ handle: t.errors.handleTaken });
  }
  // The replaced avatar is ours only if it is a stored cover, never a
  // Google or Facebook photo URL.
  await deleteCover(env, ownCoverKey(oldImage));
  return redirect(`/writers/${handleInput}`);
}

export default function EditProfile({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const errors: Record<string, string | undefined> = actionData?.errors ?? {};
  const values = actionData?.values ?? loaderData;
  const [preview, setPreview] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const saving = useNavigation().state === "submitting";

  return (
    <>
      <header className="tb-header tb-header--compact">
        <a
          className="tb-icon-btn"
          href={`/writers/${loaderData.handle}`}
          aria-label={t.cancel}
        >
          <BackIcon size={22} color="var(--tb-ink)" />
        </a>
        <span className="tb-header__title">{t.title}</span>
        <span style={{ width: 44 }} />
      </header>

      <Form
        method="post"
        encType="multipart/form-data"
        style={{
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <span className="tb-label">{t.avatarLabel}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Avatar
            name={values.name}
            image={preview ?? loaderData.image}
            size="lg"
          />
          <button
            type="button"
            className="tb-link"
            onClick={() => input.current?.click()}
          >
            {t.avatarChange}
          </button>
        </div>
        <input
          ref={input}
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
        {errors.avatar ? (
          <p className="tb-meta" role="alert">
            {errors.avatar}
          </p>
        ) : null}

        <label className="tb-label" htmlFor="tb-name">
          {t.nameLabel}
        </label>
        <input
          id="tb-name"
          name="name"
          className="tb-input"
          type="text"
          defaultValue={values.name}
          aria-invalid={errors.name ? true : undefined}
        />
        {errors.name ? (
          <p className="tb-meta" role="alert">
            {errors.name}
          </p>
        ) : null}

        <label className="tb-label" htmlFor="tb-handle">
          {t.handleLabel}
        </label>
        <input
          id="tb-handle"
          name="handle"
          className="tb-input"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          defaultValue={values.handle}
          aria-invalid={errors.handle ? true : undefined}
        />
        <p className="tb-meta">
          {t.handleHint(bn(HANDLE_MIN), bn(HANDLE_MAX))}
        </p>
        {errors.handle ? (
          <p className="tb-meta" role="alert">
            {errors.handle}
          </p>
        ) : null}

        <button
          type="submit"
          className="tb-btn tb-btn--primary tb-btn--pill"
          disabled={saving}
        >
          {saving ? t.saving : t.save}
        </button>
      </Form>

      <BottomNav active="profile" />
    </>
  );
}
