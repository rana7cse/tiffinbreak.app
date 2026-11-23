import { describe, expect, it } from "vitest";
import { fitWithin } from "~/lib/cover-resize";

describe("fitWithin", () => {
  it("shrinks a wide image so the long side is the max", () => {
    expect(fitWithin(3200, 1600, 1600)).toEqual({ width: 1600, height: 800 });
  });
  it("shrinks a tall image so the long side is the max", () => {
    expect(fitWithin(1000, 4000, 1600)).toEqual({ width: 400, height: 1600 });
  });
  it("never enlarges a small image", () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
  it("rounds to whole pixels", () => {
    expect(fitWithin(2001, 1000, 1600)).toEqual({ width: 1600, height: 800 });
  });
});
