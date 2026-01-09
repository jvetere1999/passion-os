"use client";

/**
 * Persona 5 Style Skill Wheel Component
 * Displays user stats/skills in a stylized radial chart
 */

import { useState, useEffect, useMemo } from "react";
import styles from "./SkillWheel.module.css";

export interface Skill {
  id: string;
  name: string;
  level: number; // 1-10
  maxLevel: number;
  color: string;
  icon?: React.ReactNode;
  xp: number;
  xpToNext: number;
}

interface SkillWheelProps {
  skills: Skill[];
  size?: number;
  onSkillClick?: (skill: Skill) => void;
}

// Default skills for the progress system
export const DEFAULT_SKILLS: Skill[] = [
  {
    id: "knowledge",
    name: "Knowledge",
    level: 1,
    maxLevel: 10,
    color: "#4a90d9",
    xp: 0,
    xpToNext: 100,
  },
  {
    id: "guts",
    name: "Guts",
    level: 1,
    maxLevel: 10,
    color: "#e74c3c",
    xp: 0,
    xpToNext: 100,
  },
  {
    id: "proficiency",
    name: "Proficiency",
    level: 1,
    maxLevel: 10,
    color: "#f39c12",
    xp: 0,
    xpToNext: 100,
  },
  {
    id: "kindness",
    name: "Kindness",
    level: 1,
    maxLevel: 10,
    color: "#27ae60",
    xp: 0,
    xpToNext: 100,
  },
  {
    id: "charm",
    name: "Charm",
    level: 1,
    maxLevel: 10,
    color: "#9b59b6",
    xp: 0,
    xpToNext: 100,
  },
];

// Level names inspired by Persona 5
const LEVEL_NAMES: Record<string, string[]> = {
  knowledge: ["Oblivious", "Learned", "Scholarly", "Encyclopedic", "Erudite", "Genius", "Sage", "Oracle", "Omniscient", "Transcendent"],
  guts: ["Milquetoast", "Bold", "Staunch", "Dauntless", "Lionhearted", "Fearless", "Indomitable", "Legendary", "Heroic", "Unbreakable"],
  proficiency: ["Bumbling", "Decent", "Skilled", "Masterful", "Virtuoso", "Expert", "Artisan", "Grandmaster", "Legendary", "Transcendent"],
  kindness: ["Inoffensive", "Considerate", "Empathetic", "Selfless", "Angelic", "Saintly", "Divine", "Blessed", "Enlightened", "Pure"],
  charm: ["Existent", "Suave", "Charismatic", "Debonair", "Captivating", "Magnetic", "Irresistible", "Legendary", "Iconic", "Divine"],
};

function getLevelName(skillId: string, level: number): string {
  const names = LEVEL_NAMES[skillId] || LEVEL_NAMES.knowledge;
  return names[Math.min(level - 1, names.length - 1)];
}

export function SkillWheel({ skills, size = 400, onSkillClick }: SkillWheelProps) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // Start animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const center = size / 2;
  const maxRadius = size / 2 - 40;
  const minRadius = 60;
  const angleStep = (2 * Math.PI) / skills.length;

  // Calculate polygon points for each skill
  const skillPolygons = useMemo(() => {
    return skills.map((skill, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      const radius = minRadius + ((skill.level / skill.maxLevel) * (maxRadius - minRadius));
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { skill, x, y, angle, radius };
    });
  }, [skills, center, maxRadius, minRadius, angleStep]);

  // Create the filled polygon path
  const polygonPath = useMemo(() => {
    if (skillPolygons.length === 0) return "";
    const points = skillPolygons.map(({ x, y }) => `${x},${y}`).join(" ");
    return points;
  }, [skillPolygons]);

  // Create background grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    const levels = 10;

    for (let i = 1; i <= levels; i++) {
      const radius = minRadius + ((i / levels) * (maxRadius - minRadius));
      const points = [];
      for (let j = 0; j < skills.length; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      lines.push({ level: i, points: points.join(" "), radius });
    }
    return lines;
  }, [skills.length, center, maxRadius, minRadius, angleStep]);

  // Create axis lines
  const axisLines = useMemo(() => {
    return skills.map((skill, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const x1 = center;
      const y1 = center;
      const x2 = center + maxRadius * Math.cos(angle);
      const y2 = center + maxRadius * Math.sin(angle);
      return { skill, x1, y1, x2, y2, angle };
    });
  }, [skills, center, maxRadius, angleStep]);

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(selectedSkill?.id === skill.id ? null : skill);
    onSkillClick?.(skill);
  };

  return (
    <div className={styles.container}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`${styles.wheel} ${isAnimating ? styles.animating : ""}`}
      >
        {/* Definitions */}
        <defs>
          {/* Gradient for the filled area */}
          <linearGradient id="skillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--accent-secondary, #ff4757)" stopOpacity="0.6" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Drop shadow */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={maxRadius + 10}
          fill="var(--bg-secondary)"
          stroke="var(--border-color)"
          strokeWidth="2"
        />

        {/* Grid lines */}
        {gridLines.map((line, i) => (
          <polygon
            key={`grid-${i}`}
            points={line.points}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="1"
            opacity={0.3}
            className={styles.gridLine}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((axis, i) => (
          <line
            key={`axis-${i}`}
            x1={axis.x1}
            y1={axis.y1}
            x2={axis.x2}
            y2={axis.y2}
            stroke="var(--border-subtle)"
            strokeWidth="1"
            opacity={0.4}
          />
        ))}

        {/* Filled skill polygon */}
        <polygon
          points={polygonPath}
          fill="url(#skillGradient)"
          stroke="var(--accent-primary)"
          strokeWidth="2"
          filter="url(#glow)"
          className={styles.skillPolygon}
        />

        {/* Skill points */}
        {skillPolygons.map(({ skill, x, y }, i) => (
          <g key={skill.id} className={styles.skillPoint}>
            <circle
              cx={x}
              cy={y}
              r={selectedSkill?.id === skill.id ? 12 : 8}
              fill={skill.color}
              stroke="#fff"
              strokeWidth="2"
              filter="url(#shadow)"
              className={styles.skillDot}
              onClick={() => handleSkillClick(skill)}
              style={{ cursor: "pointer" }}
            />
          </g>
        ))}

        {/* Skill labels */}
        {axisLines.map((axis, i) => {
          const skill = skills[i];
          const labelRadius = maxRadius + 30;
          const labelX = center + labelRadius * Math.cos(axis.angle);
          const labelY = center + labelRadius * Math.sin(axis.angle);

          return (
            <g key={`label-${skill.id}`} onClick={() => handleSkillClick(skill)} style={{ cursor: "pointer" }}>
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`${styles.skillLabel} ${selectedSkill?.id === skill.id ? styles.selected : ""}`}
                fill={selectedSkill?.id === skill.id ? skill.color : "var(--text-primary)"}
              >
                {skill.name}
              </text>
              <text
                x={labelX}
                y={labelY + 16}
                textAnchor="middle"
                dominantBaseline="middle"
                className={styles.skillLevel}
                fill="var(--text-muted)"
              >
                Lv.{skill.level}
              </text>
            </g>
          );
        })}

        {/* Center emblem */}
        <circle
          cx={center}
          cy={center}
          r={minRadius - 10}
          fill="var(--bg-primary)"
          stroke="var(--accent-primary)"
          strokeWidth="3"
        />
        <text
          x={center}
          y={center - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className={styles.centerLabel}
          fill="var(--text-primary)"
        >
          RANK
        </text>
        <text
          x={center}
          y={center + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          className={styles.centerValue}
          fill="var(--accent-primary)"
        >
          {Math.floor(skills.reduce((sum, s) => sum + s.level, 0) / skills.length)}
        </text>
      </svg>

      {/* Selected skill details */}
      {selectedSkill && (
        <div className={styles.skillDetails} style={{ "--skill-color": selectedSkill.color } as React.CSSProperties}>
          <div className={styles.detailsHeader}>
            <h3 className={styles.skillName}>{selectedSkill.name}</h3>
            <span className={styles.skillRank}>{getLevelName(selectedSkill.id, selectedSkill.level)}</span>
          </div>
          <div className={styles.levelBar}>
            <div className={styles.levelProgress}>
              <div
                className={styles.levelFill}
                style={{ width: `${(selectedSkill.xp / selectedSkill.xpToNext) * 100}%` }}
              />
            </div>
            <span className={styles.levelText}>
              Level {selectedSkill.level} - {selectedSkill.xp}/{selectedSkill.xpToNext} XP
            </span>
          </div>
          <div className={styles.levelStars}>
            {Array.from({ length: selectedSkill.maxLevel }).map((_, i) => (
              <span
                key={i}
                className={`${styles.star} ${i < selectedSkill.level ? styles.filled : ""}`}
              >
                *
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

