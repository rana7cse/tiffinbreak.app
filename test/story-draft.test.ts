import { describe, expect, it } from "vitest";
import {
  clearDraft,
  draftKey,
  loadDraft,
  saveDraft,
  wordCount,
} from "~/lib/story-draft";

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const draft = {
  title: "নাম",
  body: "লেখা",
  school: { id: "s1", name: "স্কুল" },
};

describe("story draft", () => {
  it("restores what was saved, per Writer", () => {
    const s = memoryStorage();
    saveDraft(s, "w1", draft);
    expect(loadDraft(s, "w1")).toEqual(draft);
    expect(loadDraft(s, "w2")).toBeNull();
    expect(draftKey("w1")).not.toBe(draftKey("w2"));
  });

  it("clears on publish", () => {
    const s = memoryStorage();
    saveDraft(s, "w1", draft);
    clearDraft(s, "w1");
    expect(loadDraft(s, "w1")).toBeNull();
  });

  it("does not store an empty draft and ignores corrupt data", () => {
    const s = memoryStorage();
    saveDraft(s, "w1", { title: " ", body: "", school: null });
    expect(loadDraft(s, "w1")).toBeNull();
    s.setItem(draftKey("w1"), "{oops");
    expect(loadDraft(s, "w1")).toBeNull();
  });

  it("counts words", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("  এক  দুই\nতিন ")).toBe(3);
  });
});
