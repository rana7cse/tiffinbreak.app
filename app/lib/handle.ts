import { like } from "drizzle-orm";
import type { Db } from "~/db";
import { user } from "~/db/schema";

const MAX_LENGTH = 30;
const FALLBACK = "writer";

/**
 * Turns a display name into a handle stem: Latin letters and digits only,
 * lowercase, accents stripped. Bangla and other scripts are dropped, so a
 * Bangla-only name yields the fallback.
 */
export function slugifyHandle(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, MAX_LENGTH);
  return slug || FALLBACK;
}

/** A free handle for `name`: the slug, then slug2, slug3, ... on collision. */
export async function generateHandle(db: Db, name: string): Promise<string> {
  const base = slugifyHandle(name);
  const rows = await db
    .select({ handle: user.handle })
    .from(user)
    .where(like(user.handle, `${base}%`));
  const taken = new Set(rows.map((r) => r.handle));
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = String(n);
    const candidate = base.slice(0, MAX_LENGTH - suffix.length) + suffix;
    if (!taken.has(candidate)) return candidate;
  }
}
