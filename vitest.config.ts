import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vitest/config";

// Tests run inside workerd and hit the Worker's fetch handler: the single
// test seam (see spec #1). reactRouter() provides the server build that
// workers/app.ts imports.
export default defineConfig({
  plugins: [
    reactRouter(),
    cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" } }),
  ],
  resolve: { tsconfigPaths: true },
  // Process CSS like the real build so `?url` imports resolve to an href
  // (Vitest stubs CSS to "" by default).
  test: { css: true },
});
