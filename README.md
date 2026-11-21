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
| `npm run lint` | Lint and format check with Biome (`npm run format` to fix) |
| `npm run build` | Production build into `build/` |
| `npm run preview` | Build, then serve the production build locally |
| `npm run deploy` | Build and deploy with Wrangler (needs a Cloudflare login) |
| `npm run db:generate` | Generate a SQL migration from the Drizzle schema |
| `npm run db:migrate:local` | Apply pending migrations to the local D1 database |
| `npm run db:migrate:remote` | Apply pending migrations to the production D1 database |

## Database (D1 + Drizzle)

The Worker's D1 binding is `DB` (see `wrangler.jsonc`). The schema lives in
[`app/db/schema.ts`](app/db/schema.ts). drizzle-kit turns schema changes into
SQL files in `migrations/`, and Wrangler applies them (it records what has run
in a `d1_migrations` table).

To change the schema:

1. Edit `app/db/schema.ts`.
2. `npm run db:generate -- --name short_description` writes
   `migrations/NNNN_short_description.sql` (plus drizzle-kit's `meta/`
   snapshot). Review the SQL and commit both.
3. `npm run db:migrate:local` applies it to the local database used by
   `npm run dev` (stored under `.wrangler/`).
4. `npm run db:migrate:remote` applies it to production (needs a Cloudflare
   login). Run it before deploying code that depends on the change.

Don't edit a migration once it has been applied anywhere; add a new one. Tests
don't need step 3: they apply every migration to a fresh, isolated database
(`test/apply-migrations.ts`).

In loaders and actions, get the binding from the router context:

```ts
import { cloudflareContext } from "~/context";
import { getDb } from "~/db";

export async function loader({ context }: Route.LoaderArgs) {
  const db = getDb(context.get(cloudflareContext).env.DB);
  // ...
}
```

`/health` reports `{"status":"ok","db":"ok"}`, or `503` with `"db":"error"`
when the database query fails (for example, migrations not applied).

## Auth (Better Auth + Google)

Login is [Better Auth](https://better-auth.com) with the Drizzle adapter on D1
and cookie sessions. Google and Facebook are the providers.
The Worker serves its endpoints under `/api/auth/*` (handled in
`workers/app.ts`, before React Router). The auth instance is built per request
by `getAuth(env)` in [`app/auth.ts`](app/auth.ts). A Writer is a row in the
`user` table, which Better Auth requires to be named that.

### Environment variables

| Variable | Meaning |
| --- | --- |
| `BETTER_AUTH_SECRET` | Random string, 32+ chars (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Origin the app is served from, no trailing slash |
| `GOOGLE_CLIENT_ID` | From the Google OAuth client |
| `GOOGLE_CLIENT_SECRET` | From the Google OAuth client |
| `FACEBOOK_CLIENT_ID` | Meta app ID |
| `FACEBOOK_CLIENT_SECRET` | Meta app secret |

They are declared under `secrets` in `wrangler.jsonc`, so `wrangler types`
types them on `Env`. Never commit real values.

### Local setup

1. Create the Google OAuth client (below).
2. `cp .dev.vars.example .dev.vars` and fill it in (`.dev.vars` is git-ignored).
3. `npm run db:migrate:local`, then `npm run dev` and open
   `http://localhost:5173/api/auth/ok` (should return `{"ok":true}`).

### Create the Google OAuth client

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   pick or create a project and configure the OAuth consent screen.
2. Credentials > Create credentials > OAuth client ID > Web application.
3. Add these **Authorised redirect URIs** (`<origin>/api/auth/callback/google`):
   - `http://localhost:5173/api/auth/callback/google`
   - `https://tiffinbreak.app/api/auth/callback/google`
4. Copy the client ID and secret into `.dev.vars` (local) and production
   secrets (below).

### Create the Meta app (Facebook login)

1. At [developers.facebook.com](https://developers.facebook.com/apps) create an
   app (use case: "Authenticate and request data from users with Facebook
   Login") and add the **Facebook Login** product.
2. Facebook Login > Settings > **Valid OAuth Redirect URIs**
   (`<origin>/api/auth/callback/facebook`):
   - `http://localhost:5173/api/auth/callback/facebook`
   - `https://tiffinbreak.app/api/auth/callback/facebook`
3. Settings > Basic: copy **App ID** and **App Secret** into
   `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` (`.dev.vars` locally,
   production secrets below). Only `email` and `public_profile` are requested.

The app starts in **Development mode**: only people with a role on the app
(admins, developers, testers) can sign in. Public use needs the app switched to
Live, which requires:

- a privacy policy URL and a data deletion URL (or instructions) in Settings > Basic;
- Business Verification of the owning Meta business;
- App Review for any permission beyond the defaults (`email` and
  `public_profile` are default, so normally none).

### Production secrets

```sh
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL        # https://tiffinbreak.app
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put FACEBOOK_CLIENT_ID
npx wrangler secret put FACEBOOK_CLIENT_SECRET
```

Run `npm run db:migrate:remote` before deploying so the auth tables exist.

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
app/db/         Drizzle schema and client
migrations/     SQL migrations (generated by drizzle-kit, applied by Wrangler)
workers/app.ts  Worker entry: hands every request to React Router
test/           Request-level tests
theme/          Static HTML design reference (not shipped)
wrangler.jsonc  Worker config; bindings are added here
```
