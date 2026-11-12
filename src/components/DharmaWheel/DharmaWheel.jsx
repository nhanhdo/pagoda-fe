import React from 'react';

// Drawn as SVG because iOS renders the "☸" character as a purple colour emoji regardless of CSS colour.
export default function DharmaWheel({ size = '1em', strokeWidth = 6, style, className }) {
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
      style={{ display: 'inline-block', verticalAlign: '-0.125em', ...style }}
    >
      <circle cx="50" cy="50" r="36" />
      <circle cx="50" cy="50" r="9" />
      {spokes.map((a, i) => (
        <g key={i}>
          <line x1={50 + 9 * Math.cos(a)} y1={50 + 9 * Math.sin(a)} x2={50 + 36 * Math.cos(a)} y2={50 + 36 * Math.sin(a)} />
          <circle cx={50 + 44 * Math.cos(a)} cy={50 + 44 * Math.sin(a)} r="4" fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  );
}
