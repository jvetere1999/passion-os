/**
 * Arrange Types
 * Core types for the arrangement/sequencer view
 */

export type LaneType = "melody" | "drums" | "chord";

export type NoteMode = "sustain" | "oneShot";

export interface MelodyNote {
  id: string;
  pitch: number;
  startBeat: number;
  duration: number;
  velocity: number;
}

export interface Lane {
  id: string;
  name: string;
  type: LaneType;
  notes: MelodyNote[];
  muted: boolean;
  solo: boolean;
  color: string;
  noteMode?: NoteMode;
}

export interface Scale {
  root: number;
  mode: string;
}

export interface HumanizeSettings {
  timing: number;
  velocity: number;
  enabled: boolean;
}

export interface Arrangement {
  id: string;
  name: string;
  bpm: number;
  bars: number;
  timeSignature: [number, number];
  key: string;
  scale: Scale;
  lanes: Lane[];
  humanize: HumanizeSettings;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new empty arrangement
 */
export function createArrangement(name: string): Arrangement {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    bpm: 120,
    bars: 4,
    timeSignature: [4, 4],
    key: "C",
    scale: { root: 60, mode: "major" },
    lanes: [createLane("drums", "Drums")],
    humanize: { timing: 0, velocity: 0, enabled: false },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new lane
 */
export function createLane(
  type: LaneType,
  name?: string
): Lane {
  const colors: Record<LaneType, string> = {
    melody: "#4CAF50",
    drums: "#FF9800",
    chord: "#2196F3",
  };

  const defaultNames: Record<LaneType, string> = {
    melody: "Melody",
    drums: "Drums",
    chord: "Chords",
  };

  return {
    id: crypto.randomUUID(),
    name: name || defaultNames[type],
    type,
    notes: [],
    muted: false,
    solo: false,
    color: colors[type],
    noteMode: type === "drums" ? "oneShot" : "sustain",
  };
}

/**
 * Add a lane to arrangement
 */
export function addLane(
  arrangement: Arrangement,
  type: LaneType
): Arrangement {
  const lane = createLane(type);
  return {
    ...arrangement,
    lanes: [...arrangement.lanes, lane],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Remove a lane from arrangement
 */
export function removeLane(
  arrangement: Arrangement,
  laneId: string
): Arrangement {
  return {
    ...arrangement,
    lanes: arrangement.lanes.filter((l) => l.id !== laneId),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Update a lane
 */
export function updateLane(
  arrangement: Arrangement,
  laneId: string,
  updates: Partial<Lane>
): Arrangement {
  return {
    ...arrangement,
    lanes: arrangement.lanes.map((l) =>
      l.id === laneId ? { ...l, ...updates } : l
    ),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Add a note to a lane
 */
export function addNote(
  arrangement: Arrangement,
  laneId: string,
  note: Omit<MelodyNote, "id">
): Arrangement {
  const newNote: MelodyNote = {
    ...note,
    id: crypto.randomUUID(),
  };

  return updateLane(arrangement, laneId, {
    notes: [
      ...(arrangement.lanes.find((l) => l.id === laneId)?.notes || []),
      newNote,
    ],
  });
}

/**
 * Remove a note from a lane
 */
export function removeNote(
  arrangement: Arrangement,
  laneId: string,
  noteId: string
): Arrangement {
  const lane = arrangement.lanes.find((l) => l.id === laneId);
  if (!lane) return arrangement;

  return updateLane(arrangement, laneId, {
    notes: lane.notes.filter((n) => n.id !== noteId),
  });
}

/**
 * MIDI note name from pitch number
 */
export function pitchToNoteName(pitch: number): string {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const octave = Math.floor(pitch / 12) - 1;
  const noteName = notes[pitch % 12];
  return `${noteName}${octave}`;
}

/**
 * Pitch number from MIDI note name
 */
export function noteNameToPitch(name: string): number {
  const notes: Record<string, number> = {
    C: 0, "C#": 1, Db: 1,
    D: 2, "D#": 3, Eb: 3,
    E: 4,
    F: 5, "F#": 6, Gb: 6,
    G: 7, "G#": 8, Ab: 8,
    A: 9, "A#": 10, Bb: 10,
    B: 11,
  };

  const match = name.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) return 60;

  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  return (octave + 1) * 12 + (notes[note] || 0);
}

