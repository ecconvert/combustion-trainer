import React from "react";

// --- Linkage animation (SVG) ---
// Jackshaft and two levers driven by link rods, mapped to fire rate.
// No external libs; uses requestAnimationFrame for smooth easing.
export default function LinkageAnimator({ fireRate, speed = 1 }) {
  // Geometry in a 1000x260 logical box
  const W = 1000, H = 260;
  const cx = 220, cy = 130;     // jackshaft center
  const rHub = 46, rPin = 78;   // hub radius and pin radius
  const fuelPivot = { x: 660, y: 95 }, airPivot = { x: 660, y: 165 };
  const leverLen = 160;

  // Stops
  const thetaL = 330; // low fire
  const thetaH = 210; // high fire

  // Piecewise cam mappings
  const mapPct = (R, pts) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [r1, p1] = pts[i], [r2, p2] = pts[i + 1];
      if (R <= r2) {
        const t = (R - r1) / Math.max(1, r2 - r1);
        return p1 + (p2 - p1) * t;
      }
    }
    return pts[pts.length - 1][1];
  };
  const fuelCurve = [
    [0, 6], [25, 22], [50, 55], [75, 82], [100, 100],
  ];
  const airCurve = [
    [0, 8], [25, 28], [50, 58], [75, 86], [100, 100],
  ];

  // Lever angle bounds
  const fuelClosed = 10, fuelOpen = 70;
  const airClosed = 5, airOpen = 80;
  const toLeverAngle = (pct, closed, open) => closed + (open - closed) * (pct / 100);

  // Animated state
  const [Rcur, setRcur] = React.useState(fireRate);
  const [Rfuel, setRfuel] = React.useState(fireRate);
  const [Rair, setRair] = React.useState(fireRate);
  const dirRef = React.useRef(0);
  const leadUntilRef = React.useRef(0);
  const slackUntilRef = React.useRef(0);

  // Animation loop with easing, slack, and 150 ms lead or lag
  React.useEffect(() => {
    let raf;
    const begin = performance.now();
    const R0 = Rcur, R1 = fireRate;

    const durationForDelta = (d) => {
      const base = 2000 / Math.max(0.25, speed); // full sweep at 1x
      return base * Math.min(1, Math.abs(d) / 100);
    };
    const dur = durationForDelta(R1 - R0);

    const prevDir = dirRef.current;
    const dir = R1 > R0 ? 1 : (R1 < R0 ? -1 : 0);
    if (dir !== 0 && dir !== prevDir) {
      dirRef.current = dir;
      slackUntilRef.current = begin + 80 / Math.max(0.25, speed);
      leadUntilRef.current = begin + 150 / Math.max(0.25, speed);
    }

    const animate = () => {
      const now = performance.now();
      const hold = now < slackUntilRef.current;
      const k = Math.min(1, (now - begin) / Math.max(1, dur));
      const ease = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const target = hold ? R0 : (R0 + (R1 - R0) * ease);
      setRcur(target);

      const inLead = now < leadUntilRef.current;
      if (inLead) {
        if (dir < 0) {
          setRair(target);
          setRfuel(R0 + (R1 - R0) * Math.max(0, ease - 0.12));
        } else if (dir > 0) {
          setRfuel(target);
          setRair(R0 + (R1 - R0) * Math.max(0, ease - 0.12));
        } else {
          setRfuel(target); setRair(target);
        }
      } else {
        setRfuel(target); setRair(target);
      }

      if (k < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setRcur(R1); setRfuel(R1); setRair(R1);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireRate, speed]);

  // Map rates to angles
  const theta = thetaL + (thetaH - thetaL) * (Rcur / 100);
  const pctFuel = mapPct(Rfuel, fuelCurve);
  const pctAir = mapPct(Rair, airCurve);

  const fuelAng = toLeverAngle(pctFuel, fuelClosed, fuelOpen);
  const airAng = toLeverAngle(pctAir, airClosed, airOpen);

  // Helpers
  const d2r = (d) => (Math.PI / 180) * d;
  const polar = (cx, cy, r, deg) => ({
    x: cx + r * Math.cos(d2r(deg)),
    y: cy + r * Math.sin(d2r(deg)),
  });

  // Pin positions on hub
  const fuelPin = polar(cx, cy, rPin, theta + 10);
  const airPin = polar(cx, cy, rPin, theta - 10);

  // Lever tips
  const fuelTip = polar(fuelPivot.x, fuelPivot.y, leverLen, fuelAng);
  const airTip = polar(airPivot.x, airPivot.y, leverLen, airAng);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {/* Background */}
        <rect x="0" y="0" width={W} height={H} rx="20" fill="url(#lg)" />
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8fafc" />
            <stop offset="1" stopColor="#eef2f7" />
          </linearGradient>
          <marker id="dot" markerWidth="6" markerHeight="6" refX="3" refY="3">
            <circle cx="3" cy="3" r="3" fill="#0f172a" />
          </marker>
        </defs>

        {/* Jackshaft hub */}
        <circle cx={cx} cy={cy} r={rHub} fill="#0f172a" opacity="0.9" />
        <circle cx={cx} cy={cy} r={rHub + 16} fill="none" stroke="#94a3b8" strokeWidth="4" />

        {/* Stops */}
        {[
          { ang: thetaL, label: "LF" },
          { ang: thetaH, label: "HF" },
        ].map((s, i) => {
          const p = polar(cx, cy, rHub + 22, s.ang);
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="#64748b" />
              <text x={p.x + 8} y={p.y + 4} fontSize="16" fill="#475569">{s.label}</text>
            </g>
          );
        })}

        {/* Pins on hub */}
        <circle cx={fuelPin.x} cy={fuelPin.y} r="6" fill="#ef4444" />
        <circle cx={airPin.x} cy={airPin.y} r="6" fill="#22c55e" />

        {/* Fuel lever and pivot */}
        <circle cx={fuelPivot.x} cy={fuelPivot.y} r="6" fill="#ef4444" />
        <line
          x1={fuelPivot.x} y1={fuelPivot.y} x2={fuelTip.x} y2={fuelTip.y}
          stroke="#ef4444" strokeWidth="10" strokeLinecap="round"
        />
        {/* Air lever and pivot */}
        <circle cx={airPivot.x} cy={airPivot.y} r="6" fill="#22c55e" />
        <line
          x1={airPivot.x} y1={airPivot.y} x2={airTip.x} y2={airTip.y}
          stroke="#22c55e" strokeWidth="10" strokeLinecap="round"
        />

        {/* Link rods */}
        <line
          x1={fuelPin.x} y1={fuelPin.y} x2={fuelTip.x} y2={fuelTip.y}
          stroke="#ef4444" strokeWidth="4" markerEnd="url(#dot)" opacity="0.9"
        />
        <line
          x1={airPin.x} y1={airPin.y} x2={airTip.x} y2={airTip.y}
          stroke="#22c55e" strokeWidth="4" markerEnd="url(#dot)" opacity="0.9"
        />

        {/* Tick marks 25 50 75 with brief glow */}
        {[25, 50, 75].map((pct, i) => {
          const ang = thetaL + (thetaH - thetaL) * (pct / 100);
          const p = polar(cx, cy, rHub + 34, ang);
          const active = Math.abs(Rcur - pct) < 1.5;
          return (
            <g key={i} opacity={active ? 1 : 0.45}>
              <circle cx={p.x} cy={p.y} r={active ? 8 : 5} fill={active ? "#f59e0b" : "#94a3b8"} />
              <text x={p.x + 10} y={p.y + 5} fontSize="14" fill="#475569">{pct}%</text>
            </g>
          );
        })}

        {/* Labels */}
        <text x="20" y="28" fontSize="18" fill="#0f172a">Jackshaft</text>
        <text x={fuelPivot.x + 12} y={fuelPivot.y - 10} fontSize="16" fill="#ef4444">Fuel lever</text>
        <text x={airPivot.x + 12} y={airPivot.y - 10} fontSize="16" fill="#22c55e">Air lever</text>
      </svg>
    </div>
  );
}

