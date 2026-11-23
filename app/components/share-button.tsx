import { type CSSProperties, type ReactNode, useState } from "react";
import { strings } from "~/strings";

const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

/**
 * Native share sheet, falling back to copying the link. `path` is the Story's
 * path; the absolute URL is built on click, in the browser.
 */
export function ShareButton({
  path,
  title,
  className,
  style,
  label,
  children,
}: {
  path: string;
  title: string;
  className: string;
  style?: CSSProperties;
  label?: string;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // Sheet dismissed (AbortError) or share failed: nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(strings.story.copyLink, url);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        aria-label={label}
        onClick={share}
      >
        {children}
      </button>
      <span role="status" aria-live="polite" style={srOnly}>
        {copied ? strings.story.linkCopied : ""}
      </span>
    </>
  );
}
