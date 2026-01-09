/**
 * Chord Templates
 * Built-in chord progression patterns for various genres
 */

import type { BuiltInTemplate } from "./types";

export const chordTemplates: BuiltInTemplate[] = [
  // ============================================
  // EDM / Electronic Chord Progressions
  // ============================================
  {
    id: "edm-anthem-progression",
    slug: "edm-anthem-progression",
    name: "EDM Anthem Progression",
    type: "chord",
    description: "Epic festival anthem chord progression (vi-IV-I-V).",
    longDescription:
      "The classic EDM festival progression that powers countless anthems. Starting from the minor vi gives emotional depth, while the IV-I-V creates an uplifting resolution. Perfect for big room, trance, and progressive house.",
    bpm: 128,
    bars: 4,
    timeSignature: [4, 4],
    key: "C",
    scaleType: "major",
    laneSettings: {
      instrumentId: "synth-pad",
      noteMode: "sustain",
      velocityDefault: 80,
      quantizeGrid: "1/4",
      color: "#a855f7",
    },
    notes: [
      // Bar 1 - Am (vi)
      { pitch: 45, startBeat: 0, duration: 4, velocity: 85 }, // A2
      { pitch: 48, startBeat: 0, duration: 4, velocity: 75 }, // C3
      { pitch: 52, startBeat: 0, duration: 4, velocity: 75 }, // E3
      // Bar 2 - F (IV)
      { pitch: 41, startBeat: 4, duration: 4, velocity: 85 }, // F2
      { pitch: 45, startBeat: 4, duration: 4, velocity: 75 }, // A2
      { pitch: 48, startBeat: 4, duration: 4, velocity: 75 }, // C3
      // Bar 3 - C (I)
      { pitch: 48, startBeat: 8, duration: 4, velocity: 90 }, // C3
      { pitch: 52, startBeat: 8, duration: 4, velocity: 80 }, // E3
      { pitch: 55, startBeat: 8, duration: 4, velocity: 80 }, // G3
      // Bar 4 - G (V)
      { pitch: 43, startBeat: 12, duration: 4, velocity: 85 }, // G2
      { pitch: 47, startBeat: 12, duration: 4, velocity: 75 }, // B2
      { pitch: 50, startBeat: 12, duration: 4, velocity: 75 }, // D3
    ],
    tags: ["edm", "anthem", "festival", "progression", "uplifting", "electronic"],
    genre: "Electronic",
    difficulty: "beginner",
    relatedTemplates: ["future-bass-progression", "trance-progression"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "future-bass-progression",
    slug: "future-bass-progression",
    name: "Future Bass Progression",
    type: "chord",
    description: "Emotional future bass chords with 7th and 9th extensions.",
    longDescription:
      "A lush chord progression with extended voicings typical of future bass and melodic dubstep. The 7th and 9th chord extensions create that modern, emotional sound.",
    bpm: 150,
    bars: 4,
    timeSignature: [4, 4],
    key: "Eb",
    scaleType: "major",
    laneSettings: {
      instrumentId: "synth-chord",
      noteMode: "sustain",
      velocityDefault: 85,
      quantizeGrid: "1/4",
      color: "#ec4899",
    },
    notes: [
      // Bar 1 - Ebmaj9
      { pitch: 51, startBeat: 0, duration: 4, velocity: 85 }, // Eb3
      { pitch: 55, startBeat: 0, duration: 4, velocity: 75 }, // G3
      { pitch: 58, startBeat: 0, duration: 4, velocity: 75 }, // Bb3
      { pitch: 62, startBeat: 0, duration: 4, velocity: 70 }, // D4
      { pitch: 65, startBeat: 0, duration: 4, velocity: 65 }, // F4 (9th)
      // Bar 2 - Cm7
      { pitch: 48, startBeat: 4, duration: 4, velocity: 85 }, // C3
      { pitch: 51, startBeat: 4, duration: 4, velocity: 75 }, // Eb3
      { pitch: 55, startBeat: 4, duration: 4, velocity: 75 }, // G3
      { pitch: 58, startBeat: 4, duration: 4, velocity: 70 }, // Bb3
      // Bar 3 - Fm7
      { pitch: 53, startBeat: 8, duration: 4, velocity: 85 }, // F3
      { pitch: 56, startBeat: 8, duration: 4, velocity: 75 }, // Ab3
      { pitch: 60, startBeat: 8, duration: 4, velocity: 75 }, // C4
      { pitch: 63, startBeat: 8, duration: 4, velocity: 70 }, // Eb4
      // Bar 4 - Bb
      { pitch: 46, startBeat: 12, duration: 4, velocity: 85 }, // Bb2
      { pitch: 50, startBeat: 12, duration: 4, velocity: 75 }, // D3
      { pitch: 53, startBeat: 12, duration: 4, velocity: 75 }, // F3
    ],
    tags: ["future-bass", "emotional", "7th-chords", "melodic", "electronic"],
    genre: "Electronic",
    difficulty: "intermediate",
    relatedTemplates: ["edm-anthem-progression", "lofi-progression"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "trance-progression",
    slug: "trance-progression",
    name: "Trance Progression",
    type: "chord",
    description: "Uplifting trance chord progression with building energy.",
    longDescription:
      "A classic trance chord progression that builds emotional tension and release. The progression moves through minor and major chords creating that signature trance euphoria.",
    bpm: 138,
    bars: 4,
    timeSignature: [4, 4],
    key: "A",
    scaleType: "minor",
    laneSettings: {
      instrumentId: "synth-pad",
      noteMode: "sustain",
      velocityDefault: 80,
      quantizeGrid: "1/4",
      color: "#06b6d4",
    },
    notes: [
      // Bar 1 - Am
      { pitch: 45, startBeat: 0, duration: 4, velocity: 80 }, // A2
      { pitch: 48, startBeat: 0, duration: 4, velocity: 75 }, // C3
      { pitch: 52, startBeat: 0, duration: 4, velocity: 75 }, // E3
      // Bar 2 - F
      { pitch: 41, startBeat: 4, duration: 4, velocity: 80 }, // F2
      { pitch: 45, startBeat: 4, duration: 4, velocity: 75 }, // A2
      { pitch: 48, startBeat: 4, duration: 4, velocity: 75 }, // C3
      // Bar 3 - G
      { pitch: 43, startBeat: 8, duration: 4, velocity: 85 }, // G2
      { pitch: 47, startBeat: 8, duration: 4, velocity: 75 }, // B2
      { pitch: 50, startBeat: 8, duration: 4, velocity: 75 }, // D3
      // Bar 4 - Em
      { pitch: 40, startBeat: 12, duration: 4, velocity: 80 }, // E2
      { pitch: 43, startBeat: 12, duration: 4, velocity: 75 }, // G2
      { pitch: 47, startBeat: 12, duration: 4, velocity: 75 }, // B2
    ],
    tags: ["trance", "uplifting", "euphoric", "progression", "electronic"],
    genre: "Electronic",
    difficulty: "beginner",
    relatedTemplates: ["edm-anthem-progression", "progressive-house-chords"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "progressive-house-chords",
    slug: "progressive-house-chords",
    name: "Progressive House Chords",
    type: "chord",
    description: "Driving progressive house chord rhythm with movement.",
    longDescription:
      "A rhythmic chord pattern designed for progressive house with stabs and sustained pads. The eighth-note rhythm creates forward momentum while maintaining harmonic depth.",
    bpm: 126,
    bars: 4,
    timeSignature: [4, 4],
    key: "D",
    scaleType: "minor",
    laneSettings: {
      instrumentId: "synth-pad",
      noteMode: "sustain",
      velocityDefault: 85,
      quantizeGrid: "1/8",
      color: "#3b82f6",
    },
    notes: [
      // Bar 1 - Dm
      { pitch: 50, startBeat: 0, duration: 2, velocity: 90 }, // D3
      { pitch: 53, startBeat: 0, duration: 2, velocity: 80 }, // F3
      { pitch: 57, startBeat: 0, duration: 2, velocity: 80 }, // A3
      { pitch: 50, startBeat: 2.5, duration: 1.5, velocity: 85 },
      { pitch: 53, startBeat: 2.5, duration: 1.5, velocity: 75 },
      { pitch: 57, startBeat: 2.5, duration: 1.5, velocity: 75 },
      // Bar 2 - Bb
      { pitch: 46, startBeat: 4, duration: 2, velocity: 90 }, // Bb2
      { pitch: 50, startBeat: 4, duration: 2, velocity: 80 }, // D3
      { pitch: 53, startBeat: 4, duration: 2, velocity: 80 }, // F3
      { pitch: 46, startBeat: 6.5, duration: 1.5, velocity: 85 },
      { pitch: 50, startBeat: 6.5, duration: 1.5, velocity: 75 },
      { pitch: 53, startBeat: 6.5, duration: 1.5, velocity: 75 },
      // Bar 3 - F
      { pitch: 41, startBeat: 8, duration: 2, velocity: 90 }, // F2
      { pitch: 45, startBeat: 8, duration: 2, velocity: 80 }, // A2
      { pitch: 48, startBeat: 8, duration: 2, velocity: 80 }, // C3
      { pitch: 41, startBeat: 10.5, duration: 1.5, velocity: 85 },
      { pitch: 45, startBeat: 10.5, duration: 1.5, velocity: 75 },
      { pitch: 48, startBeat: 10.5, duration: 1.5, velocity: 75 },
      // Bar 4 - C
      { pitch: 48, startBeat: 12, duration: 2, velocity: 90 }, // C3
      { pitch: 52, startBeat: 12, duration: 2, velocity: 80 }, // E3
      { pitch: 55, startBeat: 12, duration: 2, velocity: 80 }, // G3
      { pitch: 48, startBeat: 14.5, duration: 1.5, velocity: 85 },
      { pitch: 52, startBeat: 14.5, duration: 1.5, velocity: 75 },
      { pitch: 55, startBeat: 14.5, duration: 1.5, velocity: 75 },
    ],
    tags: ["progressive-house", "chords", "rhythmic", "dance", "electronic"],
    genre: "Electronic",
    difficulty: "intermediate",
    relatedTemplates: ["trance-progression", "deep-house-chords"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  // ============================================
  // Classic Pop/Jazz Progressions
  // ============================================
  {
    id: "i-v-vi-iv-progression",
    slug: "i-v-vi-iv-progression",
    name: "I-V-vi-IV Progression",
    type: "chord",
    description: "The most popular chord progression in pop music.",
    longDescription:
      "This iconic progression (I-V-vi-IV) has powered countless hit songs from \"Let It Be\" to \"Someone Like You\". Each chord lasts one bar, creating a satisfying cycle of tension and release that works in virtually any genre.",
    bpm: 120,
    bars: 4,
    timeSignature: [4, 4],
    key: "C",
    scaleType: "major",
    laneSettings: {
      instrumentId: "soft-grand-piano",
      noteMode: "sustain",
      velocityDefault: 75,
      quantizeGrid: "1/4",
      color: "#e91e63",
    },
    notes: [
      // Bar 1 - C major (I)
      { pitch: 48, startBeat: 0, duration: 4, velocity: 80 }, // C3
      { pitch: 52, startBeat: 0, duration: 4, velocity: 75 }, // E3
      { pitch: 55, startBeat: 0, duration: 4, velocity: 75 }, // G3
      // Bar 2 - G major (V)
      { pitch: 43, startBeat: 4, duration: 4, velocity: 80 }, // G2
      { pitch: 47, startBeat: 4, duration: 4, velocity: 75 }, // B2
      { pitch: 50, startBeat: 4, duration: 4, velocity: 75 }, // D3
      // Bar 3 - A minor (vi)
      { pitch: 45, startBeat: 8, duration: 4, velocity: 80 }, // A2
      { pitch: 48, startBeat: 8, duration: 4, velocity: 75 }, // C3
      { pitch: 52, startBeat: 8, duration: 4, velocity: 75 }, // E3
      // Bar 4 - F major (IV)
      { pitch: 41, startBeat: 12, duration: 4, velocity: 80 }, // F2
      { pitch: 45, startBeat: 12, duration: 4, velocity: 75 }, // A2
      { pitch: 48, startBeat: 12, duration: 4, velocity: 75 }, // C3
    ],
    tags: ["pop", "progression", "classic", "major", "hit"],
    genre: "Pop",
    difficulty: "beginner",
    relatedTemplates: ["sad-minor-progression", "edm-anthem-progression"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "sad-minor-progression",
    slug: "sad-minor-progression",
    name: "Sad Minor Progression",
    type: "chord",
    description: "Emotional minor key progression for ballads and sad songs.",
    longDescription:
      "A melancholic progression in A minor (i-VI-III-VII) that evokes deep emotion and introspection. Perfect for ballads, film scores, or any production needing an emotional undertone.",
    bpm: 72,
    bars: 4,
    timeSignature: [4, 4],
    key: "Am",
    scaleType: "minor",
    laneSettings: {
      instrumentId: "soft-grand-piano",
      noteMode: "sustain",
      velocityDefault: 70,
      quantizeGrid: "1/4",
      color: "#5c6bc0",
    },
    notes: [
      // Bar 1 - A minor (i)
      { pitch: 45, startBeat: 0, duration: 4, velocity: 75 },
      { pitch: 48, startBeat: 0, duration: 4, velocity: 70 },
      { pitch: 52, startBeat: 0, duration: 4, velocity: 70 },
      // Bar 2 - F major (VI)
      { pitch: 41, startBeat: 4, duration: 4, velocity: 75 },
      { pitch: 45, startBeat: 4, duration: 4, velocity: 70 },
      { pitch: 48, startBeat: 4, duration: 4, velocity: 70 },
      // Bar 3 - C major (III)
      { pitch: 48, startBeat: 8, duration: 4, velocity: 75 },
      { pitch: 52, startBeat: 8, duration: 4, velocity: 70 },
      { pitch: 55, startBeat: 8, duration: 4, velocity: 70 },
      // Bar 4 - G major (VII)
      { pitch: 43, startBeat: 12, duration: 4, velocity: 75 },
      { pitch: 47, startBeat: 12, duration: 4, velocity: 70 },
      { pitch: 50, startBeat: 12, duration: 4, velocity: 70 },
    ],
    tags: ["minor", "sad", "emotional", "ballad", "cinematic"],
    genre: "Ballad",
    difficulty: "beginner",
    relatedTemplates: ["i-v-vi-iv-progression", "future-bass-progression"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "jazz-ii-v-i",
    slug: "jazz-ii-v-i",
    name: "Jazz ii-V-I",
    type: "chord",
    description: "The essential jazz chord progression with seventh chords.",
    longDescription:
      "The ii-V-I progression is the backbone of jazz harmony. This template uses seventh chords (Dm7-G7-Cmaj7) for authentic jazz voicings. Essential for jazz standards, smooth jazz, and sophisticated pop productions.",
    bpm: 110,
    bars: 4,
    timeSignature: [4, 4],
    key: "C",
    scaleType: "major",
    laneSettings: {
      instrumentId: "soft-grand-piano",
      noteMode: "sustain",
      velocityDefault: 70,
      quantizeGrid: "1/4",
      color: "#795548",
    },
    notes: [
      // Bar 1-2 - Dm7 (ii)
      { pitch: 50, startBeat: 0, duration: 8, velocity: 70 }, // D3
      { pitch: 53, startBeat: 0, duration: 8, velocity: 65 }, // F3
      { pitch: 57, startBeat: 0, duration: 8, velocity: 65 }, // A3
      { pitch: 60, startBeat: 0, duration: 8, velocity: 65 }, // C4
      // Bar 3 - G7 (V)
      { pitch: 43, startBeat: 8, duration: 4, velocity: 75 }, // G2
      { pitch: 47, startBeat: 8, duration: 4, velocity: 65 }, // B2
      { pitch: 53, startBeat: 8, duration: 4, velocity: 65 }, // F3
      { pitch: 55, startBeat: 8, duration: 4, velocity: 65 }, // G3
      // Bar 4 - Cmaj7 (I)
      { pitch: 48, startBeat: 12, duration: 4, velocity: 75 }, // C3
      { pitch: 52, startBeat: 12, duration: 4, velocity: 65 }, // E3
      { pitch: 55, startBeat: 12, duration: 4, velocity: 65 }, // G3
      { pitch: 59, startBeat: 12, duration: 4, velocity: 65 }, // B3
    ],
    tags: ["jazz", "ii-v-i", "seventh-chords", "sophisticated", "harmony"],
    genre: "Jazz",
    difficulty: "intermediate",
    relatedTemplates: ["i-v-vi-iv-progression", "lofi-progression"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
  {
    id: "lofi-progression",
    slug: "lofi-progression",
    name: "Lo-Fi Hip-Hop Progression",
    type: "chord",
    description: "Chill lo-fi hip-hop chords with jazzy extensions.",
    longDescription:
      "A relaxed chord progression perfect for lo-fi hip-hop and chill beats. Features 7th and 9th chords with a slow, contemplative feel typical of the genre.",
    bpm: 85,
    bars: 4,
    timeSignature: [4, 4],
    key: "G",
    scaleType: "major",
    laneSettings: {
      instrumentId: "soft-grand-piano",
      noteMode: "sustain",
      velocityDefault: 65,
      quantizeGrid: "1/4",
      color: "#f59e0b",
    },
    notes: [
      // Bar 1 - Gmaj7
      { pitch: 43, startBeat: 0, duration: 4, velocity: 70 }, // G2
      { pitch: 47, startBeat: 0, duration: 4, velocity: 60 }, // B2
      { pitch: 50, startBeat: 0, duration: 4, velocity: 60 }, // D3
      { pitch: 54, startBeat: 0, duration: 4, velocity: 55 }, // F#3
      // Bar 2 - Em7
      { pitch: 40, startBeat: 4, duration: 4, velocity: 70 }, // E2
      { pitch: 43, startBeat: 4, duration: 4, velocity: 60 }, // G2
      { pitch: 47, startBeat: 4, duration: 4, velocity: 60 }, // B2
      { pitch: 50, startBeat: 4, duration: 4, velocity: 55 }, // D3
      // Bar 3 - Cmaj9
      { pitch: 36, startBeat: 8, duration: 4, velocity: 70 }, // C2
      { pitch: 40, startBeat: 8, duration: 4, velocity: 60 }, // E2
      { pitch: 43, startBeat: 8, duration: 4, velocity: 60 }, // G2
      { pitch: 47, startBeat: 8, duration: 4, velocity: 55 }, // B2
      { pitch: 50, startBeat: 8, duration: 4, velocity: 50 }, // D3 (9th)
      // Bar 4 - D7
      { pitch: 38, startBeat: 12, duration: 4, velocity: 70 }, // D2
      { pitch: 42, startBeat: 12, duration: 4, velocity: 60 }, // F#2
      { pitch: 45, startBeat: 12, duration: 4, velocity: 60 }, // A2
      { pitch: 48, startBeat: 12, duration: 4, velocity: 55 }, // C3
    ],
    tags: ["lofi", "hip-hop", "chill", "jazzy", "relaxed"],
    genre: "Lo-Fi",
    difficulty: "intermediate",
    relatedTemplates: ["jazz-ii-v-i", "future-bass-progression"],
    createdAt: "2024-01-01T00:00:00Z",
    author: "Passion OS",
  },
];

