/**
 * Shortcuts Data Module
 * Aggregates all DAW shortcuts from individual data files
 */

export * from "./types";

import { abletonShortcuts } from "./ableton";
import { flstudioShortcuts } from "./flstudio";
import { logicproShortcuts } from "./logicpro";
import { reasonShortcuts } from "./reasonrack";
import { serumFeatures } from "./serum";
import type { Shortcut, Product, ShortcutWithProduct, FeatureEntry } from "./types";

/**
 * Product definitions
 */
export const products: Product[] = [
  {
    productId: "ableton12suite",
    name: "Ableton Live 12",
    vendor: "Ableton",
    category: "DAW",
    website: "https://www.ableton.com/",
    color: "#00D8FF",
  },
  {
    productId: "flstudio",
    name: "FL Studio",
    vendor: "Image-Line",
    category: "DAW",
    website: "https://www.image-line.com/fl-studio/",
    color: "#FF8C00",
  },
  {
    productId: "logicpro",
    name: "Logic Pro",
    vendor: "Apple",
    category: "DAW",
    website: "https://www.apple.com/logic-pro/",
    color: "#4A4A4A",
  },
  {
    productId: "reasonrack",
    name: "Reason",
    vendor: "Reason Studios",
    category: "DAW",
    website: "https://www.reasonstudios.com/",
    color: "#E91E63",
  },
  {
    productId: "serum2",
    name: "Serum 2",
    vendor: "Xfer Records",
    category: "Plugin",
    website: "https://xferrecords.com/products/serum",
    color: "#9C27B0",
  },
];

/**
 * Get product by ID
 */
export function getProductById(productId: string): Product | undefined {
  return products.find((p) => p.productId === productId);
}

/**
 * All shortcuts from all products
 */
export const allShortcuts: Shortcut[] = [
  ...abletonShortcuts,
  ...flstudioShortcuts,
  ...logicproShortcuts,
  ...reasonShortcuts,
];

/**
 * All features (non-shortcut entries)
 */
export const allFeatures: FeatureEntry[] = [...serumFeatures];

/**
 * Get shortcuts by product ID
 */
export function getShortcutsByProduct(productId: string): Shortcut[] {
  return allShortcuts.filter((s) => s.productId === productId);
}

/**
 * Get shortcuts with product info
 */
export function getShortcutsWithProduct(productId?: string): ShortcutWithProduct[] {
  const shortcuts = productId
    ? getShortcutsByProduct(productId)
    : allShortcuts;

  return shortcuts.map((shortcut) => {
    const product = getProductById(shortcut.productId);
    return {
      ...shortcut,
      productName: product?.name || shortcut.productId,
      productVendor: product?.vendor,
      productCategory: product?.category,
      productIcon: product?.icon,
      productColor: product?.color,
      group: shortcut.group || "General",
    };
  });
}

/**
 * Get shortcuts grouped by their group field
 */
export function getShortcutsGroupedByCategory(
  productId: string
): Record<string, Shortcut[]> {
  const shortcuts = getShortcutsByProduct(productId);
  const groups: Record<string, Shortcut[]> = {};

  for (const shortcut of shortcuts) {
    const group = shortcut.group || "General";
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(shortcut);
  }

  return groups;
}

/**
 * Search shortcuts across all products or within a specific product
 */
export function searchShortcuts(
  query: string,
  productId?: string
): ShortcutWithProduct[] {
  const lowerQuery = query.toLowerCase();
  const shortcuts = getShortcutsWithProduct(productId);

  return shortcuts.filter(
    (s) =>
      s.command.toLowerCase().includes(lowerQuery) ||
      s.keys.toLowerCase().includes(lowerQuery) ||
      s.description?.toLowerCase().includes(lowerQuery) ||
      s.tags?.some((t) => t.toLowerCase().includes(lowerQuery)) ||
      s.group?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all unique groups for a product
 */
export function getGroupsForProduct(productId: string): string[] {
  const shortcuts = getShortcutsByProduct(productId);
  const groups = new Set<string>();

  for (const shortcut of shortcuts) {
    groups.add(shortcut.group || "General");
  }

  return Array.from(groups).sort();
}

/**
 * Get all unique tags for a product
 */
export function getTagsForProduct(productId: string): string[] {
  const shortcuts = getShortcutsByProduct(productId);
  const tags = new Set<string>();

  for (const shortcut of shortcuts) {
    shortcut.tags?.forEach((t) => tags.add(t));
  }

  return Array.from(tags).sort();
}

/**
 * Get statistics for a product
 */
export function getProductStats(productId: string): {
  totalShortcuts: number;
  groups: number;
  tags: number;
} {
  const shortcuts = getShortcutsByProduct(productId);
  return {
    totalShortcuts: shortcuts.length,
    groups: getGroupsForProduct(productId).length,
    tags: getTagsForProduct(productId).length,
  };
}

// Re-export individual shortcut arrays for direct access
export { abletonShortcuts } from "./ableton";
export { flstudioShortcuts } from "./flstudio";
export { logicproShortcuts } from "./logicpro";
export { reasonShortcuts } from "./reasonrack";
export { serumFeatures } from "./serum";

