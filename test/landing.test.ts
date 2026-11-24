import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";

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
    const { html } = await getHtml("/privacy");

    expect(html).toContain('<div class="tb-app">');
  });

  it("has a Facebook form posting to /login/facebook", async () => {
    const { html } = await getHtml("/");

    expect(html).toMatch(/<form [^>]*action="\/login\/facebook"/);
    expect(html).toMatch(/<form [^>]*method="post"/);
    expect(html).toMatch(/<input [^>]*name="returnTo"/);
    expect(html).toContain('value="/feed"');
  });

  it("has a Google form with returnTo=/feed in the top section", async () => {
    const { html } = await getHtml("/");
    const top = html.slice(0, html.indexOf('id="how"'));

    expect(top).toMatch(
      /<form [^>]*action="\/login\/google"[^>]*>(?:(?!<\/form>).)*name="returnTo"[^>]*value="\/feed"/s,
    );
    expect(top).toMatch(
      /<form [^>]*action="\/login\/facebook"[^>]*>(?:(?!<\/form>).)*name="returnTo"[^>]*value="\/feed"/s,
    );
  });

  it("has no look-around link and Facebook comes before Google", async () => {
    const { html } = await getHtml("/");

    expect(html).not.toContain('href="#how"');
    expect(html.indexOf('action="/login/facebook"')).toBeLessThan(
      html.indexOf('action="/login/google"'),
    );
  });

  it("bottom call-to-action links to /login and posts to no provider", async () => {
    const { html } = await getHtml("/");
    const bottom = html.slice(html.indexOf('id="how"'));

    expect(bottom).toMatch(/<a [^>]*tb-btn[^>]*href="\/login\?intent=write"/);
    expect(bottom).not.toContain('action="/login/google"');
    expect(bottom).not.toContain('action="/login/facebook"');
  });
});

describe("landing page when signed in", () => {
  const cta = "গল্প লেখা শুরু করো";
  const getAs = async (opts: { name: string; image?: string }) => {
    const { cookie } = await signInAs(opts);
    const res = await exports.default.fetch("http://example.com/", {
      headers: { cookie },
    });
    return res.text();
  };

  it("shows the photo in the header avatar", async () => {
    const html = await getAs({
      name: "Rafi Ahmed",
      image: "https://example.com/rafi.jpg",
    });

    expect(html).toMatch(/<img [^>]*src="https:\/\/example.com\/rafi.jpg"/);
  });

  it("shows the first letter of the name without a photo", async () => {
    const html = await getAs({ name: "Rafi Ahmed" });

    expect(html).toMatch(/tb-avatar[^>]*>R<\/span>/);
  });

  it("links the header to the Feed and the avatar to the profile", async () => {
    const html = await getAs({ name: "Rafi Ahmed" });
    const header = html.match(
      /<header class="tb-header">[\s\S]*?<\/header>/,
    )?.[0];

    expect(header).toMatch(/<a class="tb-brand" href="\/feed"/);
    expect(header).toMatch(/<a [^>]*href="\/feed"[^>]*>ফিড<\/a>/);
    expect(header).toMatch(
      /<a [^>]*href="\/profile"[^>]*aria-label="আমার প্রোফাইল"/,
    );
    expect(html).not.toMatch(/<a [^>]*href="\/login"/);
  });

  it("links to the Writer's Feed and own stories under the write CTA", async () => {
    const html = await getAs({ name: "Rafi Ahmed" });
    const links = html.match(
      /<nav class="tb-board__links"[\s\S]*?<\/nav>/,
    )?.[0];

    expect(links).toMatch(/<a href="\/feed">আমার ফিড<\/a>/);
    expect(links).toMatch(/<a href="\/profile">আমার গল্পগুলো<\/a>/);
  });

  it("replaces the login buttons with a write CTA to /write", async () => {
    const html = await getAs({ name: "Rafi Ahmed" });
    const top = html.slice(0, html.indexOf('id="how"'));

    expect(top).toMatch(
      new RegExp(`<a [^>]*href="/write"[^>]*>.*?${cta}`, "s"),
    );
    expect(html).not.toContain('action="/login/google"');
    expect(html).not.toContain('action="/login/facebook"');
  });

  it("points the bottom CTA at /write too", async () => {
    const html = await getAs({ name: "Rafi Ahmed" });
    const bottom = html.slice(html.indexOf('id="how"'));

    expect(bottom).toMatch(/<a [^>]*tb-btn[^>]*href="\/write"/);
    expect(bottom).not.toContain("/login?intent=write");
  });
});

describe("landing page when signed out", () => {
  it("has no avatar and no write CTA", async () => {
    const { html } = await getHtml("/");

    expect(html).not.toContain("tb-avatar");
    expect(html).not.toContain('href="/write"');
  });
});

describe("GET /login?intent=write", () => {
  const writeTitle = "তোমার গল্প লিখতে লগইন করো";

  it("shows the write heading and line with both providers", async () => {
    const { html } = await getHtml("/login?intent=write");

    expect(html).toContain(writeTitle);
    expect(html).toContain("গুগল বা ফেসবুক দিয়ে এক ট্যাপে লগইন করো");
    expect(html).toContain('action="/login/google"');
    expect(html).toContain('action="/login/facebook"');
    expect(html).toContain('value="/feed"');
  });

  it("stays the plain login page without intent", async () => {
    const { html } = await getHtml("/login");

    expect(html).not.toContain(writeTitle);
  });

  it("stays the plain login page for an unknown intent", async () => {
    const { html } = await getHtml("/login?intent=bogus");

    expect(html).not.toContain(writeTitle);
  });
});

describe("GET /login", () => {
  it("returns 200 with the Google sign-in form", async () => {
    const { status, html } = await getHtml("/login");

    expect(status).toBe(200);
    expect(html).toContain('action="/login/google"');
  });
});
