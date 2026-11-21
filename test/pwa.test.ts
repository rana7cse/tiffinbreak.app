import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { strings } from "~/strings";

const get = (path: string) =>
  exports.default.fetch(`http://example.com${path}`);

describe("web app manifest", () => {
  it("is served with the manifest content type and install fields", async () => {
    const res = await get("/manifest.webmanifest");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain(
      "application/manifest+json",
    );
    const m = (await res.json()) as Record<string, unknown>;
    expect(m.name).toBe(strings.brand.name);
    expect(m.short_name).toBe(strings.brand.name);
    expect(m.lang).toBe("bn");
    expect(m.start_url).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toBe("#23392E");
    expect(m.background_color).toBe("#FBF7EE");
    expect(m.icons).toContainEqual(
      expect.objectContaining({ sizes: "192x192" }),
    );
    expect(m.icons).toContainEqual(
      expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
    );
  });
});

describe("every page links the PWA metadata", () => {
  for (const path of ["/", "/nope"]) {
    it(`${path} has manifest, apple-touch-icon and theme-color`, async () => {
      const html = await (await get(path)).text();
      expect(html).toContain(
        '<link rel="manifest" href="/manifest.webmanifest"',
      );
      expect(html).toContain('rel="apple-touch-icon"');
      expect(html).toContain('<meta name="theme-color" content="#23392E"');
    });
  }
});
