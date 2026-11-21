import type { CSSProperties } from "react";

/** Decorative artwork for the landing page, ported from theme/index.html. */

const STAR_PATH =
  "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z";

type DecoProps = { className?: string; style?: CSSProperties };

export function StarDeco({
  className,
  style,
  size = 16,
  color = "#F6C35B",
}: DecoProps & { size?: number; color?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      style={style}
    >
      <path d={STAR_PATH} />
    </svg>
  );
}

export function PaperPlane({ className, style }: DecoProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      width="38"
      height="24"
      viewBox="0 0 38 24"
      fill="none"
      stroke="#F3F1E7"
      strokeWidth="1.6"
      strokeLinejoin="round"
      style={style}
    >
      <path d="M1 12 37 1 26 23 18 15Z" />
      <path d="M37 1 18 15 16 22" />
    </svg>
  );
}

export function LunchBox({ className, style }: DecoProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      width="74"
      height="98"
      viewBox="0 0 84 110"
      fill="none"
      stroke="#F3F1E7"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <path className="tb-steam" d="M30 20c-4-5 4-8 0-14" />
      <path className="tb-steam2" d="M46 20c-4-5 4-8 0-14" />
      <g className="tb-lid">
        <path d="M28 30c0-7 28-7 28 0" />
        <rect
          x="14"
          y="30"
          width="56"
          height="10"
          rx="4"
          fill="#F6C35B"
          stroke="#F3F1E7"
        />
      </g>
      <rect x="12" y="44" width="60" height="20" rx="6" fill="#3E5C4C" />
      <rect x="12" y="66" width="60" height="20" rx="6" fill="#3E5C4C" />
      <rect x="12" y="88" width="60" height="20" rx="6" fill="#3E5C4C" />
    </svg>
  );
}

export function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F6C35B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2v2" />
      <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

/** The hand-drawn yellow underline under the headline word. */
export function WordUnderline() {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 14" preserveAspectRatio="none">
      <path
        className="tb-underline"
        d="M3 9 C 50 3, 120 13, 197 5"
        fill="none"
        stroke="#F6C35B"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PaperClip({
  color,
  rotate,
}: {
  color: string;
  rotate: number;
}) {
  return (
    <svg
      className="tb-note__clip"
      aria-hidden="true"
      width="18"
      height="46"
      viewBox="0 0 18 46"
      fill="none"
      stroke={color}
      strokeWidth="2.8"
      strokeLinecap="round"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M6 34V9a4 4 0 0 1 8 0v27a6.5 6.5 0 0 1-13 0V12" />
    </svg>
  );
}

export function Pencil({ style }: { style?: CSSProperties }) {
  return (
    <svg
      aria-hidden="true"
      width="64"
      height="20"
      viewBox="0 0 64 20"
      fill="none"
      stroke="#1E2A25"
      strokeWidth="1.6"
      strokeLinejoin="round"
      style={style}
    >
      <rect x="10" y="4" width="40" height="12" rx="2" fill="#F6C35B" />
      <path d="M50 4l12 6-12 6z" fill="#F3E3C3" />
      <rect x="2" y="4" width="8" height="12" rx="2" fill="#F9A9A0" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#FFFFFF" />
      <path
        d="M13.2 19v-6h2.1l.4-2.5h-2.5V8.9c0-.7.3-1.2 1.3-1.2h1.3V5.5c-.3 0-1-.1-1.9-.1-1.9 0-3.1 1.1-3.1 3.2v1.9H8.7V13h2.1v6z"
        fill="#1466D2"
      />
    </svg>
  );
}

/** The tiffin-stack logo mark used in the header. */
export function BrandMark() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="#1E2A25"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 6c0-2 10-2 10 0" />
      <rect x="7" y="7" width="18" height="6" rx="2.5" fill="#F6C35B" />
      <rect x="7" y="14" width="18" height="6" rx="2.5" fill="#CFE8D6" />
      <rect x="7" y="21" width="18" height="6" rx="2.5" fill="#F9D3CF" />
    </svg>
  );
}
