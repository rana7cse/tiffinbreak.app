import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

async function getHtml(path: string) {
  const res = await exports.default.fetch(`http://example.com${path}`);
  return { status: res.status, html: await res.text() };
}

describe.each([
  ["/privacy", "গোপনীয়তা নীতি", "Privacy Policy"],
  ["/data-deletion", "ডেটা মুছে ফেলার নির্দেশনা", "Data deletion instructions"],
])("GET %s", (path, bnTitle, enTitle) => {
  it("is public and shows Bangla, English, the date and the contact email", async () => {
    const { status, html } = await getHtml(path);

    expect(status).toBe(200);
    expect(html).toContain(bnTitle);
    expect(html).toContain(enTitle);
    expect(html).toContain("২২ নভেম্বর ২০২৬");
    expect(html).toContain("22 November 2026");
    expect(html).toContain('href="mailto:info@xaonic.com"');
    expect(html).toContain("Powered by Xaonic LLC");
    expect(html).toContain('href="/"');
  });
});

describe("links to the legal pages", () => {
  it.each(["/", "/login"])("%s links to both pages", async (path) => {
    const { html } = await getHtml(path);

    expect(html).toMatch(/<a [^>]*href="\/privacy"/);
    expect(html).toMatch(/<a [^>]*href="\/data-deletion"/);
  });

  it("landing footer says Powered by Xaonic LLC", async () => {
    const { html } = await getHtml("/");

    expect(html).toContain("Powered by Xaonic LLC");
  });
});
