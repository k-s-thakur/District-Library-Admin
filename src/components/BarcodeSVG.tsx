"use client";

import React, { useMemo } from "react";

interface BarcodeSVGProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export default function BarcodeSVG({
  value,
  width = 180,
  height = 50,
  showText = true,
  className = "",
}: BarcodeSVGProps) {
  // Deterministic Code-128 / Code-39 style vertical bar pattern
  const bars = useMemo(() => {
    const pattern: number[] = [2, 1, 1, 2]; // Start guard

    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      // Generate 4 bar widths (1 to 3 units) per character
      pattern.push(((charCode * 3) % 3) + 1);
      pattern.push(((charCode * 7) % 2) + 1);
      pattern.push(((charCode * 11) % 3) + 1);
      pattern.push(((charCode * 13) % 2) + 1);
    }

    pattern.push(2, 1, 2, 1, 2); // Stop guard
    return pattern;
  }, [value]);

  const totalUnits = bars.reduce((sum, w) => sum + w, 0);
  const barHeight = showText ? height - 14 : height;

  let currentX = 0;

  return (
    <div className={`inline-flex flex-col items-center bg-white p-1 rounded-sm ${className}`}>
      <svg
        viewBox={`0 0 ${totalUnits} ${barHeight}`}
        width={width}
        height={barHeight}
        shapeRendering="crispEdges"
        aria-label={`Barcode for ${value}`}
      >
        <rect width={totalUnits} height={barHeight} fill="#ffffff" />
        {bars.map((barWidth, index) => {
          const isBar = index % 2 === 0;
          const x = currentX;
          currentX += barWidth;
          if (!isBar) return null;
          return (
            <rect
              key={index}
              x={x}
              y={0}
              width={barWidth}
              height={barHeight}
              fill="#0f172a"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] text-slate-800 font-bold tracking-widest mt-0.5">
          {value}
        </span>
      )}
    </div>
  );
}
