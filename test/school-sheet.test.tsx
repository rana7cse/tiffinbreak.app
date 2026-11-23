import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SchoolSheet } from "~/components/school-sheet";
import { strings } from "~/strings";

const noop = () => {};

describe("SchoolSheet", () => {
  it("renders nothing when closed", () => {
    expect(
      renderToStaticMarkup(
        <SchoolSheet open={false} onSave={noop} onSkip={noop} />,
      ),
    ).toBe("");
  });

  it("renders the theme's dialog with title, input, hint and actions", () => {
    const html = renderToStaticMarkup(
      <SchoolSheet open onSave={noop} onSkip={noop} />,
    );
    expect(html).toContain('class="tb-scrim"');
    expect(html).toMatch(
      /<section class="tb-sheet" role="dialog" aria-modal="true" aria-labelledby="tb-school-title"/,
    );
    expect(html).toContain('class="tb-sheet__grip"');
    expect(html).toContain(strings.school.question);
    expect(html).toContain(`placeholder="${strings.school.placeholder}"`);
    expect(html).toContain('id="tb-school-list"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain(strings.school.suggestionsHint);
    expect(html).toContain(strings.school.save);
    expect(html).toContain(strings.school.skip);
  });

  it("lists initial suggestions as options", () => {
    const html = renderToStaticMarkup(
      <SchoolSheet
        open
        onSave={noop}
        onSkip={noop}
        initialSuggestions={[{ id: "1", name: "রূপনগর হাই স্কুল" }]}
      />,
    );
    expect(html).toMatch(/class="tb-suggest" role="option"[^>]*>/);
    expect(html).toContain("রূপনগর হাই স্কুল");
  });
});
