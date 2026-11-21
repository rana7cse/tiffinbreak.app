import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  BackIcon,
  CloseIcon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  PenIcon,
  SchoolIcon,
  ShareIcon,
  UserIcon,
} from "~/components/icons";

const all = {
  BackIcon,
  CloseIcon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  PenIcon,
  SchoolIcon,
  ShareIcon,
  UserIcon,
};

describe("icons", () => {
  it.each(Object.entries(all))("%s is aria-hidden by default", (_, Icon) => {
    const html = renderToStaticMarkup(<Icon />);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="24"');
    expect(html).toContain('stroke="currentColor"');
  });

  it("applies size and colour", () => {
    const html = renderToStaticMarkup(<ShareIcon size={20} color="#FFFFFF" />);
    expect(html).toContain('width="20"');
    expect(html).toContain('height="20"');
    expect(html).toContain('stroke="#FFFFFF"');
  });

  it("can be exposed to assistive tech", () => {
    const html = renderToStaticMarkup(
      <CloseIcon aria-hidden={false} aria-label="বন্ধ করো" />,
    );
    expect(html).toContain('aria-hidden="false"');
    expect(html).toContain('aria-label="বন্ধ করো"');
  });

  it("fills the heart with its colour only when filled", () => {
    expect(renderToStaticMarkup(<HeartIcon color="#C0501D" />)).toContain(
      'fill="none"',
    );
    expect(
      renderToStaticMarkup(<HeartIcon color="#C0501D" filled />),
    ).toContain('fill="#C0501D"');
  });
});
