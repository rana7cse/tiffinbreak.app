/**
 * Liveness check. Resource route (no UI): returns JSON only.
 * Later tickets add dependency checks (e.g. D1) to this payload.
 */
export function loader() {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
