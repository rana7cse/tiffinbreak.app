import { strings } from "~/strings";

/**
 * Absolute URL of a Story's cover image, or null without one. The one place
 * that knows how a `cover_key` becomes a URL, so pages and share-preview tags
 * stay in sync. A key is `covers/<random>.<ext>`, served by `routes/covers.ts`.
 */
export function coverUrl(
  origin: string,
  coverKey: string | null,
): string | null {
  return coverKey ? `${origin}/${coverKey}` : null;
}

export const DEFAULT_SHARE_IMAGE = {
  path: "/og-default.png",
  type: "image/png",
  width: 1200,
  height: 630,
} as const;

const EXCERPT_MAX = 155;

/** Plain-text excerpt: whitespace collapsed, cut at a word boundary. */
export function excerptOf(body: string, max = EXCERPT_MAX): string {
  const text = body.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const space = cut.lastIndexOf(" ");
  const head = (space > 0 ? cut.slice(0, space) : cut.slice(0, max)).trimEnd();
  return `${head}…`;
}

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export type SharePreview = {
  title: string;
  description: string;
  url: string;
  /** Absolute cover URL, or null for the default share image. */
  cover: string | null;
  origin: string;
  publishedAt: Date;
  author: string;
};

/** Open Graph + Twitter `<meta>` descriptors and canonical link for a Story. */
export function sharePreviewMeta(p: SharePreview) {
  const ext = p.cover?.split(".").pop()?.toLowerCase() ?? "";
  const image = p.cover ?? `${p.origin}${DEFAULT_SHARE_IMAGE.path}`;
  const imageType = p.cover ? IMAGE_TYPES[ext] : DEFAULT_SHARE_IMAGE.type;
  return [
    { name: "description", content: p.description },
    { tagName: "link", rel: "canonical", href: p.url },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: strings.brand.name },
    { property: "og:locale", content: "bn_BD" },
    { property: "og:title", content: p.title },
    { property: "og:description", content: p.description },
    { property: "og:url", content: p.url },
    {
      property: "article:published_time",
      content: p.publishedAt.toISOString(),
    },
    { property: "article:author", content: p.author },
    { property: "og:image", content: image },
    ...(imageType ? [{ property: "og:image:type", content: imageType }] : []),
    ...(p.cover
      ? []
      : [
          {
            property: "og:image:width",
            content: String(DEFAULT_SHARE_IMAGE.width),
          },
          {
            property: "og:image:height",
            content: String(DEFAULT_SHARE_IMAGE.height),
          },
        ]),
    { property: "og:image:alt", content: p.title },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: p.title },
    { name: "twitter:description", content: p.description },
    { name: "twitter:image", content: image },
  ];
}

/** Site-wide default share tags for pages without their own (e.g. home). */
export function siteShareMeta(origin: string) {
  return [
    { property: "og:site_name", content: strings.brand.name },
    { property: "og:locale", content: "bn_BD" },
    { property: "og:image", content: `${origin}${DEFAULT_SHARE_IMAGE.path}` },
    { property: "og:image:type", content: DEFAULT_SHARE_IMAGE.type },
    { property: "og:image:width", content: String(DEFAULT_SHARE_IMAGE.width) },
    {
      property: "og:image:height",
      content: String(DEFAULT_SHARE_IMAGE.height),
    },
  ];
}
