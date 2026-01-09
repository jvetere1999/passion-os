/**
 * Camelot Wheel Data
 *
 * Maps between Camelot notation, traditional key names, and Open Key notation.
 * Used by the Harmonic Wheel component.
 */

export interface KeyInfo {
  camelot: string;
  traditionalKey: string;
  openKey: string;
  isMinor: boolean;
  position: number; // 1-12 around the wheel
}

/**
 * Complete key mapping
 * Position 1 is at the top, going clockwise
 */
export const KEYS: KeyInfo[] = [
  // Minor keys (A side)
  { camelot: "1A", traditionalKey: "A-flat minor", openKey: "6m", isMinor: true, position: 1 },
  { camelot: "2A", traditionalKey: "E-flat minor", openKey: "7m", isMinor: true, position: 2 },
  { camelot: "3A", traditionalKey: "B-flat minor", openKey: "8m", isMinor: true, position: 3 },
  { camelot: "4A", traditionalKey: "F minor", openKey: "9m", isMinor: true, position: 4 },
  { camelot: "5A", traditionalKey: "C minor", openKey: "10m", isMinor: true, position: 5 },
  { camelot: "6A", traditionalKey: "G minor", openKey: "11m", isMinor: true, position: 6 },
  { camelot: "7A", traditionalKey: "D minor", openKey: "12m", isMinor: true, position: 7 },
  { camelot: "8A", traditionalKey: "A minor", openKey: "1m", isMinor: true, position: 8 },
  { camelot: "9A", traditionalKey: "E minor", openKey: "2m", isMinor: true, position: 9 },
  { camelot: "10A", traditionalKey: "B minor", openKey: "3m", isMinor: true, position: 10 },
  { camelot: "11A", traditionalKey: "F-sharp minor", openKey: "4m", isMinor: true, position: 11 },
  { camelot: "12A", traditionalKey: "D-flat minor", openKey: "5m", isMinor: true, position: 12 },

  // Major keys (B side)
  { camelot: "1B", traditionalKey: "B major", openKey: "6d", isMinor: false, position: 1 },
  { camelot: "2B", traditionalKey: "F-sharp major", openKey: "7d", isMinor: false, position: 2 },
  { camelot: "3B", traditionalKey: "D-flat major", openKey: "8d", isMinor: false, position: 3 },
  { camelot: "4B", traditionalKey: "A-flat major", openKey: "9d", isMinor: false, position: 4 },
  { camelot: "5B", traditionalKey: "E-flat major", openKey: "10d", isMinor: false, position: 5 },
  { camelot: "6B", traditionalKey: "B-flat major", openKey: "11d", isMinor: false, position: 6 },
  { camelot: "7B", traditionalKey: "F major", openKey: "12d", isMinor: false, position: 7 },
  { camelot: "8B", traditionalKey: "C major", openKey: "1d", isMinor: false, position: 8 },
  { camelot: "9B", traditionalKey: "G major", openKey: "2d", isMinor: false, position: 9 },
  { camelot: "10B", traditionalKey: "D major", openKey: "3d", isMinor: false, position: 10 },
  { camelot: "11B", traditionalKey: "A major", openKey: "4d", isMinor: false, position: 11 },
  { camelot: "12B", traditionalKey: "E major", openKey: "5d", isMinor: false, position: 12 },
];

/**
 * Get a key by its Camelot notation
 */
export function getKeyByCamelot(camelot: string): KeyInfo | undefined {
  return KEYS.find((k) => k.camelot === camelot);
}

/**
 * Get compatible keys for mixing (Camelot rules)
 * Returns: same key, relative major/minor, and adjacent keys (+/- 1)
 */
export function getCompatibleKeys(camelot: string): {
  same: KeyInfo | undefined;
  relative: KeyInfo | undefined;
  adjacent: KeyInfo[];
} {
  const key = getKeyByCamelot(camelot);
  if (!key) return { same: undefined, relative: undefined, adjacent: [] };

  const number = parseInt(camelot.slice(0, -1));
  const letter = camelot.slice(-1);

  // Same key
  const same = key;

  // Relative major/minor (same number, different letter)
  const relativeLetter = letter === "A" ? "B" : "A";
  const relative = getKeyByCamelot(`${number}${relativeLetter}`);

  // Adjacent keys (+/- 1, same letter)
  const prevNumber = number === 1 ? 12 : number - 1;
  const nextNumber = number === 12 ? 1 : number + 1;

  const adjacent = [
    getKeyByCamelot(`${prevNumber}${letter}`),
    getKeyByCamelot(`${nextNumber}${letter}`),
  ].filter((k): k is KeyInfo => k !== undefined);

  return { same, relative, adjacent };
}

/**
 * Get Circle of Fifths relationships
 */
export function getCircleOfFifthsRelationships(camelot: string): {
  perfectFifth: KeyInfo | undefined;
  perfectFourth: KeyInfo | undefined;
  relativeMinor: KeyInfo | undefined;
  relativeMajor: KeyInfo | undefined;
} {
  const key = getKeyByCamelot(camelot);
  if (!key) {
    return {
      perfectFifth: undefined,
      perfectFourth: undefined,
      relativeMinor: undefined,
      relativeMajor: undefined,
    };
  }

  const number = parseInt(camelot.slice(0, -1));
  const letter = camelot.slice(-1);

  // In Camelot, moving +1 is a perfect fifth
  const fifthNumber = number === 12 ? 1 : number + 1;
  const fourthNumber = number === 1 ? 12 : number - 1;

  const perfectFifth = getKeyByCamelot(`${fifthNumber}${letter}`);
  const perfectFourth = getKeyByCamelot(`${fourthNumber}${letter}`);

  // Relative minor/major (same number, different letter)
  const relativeLetter = letter === "A" ? "B" : "A";
  const relativeKey = getKeyByCamelot(`${number}${relativeLetter}`);

  return {
    perfectFifth,
    perfectFourth,
    relativeMinor: letter === "B" ? relativeKey : undefined,
    relativeMajor: letter === "A" ? relativeKey : undefined,
  };
}

/**
 * Get all minor keys (outer ring)
 */
export function getMinorKeys(): KeyInfo[] {
  return KEYS.filter((k) => k.isMinor).sort((a, b) => a.position - b.position);
}

/**
 * Get all major keys (inner ring)
 */
export function getMajorKeys(): KeyInfo[] {
  return KEYS.filter((k) => !k.isMinor).sort((a, b) => a.position - b.position);
}

