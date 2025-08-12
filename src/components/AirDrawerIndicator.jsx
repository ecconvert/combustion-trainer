import React from "react";

// Centered air drawer indicator with a simple pointer (needle) from 7 o'clock (Low Fire)
// to 11 o'clock (High Fire).
// Place it absolutely inside the chamber container.
function AirDrawerIndicator({
  value,                 // 0..100 fire rate
  chamberRef,            // ref to the chamber container (position: relative)
  flameSelector = "[data-flame-root]", // optional CSS selector for the flame node
  speed = 1,             // 0.5, 1, 2 animation speed
  scale = 1.18,          // size relative to measured flame
  angleLow = 180,        // 7 o'clock (degrees, clockwise from 12)
  angleHigh = 300        // 11 o'clock (degrees, clockwise from 12)
}) {
  const [box, setBox] = React.useState({ left: 0, top: 0, width: 0, height: 0 });
  const [ring, setRing] = React.useState({ cx: 0, cy: 0, r: 60 });
  const [angle, setAngle] = React.useState(angleLow - ((angleLow - angleHigh) * (value / 100)));

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

      const cx = basis.left + basis.width / 2;
      const cy = basis.top + basis.height / 2;

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
  }, [chamberRef, flameSelector, scale]);

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

  // Needle: from center to near edge, slightly inside
  const needleLength = ring.r * 0.87;
  const needleWidth = Math.max(2, ring.r * 0.10);

  // Center coordinates
  const cx = ring.r;
  const cy = ring.r;

  // Compute needle tip and base points for a simple pointer triangle
  const angleRad = (Math.PI / 180) * angle; // SVG 0deg is at 3 o'clock, but pointer is centered
  const tipX = cx + needleLength * Math.cos(angleRad);
  const tipY = cy + needleLength * Math.sin(angleRad);
  const baseAngle1 = angleRad + Math.PI / 2.5;
  const baseAngle2 = angleRad - Math.PI / 2.5;
  const baseRadius = needleWidth;
  const baseX1 = cx + baseRadius * Math.cos(baseAngle1);
  const baseY1 = cy + baseRadius * Math.sin(baseAngle1);
  const baseX2 = cx + baseRadius * Math.cos(baseAngle2);
  const baseY2 = cy + baseRadius * Math.sin(baseAngle2);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ position: "absolute", left, top, pointerEvents: "none", zIndex: 2 }}
    >
      {/* background ring */}
      <circle cx={cx} cy={cy} r={ring.r * 0.95} fill="rgba(255,255,255,0.45)" stroke="#cbd5e1" strokeWidth={Math.max(1, ring.r * 0.03)} />
      {/* arc from 7 to 11 o'clock for visual cue */}
      <path
        d={describeArc(cx, cy, ring.r * 0.82, angleLow, angleHigh)}
        stroke="#334155"
        strokeWidth={Math.max(2, ring.r * 0.07)}
        fill="none"
        opacity={0.7}
      />
      {/* pointer/needle */}
      <polygon
        points={`${tipX},${tipY} ${baseX1},${baseY1} ${baseX2},${baseY2}`}
        fill="#1e293b"
        stroke="#fff"
        strokeWidth={Math.max(1, ring.r * 0.02)}
        style={{ filter: "drop-shadow(0 0 2px #fff8)" }}
      />
      {/* hub */}
      <circle cx={cx} cy={cy} r={ring.r * 0.13} fill="#334155" stroke="#fff" strokeWidth={Math.max(1, ring.r * 0.02)} />
    </svg>
  );
}

// Helper to describe an SVG arc
function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}
function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = (angleDeg - 90) * Math.PI / 180.0;
  return {
    x: cx + (r * Math.cos(angleRad)),
    y: cy + (r * Math.sin(angleRad))
  };
}

export default AirDrawerIndicator;