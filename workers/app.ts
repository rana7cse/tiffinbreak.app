import { createRequestHandler, RouterContextProvider } from "react-router";
import { getAuth } from "~/auth";
import { cloudflareContext } from "~/context";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    // Better Auth owns /api/auth/*; answer before React Router sees it.
    if (new URL(request.url).pathname.startsWith("/api/auth/")) {
      return getAuth(env).handler(request);
    }
    const context = new RouterContextProvider();
    context.set(cloudflareContext, { env, ctx });
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
