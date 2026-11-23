import { useEffect, useId, useState } from "react";
import { SchoolIcon } from "~/components/icons";
import { normalizeSchoolName } from "~/lib/school-name";
import { strings } from "~/strings";

const t = strings.school;

export type SchoolOption = { id: string; name: string };

type SchoolSheetProps = {
  open: boolean;
  /** Called with the saved (found or created) School. */
  onSave: (school: SchoolOption) => void;
  /** Called when the Writer chooses "not now". */
  onSkip: () => void;
  /** Shown before the Writer types anything. */
  initialSuggestions?: SchoolOption[];
};

/**
 * The add-School bottom sheet (theme/school.html). Suggestions come from
 * `GET /schools?q=`; saving does `POST /schools`, which finds or creates the
 * School, so typing a new name needs no separate step.
 */
export function SchoolSheet({
  open,
  onSave,
  onSkip,
  initialSuggestions = [],
}: SchoolSheetProps) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] =
    useState<SchoolOption[]>(initialSuggestions);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const q = normalizeSchoolName(query);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        try {
          const res = await fetch(`/schools?q=${encodeURIComponent(q)}`, {
            headers: { accept: "application/json" },
            signal: controller.signal,
          });
          if (!res.ok) return;
          const data = (await res.json()) as { schools: SchoolOption[] };
          setSuggestions(data.schools);
        } catch {
          // Suggestions are a convenience; typing a name still works.
        }
      },
      q ? 200 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, q]);

  if (!open) return null;

  const exact = suggestions.some((s) => s.name === q);
  const hint = !q
    ? t.suggestionsHint
    : suggestions.length
      ? t.matchHint
      : t.newNameHint;

  async function save() {
    if (!q || saving) return;
    setSaving(true);
    setFailed(false);
    try {
      const res = await fetch("/schools", {
        method: "POST",
        headers: { accept: "application/json" },
        body: new URLSearchParams({ name: q }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { school: SchoolOption };
      onSave(data.school);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="tb-scrim">
      <section
        className="tb-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tb-school-title"
      >
        <div className="tb-sheet__grip" aria-hidden="true" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 6,
          }}
        >
          <div className="tb-tile-icon">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1E2A25"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 10l9-6 9 6" fill="#F9A9A0" />
              <path d="M5 10v9h14v-9" fill="#FFFFFF" />
              <path d="M10 19v-5h4v5" fill="#CFE8D6" />
              <path d="M12 4V2" />
            </svg>
          </div>
          <h2
            id="tb-school-title"
            className="tb-display"
            style={{
              fontSize: 26,
              lineHeight: 1.3,
              color: "var(--tb-board)",
            }}
          >
            {t.question}
          </h2>
        </div>
        <p className="tb-lead" style={{ lineHeight: 1.6 }}>
          {t.lead}
        </p>

        <label className="tb-label" htmlFor={inputId} style={{ marginTop: 6 }}>
          {t.label}
        </label>
        <input
          id={inputId}
          className="tb-input"
          type="text"
          placeholder={t.placeholder}
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="tb-meta" id="tb-school-hint">
            {hint}
          </span>
          <div
            id="tb-school-list"
            role="listbox"
            aria-labelledby="tb-school-hint"
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="tb-suggest"
                role="option"
                aria-selected={s.name === q}
                onClick={() => setQuery(s.name)}
              >
                <SchoolIcon size={18} color="var(--tb-subtle)" />
                {s.name}
              </button>
            ))}
            {q && !exact ? (
              <button
                type="button"
                className="tb-suggest"
                role="option"
                aria-selected={false}
                onClick={save}
              >
                <SchoolIcon size={18} color="var(--tb-subtle)" />
                {t.addNew(q)}
              </button>
            ) : null}
          </div>
        </div>

        {failed ? (
          <p className="tb-meta" role="alert">
            {t.saveFailed}
          </p>
        ) : null}

        <button
          type="button"
          className="tb-btn tb-btn--primary tb-btn--lg tb-btn--block"
          style={{ marginTop: 6 }}
          disabled={!q || saving}
          onClick={save}
        >
          {saving ? t.saving : t.save}
        </button>
        <button
          type="button"
          className="tb-link"
          style={{ alignSelf: "center" }}
          onClick={onSkip}
        >
          {t.skip}
        </button>
      </section>
    </div>
  );
}
