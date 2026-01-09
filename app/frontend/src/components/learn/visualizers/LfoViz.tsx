"use client";

/**
 * LFO Visualizer Component
 * Interactive LFO waveform display
 */

import { useMemo } from "react";
import styles from "./Visualizers.module.css";

interface LfoVizProps {
  shape?: "sine" | "triangle" | "square" | "saw" | "random";
  rate?: number;
  phase?: number;
  tempoSync?: boolean;
  width?: number;
  height?: number;
}

export function LfoViz({
  shape = "sine",
  rate = 1,
  phase = 0,
  tempoSync = false,
  width = 300,
  height = 100,
}: LfoVizProps) {
  const path = useMemo(() => {
    const padding = 10;
    const w = width - padding * 2;
    const h = height - padding * 2;
    const centerY = height / 2;
    const amplitude = h / 2 - 5;
    const cycles = 2;

    const points: string[] = [];
    const steps = 100;

    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * cycles;
      const x = padding + (i / steps) * w;
      let y = centerY;

      const phaseOffset = phase * Math.PI * 2;

      switch (shape) {
        case "sine":
          y = centerY - Math.sin(t * Math.PI * 2 + phaseOffset) * amplitude;
          break;
        case "triangle": {
          const triPhase = (t + phase) % 1;
          y = centerY - (triPhase < 0.5 ? triPhase * 4 - 1 : 3 - triPhase * 4) * amplitude;
          break;
        }
        case "square":
          y = centerY - (Math.sin(t * Math.PI * 2 + phaseOffset) >= 0 ? 1 : -1) * amplitude;
          break;
        case "saw": {
          const sawPhase = (t + phase) % 1;
          y = centerY - (sawPhase * 2 - 1) * amplitude;
          break;
        }
        case "random": {
          const randomSeed = Math.floor((t + phase) * 4);
          y = centerY - ((Math.sin(randomSeed * 12.9898) * 43758.5453) % 1 * 2 - 1) * amplitude;
          break;
        }
      }

      points.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }

    return points.join(" ");
  }, [shape, phase, width, height]);

  return (
    <div className={styles.visualizer}>
      <svg width={width} height={height} className={styles.svg}>
        <line
          x1="10"
          y1={height / 2}
          x2={width - 10}
          y2={height / 2}
          className={styles.gridLine}
        />
        <path d={path} className={styles.lfoShape} />
      </svg>

      <div className={styles.lfoInfo}>
        <span>Shape: {shape}</span>
        <span>Rate: {tempoSync ? `1/${rate}` : `${rate}Hz`}</span>
        <span>Phase: {Math.round(phase * 360)}deg</span>
      </div>
    </div>
  );
}

export default LfoViz;

