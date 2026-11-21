/**
 * Drizzle schema: the single source of truth for D1 tables. After changing
 * it, run `npm run db:generate` to write a SQL migration into `migrations/`.
 */
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Internal key/value table, not part of the domain. It gives the migration
 * pipeline something to apply before the first domain tables land, and
 * `/health` reads it to prove migrations have run.
 */
export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
