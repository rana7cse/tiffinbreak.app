import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vitest/config";

// Tests run inside workerd and hit the Worker's fetch handler: the single
// test seam (see spec #1). reactRouter() provides the server build that
// workers/app.ts imports.
export default defineConfig(async () => {
  // Read in Node, applied inside workerd by test/apply-migrations.ts.
  const migrations = await readD1Migrations("./migrations");

  return {
    plugins: [
      reactRouter(),
      cloudflareTest({
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: {
          bindings: {
            TEST_MIGRATIONS: migrations,
            // Fake auth config for tests; never real credentials.
            BETTER_AUTH_SECRET: "test-secret-at-least-32-characters-long",
            BETTER_AUTH_URL: "http://example.com",
            GOOGLE_CLIENT_ID: "test-google-client-id",
            GOOGLE_CLIENT_SECRET: "test-google-client-secret",
          },
        },
      }),
    ],
    resolve: { tsconfigPaths: true },
    // Process CSS like the real build so `?url` imports resolve to an href
    // (Vitest stubs CSS to "" by default).
    test: { css: true, setupFiles: ["./test/apply-migrations.ts"] },
  };
});
