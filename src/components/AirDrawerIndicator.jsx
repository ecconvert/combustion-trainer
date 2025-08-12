import React from "react";

// Off-center Cleaver-Brooks style air drawer indicator.
// Auto-sizes from the flame bounds if available, otherwise falls back to the chamber box.
// Place it absolutely inside the chamber container.
function AirDrawerIndicator({
  value,                 // 0..100 fire rate
  chamberRef,            // ref to the chamber container (position: relative)
  flameSelector = "[data-flame-root]", // optional CSS selector for the flame node
  speed = 1,             // 0.5, 1, 2 animation speed
  scale = 1.18,          // size relative to measured flame
  offsetRatio = { x: 0.22, y: -0.06 }, // offset from flame center, fraction of width and height
  angleLow = -140,       // low-fire angle
  angleHigh = 40         // high-fire angle
}) {
  const [box, setBox] = React.useState({ left: 0, top: 0, width: 0, height: 0 });
  const [ring, setRing] = React.useState({ cx: 0, cy: 0, r: 60 });
  const [angle, setAngle] = React.useState(angleLow + (angleHigh - angleLow) * (value / 100));

  // Measure chamber and flame size
  React.useEffect(() => {
    if (!chamberRef?.current) return;
    const chamberEl = chamberRef.current;

    const measure = () => {
      const cRect = chamberEl.getBoundingClientRect();
      let fRect = null;
      if (flameSelector) {
        const flameEl = chamberEl.querySelector(flameSelector);
        if (flameEl) fRect = flameEl.getBoundingClientRect();
      }
      const basis = fRect || cRect;

      const cx = basis.left + basis.width / 2 + basis.width * offsetRatio.x;
      const cy = basis.top + basis.height / 2 + basis.height * offsetRatio.y;

      const rBase = (Math.min(basis.width, basis.height) * 0.5) / 2; // rough flame radius
      const r = rBase * scale;

      setBox(cRect);
      setRing({ cx, cy, r });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(chamberEl);
    if (flameSelector) {
      const flameEl = chamberEl.querySelector(flameSelector);
      if (flameEl) ro.observe(flameEl);
    }
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [chamberRef, flameSelector, offsetRatio.x, offsetRatio.y, scale]);

  // Ease the needle to the new angle on value change
  React.useEffect(() => {
    let raf;
    const start = performance.now();
    const a0 = angle;
    const a1 = angleLow + (angleHigh - angleLow) * (value / 100);
    const dur = 650 / Math.max(0.25, speed);
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setAngle(a0 + (a1 - a0) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, speed, angleLow, angleHigh]); // eslint-disable-line

  if (!ring.r || !box.width) return null;

  // Place the SVG so its 0,0 aligns with the chamber box
  const left = ring.cx - ring.r - box.left;
  const top = ring.cy - ring.r - box.top;
  const size = ring.r * 2;

  // Build a sector path for the rotating shutter
  const sectorPath = (cx, cy, rInner, rOuter) => {
    const start = -70, end = 70; // visible opening span
    const toXY = (rr, a) => {
      const rad = (Math.PI / 180) * a;
      return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
    };
    const [x1, y1] = toXY(rInner, start);
    const [x2, y2] = toXY(rOuter, start);
    const [x3, y3] = toXY(rOuter, end);
    const [x4, y4] = toXY(rInner, end);
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 ${large} 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 ${large} 0 ${x1} ${y1} Z`;
  };

  const inner = ring.r * 0.62;    // inner radius like CB hub
  const outer = ring.r * 0.98;    // outer ring

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", left, top, pointerEvents: "none", zIndex: 2 }}
    >
      {/* ring */}
      <circle cx={ring.r} cy={ring.r} r={outer} fill="rgba(255,255,255,0.35)" stroke="#cbd5e1" strokeWidth={Math.max(1, ring.r * 0.02)} />
      <circle cx={ring.r} cy={ring.r} r={inner} fill="rgba(255,255,255,0.75)" stroke="#cbd5e1" strokeWidth={Math.max(1, ring.r * 0.02)} />
      {/* rotating shutter vane like an air drawer */}
      <g transform={`rotate(${angle} ${ring.r} ${ring.r})`}>
        <path d={sectorPath(ring.r, ring.r, inner, outer)} fill="rgba(15,23,42,0.65)" />
      </g>
    </svg>
  );
}

export default AirDrawerIndicator;
