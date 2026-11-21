# Cloudflare-only stack

The app runs entirely on Cloudflare's free tier so it costs nothing to operate at small scale: one Worker serving React Router v7 (SSR) plus static assets, D1 via Drizzle for data, R2 for cover photos (resized in the browser, so no paid Images service), KV for sessions/caches, and Better Auth for Facebook + Google login. Moving off later means replacing D1 (SQLite) and R2 bindings, so treat this as a deliberate lock-in.
