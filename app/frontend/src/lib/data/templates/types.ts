/**
 * Template Types
 * Core types for built-in music templates
 */

export type LaneTemplateType = "melody" | "drums" | "chord";

export type NoteMode = "sustain" | "oneShot";

export type QuantizeGrid = "1/4" | "1/8" | "1/16" | "1/32" | "off";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface TemplateNote {
  pitch: number;
  startBeat: number;
  duration: number;
  velocity: number;
}

export interface LaneSettings {
  instrumentId: string;
  noteMode: NoteMode;
  velocityDefault: number;
  quantizeGrid: QuantizeGrid;
  color: string;
}

export interface BuiltInTemplate {
  id: string;
  slug: string;
  name: string;
  type: LaneTemplateType;
  description: string;
  longDescription?: string;

  // Musical metadata
  bpm: number;
  bars: number;
  timeSignature: [number, number];
  key: string;
  scaleType: string;

  // Settings
  laneSettings: LaneSettings;

  // Notes
  notes: TemplateNote[];

  // SEO and Organization
  tags: string[];
  genre: string;
  difficulty: Difficulty;
  relatedTemplates?: string[];

  // Metadata
  createdAt: string;
  author: string;
}

