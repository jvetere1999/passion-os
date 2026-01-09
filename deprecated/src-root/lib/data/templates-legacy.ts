/**
 * Templates Data
 * Static data for music production templates
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: "drums" | "melody" | "chords";
  tags: string[];
  bpm?: number;
  timeSignature?: string;
  bars?: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  preview?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): TemplateCategory[] {
  return [
    {
      id: "drums",
      name: "Drum Patterns",
      description: "Rhythm and percussion templates",
      icon: "drums",
      count: getDrumTemplates().length,
    },
    {
      id: "melody",
      name: "Melodies",
      description: "Lead and melodic templates",
      icon: "music",
      count: getMelodyTemplates().length,
    },
    {
      id: "chords",
      name: "Chord Progressions",
      description: "Harmonic templates and progressions",
      icon: "piano",
      count: getChordTemplates().length,
    },
  ];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: "drums" | "melody" | "chords"
): Template[] {
  switch (category) {
    case "drums":
      return getDrumTemplates();
    case "melody":
      return getMelodyTemplates();
    case "chords":
      return getChordTemplates();
    default:
      return [];
  }
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): Template | null {
  const allTemplates = [
    ...getDrumTemplates(),
    ...getMelodyTemplates(),
    ...getChordTemplates(),
  ];
  return allTemplates.find((t) => t.id === id) || null;
}

function getDrumTemplates(): Template[] {
  return [
    {
      id: "drums-basic-rock",
      name: "Basic Rock Beat",
      description: "Classic rock drum pattern with kick, snare, and hi-hat",
      category: "drums",
      tags: ["rock", "basic", "4/4"],
      bpm: 120,
      timeSignature: "4/4",
      bars: 4,
      difficulty: "beginner",
    },
    {
      id: "drums-funk-groove",
      name: "Funk Groove",
      description: "Syncopated funk pattern with ghost notes",
      category: "drums",
      tags: ["funk", "groove", "syncopated"],
      bpm: 100,
      timeSignature: "4/4",
      bars: 4,
      difficulty: "intermediate",
    },
    {
      id: "drums-hip-hop",
      name: "Hip Hop Beat",
      description: "Modern hip hop drum pattern",
      category: "drums",
      tags: ["hip-hop", "trap", "modern"],
      bpm: 90,
      timeSignature: "4/4",
      bars: 4,
      difficulty: "beginner",
    },
    {
      id: "drums-edm-four",
      name: "EDM Four-on-Floor",
      description: "Classic EDM kick pattern with builds",
      category: "drums",
      tags: ["edm", "house", "electronic"],
      bpm: 128,
      timeSignature: "4/4",
      bars: 8,
      difficulty: "beginner",
    },
    {
      id: "drums-jazz-swing",
      name: "Jazz Swing",
      description: "Traditional jazz swing pattern",
      category: "drums",
      tags: ["jazz", "swing", "brushes"],
      bpm: 140,
      timeSignature: "4/4",
      bars: 4,
      difficulty: "advanced",
    },
    {
      id: "drums-breakbeat",
      name: "Breakbeat",
      description: "Classic breakbeat pattern",
      category: "drums",
      tags: ["breakbeat", "dnb", "breaks"],
      bpm: 170,
      timeSignature: "4/4",
      bars: 4,
      difficulty: "intermediate",
    },
  ];
}

function getMelodyTemplates(): Template[] {
  return [
    {
      id: "melody-pop-hook",
      name: "Pop Hook",
      description: "Catchy pop melody hook pattern",
      category: "melody",
      tags: ["pop", "hook", "catchy"],
      bpm: 120,
      timeSignature: "4/4",
      bars: 8,
      difficulty: "beginner",
    },
    {
      id: "melody-edm-lead",
      name: "EDM Lead",
      description: "Energetic EDM lead melody",
      category: "melody",
      tags: ["edm", "lead", "synth"],
      bpm: 128,
      timeSignature: "4/4",
      bars: 8,
      difficulty: "intermediate",
    },
    {
      id: "melody-rnb-vocal",
      name: "R&B Vocal Line",
      description: "Smooth R&B style melody",
      category: "melody",
      tags: ["rnb", "soul", "smooth"],
      bpm: 85,
      timeSignature: "4/4",
      bars: 8,
      difficulty: "intermediate",
    },
    {
      id: "melody-ambient",
      name: "Ambient Pad",
      description: "Atmospheric ambient melody",
      category: "melody",
      tags: ["ambient", "atmospheric", "pad"],
      bpm: 70,
      timeSignature: "4/4",
      bars: 16,
      difficulty: "beginner",
    },
    {
      id: "melody-classical-motif",
      name: "Classical Motif",
      description: "Classical style melodic motif",
      category: "melody",
      tags: ["classical", "orchestral", "motif"],
      bpm: 100,
      timeSignature: "3/4",
      bars: 8,
      difficulty: "advanced",
    },
  ];
}

function getChordTemplates(): Template[] {
  return [
    {
      id: "chords-pop-progression",
      name: "Pop I-V-vi-IV",
      description: "The most common pop chord progression",
      category: "chords",
      tags: ["pop", "common", "major"],
      bpm: 120,
      timeSignature: "4/4",
      bars: 4,
      difficulty: "beginner",
    },
    {
      id: "chords-jazz-251",
      name: "Jazz ii-V-I",
      description: "Essential jazz chord progression",
      category: "chords",
      tags: ["jazz", "standard", "essential"],
      bpm: 120,
      timeSignature: "4/4",
      bars: 4,
      difficulty: "intermediate",
    },
    {
      id: "chords-sad-minor",
      name: "Sad Minor",
      description: "Emotional minor key progression",
      category: "chords",
      tags: ["minor", "emotional", "sad"],
      bpm: 80,
      timeSignature: "4/4",
      bars: 8,
      difficulty: "beginner",
    },
    {
      id: "chords-epic-cinematic",
      name: "Epic Cinematic",
      description: "Powerful cinematic chord progression",
      category: "chords",
      tags: ["cinematic", "epic", "film"],
      bpm: 90,
      timeSignature: "4/4",
      bars: 8,
      difficulty: "intermediate",
    },
    {
      id: "chords-neo-soul",
      name: "Neo Soul",
      description: "Rich neo-soul chord voicings",
      category: "chords",
      tags: ["neo-soul", "jazz", "rich"],
      bpm: 75,
      timeSignature: "4/4",
      bars: 4,
      difficulty: "advanced",
    },
    {
      id: "chords-lofi",
      name: "Lo-Fi Chill",
      description: "Relaxed lo-fi chord progression",
      category: "chords",
      tags: ["lofi", "chill", "relaxed"],
      bpm: 85,
      timeSignature: "4/4",
      bars: 8,
      difficulty: "beginner",
    },
  ];
}

/**
 * Search templates
 */
export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase();
  const allTemplates = [
    ...getDrumTemplates(),
    ...getMelodyTemplates(),
    ...getChordTemplates(),
  ];

  return allTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

