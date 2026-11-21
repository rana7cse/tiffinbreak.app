# TiffinBreak

A mobile-first Bangla web app for sharing school and college memories. Runs on
Cloudflare Workers (React Router v7+ with server rendering).

- Product spec: GitHub issue #1
- Vocabulary: [`GLOSSARY.md`](GLOSSARY.md) · Decisions: [`docs/adr/`](docs/adr)
- Design reference (static HTML): [`theme/`](theme)

## Requirements

- Node.js 22 or newer (`.nvmrc` pins 24, so run `nvm use`)
- npm 11+

## Getting started

```sh
nvm use
npm install
npm run dev        # http://localhost:5173
```

`npm install` also runs `wrangler types`, which generates
`worker-configuration.d.ts` (git-ignored) from `wrangler.jsonc`. Re-run
`npm run cf-typegen` after changing bindings.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with the Worker running in workerd |
| `npm test` | Run the test suite once (`npm run test:watch` to watch) |
| `npm run typecheck` | Generate Worker + route types, then `tsc` |
| `npm run build` | Production build into `build/` |
| `npm run preview` | Build, then serve the production build locally |
| `npm run deploy` | Build and deploy with Wrangler (needs a Cloudflare login) |

## Tests

Tests run inside the real Workers runtime using
[`@cloudflare/vitest-plugin`](https://developers.cloudflare.com/workers/testing/vitest-integration/).
Every test goes through **one seam**: it sends an HTTP request to the Worker's
fetch handler and checks the response. Tests don't import route modules or
internals directly.

```ts
import { exports } from "cloudflare:workers";

const res = await exports.default.fetch("http://example.com/health");
```

Tests live in `test/`. CI (`.github/workflows/ci.yml`) runs lint, typecheck and tests on every pull request and push to `main`.

## Project layout

```
app/            React Router app (root layout, routes)
workers/app.ts  Worker entry: hands every request to React Router
test/           Request-level tests
theme/          Static HTML design reference (not shipped)
wrangler.jsonc  Worker config; bindings are added here
```
