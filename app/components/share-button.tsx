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
  const [shownUrl, setShownUrl] = useState<string | null>(null);

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
    } catch {
      setCopied(false);
    }
    // Always show the link, so it can be copied by hand if needed.
    setShownUrl(url);
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
      {shownUrl ? (
        <div
          className="tb-card"
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 88,
            zIndex: 20,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <input
            className="tb-input"
            readOnly
            value={shownUrl}
            aria-label={strings.story.copyLink}
            onFocus={(e) => e.currentTarget.select()}
          />
          <span role="status" aria-live="polite" style={{ fontSize: 14 }}>
            {copied ? strings.story.linkCopied : strings.story.copyLink}
          </span>
        </div>
      ) : (
        <span role="status" aria-live="polite" style={srOnly} />
      )}
    </>
  );
}
