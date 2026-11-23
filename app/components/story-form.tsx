import { type ReactNode, type Ref, useRef, useState } from "react";
import { Form } from "react-router";
import { resizeCover } from "~/lib/cover-resize";
import { coverUrl } from "~/lib/story-share";
import { strings } from "~/strings";
import { ImageIcon, SchoolIcon } from "./icons";

const t = strings.write;

type Props = {
  id: string;
  title: string;
  onTitleChange: (value: string) => void;
  body: string;
  onBodyChange: (value: string) => void;
  bodyRef?: Ref<HTMLTextAreaElement>;
  school: { id: string; name: string } | null;
  onOpenSheet: () => void;
  errors: Record<string, string | undefined>;
  /** The Story's stored cover, when editing. */
  existingCoverKey?: string | null;
  /** Extra content after the body field (the Write page's prompt card). */
  children?: ReactNode;
};

/**
 * The Story form shared by the Write and Edit pages: cover picker, title,
 * School and body. State lives in the page, which owns drafts and the sheet.
 */
export function StoryForm({
  id,
  title,
  onTitleChange,
  body,
  onBodyChange,
  bodyRef,
  school,
  onOpenSheet,
  errors,
  existingCoverKey = null,
  children,
}: Props) {
  const coverInput = useRef<HTMLInputElement>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [removeExisting, setRemoveExisting] = useState(false);

  const shownCover =
    coverPreview ??
    (existingCoverKey && !removeExisting
      ? coverUrl("", existingCoverKey)
      : null);

  // Shrink the picked photo in the browser; the resized File replaces the
  // original in the input, so the normal form submit uploads it.
  async function pickCover(file: File | undefined) {
    const input = coverInput.current;
    if (!input || !file) return;
    const resized = await resizeCover(file);
    const files = new DataTransfer();
    files.items.add(resized);
    input.files = files.files;
    setCoverPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(resized);
    });
  }

  function removeCover() {
    if (coverInput.current) coverInput.current.value = "";
    setRemoveExisting(true);
    setCoverPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  return (
    <Form
      id={id}
      method="post"
      encType="multipart/form-data"
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
      <input type="hidden" name="schoolName" value={school?.name ?? ""} />
      {removeExisting ? (
        <input type="hidden" name="removeCover" value="1" />
      ) : null}

      <input
        ref={coverInput}
        id="tb-cover"
        name="cover"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => pickCover(e.target.files?.[0])}
      />
      {shownCover ? (
        <div>
          <img
            src={shownCover}
            alt={t.coverAlt}
            style={{
              display: "block",
              width: "100%",
              height: 180,
              objectFit: "cover",
              borderRadius: 18,
              border: "var(--tb-border)",
            }}
          />
          <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
            <button
              type="button"
              className="tb-link"
              onClick={() => coverInput.current?.click()}
            >
              {t.coverChange}
            </button>
            <button type="button" className="tb-link" onClick={removeCover}>
              {t.coverRemove}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="tb-dropzone"
          onClick={() => coverInput.current?.click()}
        >
          <ImageIcon size={24} color="var(--tb-muted)" />
          {t.coverPick}
        </button>
      )}
      {errors.form ? (
        <p className="tb-meta" role="alert">
          {errors.form}
        </p>
      ) : null}
      {errors.cover ? (
        <p className="tb-meta" role="alert">
          {errors.cover}
        </p>
      ) : null}

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
        onChange={(e) => onTitleChange(e.target.value)}
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
        <SchoolIcon size={16} color="var(--tb-muted)" />
        {school ? (
          <>
            {school.name} ·{" "}
            <button type="button" className="tb-link" onClick={onOpenSheet}>
              {t.changeSchool}
            </button>
          </>
        ) : (
          <button type="button" className="tb-link" onClick={onOpenSheet}>
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
        onChange={(e) => onBodyChange(e.target.value)}
        aria-invalid={errors.body ? true : undefined}
      />
      {errors.body ? (
        <p className="tb-meta" role="alert">
          {errors.body}
        </p>
      ) : null}

      {children}
    </Form>
  );
}
