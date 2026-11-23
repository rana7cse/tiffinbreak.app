import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";

async function getHtml(path: string, cookie: string) {
  const res = await exports.default.fetch(`http://example.com${path}`, {
    headers: { cookie },
  });
  expect(res.status).toBe(200);
  return res.text();
}

function navItem(html: string, href: string) {
  const nav = html.match(/<nav class="tb-bottom-nav"[\s\S]*?<\/nav>/)?.[0];
  expect(nav).toBeTruthy();
  return nav?.match(new RegExp(`<a [^>]*href="${href}"[^>]*>`))?.[0];
}

describe("signed-in app shell", () => {
  it("renders the bottom nav on /feed with Home marked active", async () => {
    const { cookie } = await signInAs();
    const html = await getHtml("/feed", cookie);

    expect(html).toContain('aria-label="প্রধান মেনু"');
    expect(navItem(html, "/feed")).toContain('aria-current="page"');
    expect(navItem(html, "/write")).toBeDefined();
    expect(navItem(html, "/write")).not.toContain("aria-current");
    expect(navItem(html, "/profile")).toBeDefined();
    expect(html).toContain("tb-app tb-app--with-nav");
  });

  it("shows the Writer's avatar in the header, linking to the profile", async () => {
    const { cookie } = await signInAs({ name: "রাফি" });
    const html = await getHtml("/feed", cookie);

    expect(html).toMatch(
      /<header class="tb-header">[\s\S]*href="\/profile"[^>]*aria-label="আমার প্রোফাইল"[\s\S]*রা[\s\S]*<\/header>/,
    );
  });

  it("serves a profile placeholder inside the shell", async () => {
    const { cookie } = await signInAs();
    const html = await getHtml("/profile", cookie);

    expect(navItem(html, "/profile")).toContain('aria-current="page"');
  });
});
