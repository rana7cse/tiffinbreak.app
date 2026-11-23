export const COVER_MAX_SIDE = 1600;

/** Scales (width, height) down so the long side is at most `max`; never up. */
export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Browser only: shrinks a picked photo to at most COVER_MAX_SIDE and encodes
 * it as WebP. Falls back to the original file if the browser cannot decode it.
 */
export async function resizeCover(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(
      bitmap.width,
      bitmap.height,
      COVER_MAX_SIDE,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (blob?.type !== "image/webp") return file;
    return new File([blob], "cover.webp", { type: "image/webp" });
  } catch {
    return file;
  }
}
