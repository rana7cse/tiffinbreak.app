/**
 * Builds a 302 to `location`, forwarding every Set-Cookie from a Better Auth
 * response (OAuth state cookie on sign-in, cleared session on sign-out).
 */
export function redirectWithCookies(location: string, from: Response) {
  const headers = new Headers({ location });
  for (const cookie of from.headers.getSetCookie()) {
    headers.append("set-cookie", cookie);
  }
  return new Response(null, { status: 302, headers });
}
