import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

async function getHtml(path: string) {
  const res = await exports.default.fetch(`http://example.com${path}`);
  return res.text();
}

describe("theme and mobile shell", () => {
  it("links the theme stylesheet, the Bangla fonts and the favicon", async () => {
    const html = await getHtml("/");

    expect(html).toMatch(/<link rel="stylesheet" href="[^"]*theme[^"]*\.css"/);
    expect(html).toContain("fonts.googleapis.com/css2?family=Anek+Bangla");
    expect(html).toContain("Baloo+Da+2");
    expect(html).toMatch(/<link rel="icon" href="\/logo-favicon\.svg"/);
    expect(html).toContain(
      '<meta name="viewport" content="width=device-width, initial-scale=1"',
    );
  });

  it("renders the page inside the tb-app mobile column", async () => {
    const html = await getHtml("/");

    expect(html).toMatch(/<div class="tb-app[ "][\s\S]*টিফিনব্রেক/);
  });

  it("renders error pages inside the tb-app mobile column too", async () => {
    const html = await getHtml("/nope");

    expect(html).toContain('<div class="tb-app">');
  });
});
