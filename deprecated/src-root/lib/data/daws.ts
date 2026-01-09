/**
 * DAW Data Module
 * Provides DAW information and shortcuts for hub pages
 * Uses real shortcuts data from shortcuts/ directory
 */

import {
  getShortcutsByProduct,
  getGroupsForProduct,
  type Shortcut as RealShortcut,
} from "./shortcuts/index";

export interface Shortcut {
  id: string;
  action: string;
  keys: string[];
  keysWin?: string[];
  category: string;
  description?: string;
  tags?: string[];
  context?: string;
}

export interface DAWData {
  id: string;
  name: string;
  color: string;
  version?: string;
  shortcuts: Shortcut[];
  categories: string[];
}

// Map simplified DAW IDs to product IDs
const reverseDawIdMap: Record<string, string> = {
  ableton: "ableton12suite",
  flstudio: "flstudio",
  logic: "logicpro",
  reason: "reasonrack",
};

/**
 * Get all available DAWs
 */
export function getDAWs(): Array<{ id: string; name: string; color: string }> {
  return [
    { id: "ableton", name: "Ableton Live 12", color: "#00D8FF" },
    { id: "logic", name: "Logic Pro", color: "#4A4A4A" },
    { id: "flstudio", name: "FL Studio", color: "#FF8C00" },
    { id: "reason", name: "Reason", color: "#E91E63" },
    { id: "reaper", name: "Reaper", color: "#228B22" },
    { id: "bitwig", name: "Bitwig Studio", color: "#FF6B35" },
    { id: "cubase", name: "Cubase", color: "#C9284D" },
    { id: "protools", name: "Pro Tools", color: "#7B68EE" },
    { id: "studio-one", name: "Studio One", color: "#2196F3" },
  ];
}

/**
 * Convert real shortcut to simplified format
 */
function convertShortcut(shortcut: RealShortcut): Shortcut {
  // Parse keys string into array (split on common separators)
  const keyString = shortcut.keys || "";
  const keys = keyString
    .replace(/\+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  // Parse Windows keys if available
  let keysWin: string[] | undefined;
  if (shortcut.keysWin) {
    keysWin = shortcut.keysWin
      .replace(/\+/g, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  return {
    id: shortcut.id,
    action: shortcut.command,
    keys: keys.length > 0 ? keys : [keyString],
    keysWin,
    category: shortcut.group || "General",
    description: shortcut.description,
    tags: shortcut.tags,
    context: shortcut.context,
  };
}

/**
 * Get DAW data by ID
 */
export function getDAWById(id: string): DAWData | null {
  const daws = getDAWs();
  const daw = daws.find((d) => d.id === id);
  if (!daw) return null;

  // Get the product ID for this DAW
  const productId = reverseDawIdMap[id];

  if (productId) {
    // Use real shortcuts data
    const realShortcuts = getShortcutsByProduct(productId);
    const categories = getGroupsForProduct(productId);

    return {
      ...daw,
      version: getDAWVersion(id),
      categories,
      shortcuts: realShortcuts.map(convertShortcut),
    };
  }

  // Fallback for DAWs without real data
  return {
    ...daw,
    version: getDAWVersion(id),
    categories: getCategories(),
    shortcuts: getShortcuts(id),
  };
}

function getDAWVersion(id: string): string {
  const versions: Record<string, string> = {
    ableton: "12",
    logic: "11",
    flstudio: "21",
    protools: "2024",
    reaper: "7",
    bitwig: "5",
    cubase: "13",
    "studio-one": "6",
    reason: "13",
  };
  return versions[id] || "Latest";
}

function getCategories(): string[] {
  return [
    "Transport",
    "Editing",
    "Navigation",
    "Mixing",
    "Recording",
    "View",
    "Tools",
    "Quantize",
    "Automation",
    "File",
  ];
}

// Comprehensive placeholder shortcuts for DAWs without full data
const placeholderShortcuts: Record<string, Shortcut[]> = {
  reaper: [
    { id: "reaper-play", action: "Play / Pause", keys: ["Space"], category: "Transport", description: "Toggle playback", tags: ["transport", "playback"] },
    { id: "reaper-stop", action: "Stop", keys: ["Cmd", "Space"], keysWin: ["Ctrl", "Space"], category: "Transport", description: "Stop and return to start", tags: ["transport"] },
    { id: "reaper-record", action: "Record", keys: ["R"], category: "Recording", description: "Toggle recording", tags: ["recording", "transport"] },
    { id: "reaper-undo", action: "Undo", keys: ["Cmd", "Z"], keysWin: ["Ctrl", "Z"], category: "Editing", description: "Undo last action", tags: ["editing", "history"] },
    { id: "reaper-redo", action: "Redo", keys: ["Cmd", "Shift", "Z"], keysWin: ["Ctrl", "Shift", "Z"], category: "Editing", description: "Redo last undone action", tags: ["editing", "history"] },
    { id: "reaper-save", action: "Save Project", keys: ["Cmd", "S"], keysWin: ["Ctrl", "S"], category: "File", description: "Save current project", tags: ["file", "save"] },
    { id: "reaper-cut", action: "Cut", keys: ["Cmd", "X"], keysWin: ["Ctrl", "X"], category: "Editing", description: "Cut selected items", tags: ["editing", "clipboard"] },
    { id: "reaper-copy", action: "Copy", keys: ["Cmd", "C"], keysWin: ["Ctrl", "C"], category: "Editing", description: "Copy selected items", tags: ["editing", "clipboard"] },
    { id: "reaper-paste", action: "Paste", keys: ["Cmd", "V"], keysWin: ["Ctrl", "V"], category: "Editing", description: "Paste items at cursor", tags: ["editing", "clipboard"] },
    { id: "reaper-delete", action: "Delete", keys: ["Delete"], category: "Editing", description: "Delete selected items", tags: ["editing"] },
    { id: "reaper-split", action: "Split at Cursor", keys: ["S"], category: "Editing", description: "Split items at edit cursor", tags: ["editing", "split"] },
    { id: "reaper-select-all", action: "Select All", keys: ["Cmd", "A"], keysWin: ["Ctrl", "A"], category: "Editing", description: "Select all items", tags: ["selection"] },
    { id: "reaper-zoom-in", action: "Zoom In", keys: ["+"], category: "Navigation", description: "Zoom in horizontally", tags: ["zoom", "view"] },
    { id: "reaper-zoom-out", action: "Zoom Out", keys: ["-"], category: "Navigation", description: "Zoom out horizontally", tags: ["zoom", "view"] },
    { id: "reaper-mixer", action: "Toggle Mixer", keys: ["Cmd", "M"], keysWin: ["Ctrl", "M"], category: "View", description: "Show/hide mixer window", tags: ["view", "mixer"] },
    { id: "reaper-fx", action: "Show FX Chain", keys: ["F"], category: "Mixing", description: "Open FX chain for selected track", context: "Track selected", tags: ["fx", "mixing"] },
    { id: "reaper-loop", action: "Toggle Loop", keys: ["L"], category: "Transport", description: "Toggle loop playback", tags: ["transport", "loop"] },
    { id: "reaper-metronome", action: "Toggle Metronome", keys: ["Cmd", "Shift", "M"], keysWin: ["Ctrl", "Shift", "M"], category: "Transport", description: "Enable/disable click", tags: ["metronome", "transport"] },
    { id: "reaper-actions", action: "Actions List", keys: ["?"], category: "Tools", description: "Open actions/shortcuts list", tags: ["actions", "customize"] },
    { id: "reaper-render", action: "Render Project", keys: ["Cmd", "Alt", "R"], keysWin: ["Ctrl", "Alt", "R"], category: "File", description: "Open render dialog", tags: ["render", "export", "file"] },
  ],
  bitwig: [
    { id: "bitwig-play", action: "Play / Stop", keys: ["Space"], category: "Transport", description: "Toggle playback", tags: ["transport", "playback"] },
    { id: "bitwig-record", action: "Record", keys: ["F9"], category: "Recording", description: "Toggle recording", tags: ["recording", "transport"] },
    { id: "bitwig-undo", action: "Undo", keys: ["Cmd", "Z"], keysWin: ["Ctrl", "Z"], category: "Editing", description: "Undo last action", tags: ["editing", "history"] },
    { id: "bitwig-redo", action: "Redo", keys: ["Cmd", "Shift", "Z"], keysWin: ["Ctrl", "Shift", "Z"], category: "Editing", description: "Redo last undone action", tags: ["editing", "history"] },
    { id: "bitwig-save", action: "Save Project", keys: ["Cmd", "S"], keysWin: ["Ctrl", "S"], category: "File", description: "Save current project", tags: ["file", "save"] },
    { id: "bitwig-cut", action: "Cut", keys: ["Cmd", "X"], keysWin: ["Ctrl", "X"], category: "Editing", description: "Cut selected", tags: ["editing", "clipboard"] },
    { id: "bitwig-copy", action: "Copy", keys: ["Cmd", "C"], keysWin: ["Ctrl", "C"], category: "Editing", description: "Copy selected", tags: ["editing", "clipboard"] },
    { id: "bitwig-paste", action: "Paste", keys: ["Cmd", "V"], keysWin: ["Ctrl", "V"], category: "Editing", description: "Paste at cursor", tags: ["editing", "clipboard"] },
    { id: "bitwig-duplicate", action: "Duplicate", keys: ["Cmd", "D"], keysWin: ["Ctrl", "D"], category: "Editing", description: "Duplicate selection", tags: ["editing", "duplicate"] },
    { id: "bitwig-delete", action: "Delete", keys: ["Delete"], category: "Editing", description: "Delete selected", tags: ["editing"] },
    { id: "bitwig-split", action: "Split", keys: ["Cmd", "E"], keysWin: ["Ctrl", "E"], category: "Editing", description: "Split at playhead", tags: ["editing", "split"] },
    { id: "bitwig-arranger", action: "Show Arranger", keys: ["F3"], category: "View", description: "Switch to arranger view", tags: ["view", "arranger"] },
    { id: "bitwig-mixer", action: "Show Mixer", keys: ["F4"], category: "View", description: "Switch to mixer view", tags: ["view", "mixer"] },
    { id: "bitwig-detail", action: "Show Detail Editor", keys: ["F5"], category: "View", description: "Toggle detail editor panel", tags: ["view", "editor"] },
    { id: "bitwig-browser", action: "Toggle Browser", keys: ["F6"], category: "View", description: "Show/hide browser panel", tags: ["view", "browser"] },
    { id: "bitwig-inspector", action: "Toggle Inspector", keys: ["I"], category: "View", description: "Show/hide inspector panel", tags: ["view", "inspector"] },
    { id: "bitwig-loop", action: "Toggle Loop", keys: ["L"], category: "Transport", description: "Toggle loop playback", tags: ["transport", "loop"] },
    { id: "bitwig-quantize", action: "Quantize", keys: ["Q"], category: "Quantize", description: "Quantize selected notes", context: "Notes selected", tags: ["quantize", "midi"] },
    { id: "bitwig-automation", action: "Toggle Automation", keys: ["A"], category: "Automation", description: "Toggle automation mode", tags: ["automation"] },
    { id: "bitwig-solo", action: "Solo Track", keys: ["S"], category: "Mixing", description: "Solo selected track", context: "Track selected", tags: ["mixing", "solo"] },
  ],
  cubase: [
    { id: "cubase-play", action: "Start/Stop", keys: ["Space"], category: "Transport", description: "Start or stop playback", tags: ["transport", "playback"] },
    { id: "cubase-record", action: "Record", keys: ["*"], category: "Recording", description: "Start recording (numpad asterisk)", tags: ["recording", "transport"] },
    { id: "cubase-stop", action: "Stop", keys: ["0"], category: "Transport", description: "Stop playback (numpad 0)", tags: ["transport"] },
    { id: "cubase-undo", action: "Undo", keys: ["Cmd", "Z"], keysWin: ["Ctrl", "Z"], category: "Editing", description: "Undo last action", tags: ["editing", "history"] },
    { id: "cubase-redo", action: "Redo", keys: ["Cmd", "Shift", "Z"], keysWin: ["Ctrl", "Shift", "Z"], category: "Editing", description: "Redo last undone action", tags: ["editing", "history"] },
    { id: "cubase-save", action: "Save", keys: ["Cmd", "S"], keysWin: ["Ctrl", "S"], category: "File", description: "Save project", tags: ["file", "save"] },
    { id: "cubase-cut", action: "Cut", keys: ["Cmd", "X"], keysWin: ["Ctrl", "X"], category: "Editing", description: "Cut to clipboard", tags: ["editing", "clipboard"] },
    { id: "cubase-copy", action: "Copy", keys: ["Cmd", "C"], keysWin: ["Ctrl", "C"], category: "Editing", description: "Copy to clipboard", tags: ["editing", "clipboard"] },
    { id: "cubase-paste", action: "Paste", keys: ["Cmd", "V"], keysWin: ["Ctrl", "V"], category: "Editing", description: "Paste from clipboard", tags: ["editing", "clipboard"] },
    { id: "cubase-delete", action: "Delete", keys: ["Delete"], keysWin: ["Delete"], category: "Editing", description: "Delete selected events", tags: ["editing"] },
    { id: "cubase-split", action: "Split at Cursor", keys: ["Alt", "X"], category: "Editing", description: "Split events at cursor position", tags: ["editing", "split"] },
    { id: "cubase-select-all", action: "Select All", keys: ["Cmd", "A"], keysWin: ["Ctrl", "A"], category: "Editing", description: "Select all events", tags: ["selection"] },
    { id: "cubase-zoom-in", action: "Zoom In", keys: ["G"], category: "Navigation", description: "Zoom in horizontally", tags: ["zoom", "view"] },
    { id: "cubase-zoom-out", action: "Zoom Out", keys: ["H"], category: "Navigation", description: "Zoom out horizontally", tags: ["zoom", "view"] },
    { id: "cubase-mixconsole", action: "Open MixConsole", keys: ["F3"], category: "View", description: "Open MixConsole window", tags: ["view", "mixer"] },
    { id: "cubase-channel-settings", action: "Channel Settings", keys: ["E"], category: "Mixing", description: "Open channel settings", context: "Track selected", tags: ["mixing", "channel"] },
    { id: "cubase-loop", action: "Toggle Cycle", keys: ["/"], category: "Transport", description: "Toggle cycle/loop mode", tags: ["transport", "loop"] },
    { id: "cubase-locators", action: "Set Locators to Selection", keys: ["P"], category: "Transport", description: "Set left/right locators to selection", tags: ["transport", "locators"] },
    { id: "cubase-quantize", action: "Quantize", keys: ["Q"], category: "Quantize", description: "Quantize selected events", context: "MIDI events selected", tags: ["quantize", "midi"] },
    { id: "cubase-export", action: "Export Audio Mixdown", keys: ["Cmd", "Shift", "M"], keysWin: ["Ctrl", "Shift", "M"], category: "File", description: "Open export audio dialog", tags: ["export", "render", "file"] },
  ],
  protools: [
    { id: "protools-play", action: "Play / Stop", keys: ["Space"], category: "Transport", description: "Toggle playback", tags: ["transport", "playback"] },
    { id: "protools-record", action: "Record", keys: ["Cmd", "Space"], keysWin: ["Ctrl", "Space"], category: "Recording", description: "Start recording", tags: ["recording", "transport"] },
    { id: "protools-undo", action: "Undo", keys: ["Cmd", "Z"], keysWin: ["Ctrl", "Z"], category: "Editing", description: "Undo last action", tags: ["editing", "history"] },
    { id: "protools-redo", action: "Redo", keys: ["Cmd", "Shift", "Z"], keysWin: ["Ctrl", "Shift", "Z"], category: "Editing", description: "Redo last undone action", tags: ["editing", "history"] },
    { id: "protools-save", action: "Save Session", keys: ["Cmd", "S"], keysWin: ["Ctrl", "S"], category: "File", description: "Save current session", tags: ["file", "save"] },
  ],
  "studio-one": [
    { id: "studio-one-play", action: "Play / Stop", keys: ["Space"], category: "Transport", description: "Toggle playback", tags: ["transport", "playback"] },
    { id: "studio-one-record", action: "Record", keys: ["*"], category: "Recording", description: "Start recording", tags: ["recording", "transport"] },
    { id: "studio-one-undo", action: "Undo", keys: ["Cmd", "Z"], keysWin: ["Ctrl", "Z"], category: "Editing", description: "Undo last action", tags: ["editing", "history"] },
    { id: "studio-one-redo", action: "Redo", keys: ["Cmd", "Shift", "Z"], keysWin: ["Ctrl", "Shift", "Z"], category: "Editing", description: "Redo last undone action", tags: ["editing", "history"] },
    { id: "studio-one-save", action: "Save Song", keys: ["Cmd", "S"], keysWin: ["Ctrl", "S"], category: "File", description: "Save current song", tags: ["file", "save"] },
  ],
};

function getShortcuts(id: string): Shortcut[] {
  // Return DAW-specific placeholder shortcuts if available
  if (placeholderShortcuts[id]) {
    return placeholderShortcuts[id];
  }

  // Generic fallback
  return [
    { id: `${id}-play`, action: "Play / Stop", keys: ["Space"], category: "Transport", description: "Start or stop playback", tags: ["transport"] },
    { id: `${id}-record`, action: "Record", keys: ["R"], category: "Recording", description: "Toggle recording", tags: ["recording"] },
    { id: `${id}-undo`, action: "Undo", keys: ["Cmd", "Z"], keysWin: ["Ctrl", "Z"], category: "Editing", description: "Undo last action", tags: ["editing"] },
    { id: `${id}-redo`, action: "Redo", keys: ["Cmd", "Shift", "Z"], keysWin: ["Ctrl", "Shift", "Z"], category: "Editing", description: "Redo last undone action", tags: ["editing"] },
    { id: `${id}-save`, action: "Save", keys: ["Cmd", "S"], keysWin: ["Ctrl", "S"], category: "File", description: "Save project", tags: ["file"] },
  ];
}

/**
 * Search shortcuts across all DAWs or within a specific DAW
 */
export function searchShortcuts(
  query: string,
  dawId?: string
): Array<Shortcut & { dawId: string; dawName: string }> {
  const results: Array<Shortcut & { dawId: string; dawName: string }> = [];
  const lowerQuery = query.toLowerCase();

  const daws = dawId
    ? [getDAWById(dawId)].filter(Boolean)
    : getDAWs().map((d) => getDAWById(d.id));

  for (const daw of daws) {
    if (!daw) continue;
    for (const shortcut of daw.shortcuts) {
      if (
        shortcut.action.toLowerCase().includes(lowerQuery) ||
        shortcut.category.toLowerCase().includes(lowerQuery) ||
        shortcut.keys.some((k) => k.toLowerCase().includes(lowerQuery)) ||
        shortcut.description?.toLowerCase().includes(lowerQuery)
      ) {
        results.push({
          ...shortcut,
          dawId: daw.id,
          dawName: daw.name,
        });
      }
    }
  }

  return results;
}

