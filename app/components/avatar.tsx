import { useEffect, useRef, useState } from "react";

/** First user-perceived character, so Bangla conjuncts like "স্ব" stay whole. */
function initialOf(name: string) {
  const [first] = new Intl.Segmenter().segment(name.trim());
  return first?.segment ?? "";
}

/** Pixel sizes of the theme's avatar classes: `.tb-avatar` and its modifiers. */
const SIZES = { sm: 38, md: 46, lg: 84, header: 44 } as const;

type AvatarProps = {
  name: string;
  /** Profile photo URL (Google or Facebook); the initial is shown without it. */
  image?: string | null;
  /**
   * `.tb-avatar` (38px, default), `--md` (46px) or `--lg` (84px); `header`
   * is the 44px size the theme sets inline on the app header.
   */
  size?: keyof typeof SIZES;
  /** A background colour modifier; the theme's default (mint) without one. */
  variant?: "yellow" | "sky" | "pink";
  /** Renders a link to the Writer's profile instead of a plain circle. */
  href?: string;
  /** Accessible name for the link. */
  label?: string;
};

/** The Writer's photo, or their initial on a coloured circle (`.tb-avatar`). */
export function Avatar({
  name,
  image,
  size = "sm",
  variant,
  href,
  label,
}: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // The photo may fail before hydration, when onError can't fire yet.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth === 0) {
      setBroken(true);
    }
  }, []);

  const className = [
    "tb-avatar",
    size === "sm" || size === "header" ? "" : `tb-avatar--${size}`,
    variant ? `tb-avatar--${variant}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const headerStyle =
    size === "header"
      ? { width: 44, height: 44, borderWidth: 2, fontSize: 19 }
      : undefined;

  const content =
    image && !broken ? (
      <img
        ref={img}
        src={image}
        alt={name}
        referrerPolicy="no-referrer"
        width={SIZES[size]}
        height={SIZES[size]}
        onError={() => setBroken(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      initialOf(name)
    );

  return href ? (
    <a className={className} href={href} aria-label={label} style={headerStyle}>
      {content}
    </a>
  ) : (
    <span className={className} style={headerStyle}>
      {content}
    </span>
  );
}
