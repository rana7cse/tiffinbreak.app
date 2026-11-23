export type DraftSchool = { id: string; name: string };

export type StoryDraft = {
  title: string;
  body: string;
  school: DraftSchool | null;
};

/** The slice of `Storage` the draft needs, so tests can pass a fake. */
export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** One draft per Writer, so a shared phone never mixes two people's drafts. */
export function draftKey(writerId: string): string {
  return `tb:story-draft:${writerId}`;
}

/** The saved draft, or null when there is none or it is unreadable. */
export function loadDraft(
  storage: DraftStorage,
  writerId: string,
): StoryDraft | null {
  try {
    const raw = storage.getItem(draftKey(writerId));
    if (!raw) return null;
    const d = JSON.parse(raw) as Partial<StoryDraft>;
    if (typeof d.title !== "string" || typeof d.body !== "string") return null;
    const school =
      d.school &&
      typeof d.school.id === "string" &&
      typeof d.school.name === "string"
        ? { id: d.school.id, name: d.school.name }
        : null;
    return { title: d.title, body: d.body, school };
  } catch {
    return null;
  }
}

/** Saves the draft; an empty one clears instead. Storage failures are ignored. */
export function saveDraft(
  storage: DraftStorage,
  writerId: string,
  draft: StoryDraft,
): void {
  try {
    if (!draft.title.trim() && !draft.body.trim()) {
      storage.removeItem(draftKey(writerId));
      return;
    }
    storage.setItem(draftKey(writerId), JSON.stringify(draft));
  } catch {
    // Private mode or a full quota: autosave is best effort.
  }
}

export function clearDraft(storage: DraftStorage, writerId: string): void {
  try {
    storage.removeItem(draftKey(writerId));
  } catch {
    // Nothing to do.
  }
}

/** Whitespace-separated words, as the live counter and prompt rule use. */
export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}
