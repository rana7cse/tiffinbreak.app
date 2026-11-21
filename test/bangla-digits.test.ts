import { describe, expect, it } from "vitest";
import { bn } from "~/lib/bangla-digits";

describe("bn (Bangla digits)", () => {
  it("maps each digit 0-9", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(bn)).toEqual([
      "০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯",
    ]);
  });

  it("renders multi-digit numbers", () => {
    expect(bn(24)).toBe("২৪");
    expect(bn(1071)).toBe("১০৭১");
    expect(bn(1234567890)).toBe("১২৩৪৫৬৭৮৯০");
  });

  it("keeps the ASCII minus sign for negative numbers", () => {
    expect(bn(-5)).toBe("-৫");
    expect(bn(-0)).toBe("০");
  });

  it("keeps the decimal point", () => {
    expect(bn(1.5)).toBe("১.৫");
  });

  it("swaps digits inside strings and keeps other characters", () => {
    expect(bn("+3")).toBe("+৩");
    expect(bn("12 জন")).toBe("১২ জন");
    expect(bn("৪০৪")).toBe("৪০৪");
  });

  it("returns non-numeric strings unchanged", () => {
    expect(bn("abc")).toBe("abc");
    expect(bn("")).toBe("");
  });

  it("throws on NaN and Infinity", () => {
    expect(() => bn(Number.NaN)).toThrow(RangeError);
    expect(() => bn(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => bn(Number.NEGATIVE_INFINITY)).toThrow(RangeError);
  });
});
