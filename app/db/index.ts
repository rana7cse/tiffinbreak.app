import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/** Drizzle client over a D1 binding (normally `env.DB`). */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof getDb>;
