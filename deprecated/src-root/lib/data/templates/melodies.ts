/**
 * Melody Templates
 * Built-in melodic patterns for various genres
 */

import type { BuiltInTemplate } from "./types";

export const melodyTemplates: BuiltInTemplate[] = [
  // ============================================
  // EDM / Electronic Melody Templates
  // ============================================
  {
    id: "edm-supersaw-lead",
    slug: "edm-supersaw-lead",
    name: "EDM Supersaw Lead",
    type: "melody",
    description: "Anthemic EDM lead melody with big room energy.",
    longDescription:
      "A soaring lead melody designed for festival-ready big room and progressive house. Features wide intervals, dramatic builds, and a memorable hook that translates well with supersaw synths.",
    bpm: 128,
    bars: 4,
    timeSignature: [4, 4],
    key: "F",
    scaleType: "minor",
    laneSettings: {
      instrumentId: "synth-supersaw",
      noteMode: "sustain",
      velocityDefault: 100,
      quantizeGrid: "1/8",
      color: "#a855f7",
    },
    notes: [
      // Bar 1
      { pitch: 65, startBeat: 0, duration: 1, velocity: 100 }, // F4
      { pitch: 68, startBeat: 1, duration: 0.5, velocity: 95 }, // Ab4
      { pitch: 70, startBeat: 1.5, duration: 0.5, velocity: 95 }, // Bb4
      { pitch: 72, startBeat: 2, duration: 2, velocity: 105 }, // C5
      // Bar 2
      { pitch: 70, startBeat: 4, duration: 1, velocity: 95 },
      { pitch: 68, startBeat: 5, duration: 1, velocity: 90 },
      { pitch: 65, startBeat: 6, duration: 2, velocity: 100 },
      // Bar 3
      { pitch: 65, startBeat: 8, duration: 1, velocity: 100 },
      { pitch: 68, startBeat: 9, duration: 0.5, velocity: 95 },
      { pitch: 70, startBeat: 9.5, duration: 0.5, velocity: 95 },
      { pitch: 72, startBeat: 10, duration: 1, velocity: 105 },
      { pitch: 75, startBeat: 11, duration: 1, velocity: 110 }, // Eb5
      // Bar 4 - Resolution
      { pitch: 77, startBeat: 12, duration: 2, velocity: 115 }, // F5
      { pitch: 72, startBeat: 14, duration: 2, velocity: 100 },
    ],
    tags: ["edm", "lead", "supersaw", "festival", "big-room", "electronic"],
    genre: "Electronic",
    difficulty: "intermediate",
    relatedTemplates: ["future-bass-chord-stabs", "trance-arpeggio"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "trance-arpeggio",
    slug: "trance-arpeggio",
    name: "Trance Arpeggio",
    type: "melody",
    description: "Classic trance arpeggiated synth pattern.",
    longDescription:
      "An uplifting trance arpeggio pattern that creates hypnotic, driving energy. Perfect for trance buildups, breakdowns, or as a rhythmic bed under leads.",
    bpm: 138,
    bars: 2,
    timeSignature: [4, 4],
    key: "A",
    scaleType: "minor",
    laneSettings: {
      instrumentId: "synth-pluck",
      noteMode: "sustain",
      velocityDefault: 85,
      quantizeGrid: "1/16",
      color: "#06b6d4",
    },
    notes: [
      // Bar 1 - Am arpeggio
      { pitch: 57, startBeat: 0, duration: 0.25, velocity: 90 }, // A3
      { pitch: 60, startBeat: 0.25, duration: 0.25, velocity: 80 }, // C4
      { pitch: 64, startBeat: 0.5, duration: 0.25, velocity: 85 }, // E4
      { pitch: 69, startBeat: 0.75, duration: 0.25, velocity: 75 }, // A4
      { pitch: 64, startBeat: 1, duration: 0.25, velocity: 85 },
      { pitch: 60, startBeat: 1.25, duration: 0.25, velocity: 80 },
      { pitch: 57, startBeat: 1.5, duration: 0.25, velocity: 90 },
      { pitch: 60, startBeat: 1.75, duration: 0.25, velocity: 80 },
      { pitch: 64, startBeat: 2, duration: 0.25, velocity: 85 },
      { pitch: 69, startBeat: 2.25, duration: 0.25, velocity: 75 },
      { pitch: 64, startBeat: 2.5, duration: 0.25, velocity: 85 },
      { pitch: 60, startBeat: 2.75, duration: 0.25, velocity: 80 },
      { pitch: 57, startBeat: 3, duration: 0.25, velocity: 90 },
      { pitch: 60, startBeat: 3.25, duration: 0.25, velocity: 80 },
      { pitch: 64, startBeat: 3.5, duration: 0.25, velocity: 85 },
      { pitch: 69, startBeat: 3.75, duration: 0.25, velocity: 75 },
      // Bar 2 - G arpeggio
      { pitch: 55, startBeat: 4, duration: 0.25, velocity: 90 }, // G3
      { pitch: 59, startBeat: 4.25, duration: 0.25, velocity: 80 }, // B3
      { pitch: 62, startBeat: 4.5, duration: 0.25, velocity: 85 }, // D4
      { pitch: 67, startBeat: 4.75, duration: 0.25, velocity: 75 }, // G4
      { pitch: 62, startBeat: 5, duration: 0.25, velocity: 85 },
      { pitch: 59, startBeat: 5.25, duration: 0.25, velocity: 80 },
      { pitch: 55, startBeat: 5.5, duration: 0.25, velocity: 90 },
      { pitch: 59, startBeat: 5.75, duration: 0.25, velocity: 80 },
      { pitch: 62, startBeat: 6, duration: 0.25, velocity: 85 },
      { pitch: 67, startBeat: 6.25, duration: 0.25, velocity: 75 },
      { pitch: 62, startBeat: 6.5, duration: 0.25, velocity: 85 },
      { pitch: 59, startBeat: 6.75, duration: 0.25, velocity: 80 },
      { pitch: 55, startBeat: 7, duration: 0.25, velocity: 90 },
      { pitch: 59, startBeat: 7.25, duration: 0.25, velocity: 80 },
      { pitch: 62, startBeat: 7.5, duration: 0.25, velocity: 85 },
      { pitch: 67, startBeat: 7.75, duration: 0.25, velocity: 80 },
    ],
    tags: ["trance", "arpeggio", "synth", "uplifting", "electronic"],
    genre: "Electronic",
    difficulty: "intermediate",
    relatedTemplates: ["edm-supersaw-lead", "progressive-house-pluck"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "future-bass-chord-stabs",
    slug: "future-bass-chord-stabs",
    name: "Future Bass Chord Stabs",
    type: "melody",
    description: "Punchy future bass chord stabs with sidechain feel.",
    longDescription:
      "Rhythmic chord stabs designed for future bass and melodic dubstep. The pattern creates a pumping, sidechained feel with 7th chord voicings for that modern sound.",
    bpm: 150,
    bars: 2,
    timeSignature: [4, 4],
    key: "Eb",
    scaleType: "major",
    laneSettings: {
      instrumentId: "synth-chord",
      noteMode: "sustain",
      velocityDefault: 100,
      quantizeGrid: "1/8",
      color: "#ec4899",
    },
    notes: [
      // Bar 1 - Ebmaj7 stabs
      { pitch: 63, startBeat: 0.5, duration: 0.5, velocity: 110 }, // Eb4
      { pitch: 67, startBeat: 0.5, duration: 0.5, velocity: 100 }, // G4
      { pitch: 70, startBeat: 0.5, duration: 0.5, velocity: 100 }, // Bb4
      { pitch: 74, startBeat: 0.5, duration: 0.5, velocity: 95 }, // D5
      { pitch: 63, startBeat: 1.5, duration: 0.25, velocity: 90 },
      { pitch: 67, startBeat: 1.5, duration: 0.25, velocity: 85 },
      { pitch: 70, startBeat: 1.5, duration: 0.25, velocity: 85 },
      { pitch: 63, startBeat: 2.5, duration: 0.5, velocity: 110 },
      { pitch: 67, startBeat: 2.5, duration: 0.5, velocity: 100 },
      { pitch: 70, startBeat: 2.5, duration: 0.5, velocity: 100 },
      { pitch: 74, startBeat: 2.5, duration: 0.5, velocity: 95 },
      { pitch: 63, startBeat: 3.5, duration: 0.25, velocity: 90 },
      { pitch: 67, startBeat: 3.5, duration: 0.25, velocity: 85 },
      // Bar 2 - Cm7 stabs
      { pitch: 60, startBeat: 4.5, duration: 0.5, velocity: 110 }, // C4
      { pitch: 63, startBeat: 4.5, duration: 0.5, velocity: 100 }, // Eb4
      { pitch: 67, startBeat: 4.5, duration: 0.5, velocity: 100 }, // G4
      { pitch: 70, startBeat: 4.5, duration: 0.5, velocity: 95 }, // Bb4
      { pitch: 60, startBeat: 5.5, duration: 0.25, velocity: 90 },
      { pitch: 63, startBeat: 5.5, duration: 0.25, velocity: 85 },
      { pitch: 67, startBeat: 5.5, duration: 0.25, velocity: 85 },
      { pitch: 60, startBeat: 6.5, duration: 0.5, velocity: 110 },
      { pitch: 63, startBeat: 6.5, duration: 0.5, velocity: 100 },
      { pitch: 67, startBeat: 6.5, duration: 0.5, velocity: 100 },
      { pitch: 70, startBeat: 6.5, duration: 0.5, velocity: 95 },
      { pitch: 60, startBeat: 7.5, duration: 0.5, velocity: 100 },
      { pitch: 63, startBeat: 7.5, duration: 0.5, velocity: 95 },
      { pitch: 67, startBeat: 7.5, duration: 0.5, velocity: 95 },
    ],
    tags: ["future-bass", "chords", "stabs", "melodic", "electronic"],
    genre: "Electronic",
    difficulty: "intermediate",
    relatedTemplates: ["edm-supersaw-lead", "dubstep-wobble-bass"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "progressive-house-pluck",
    slug: "progressive-house-pluck",
    name: "Progressive House Pluck",
    type: "melody",
    description: "Melodic pluck pattern for progressive house breakdowns.",
    longDescription:
      "A memorable pluck melody designed for progressive house breakdowns and builds. Features emotional intervals and building phrases that work perfectly over 4-chord progressions.",
    bpm: 126,
    bars: 4,
    timeSignature: [4, 4],
    key: "D",
    scaleType: "minor",
    laneSettings: {
      instrumentId: "synth-pluck",
      noteMode: "sustain",
      velocityDefault: 90,
      quantizeGrid: "1/8",
      color: "#3b82f6",
    },
    notes: [
      // Bar 1
      { pitch: 62, startBeat: 0, duration: 0.5, velocity: 95 }, // D4
      { pitch: 65, startBeat: 0.5, duration: 0.5, velocity: 85 }, // F4
      { pitch: 69, startBeat: 1, duration: 1.5, velocity: 100 }, // A4
      { pitch: 67, startBeat: 2.5, duration: 0.5, velocity: 85 }, // G4
      { pitch: 65, startBeat: 3, duration: 1, velocity: 90 },
      // Bar 2
      { pitch: 62, startBeat: 4, duration: 0.5, velocity: 95 },
      { pitch: 65, startBeat: 4.5, duration: 0.5, velocity: 85 },
      { pitch: 67, startBeat: 5, duration: 1, velocity: 95 },
      { pitch: 69, startBeat: 6, duration: 0.5, velocity: 90 },
      { pitch: 67, startBeat: 6.5, duration: 0.5, velocity: 85 },
      { pitch: 65, startBeat: 7, duration: 1, velocity: 95 },
      // Bar 3
      { pitch: 67, startBeat: 8, duration: 0.5, velocity: 95 },
      { pitch: 69, startBeat: 8.5, duration: 0.5, velocity: 90 },
      { pitch: 72, startBeat: 9, duration: 1.5, velocity: 105 }, // D5
      { pitch: 74, startBeat: 10.5, duration: 0.5, velocity: 95 }, // E5
      { pitch: 72, startBeat: 11, duration: 1, velocity: 100 },
      // Bar 4 - Resolution
      { pitch: 69, startBeat: 12, duration: 1, velocity: 100 },
      { pitch: 67, startBeat: 13, duration: 1, velocity: 95 },
      { pitch: 62, startBeat: 14, duration: 2, velocity: 105 },
    ],
    tags: ["progressive-house", "pluck", "melodic", "breakdown", "electronic"],
    genre: "Electronic",
    difficulty: "intermediate",
    relatedTemplates: ["trance-arpeggio", "edm-supersaw-lead"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  // ============================================
  // Basic / Educational Templates
  // ============================================
  {
    id: "simple-c-major-scale",
    slug: "simple-c-major-scale",
    name: "C Major Scale",
    type: "melody",
    description: "Ascending C major scale for practicing and learning.",
    longDescription:
      "A simple ascending C major scale from C4 to C5. Perfect for beginners learning note placement, understanding the major scale intervals, or as a starting point for melodic development.",
    bpm: 100,
    bars: 2,
    timeSignature: [4, 4],
    key: "C",
    scaleType: "major",
    laneSettings: {
      instrumentId: "soft-grand-piano",
      noteMode: "sustain",
      velocityDefault: 80,
      quantizeGrid: "1/4",
      color: "#4a9eff",
    },
    notes: [
      { pitch: 60, startBeat: 0, duration: 1, velocity: 80 }, // C4
      { pitch: 62, startBeat: 1, duration: 1, velocity: 80 }, // D4
      { pitch: 64, startBeat: 2, duration: 1, velocity: 80 }, // E4
      { pitch: 65, startBeat: 3, duration: 1, velocity: 80 }, // F4
      { pitch: 67, startBeat: 4, duration: 1, velocity: 80 }, // G4
      { pitch: 69, startBeat: 5, duration: 1, velocity: 80 }, // A4
      { pitch: 71, startBeat: 6, duration: 1, velocity: 80 }, // B4
      { pitch: 72, startBeat: 7, duration: 1, velocity: 85 }, // C5
    ],
    tags: ["scale", "major", "beginner", "c-major", "piano", "educational"],
    genre: "Educational",
    difficulty: "beginner",
    relatedTemplates: ["simple-arpeggio", "pop-melody-hook"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "simple-arpeggio",
    slug: "simple-arpeggio",
    name: "Simple Arpeggio",
    type: "melody",
    description: "Basic C major arpeggio pattern for chord-based melodies.",
    longDescription:
      "A gentle arpeggiated pattern using the notes of a C major chord. This template demonstrates how chord tones can create flowing melodic motion, perfect for ambient pads, intro sections, or as accompaniment.",
    bpm: 90,
    bars: 2,
    timeSignature: [4, 4],
    key: "C",
    scaleType: "major",
    laneSettings: {
      instrumentId: "soft-grand-piano",
      noteMode: "sustain",
      velocityDefault: 70,
      quantizeGrid: "1/8",
      color: "#81c784",
    },
    notes: [
      // Bar 1 - C major arpeggio
      { pitch: 48, startBeat: 0, duration: 0.5, velocity: 70 }, // C3
      { pitch: 52, startBeat: 0.5, duration: 0.5, velocity: 65 }, // E3
      { pitch: 55, startBeat: 1, duration: 0.5, velocity: 65 }, // G3
      { pitch: 60, startBeat: 1.5, duration: 0.5, velocity: 75 }, // C4
      { pitch: 55, startBeat: 2, duration: 0.5, velocity: 65 },
      { pitch: 52, startBeat: 2.5, duration: 0.5, velocity: 65 },
      { pitch: 48, startBeat: 3, duration: 0.5, velocity: 70 },
      { pitch: 52, startBeat: 3.5, duration: 0.5, velocity: 65 },
      // Bar 2
      { pitch: 55, startBeat: 4, duration: 0.5, velocity: 65 },
      { pitch: 60, startBeat: 4.5, duration: 0.5, velocity: 75 },
      { pitch: 64, startBeat: 5, duration: 0.5, velocity: 70 }, // E4
      { pitch: 60, startBeat: 5.5, duration: 0.5, velocity: 75 },
      { pitch: 55, startBeat: 6, duration: 0.5, velocity: 65 },
      { pitch: 52, startBeat: 6.5, duration: 0.5, velocity: 65 },
      { pitch: 48, startBeat: 7, duration: 1, velocity: 80 },
    ],
    tags: ["arpeggio", "chord", "piano", "ambient", "beginner", "educational"],
    genre: "Ambient",
    difficulty: "beginner",
    relatedTemplates: ["simple-c-major-scale", "trance-arpeggio"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
];

