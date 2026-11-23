import type { CSSProperties } from "react";
import { useMatches } from "react-router";

/**
 * A route opts into extra classes on the `.tb-app` shell by exporting
 * `handle`, e.g. `export const handle = { shellClass: ["tb-app--ruled"] }`
 * (use `satisfies ShellHandle`). Classes from every matched route are
 * merged, parent first.
 */
export type ShellHandle = {
  shellClass?: readonly string[];
  /** Inline style for the shell, for pages whose theme markup sets one. */
  shellStyle?: CSSProperties;
};

export function useShell(): { className: string; style?: CSSProperties } {
  const matches = useMatches();
  const extra = matches.flatMap(
    (m) => (m.handle as ShellHandle | undefined)?.shellClass ?? [],
  );
  const styles = matches.flatMap((m) => {
    const own = (m.handle as ShellHandle | undefined)?.shellStyle;
    return own ? [own] : [];
  });
  const style = styles.length > 0 ? Object.assign({}, ...styles) : undefined;
  return { className: ["tb-app", ...extra].join(" "), style };
}
