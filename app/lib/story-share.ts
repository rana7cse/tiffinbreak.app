/**
 * Absolute URL of a Story's cover image, or null without one. The one place
 * that knows how a `cover_key` becomes a URL (the cover-photo ticket may
 * change it), so pages and share-preview tags stay in sync.
 */
export function coverUrl(
  origin: string,
  coverKey: string | null,
): string | null {
  return coverKey ? `${origin}/${coverKey}` : null;
}

export type SharePreview = {
  title: string;
  description: string;
  url: string;
  image: string | null;
};

/** Open Graph + Twitter `<meta>` descriptors for a shared Story link. */
export function sharePreviewMeta(p: SharePreview) {
  return [
    { property: "og:type", content: "article" },
    { property: "og:title", content: p.title },
    { property: "og:description", content: p.description },
    { property: "og:url", content: p.url },
    ...(p.image ? [{ property: "og:image", content: p.image }] : []),
    {
      name: "twitter:card",
      content: p.image ? "summary_large_image" : "summary",
    },
    { name: "twitter:title", content: p.title },
    { name: "twitter:description", content: p.description },
    ...(p.image ? [{ name: "twitter:image", content: p.image }] : []),
  ];
}
