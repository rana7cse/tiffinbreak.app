import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("routing through React Router", () => {
  it("server-renders the home page as Bangla HTML", async () => {
    const res = await exports.default.fetch("http://example.com/");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain('<html lang="bn"');
    expect(html).toContain("টিফিনব্রেক");
  });

  it("returns 404 for unknown paths", async () => {
    const res = await exports.default.fetch("http://example.com/nope");

    expect(res.status).toBe(404);
  });
});
