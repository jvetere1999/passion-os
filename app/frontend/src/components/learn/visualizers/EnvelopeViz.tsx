"use client";

/**
 * Envelope Visualizer Component
 * Interactive ADSR envelope display
 */

import { useState, useCallback, useMemo } from "react";
import styles from "./Visualizers.module.css";

interface EnvelopeVizProps {
  attack?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  interactive?: boolean;
  onChange?: (envelope: { attack: number; decay: number; sustain: number; release: number }) => void;
  width?: number;
  height?: number;
}

export function EnvelopeViz({
  attack = 0.1,
  decay = 0.2,
  sustain = 0.7,
  release = 0.3,
  interactive = false,
  onChange,
  width = 300,
  height = 150,
}: EnvelopeVizProps) {
  const [localAttack, setLocalAttack] = useState(attack);
  const [localDecay, setLocalDecay] = useState(decay);
  const [localSustain, setLocalSustain] = useState(sustain);
  const [localRelease, setLocalRelease] = useState(release);

  const currentEnvelope = useMemo(() => {
    if (interactive) {
      return { attack: localAttack, decay: localDecay, sustain: localSustain, release: localRelease };
    }
    return { attack, decay, sustain, release };
  }, [interactive, localAttack, localDecay, localSustain, localRelease, attack, decay, sustain, release]);

  const path = useMemo(() => {
    const { attack: a, decay: d, sustain: s, release: r } = currentEnvelope;
    const padding = 10;
    const w = width - padding * 2;
    const h = height - padding * 2;

    // Normalize values (assuming max time is 1 second for visualization)
    const totalTime = a + d + 0.3 + r; // 0.3 is hold time visualization
    const attackX = (a / totalTime) * w;
    const decayX = ((a + d) / totalTime) * w;
    const sustainX = ((a + d + 0.3) / totalTime) * w;
    const releaseX = w;

    const peakY = padding;
    const sustainY = padding + (1 - s) * h;
    const bottomY = height - padding;

    return `M ${padding} ${bottomY} 
            L ${padding + attackX} ${peakY} 
            L ${padding + decayX} ${sustainY} 
            L ${padding + sustainX} ${sustainY} 
            L ${padding + releaseX} ${bottomY}`;
  }, [currentEnvelope, width, height]);

  const handleChange = useCallback(
    (param: "attack" | "decay" | "sustain" | "release", value: number) => {
      const setters = {
        attack: setLocalAttack,
        decay: setLocalDecay,
        sustain: setLocalSustain,
        release: setLocalRelease,
      };
      setters[param](value);

      if (onChange) {
        onChange({
          ...currentEnvelope,
          [param]: value,
        });
      }
    },
    [currentEnvelope, onChange]
  );

  return (
    <div className={styles.visualizer}>
      <svg width={width} height={height} className={styles.svg}>
        {/* Grid lines */}
        <line x1="10" y1={height / 2} x2={width - 10} y2={height / 2} className={styles.gridLine} />
        <line x1={width / 2} y1="10" x2={width / 2} y2={height - 10} className={styles.gridLine} />

        {/* Envelope path */}
        <path d={path} className={styles.envelopePath} />

        {/* Labels */}
        <text x="20" y={height - 5} className={styles.label}>A</text>
        <text x={width * 0.3} y={height - 5} className={styles.label}>D</text>
        <text x={width * 0.55} y={height - 5} className={styles.label}>S</text>
        <text x={width * 0.8} y={height - 5} className={styles.label}>R</text>
      </svg>

      {interactive && (
        <div className={styles.controls}>
          <div className={styles.control}>
            <label>Attack</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localAttack}
              onChange={(e) => handleChange("attack", parseFloat(e.target.value))}
            />
            <span>{(localAttack * 1000).toFixed(0)}ms</span>
          </div>
          <div className={styles.control}>
            <label>Decay</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localDecay}
              onChange={(e) => handleChange("decay", parseFloat(e.target.value))}
            />
            <span>{(localDecay * 1000).toFixed(0)}ms</span>
          </div>
          <div className={styles.control}>
            <label>Sustain</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localSustain}
              onChange={(e) => handleChange("sustain", parseFloat(e.target.value))}
            />
            <span>{(localSustain * 100).toFixed(0)}%</span>
          </div>
          <div className={styles.control}>
            <label>Release</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={localRelease}
              onChange={(e) => handleChange("release", parseFloat(e.target.value))}
            />
            <span>{(localRelease * 1000).toFixed(0)}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnvelopeViz;

