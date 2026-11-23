/**
 * Drizzle schema: the single source of truth for D1 tables. After changing
 * it, run `npm run db:generate` to write a SQL migration into `migrations/`.
 */
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Internal key/value table, not part of the domain. It gives the migration
 * pipeline something to apply before the first domain tables land, and
 * `/health` reads it to prove migrations have run.
 */
export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/*
 * Better Auth tables (column shapes follow its documented core schema).
 *
 * A Writer (see GLOSSARY.md) is a row in `user`: Better Auth requires that
 * table name, and "user" stays out of UI copy. Name and avatar (`image`) are
 * copied from the provider on first sign-in. `handle` is the unique public
 * @handle (generated on first sign-in, see app/lib/handle.ts); `role` is
 * `writer` or `admin`. Timestamps are stored as integer milliseconds.
 */
const nowMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  // Nullable only because SQLite cannot add a NOT NULL column without a
  // default; the sign-in hook and the 0002 backfill leave no Writer without one.
  handle: text("handle").unique(),
  role: text("role", { enum: ["writer", "admin"] })
    .default("writer")
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(nowMs)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/**
 * A School (see GLOSSARY.md): a school or college Stories are about.
 * `normalizedName` is the NFC/trimmed/whitespace-collapsed name (see
 * `normalizeSchoolName`); it is unique among Schools that have not been
 * merged away. `mergedIntoId` is set when an Admin folds a duplicate in.
 */
export const school = sqliteTable(
  "school",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    mergedIntoId: text("merged_into_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(nowMs)
      .notNull(),
  },
  (t) => [
    uniqueIndex("school_normalized_name_unique")
      .on(t.normalizedName)
      .where(sql`${t.mergedIntoId} is null`),
  ],
);
