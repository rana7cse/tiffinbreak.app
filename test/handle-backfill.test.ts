import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import migration from "../migrations/0002_writer_handles.sql?raw";

/** The backfill statement from the migration (its only UPDATE). */
const backfill = migration
  .split("--> statement-breakpoint")
  .map((s) => s.replace(/^--.*$/gm, "").trim())
  .find((s) => s.toUpperCase().startsWith("UPDATE"));

async function insertLegacyWriter(id: string) {
  await env.DB.prepare(
    "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, 'Old Writer', ?, 1, 1, 1)",
  )
    .bind(id, `${id}@example.com`)
    .run();
}

describe("handle backfill migration", () => {
  it("gives every Writer without a handle a unique one and keeps existing handles", async () => {
    expect(backfill).toBeDefined();
    await insertLegacyWriter("a");
    await insertLegacyWriter("b");
    await insertLegacyWriter("c");
    await env.DB.prepare(
      "UPDATE user SET handle = 'keepme' WHERE id = 'c'",
    ).run();

    await env.DB.prepare(backfill as string).run();

    const { results } = await env.DB.prepare(
      "SELECT id, handle FROM user ORDER BY id",
    ).all<{ id: string; handle: string }>();
    expect(new Set(results.map((r) => r.handle)).size).toBe(3);
    for (const r of results.filter((r) => r.id !== "c")) {
      expect(r.handle).toMatch(/^writer[0-9]+$/);
    }
    expect(results.find((r) => r.id === "c")?.handle).toBe("keepme");
  });
});
