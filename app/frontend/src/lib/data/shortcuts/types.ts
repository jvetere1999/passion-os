/**
 * Shortcut type definition
 * Matches legacy SvelteKit app format for data compatibility
 */

export interface Shortcut {
  /** Stable unique ID, namespaced by product: `${productId}:slug` */
  id: string;
  /** Product this shortcut belongs to */
  productId: string;
  /** Type/category of shortcut */
  type: string;
  /** The command or action name */
  command: string;
  /** Human-readable description */
  description?: string;
  /** URL to source documentation */
  descriptionSource?: string;
  /**
   * Mac-style key display (e.g., "Command+Shift+Z")
   * Uses Unicode symbols: Command, Option, Shift, Control
   */
  keys: string;
  /** Windows-style key override (e.g., "Ctrl+Shift+Z") */
  keysWin?: string;
  /** Context where this shortcut applies */
  context?: string;
  /** Tags for filtering */
  tags?: string[];
  /** Primary grouping from source document */
  group?: string;
  /** Cross-cutting facets for secondary categorization */
  facets?: string[];
}

export interface Product {
  productId: string;
  name: string;
  vendor?: string;
  category?: string;
  website?: string;
  icon?: string;
  color?: string;
}

export interface ShortcutWithProduct extends Shortcut {
  productName: string;
  productVendor?: string;
  productCategory?: string;
  productIcon?: string;
  productColor?: string;
}

/**
 * Feature entry for power features (not keyboard shortcuts)
 */
export interface FeatureEntry {
  kind?: "feature";
  id: string;
  productId: string;
  type: string;
  command: string;
  description?: string;
  descriptionSource?: string;
  /** Key or mouse action to trigger */
  keys?: string;
  context?: string;
  note?: string;
  default?: string;
  tags?: string[];
  group?: string;
  facets?: string[];
}

export type Entry = Shortcut | FeatureEntry;

export function isShortcut(entry: Entry): entry is Shortcut {
  return "keys" in entry;
}

export function isFeature(entry: Entry): entry is FeatureEntry {
  return (entry as FeatureEntry).type === "feature";
}

