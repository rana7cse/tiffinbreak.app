/** Cover photos: validation, R2 storage, and the one place that builds URLs. */

export const COVER_MAX_BYTES = 3 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const TYPES_BY_EXTENSION = Object.fromEntries(
  Object.entries(EXTENSIONS).map(([type, ext]) => [ext, type]),
);

const KEY_PATTERN = /^[0-9a-f]{32}\.(jpg|png|webp)$/;

/** Public URL of a stored cover. Change the route here and nowhere else. */
export function coverUrl(key: string): string {
  return `/covers/${key}`;
}

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
  const key = `${name}.${EXTENSIONS[file.type]}`;
  await env.COVERS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });
  return key;
}

/** Reads a cover for the public route; null for a malformed or unknown key. */
export async function readCover(env: Pick<Env, "COVERS">, key: string) {
  if (!KEY_PATTERN.test(key)) return null;
  const object = await env.COVERS.get(key);
  if (!object) return null;
  return {
    body: object.body,
    contentType:
      object.httpMetadata?.contentType ??
      TYPES_BY_EXTENSION[key.split(".")[1] as string],
  };
}
