import React from 'react';
import { clamp } from '../../lib/math';

/**
 * Animated flame component with color and size based on phi ratio and intensity.
 *
 * @param {Object} props
 * @param {number} props.phi - Equivalence ratio (phi = 1/excess_air)
 * @param {number} props.intensity - Flame intensity factor
 * @param {boolean} [props.pilot=false] - Whether this is a pilot flame
 */
export default function Flame({ phi, intensity, pilot = false }) {
  let color = "#48b3ff"; // lean -> blue
  if (phi > 1.05 && phi < 1.2) color = "#ff8c00"; // near stoich -> orange
  if (phi >= 1.2) color = "#ffd54d"; // rich -> yellow
  let size = clamp(40 + intensity * 60, 30, 120);

  if (pilot) {
    color = "#ff8c00"; // pilot flame bright orange
    size = clamp(20 + intensity * 40, 10, 60);
  }

  return (
    <div
      aria-label="flame"
      className="mx-auto rounded-full opacity-90 shadow-inner"
      style={{ 
        width: size,
        height: size * (pilot ? 1.1 : 1.2),
        background: `radial-gradient(circle at 50% 60%, ${color}, transparent 60%)`,
        filter: "blur(1px)",
        animation: "flicker 0.18s infinite alternate",
      }}
    />
  );
}