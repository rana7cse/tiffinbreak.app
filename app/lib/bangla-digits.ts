const BANGLA_DIGITS = "০১২৩৪৫৬৭৮৯";

/**
 * Renders a number (or a string) with Bangla digits: `bn(24)` → "২৪".
 *
 * Behaviour (ported from `bn()` in theme/js/demo.js):
 * - Only ASCII digits 0-9 are swapped; every other character is kept as is.
 *   So the minus sign stays an ASCII "-" (`bn(-5)` → "-৫"), a decimal point
 *   stays "." (`bn(1.5)` → "১.৫"), and text passes through ("+3" → "+৩").
 * - Numbers are formatted with `String(n)`: no thousands separators, and very
 *   large or small values come out in exponent form ("১e+২১").
 * - Non-numeric strings are returned unchanged ("abc" → "abc"); digits already
 *   in Bangla are left alone.
 * - NaN and ±Infinity throw a RangeError: they are bugs in the caller, and
 *   printing "NaN" to a reader is worse than failing loudly.
 */
export function bn(value: number | string): string {
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new RangeError(`bn() needs a finite number, got ${value}`);
  }
  return String(value).replace(/[0-9]/g, (d) => BANGLA_DIGITS[Number(d)]);
}
