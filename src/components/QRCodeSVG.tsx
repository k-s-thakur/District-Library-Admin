"use client";

import React, { useMemo } from "react";

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCodeSVG({ value, size = 96, className = "" }: QRCodeSVGProps) {
  // Deterministic 21x21 QR Code generator with authentic finder patterns
  const matrix = useMemo(() => {
    const N = 21;
    const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));

    // 1. Draw 7x7 Finder Pattern helper
    const drawFinderPattern = (startRow: number, startCol: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startRow + r][startCol + c] = true;
          } else {
            grid[startRow + r][startCol + c] = false;
          }
        }
      }
    };

    // Draw Top-Left, Top-Right, and Bottom-Left Finder Patterns
    drawFinderPattern(0, 0);
    drawFinderPattern(0, N - 7);
    drawFinderPattern(N - 7, 0);

    // 2. Timing patterns on Row 6 and Column 6
    for (let i = 8; i < N - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    // 3. Simple FNV-1a hash to generate deterministic pseudo-data bits
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const isReserved = (r: number, c: number) => {
      if (r < 8 && c < 8) return true; // Top-left
      if (r < 8 && c >= N - 8) return true; // Top-right
      if (r >= N - 8 && c < 8) return true; // Bottom-left
      if (r === 6 || c === 6) return true; // Timing
      return false;
    };

    // Fill remaining cells
    let bitIndex = 0;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!isReserved(r, c)) {
          // Pseudorandom pseudo-data bits seeded by character code and position
          const bit = ((hash >> (bitIndex % 31)) & 1) ^ (((r * 7 + c * 13) % 5 === 0) ? 1 : 0);
          grid[r][c] = bit === 1;
          bitIndex++;
        }
      }
    }

    return grid;
  }, [value]);

  const N = matrix.length;
  const cellSize = 100 / N;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`rounded-sm bg-white p-1 ${className}`}
      shapeRendering="crispEdges"
      aria-label={`QR Code for ${value}`}
    >
      <rect width="100" height="100" fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.1}
              height={cellSize + 0.1}
              fill="#0f172a"
            />
          ) : null
        )
      )}
    </svg>
  );
}
