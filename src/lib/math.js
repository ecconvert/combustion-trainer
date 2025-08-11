/**
 * Utility math helpers used throughout the simulator.
 *
 * These functions have no external dependencies and are kept in a
 * separate module so they can be reused anywhere in the app.
 */

/**
 * Clamp a numeric value between a minimum and maximum.
 * @param {number} v - Value to constrain.
 * @param {number} a - Lower bound of allowed range.
 * @param {number} b - Upper bound of allowed range.
 * @returns {number} Value `v` forced within `[a,b]`.
 */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Linearly interpolate between two numbers.
 * @param {number} a - Start value.
 * @param {number} b - End value.
 * @param {number} t - Interpolation factor where 0 gives `a` and 1 gives `b`.
 * @returns {number} Interpolated value.
 */
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Convert Fahrenheit to Celsius using the standard formula.
 * @param {number} f - Temperature in degrees Fahrenheit.
 * @returns {number} Temperature in degrees Celsius.
 */
export const f2c = (f) => (f - 32) * (5 / 9);

/**
 * Safely parse a value into a number.
 *
 * @param {number|string} x - Value to parse.
 * @param {number} [d=0] - Default to return if parsing fails.
 * @returns {number} Numeric value or the default.
 */
export const num = (x, d = 0) => {
  const v = typeof x === "number" ? x : parseFloat(x);
  return Number.isFinite(v) ? v : d;
};
