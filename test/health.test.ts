import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("GET /health", () => {
  it("returns 200 with ok status and a reachable, migrated database", async () => {
    const res = await exports.default.fetch("http://example.com/health");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.json()).toEqual({ status: "ok", db: "ok" });
  });

  it("returns 503 with db error when the database query fails", async () => {
    // Storage is isolated per test, so this drop is undone afterwards.
    await env.DB.exec("DROP TABLE app_meta");

    const res = await exports.default.fetch("http://example.com/health");

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "error", db: "error" });
  });
});
