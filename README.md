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
| `npm run deploy` | Build and deploy with Wrangler, no migrations (needs a Cloudflare login) |
| `npm run deploy:prod` | Migrate the production D1, then `wrangler deploy` (the Workers Builds deploy command; run after `npm run build`) |
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
   - `https://tiffinbreak.faridpuri.com/api/auth/callback/google`
4. Under **Authorised domains** (OAuth consent screen > Branding) add
   `faridpuri.com`.
5. Copy the client ID and secret into `.dev.vars` (local) and production
   secrets (below).

### Create the Meta app (Facebook login)

1. At [developers.facebook.com](https://developers.facebook.com/apps) create an
   app (use case: "Authenticate and request data from users with Facebook
   Login") and add the **Facebook Login** product.
2. Facebook Login > Settings > **Valid OAuth Redirect URIs**
   (`<origin>/api/auth/callback/facebook`):
   - `http://localhost:5173/api/auth/callback/facebook`
   - `https://tiffinbreak.faridpuri.com/api/auth/callback/facebook`
3. Settings > Basic: copy **App ID** and **App Secret** into
   `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET` (`.dev.vars` locally,
   production secrets below). Only `email` and `public_profile` are requested.

The app starts in **Development mode**: only people with a role on the app
(admins, developers, testers) can sign in. Public use needs the app switched to
Live, which requires:

- a privacy policy URL and a data deletion URL (or instructions) in Settings > Basic:
  - **Privacy Policy URL**: `https://tiffinbreak.faridpuri.com/privacy`
  - **Data Deletion Instructions URL**: `https://tiffinbreak.faridpuri.com/data-deletion`;
- Business Verification of the owning Meta business;
- App Review for any permission beyond the defaults (`email` and
  `public_profile` are default, so normally none).

### Production secrets

Set with `wrangler secret put`; see
[Production setup](#production-setup-one-time-by-a-human) step 4. Migrations
run on deploy via `npm run deploy:prod`.

## Production setup (one-time, by a human)

Production runs on Cloudflare Workers at `https://tiffinbreak.faridpuri.com`. The workers.dev URL
stays on but is not the production origin. The custom domain `tiffinbreak.app`
comes later (see the end of this section). Workers Builds deploys `main` to
production and gives every pull request a preview URL. Do these once, in order.

1. **Resources (already created, APAC).** The IDs are in `wrangler.jsonc`. To
   recreate them in another account, run these and paste the new IDs in:

   ```sh
   npx wrangler d1 create tiffinbreak --location apac   # database_id
   npx wrangler kv namespace create tiffinbreak-cache   # id of the CACHE binding
   ```

2. **R2 (not created yet).** Dashboard > Storage & databases > R2 object
   storage > enable R2 (needs a payment method; the free tier still applies).
   Create a bucket named `tiffinbreak-covers`. No binding yet: the cover-photo
   ticket adds `r2_buckets` to `wrangler.jsonc`.

3. **Connect the repo (Workers Builds).** Dashboard > Workers & Pages > the
   `tiffinbreak` Worker > Settings > Builds > Connect (if the Worker does not
   exist yet: Create application > Import a repository). Pick the GitHub repo
   `rana7cse/tiffinbreak.app`, then set:

   | Setting | Value |
   | --- | --- |
   | Production branch | `main` |
   | Build command | `npm run build` |
   | Deploy command | `npm run deploy:prod` |
   | Non-production branch builds | enabled |
   | Non-production deploy command | `npx wrangler versions upload` |
   | Build variable `NODE_VERSION` | `24` (only if the build picks an older Node; `.nvmrc` is also read) |

   `npm run deploy:prod` applies pending D1 migrations to production
   (`db:migrate:remote`), then runs `wrangler deploy`. `npm run build` writes a
   redirect to `build/server/wrangler.json`, which Wrangler picks up, so build
   and deploy must run in that order in the same checkout.

   Previews (`wrangler versions upload`) do **not** migrate and use the
   **production** D1 and KV, so a PR that changes the schema can break its own
   preview until it is merged. A separate preview database is out of scope.

   The build token needs D1 edit rights for the remote migration. Under
   Settings > Builds > API token, check the token Workers Builds uses. If it
   lacks D1, create one (My Profile > API Tokens > Create Token > Custom) with
   Account > Workers Scripts > Edit, Account > D1 > Edit and Account >
   Workers KV Storage > Edit, then select it under Builds > API token.

4. **Secrets.** `wrangler.jsonc` lists them as required, so deploys fail until
   all are set. Run `npx wrangler login` first, then:

   ```sh
   openssl rand -base64 32                        # value for BETTER_AUTH_SECRET
   npx wrangler secret put BETTER_AUTH_SECRET
   npx wrangler secret put BETTER_AUTH_URL        # https://tiffinbreak.faridpuri.com
   npx wrangler secret put GOOGLE_CLIENT_ID
   npx wrangler secret put GOOGLE_CLIENT_SECRET
   npx wrangler secret put FACEBOOK_CLIENT_ID
   npx wrangler secret put FACEBOOK_CLIENT_SECRET
   ```

   Where the Google and Meta values come from: see
   [Create the Google OAuth client](#create-the-google-oauth-client) and
   [Create the Meta app](#create-the-meta-app-facebook-login).

5. **Custom domain.** `tiffinbreak.faridpuri.com` is attached automatically on
   deploy by the `routes` entry in `wrangler.jsonc`, because the `faridpuri.com`
   zone is already active in this Cloudflare account. If a DNS record named
   `tiffinbreak` already exists in the faridpuri.com zone, delete it first (the
   Custom Domain creates its own record and certificate). Check it under the
   Worker > Settings > Domains & Routes.

6. **OAuth redirect URIs.** Add `https://tiffinbreak.faridpuri.com/api/auth/callback/google`
   and `.../facebook` to the Google client and the Meta app, as listed in the
   two sections linked in step 4.

7. **Deploy and verify.** Push to `main` (or retry the build under the
   Worker's Deployments > Builds), then:

   ```sh
   curl https://tiffinbreak.faridpuri.com/health   # {"status":"ok","db":"ok"}
   ```

   Open a PR to confirm it gets a preview URL (shown in the Worker's
   Deployments tab).

### Later: move to tiffinbreak.app

When `tiffinbreak.app` is ready to go live (`tiffinbreak.faridpuri.com` can stay
as an extra Custom Domain or be removed from `routes`):

1. Onboard the zone: Dashboard > Domains > Onboard a domain, then point the
   registrar's nameservers at Cloudflare.
2. Delete any old DNS records on the apex (`tiffinbreak.app`); the Custom Domain
   creates its own record and certificate.
3. Add a second route in `wrangler.jsonc` (or replace the faridpuri.com one) and deploy:

   ```jsonc
   "routes": [
     { "pattern": "tiffinbreak.faridpuri.com", "custom_domain": true },
     { "pattern": "tiffinbreak.app", "custom_domain": true }
   ],
   ```

   Check it under the Worker > Settings > Domains & Routes.
4. Update the secret: `npx wrangler secret put BETTER_AUTH_URL` with
   `https://tiffinbreak.app`.
5. Add `https://tiffinbreak.app/api/auth/callback/google` at Google and
   `https://tiffinbreak.app/api/auth/callback/facebook` at Meta.
6. At Meta (Settings > Basic) set the privacy URL to
   `https://tiffinbreak.app/privacy` and the data deletion URL to
   `https://tiffinbreak.app/data-deletion`.

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
