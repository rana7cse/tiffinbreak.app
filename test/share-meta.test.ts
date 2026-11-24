import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { signInAs } from "./helpers/session";
import { createStory } from "./helpers/story";

const ORIGIN = "http://example.com";

async function getHtml(path: string, cookie?: string) {
  const res = await exports.default.fetch(`${ORIGIN}${path}`, {
    headers: cookie ? { cookie } : {},
  });
  expect(res.status).toBe(200);
  return res.text();
}

function tag(html: string, key: string) {
  const re = new RegExp(
    `<meta[^>]*(?:property|name)="${key}"[^>]*content="([^"]*)"`,
  );
  return re.exec(html)?.[1];
}

function expectFullShareTags(html: string, url: string) {
  expect(tag(html, "og:type")).toBe("website");
  expect(tag(html, "og:title")).toBeTruthy();
  expect(tag(html, "og:description")).toBeTruthy();
  expect(tag(html, "description")).toBeTruthy();
  expect(tag(html, "og:url")).toBe(url);
  expect(html).toContain(`rel="canonical" href="${url}"`);
  expect(tag(html, "og:image")).toBe(`${ORIGIN}/og-v2.png`);
  expect(tag(html, "og:image:type")).toBe("image/png");
  expect(tag(html, "og:image:width")).toBe("1200");
  expect(tag(html, "og:image:height")).toBe("630");
  expect(tag(html, "og:image:alt")).toBeTruthy();
  expect(tag(html, "twitter:card")).toBe("summary_large_image");
  expect(tag(html, "twitter:title")).toBeTruthy();
  expect(tag(html, "twitter:image")).toBe(`${ORIGIN}/og-v2.png`);
}

describe("share tags on every page", () => {
  it("home has the inviting og:title", async () => {
    const html = await getHtml("/?utm=x");
    expectFullShareTags(html, `${ORIGIN}/`);
    expect(tag(html, "og:title")).toBe("টিফিনব্রেক — স্কুলের সেই দিনগুলো মনে পড়ে?");
  });

  it("login", async () => {
    expectFullShareTags(await getHtml("/login"), `${ORIGIN}/login`);
  });

  it("privacy", async () => {
    expectFullShareTags(await getHtml("/privacy"), `${ORIGIN}/privacy`);
  });

  it("feed", async () => {
    const { cookie } = await signInAs();
    expectFullShareTags(await getHtml("/feed", cookie), `${ORIGIN}/feed`);
  });

  it("school page names the School", async () => {
    const { school, cookie } = await createStory();
    const html = await getHtml(`/schools/${school.id}`, cookie);
    expectFullShareTags(html, `${ORIGIN}/schools/${school.id}`);
    expect(tag(html, "og:description")).toContain(school.name);
  });
});
