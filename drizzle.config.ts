import { defineConfig } from "drizzle-kit";

// drizzle-kit only generates SQL here; wrangler applies it
// (`npm run db:migrate:local` / `npm run db:migrate:remote`).
export default defineConfig({
  dialect: "sqlite",
  schema: "./app/db/schema.ts",
  out: "./migrations",
});
