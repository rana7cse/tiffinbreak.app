export const DEFAULT_RETURN_TO = "/feed";

const FAKE_ORIGIN = "http://sanitize.invalid";

/**
 * Accepts only same-origin paths ("/feed?x=1"); anything else, including
 * protocol-relative ("//evil.com"), absolute URLs, backslash tricks and
 * "javascript:", falls back to `/feed`. Use it on every `returnTo` that
 * comes from the query string or a form field.
 */
export function sanitizeReturnTo(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_RETURN_TO;
  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }
  // Browsers turn backslashes and control characters into something else
  // ("/\evil.com" becomes "//evil.com"), so reject them outright.
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (ch === "\\" || code <= 0x1f || code === 0x7f) return DEFAULT_RETURN_TO;
  }
  try {
    if (new URL(value, FAKE_ORIGIN).origin !== FAKE_ORIGIN) {
      return DEFAULT_RETURN_TO;
    }
  } catch {
    return DEFAULT_RETURN_TO;
  }
  return value;
}
