import { PenIcon } from "~/components/icons";
import { strings } from "~/strings";

const t = strings.feed;

/** The empty Feed invitation (theme/feed.html `<DiaryEmptyState />`). */
export function DiaryEmptyState() {
  return (
    <section
      className="tb-card tb-card--pad"
      aria-labelledby="tb-diary"
      style={{ paddingBottom: 20 }}
    >
      <h2 id="tb-diary">
        <span
          className="tb-marker"
          style={{ fontFamily: "var(--tb-font-display)", fontSize: 20 }}
        >
          {t.myDiary}
        </span>
      </h2>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "16px 0 4px",
        }}
      >
        <svg
          aria-hidden="true"
          width="190"
          height="118"
          viewBox="0 0 190 118"
          fill="none"
          stroke="#1E2A25"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        >
          <path
            d="M95 22C78 10 44 8 12 15v90c32-7 66-5 83 7 17-12 51-14 83-7V15C146 8 112 10 95 22z"
            fill="#FFFDF5"
          />
          <path d="M95 22v90" />
          <path
            d="M26 36h52M26 50h52M26 64h52M26 78h36M112 36h52M112 50h52M112 64h40"
            stroke="#B5D4F4"
            strokeWidth="1.5"
          />
          <path d="M20 30v70" stroke="#F09595" strokeWidth="1.5" />
          <g transform="rotate(-38 140 86)">
            <rect x="112" y="80" width="46" height="12" rx="2" fill="#F6C35B" />
            <path d="M158 80l12 6-12 6z" fill="#F3E3C3" />
            <rect x="104" y="80" width="8" height="12" rx="2" fill="#F9A9A0" />
          </g>
          <rect
            x="34"
            y="2"
            width="36"
            height="14"
            rx="2"
            fill="rgba(255,255,255,0.75)"
            stroke="rgba(30,42,37,0.3)"
            strokeWidth="1"
            transform="rotate(-6 52 9)"
          />
        </svg>
      </div>
      <p
        className="tb-display"
        style={{
          marginTop: 10,
          textAlign: "center",
          fontSize: 23,
          lineHeight: 1.35,
          color: "var(--tb-board)",
        }}
      >
        {t.emptyTitle}
      </p>
      <p
        className="tb-lead"
        style={{ margin: "4px 0 18px", textAlign: "center", lineHeight: 1.6 }}
      >
        {t.emptyLead}
      </p>
      <a
        className="tb-btn tb-btn--primary tb-btn--block"
        href="/write"
        style={{ minHeight: 52, borderRadius: 14 }}
      >
        <PenIcon size={18} color="#FFFFFF" />
        {t.writeFirst}
      </a>
    </section>
  );
}
