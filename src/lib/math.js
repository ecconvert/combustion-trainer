export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const f2c = (f) => (f - 32) * (5 / 9);
export const num = (x, d = 0) => {
  const v = typeof x === "number" ? x : parseFloat(x);
  return Number.isFinite(v) ? v : d;
};
