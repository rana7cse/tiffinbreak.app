import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { THEME_COLOR } from "./lib/pwa";
import { useShellClassName } from "./lib/shell";
import themeHref from "./styles/theme.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/logo-favicon.svg", type: "image/svg+xml" },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&family=Baloo+Da+2:wght@500;600;700&display=swap",
  },
  { rel: "stylesheet", href: themeHref },
];

// Every page (including error pages) renders inside the .tb-app mobile
// column; theme.css caps it at --tb-max and centres it on wider screens.
export function Layout({ children }: { children: React.ReactNode }) {
  const shellClassName = useShellClassName();
  return (
    <html lang="bn">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content={THEME_COLOR} />
        <Meta />
        <Links />
      </head>
      <body>
        <div className={shellClassName}>{children}</div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  // Client only: effects never run during SSR.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "কিছু একটা ভুল হয়েছে";
  let details = "একটু পরে আবার চেষ্টা করো।";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "৪০৪" : "ভুল";
    details =
      error.status === 404
        ? "এই পাতাটা খুঁজে পাওয়া যায়নি।"
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
