"use client";

/**
 * Filter Visualizer Component
 * Interactive filter frequency response display
 */

import { useMemo } from "react";
import styles from "./Visualizers.module.css";

interface FilterVizProps {
  type?: "lowpass" | "highpass" | "bandpass" | "notch";
  cutoff?: number; // 0-1 normalized
  resonance?: number; // 0-1 normalized
  width?: number;
  height?: number;
}

export function FilterViz({
  type = "lowpass",
  cutoff = 0.5,
  resonance = 0.3,
  width = 300,
  height = 150,
}: FilterVizProps) {
  const path = useMemo(() => {
    const padding = 10;
    const w = width - padding * 2;
    const h = height - padding * 2;

    const cutoffX = padding + cutoff * w;
    const peakHeight = resonance * h * 0.8;
    const baseY = height - padding;
    const topY = padding;

    let pathD = "";

    switch (type) {
      case "lowpass":
        pathD = `
          M ${padding} ${topY + h * 0.1}
          L ${cutoffX - 20} ${topY + h * 0.1}
          Q ${cutoffX} ${topY + h * 0.1 - peakHeight} ${cutoffX} ${topY + h * 0.1}
          C ${cutoffX + 30} ${topY + h * 0.3} ${cutoffX + 60} ${baseY - 10} ${width - padding} ${baseY}
        `;
        break;
      case "highpass":
        pathD = `
          M ${padding} ${baseY}
          C ${cutoffX - 60} ${baseY - 10} ${cutoffX - 30} ${topY + h * 0.3} ${cutoffX} ${topY + h * 0.1}
          Q ${cutoffX} ${topY + h * 0.1 - peakHeight} ${cutoffX + 20} ${topY + h * 0.1}
          L ${width - padding} ${topY + h * 0.1}
        `;
        break;
      case "bandpass":
        const bandWidth = w * 0.15;
        pathD = `
          M ${padding} ${baseY}
          C ${cutoffX - bandWidth * 2} ${baseY} ${cutoffX - bandWidth} ${topY + h * 0.3} ${cutoffX} ${topY + h * 0.1 - peakHeight * 0.5}
          C ${cutoffX + bandWidth} ${topY + h * 0.3} ${cutoffX + bandWidth * 2} ${baseY} ${width - padding} ${baseY}
        `;
        break;
      case "notch":
        pathD = `
          M ${padding} ${topY + h * 0.1}
          L ${cutoffX - 30} ${topY + h * 0.1}
          C ${cutoffX - 15} ${topY + h * 0.1} ${cutoffX - 10} ${baseY - 20} ${cutoffX} ${baseY - 10}
          C ${cutoffX + 10} ${baseY - 20} ${cutoffX + 15} ${topY + h * 0.1} ${cutoffX + 30} ${topY + h * 0.1}
          L ${width - padding} ${topY + h * 0.1}
        `;
        break;
    }

    return pathD;
  }, [type, cutoff, resonance, width, height]);

  const cutoffX = 10 + cutoff * (width - 20);

  return (
    <div className={styles.visualizer}>
      <svg width={width} height={height} className={styles.svg}>
        {/* Background grid */}
        {[0.25, 0.5, 0.75].map((pos) => (
          <line
            key={pos}
            x1={10 + pos * (width - 20)}
            y1="10"
            x2={10 + pos * (width - 20)}
            y2={height - 10}
            className={styles.gridLine}
          />
        ))}
        {[0.25, 0.5, 0.75].map((pos) => (
          <line
            key={pos}
            x1="10"
            y1={10 + pos * (height - 20)}
            x2={width - 10}
            y2={10 + pos * (height - 20)}
            className={styles.gridLine}
          />
        ))}

        {/* Cutoff indicator */}
        <line x1={cutoffX} y1="10" x2={cutoffX} y2={height - 10} className={styles.cutoffLine} />

        {/* Filter response curve */}
        <path d={path} className={styles.filterPath} />

        {/* Labels */}
        <text x="15" y={height - 5} className={styles.label}>20Hz</text>
        <text x={width - 45} y={height - 5} className={styles.label}>20kHz</text>
        <text x={cutoffX - 10} y="25" className={styles.label}>Fc</text>
      </svg>

      <div className={styles.filterInfo}>
        <span className={styles.filterType}>{type}</span>
        <span className={styles.filterParams}>
          Cutoff: {Math.round(20 * Math.pow(1000, cutoff))}Hz | Res: {Math.round(resonance * 100)}%
        </span>
      </div>
    </div>
  );
}

export default FilterViz;

