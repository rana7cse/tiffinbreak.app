import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// Runs before each test file. Migrations already applied are skipped, and
// storage is isolated per test, so every test starts from a migrated DB.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
