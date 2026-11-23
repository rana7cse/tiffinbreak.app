/**
 * The canonical form of a School name: Unicode NFC, trimmed, and every run of
 * whitespace collapsed to one space. Two names that differ only in these ways
 * are the same School.
 */
export function normalizeSchoolName(name: string): string {
  return name.normalize("NFC").replace(/\s+/g, " ").trim();
}
