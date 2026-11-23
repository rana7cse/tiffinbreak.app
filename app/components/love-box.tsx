import { useCallback, useEffect, useRef, useState } from "react";
import { bn } from "~/lib/bangla-digits";
import { strings } from "~/strings";
import { HeartIcon } from "./icons";

export const MAX_LOVE = 10;
const FLUSH_DELAY_MS = 600;

/**
 * Optimistic, batched Love for one Story. Taps show immediately; they are
 * sent as one `POST /stories/:id/love` after a short pause (or when the page
 * is hidden). The server's answer replaces the local numbers; a failed batch
 * rolls its taps back.
 */
export function useLove(
  storyId: string,
  initial: { mine: number; total: number },
  disabled: boolean,
) {
  const [server, setServer] = useState(initial);
  const [pending, setPending] = useState(0);
  const pendingRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mine = Math.min(MAX_LOVE, server.mine + pending);
  const total = server.total + (mine - server.mine);

  const flush = useCallback(
    async (keepalive = false) => {
      clearTimeout(timer.current);
      const count = pendingRef.current;
      if (count === 0) return;
      pendingRef.current = 0;
      try {
        const res = await fetch(`/stories/${storyId}/love`, {
          method: "POST",
          body: new URLSearchParams({ count: String(count) }),
          keepalive,
        });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as { mine: number; total: number };
        // Taps made while this request was in flight stay on top of it.
        setServer(next);
        setPending(pendingRef.current);
      } catch {
        setPending(pendingRef.current);
      }
    },
    [storyId],
  );

  const tap = useCallback(() => {
    if (disabled) return;
    if (server.mine + pendingRef.current >= MAX_LOVE) return;
    pendingRef.current += 1;
    setPending(pendingRef.current);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), FLUSH_DELAY_MS);
  }, [disabled, server.mine, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush(true);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush(true);
    };
  }, [flush]);

  return { mine, total, tap, maxed: mine >= MAX_LOVE };
}

export type LoveState = ReturnType<typeof useLove>;

const t = strings.story;

export function LoveBox({
  love,
  disabled,
}: {
  love: LoveState;
  disabled: boolean;
}) {
  const { mine, total, tap, maxed } = love;
  return (
    <section
      className="tb-card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        padding: "22px 16px",
        background: "var(--tb-peach)",
        overflow: "visible",
      }}
    >
      <p style={{ fontSize: 17, fontWeight: 600, textAlign: "center" }}>
        {t.loveBoxTitle}
      </p>
      <div style={{ position: "relative" }}>
        <button
          type="button"
          className="tb-btn tb-love-big"
          aria-label={strings.love.give}
          disabled={disabled}
          onClick={tap}
          style={{
            width: 74,
            height: 74,
            padding: 0,
            borderRadius: "50%",
            background: mine ? "var(--tb-accent-soft)" : undefined,
          }}
        >
          <HeartIcon size={36} color="var(--tb-accent)" filled={mine > 0} />
        </button>
        <span
          hidden={!mine}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -8,
            right: -20,
            padding: "2px 8px",
            borderRadius: 999,
            border: "1.5px solid var(--tb-ink)",
            background: "var(--tb-accent)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {`+${bn(mine)}`}
        </span>
      </div>
      <p style={{ fontSize: 15, color: "var(--tb-muted)" }}>
        <span>{bn(total)}</span> {t.loveCount} ·{" "}
        <span>{maxed ? strings.love.maxReached : strings.love.hint}</span>
      </p>
    </section>
  );
}

export function LoveActionButton({
  love,
  disabled,
}: {
  love: LoveState;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      className="tb-btn tb-btn--pill"
      aria-label={strings.love.give}
      disabled={disabled}
      onClick={love.tap}
      style={{ fontSize: 16, color: "var(--tb-accent)" }}
    >
      <HeartIcon size={22} color="var(--tb-accent)" filled={love.mine > 0} />
      <span>{bn(love.total)}</span>
    </button>
  );
}
