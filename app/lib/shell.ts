import { useMatches } from "react-router";

/**
 * A route opts into extra classes on the `.tb-app` shell by exporting
 * `handle`, e.g. `export const handle = { shellClass: ["tb-app--ruled"] }`
 * (use `satisfies ShellHandle`). Classes from every matched route are
 * merged, parent first.
 */
export type ShellHandle = { shellClass?: readonly string[] };

export function useShellClassName(): string {
  const matches = useMatches();
  const extra = matches.flatMap(
    (m) => (m.handle as ShellHandle | undefined)?.shellClass ?? [],
  );
  return ["tb-app", ...extra].join(" ");
}
