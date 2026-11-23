import { strings } from "~/strings";
import { bn } from "./bangla-digits";

const DAY_MS = 24 * 60 * 60 * 1000;
export const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

/** "২১ নভেম্বর", in Bangladesh time. */
export function formatStoryDate(date: Date): string {
  const d = new Date(date.getTime() + DHAKA_OFFSET_MS);
  return `${bn(d.getUTCDate())} ${strings.story.months[d.getUTCMonth()]}`;
}

/**
 * "২ ঘণ্টা আগে", "গতকাল", "৩ দিন আগে"; a plain date from a week on.
 * Days are counted on the Bangladesh calendar.
 */
export function relativeTime(createdAt: number, now = Date.now()): string {
  const t = strings.feed.time;
  const diff = Math.max(0, now - createdAt);
  if (diff < 60_000) return t.justNow;
  if (diff < 3_600_000) return t.minutesAgo(bn(Math.floor(diff / 60_000)));
  if (diff < DAY_MS) return t.hoursAgo(bn(Math.floor(diff / 3_600_000)));
  const day = (ms: number) => Math.floor((ms + DHAKA_OFFSET_MS) / DAY_MS);
  const days = day(now) - day(createdAt);
  if (days <= 1) return t.yesterday;
  if (days < 7) return t.daysAgo(bn(days));
  return formatStoryDate(new Date(createdAt));
}
