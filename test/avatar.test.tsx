import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Avatar } from "~/components/avatar";

describe("Avatar", () => {
  it("shows the photo with alt text and no referrer", () => {
    const html = renderToStaticMarkup(
      <Avatar name="Rafi Ahmed" image="https://example.com/rafi.jpg" />,
    );

    expect(html).toMatch(/<img [^>]*src="https:\/\/example.com\/rafi.jpg"/);
    expect(html).toContain('alt="Rafi Ahmed"');
    expect(html).toContain('referrerPolicy="no-referrer"');
  });

  it("shows the first letter of the name without a photo", () => {
    const html = renderToStaticMarkup(<Avatar name="Rafi Ahmed" />);

    expect(html).not.toContain("<img");
    expect(html).toContain(">R</span>");
  });

  it("treats a null photo like no photo", () => {
    const html = renderToStaticMarkup(<Avatar name="Rafi" image={null} />);

    expect(html).not.toContain("<img");
  });

  it("takes a whole Bangla grapheme, not a lone code unit", () => {
    const html = renderToStaticMarkup(<Avatar name="স্বপ্না আক্তার" />);

    expect(html).toContain(">স্ব</span>");
  });
});
