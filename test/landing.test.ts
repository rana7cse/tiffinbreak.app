import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

async function getHtml(path: string) {
  const res = await exports.default.fetch(`http://example.com${path}`);
  return { status: res.status, html: await res.text() };
}

describe("landing page", () => {
  it("returns 200 with the Bangla headline and a login link", async () => {
    const { status, html } = await getHtml("/");

    expect(status).toBe(200);
    expect(html).toContain("সেই দিনগুলো");
    expect(html).toMatch(/<a [^>]*href="\/login"[^>]*>/);
  });

  it("renders every prompt note and step", async () => {
    const { html } = await getHtml("/");

    expect(html.match(/class="tb-note /g)).toHaveLength(7);
    expect(html.match(/class="tb-step"/g)).toHaveLength(3);
  });

  it("puts the landing variant classes on the shell", async () => {
    const { html } = await getHtml("/");

    expect(html).toContain('<div class="tb-app tb-app--ruled tb-anim">');
  });

  it("leaves the shell plain on pages without a variant", async () => {
    const { html } = await getHtml("/login");

    expect(html).toContain('<div class="tb-app">');
  });

  it("has a Facebook form posting to /login/facebook", async () => {
    const { html } = await getHtml("/");

    expect(html).toMatch(/<form [^>]*action="\/login\/facebook"/);
    expect(html).toMatch(/<form [^>]*method="post"/);
    expect(html).toMatch(/<input [^>]*name="returnTo"/);
    expect(html).toContain('value="/feed"');
  });
});

describe("GET /login", () => {
  it("returns 200 with the Google sign-in form", async () => {
    const { status, html } = await getHtml("/login");

    expect(status).toBe(200);
    expect(html).toContain('action="/login/google"');
  });
});
