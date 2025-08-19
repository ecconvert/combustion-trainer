import React from 'react';

/**
 * Small animated spark used during ignition.
 */
export default function Spark() {
  return (
    <div
      aria-label="spark"
      className="absolute"
      style={{ 
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "radial-gradient(circle, #fff59d, rgba(255,193,7,0.9) 40%, rgba(255,193,7,0) 70%)",
        filter: "blur(0.5px)",
        animation: "spark 0.08s infinite alternate",
      }}
    />
  );
}