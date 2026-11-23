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
  /** The 84px profile-header size (`.tb-avatar--lg`). */
  large?: boolean;
};

/** The Writer's photo, or their initial on a coloured circle (`.tb-avatar`). */
export function Avatar({ name, image, large = false }: AvatarProps) {
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
      className={`tb-avatar tb-avatar--pink${large ? " tb-avatar--lg" : ""}`}
      style={
        large
          ? { fontSize: 34 }
          : { width: 44, height: 44, borderWidth: 2, fontSize: 19 }
      }
    >
      {image && !broken ? (
        <img
          ref={img}
          src={image}
          alt={name}
          referrerPolicy="no-referrer"
          width={large ? 84 : 44}
          height={large ? 84 : 44}
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initialOf(name)
      )}
    </span>
  );
}
