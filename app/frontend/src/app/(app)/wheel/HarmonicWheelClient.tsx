"use client";

/**
 * Harmonic Wheel Client Component
 *
 * Interactive SVG wheel showing key relationships.
 * Two modes: Harmonic (Camelot) and Theory (Circle of Fifths).
 */

import { useState, useCallback } from "react";
import {
  type KeyInfo,
  getMinorKeys,
  getMajorKeys,
  getCompatibleKeys,
  getCircleOfFifthsRelationships,
} from "@/lib/data/camelotWheel";
import styles from "./HarmonicWheel.module.css";

type WheelMode = "harmonic" | "theory";

interface CompatibilityType {
  same: boolean;
  relative: boolean;
  adjacent: boolean;
}

export function HarmonicWheelClient() {
  const [mode, setMode] = useState<WheelMode>("harmonic");
  const [selectedKey, setSelectedKey] = useState<KeyInfo | null>(null);

  const minorKeys = getMinorKeys();
  const majorKeys = getMajorKeys();

  const getSubtitle = () => {
    if (!selectedKey) return mode === "harmonic" ? "Harmonic mixing made simple." : "The circle of fifths, visualized.";
    return mode === "harmonic" ? "Harmonic mixing made simple." : "The circle of fifths, visualized.";
  };

  const handleKeyClick = useCallback((key: KeyInfo) => {
    setSelectedKey((prev) => (prev?.camelot === key.camelot ? null : key));
  }, []);

  const getKeyCompatibility = useCallback((key: KeyInfo): CompatibilityType | null => {
    if (!selectedKey) return null;

    const compatible = getCompatibleKeys(selectedKey.camelot);

    return {
      same: key.camelot === selectedKey.camelot,
      relative: key.camelot === compatible.relative?.camelot,
      adjacent: compatible.adjacent.some((k) => k.camelot === key.camelot),
    };
  }, [selectedKey]);

  return (
    <div className={styles.container}>
      {/* Mode Toggle */}
      <div className={styles.modeToggle}>
        <button
          className={`${styles.modeButton} ${mode === "harmonic" ? styles.active : ""}`}
          onClick={() => setMode("harmonic")}
        >
          Harmonic (Camelot)
        </button>
        <button
          className={`${styles.modeButton} ${mode === "theory" ? styles.active : ""}`}
          onClick={() => setMode("theory")}
        >
          Theory (Fifths)
        </button>
      </div>

      <p className={styles.modeSubtitle}>{getSubtitle()}</p>

      {/* The Wheel */}
      <div className={styles.wheelContainer}>
        <svg
          viewBox="0 0 400 400"
          className={styles.wheel}
          role="img"
          aria-label="Harmonic wheel showing key relationships"
        >
          {/* Outer ring - Minor keys */}
          <g className={styles.outerRing}>
            {minorKeys.map((key) => (
              <WheelSegment
                key={key.camelot}
                keyInfo={key}
                ringType="outer"
                mode={mode}
                compatibility={getKeyCompatibility(key)}
                isSelected={selectedKey?.camelot === key.camelot}
                onClick={() => handleKeyClick(key)}
              />
            ))}
          </g>

          {/* Inner ring - Major keys */}
          <g className={styles.innerRing}>
            {majorKeys.map((key) => (
              <WheelSegment
                key={key.camelot}
                keyInfo={key}
                ringType="inner"
                mode={mode}
                compatibility={getKeyCompatibility(key)}
                isSelected={selectedKey?.camelot === key.camelot}
                onClick={() => handleKeyClick(key)}
              />
            ))}
          </g>

          {/* Center */}
          <circle cx="200" cy="200" r="60" className={styles.center} />
          <text x="200" y="195" className={styles.centerText} textAnchor="middle">
            {selectedKey ? (mode === "harmonic" ? selectedKey.camelot : selectedKey.traditionalKey.split(" ")[0]) : "Pick"}
          </text>
          <text x="200" y="215" className={styles.centerSubtext} textAnchor="middle">
            {selectedKey ? (mode === "harmonic" ? selectedKey.traditionalKey : selectedKey.isMinor ? "minor" : "major") : "any key"}
          </text>
        </svg>
      </div>

      {/* Info Panel */}
      {selectedKey && (
        <KeyInfoPanel
          keyInfo={selectedKey}
          mode={mode}
        />
      )}
    </div>
  );
}

interface WheelSegmentProps {
  keyInfo: KeyInfo;
  ringType: "outer" | "inner";
  mode: WheelMode;
  compatibility: CompatibilityType | null;
  isSelected: boolean;
  onClick: () => void;
}

function WheelSegment({
  keyInfo,
  ringType,
  mode,
  compatibility,
  isSelected,
  onClick,
}: WheelSegmentProps) {
  const angle = ((keyInfo.position - 1) * 30) - 90; // Start at top
  const angleRad = (angle * Math.PI) / 180;
  const nextAngleRad = ((angle + 30) * Math.PI) / 180;

  const outerRadius = ringType === "outer" ? 180 : 120;
  const innerRadius = ringType === "outer" ? 120 : 60;

  // Calculate arc path
  const x1 = 200 + outerRadius * Math.cos(angleRad);
  const y1 = 200 + outerRadius * Math.sin(angleRad);
  const x2 = 200 + outerRadius * Math.cos(nextAngleRad);
  const y2 = 200 + outerRadius * Math.sin(nextAngleRad);
  const x3 = 200 + innerRadius * Math.cos(nextAngleRad);
  const y3 = 200 + innerRadius * Math.sin(nextAngleRad);
  const x4 = 200 + innerRadius * Math.cos(angleRad);
  const y4 = 200 + innerRadius * Math.sin(angleRad);

  const path = `
    M ${x1} ${y1}
    A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2}
    L ${x3} ${y3}
    A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4}
    Z
  `;

  // Label position
  const labelRadius = (outerRadius + innerRadius) / 2;
  const labelAngle = angle + 15;
  const labelAngleRad = (labelAngle * Math.PI) / 180;
  const labelX = 200 + labelRadius * Math.cos(labelAngleRad);
  const labelY = 200 + labelRadius * Math.sin(labelAngleRad);

  // Determine segment class
  let segmentClass = styles.segment;
  if (isSelected) {
    segmentClass += ` ${styles.selected}`;
  } else if (compatibility) {
    if (compatibility.relative) {
      segmentClass += ` ${styles.relative}`;
    } else if (compatibility.adjacent) {
      segmentClass += ` ${styles.adjacent}`;
    } else if (!compatibility.same) {
      segmentClass += ` ${styles.faded}`;
    }
  }

  const label = mode === "harmonic" ? keyInfo.camelot : keyInfo.traditionalKey.split(" ")[0];

  return (
    <g
      className={segmentClass}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${keyInfo.camelot} - ${keyInfo.traditionalKey}`}
    >
      <path d={path} className={styles.segmentPath} />
      <text
        x={labelX}
        y={labelY}
        className={styles.segmentLabel}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

interface KeyInfoPanelProps {
  keyInfo: KeyInfo;
  mode: WheelMode;
}

function KeyInfoPanel({ keyInfo, mode }: KeyInfoPanelProps) {
  if (mode === "harmonic") {
    const compatible = getCompatibleKeys(keyInfo.camelot);

    return (
      <div className={styles.infoPanel}>
        <h3 className={styles.infoPanelTitle}>
          {keyInfo.camelot} - {keyInfo.traditionalKey}
        </h3>
        <div className={styles.infoPanelContent}>
          <p className={styles.infoLabel}>Mixes well with:</p>
          <ul className={styles.infoList}>
            {compatible.relative && (
              <li>
                <span className={styles.relativeTag}>Relative</span>
                {compatible.relative.camelot} ({compatible.relative.traditionalKey})
              </li>
            )}
            {compatible.adjacent.map((adj) => (
              <li key={adj.camelot}>
                <span className={styles.adjacentTag}>Adjacent</span>
                {adj.camelot} ({adj.traditionalKey})
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Theory mode
  const relationships = getCircleOfFifthsRelationships(keyInfo.camelot);

  return (
    <div className={styles.infoPanel}>
      <h3 className={styles.infoPanelTitle}>{keyInfo.traditionalKey}</h3>
      <div className={styles.infoPanelContent}>
        <p className={styles.infoLabel}>Relationships:</p>
        <ul className={styles.infoList}>
          {relationships.perfectFifth && (
            <li>
              <span className={styles.fifthTag}>Perfect 5th</span>
              {relationships.perfectFifth.traditionalKey}
            </li>
          )}
          {relationships.perfectFourth && (
            <li>
              <span className={styles.fourthTag}>Perfect 4th</span>
              {relationships.perfectFourth.traditionalKey}
            </li>
          )}
          {relationships.relativeMinor && (
            <li>
              <span className={styles.relativeTag}>Relative minor</span>
              {relationships.relativeMinor.traditionalKey}
            </li>
          )}
          {relationships.relativeMajor && (
            <li>
              <span className={styles.relativeTag}>Relative major</span>
              {relationships.relativeMajor.traditionalKey}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

