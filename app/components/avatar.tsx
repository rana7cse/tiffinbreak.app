import { useEffect, useRef, useState } from "react";

/** First user-perceived character, so Bangla conjuncts like "স্ব" stay whole. */
function initialOf(name: string) {
  const [first] = new Intl.Segmenter().segment(name.trim());
  return first?.segment ?? "";
}

type AvatarProps = {
  name: string;
  /** Profile photo URL (Google or Facebook); the initial is shown without it. */
  image?: string | null;
};

/** The Writer's photo, or their initial on a coloured circle (`.tb-avatar`). */
export function Avatar({ name, image }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const img = useRef<HTMLImageElement>(null);

  // The photo may fail before hydration, when onError can't fire yet.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth === 0) {
      setBroken(true);
    }
  }, []);

  return (
    <span
      className="tb-avatar tb-avatar--pink"
      style={{ width: 44, height: 44, borderWidth: 2, fontSize: 19 }}
    >
      {image && !broken ? (
        <img
          ref={img}
          src={image}
          alt={name}
          referrerPolicy="no-referrer"
          width={44}
          height={44}
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initialOf(name)
      )}
    </span>
  );
}
