import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import themeHref from "./styles/theme.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/logo-favicon.svg", type: "image/svg+xml" },
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
  return (
    <html lang="bn">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="tb-app">{children}</div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
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
