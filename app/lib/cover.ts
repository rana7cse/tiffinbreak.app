/**
 * Cover photos: validation and R2 storage. The stored `cover_key` is
 * `covers/<random>.<ext>`, which is also the public path (`/covers/:name`),
 * so `coverUrl` in `story-share.ts` needs no special case.
 */

export const COVER_MAX_BYTES = 3 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const TYPES_BY_EXTENSION = Object.fromEntries(
  Object.entries(EXTENSIONS).map(([type, ext]) => [ext, type]),
);

const NAME_PATTERN = /^[0-9a-f]{32}\.(jpg|png|webp)$/;

export type CoverError = "coverType" | "coverTooBig";

/** What is wrong with an uploaded cover, or null when it is acceptable. */
export function validateCover(file: File): CoverError | null {
  if (!(file.type in EXTENSIONS)) return "coverType";
  if (file.size > COVER_MAX_BYTES) return "coverTooBig";
  return null;
}

/** Stores a (valid) cover in R2 under a random, unguessable key. */
export async function storeCover(
  env: Pick<Env, "COVERS">,
  file: File,
): Promise<string> {
  const random = crypto.getRandomValues(new Uint8Array(16));
  const name = Array.from(random, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  const key = `covers/${name}.${EXTENSIONS[file.type]}`;
  await env.COVERS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  return key;
}

/**
 * The R2 key behind a stored `/covers/...` image path, or null for anything
 * else (a Google or Facebook photo URL, or no image). Only our own objects
 * may ever be deleted.
 */
export function ownCoverKey(image: string | null | undefined): string | null {
  const key = image?.startsWith("/") ? image.slice(1) : null;
  return key && /^covers\/[0-9a-f]{32}\.(jpg|png|webp)$/.test(key) ? key : null;
}

/** Removes a cover from R2. Best effort: an orphan object is harmless. */
export async function deleteCover(
  env: Pick<Env, "COVERS">,
  key: string | null,
): Promise<void> {
  if (!key) return;
  try {
    await env.COVERS.delete(key);
  } catch (error) {
    console.error("cover: delete failed", error);
  }
}

/** Reads a cover for the public route; null for a malformed or unknown key. */
export async function readCover(env: Pick<Env, "COVERS">, name: string) {
  if (!NAME_PATTERN.test(name)) return null;
  const object = await env.COVERS.get(`covers/${name}`);
  if (!object) return null;
  return {
    body: object.body,
    contentType:
      object.httpMetadata?.contentType ??
      TYPES_BY_EXTENSION[name.split(".")[1] as string],
  };
}
