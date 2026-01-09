"use client";

/**
 * Analysis Cache Client
 * Client-side utilities for caching and retrieving track analysis
 * Uses D1 via API for persistent storage
 *
 * STORAGE RULE: Analysis cache should be stored in D1 via track_analysis_cache table.
 * localStorage is DEPRECATED when DISABLE_MASS_LOCAL_PERSISTENCE is enabled.
 */

import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";

export interface CachedAnalysis {
  id: string;
  contentHash: string;
  name: string;
  durationMs?: number;
  bpm?: number;
  key?: string;
  peakDb?: number;
  rmsDb?: number;
  lufs?: number;
  frequencyProfile?: "bass-heavy" | "mid-focused" | "bright" | "balanced";
  waveformData?: number[];
  createdAt?: string;
  updatedAt?: string;
}

// Local cache for quick access
const memoryCache = new Map<string, CachedAnalysis>();

// LocalStorage key for offline fallback
const LOCAL_CACHE_KEY = "passion_analysis_cache_v1";

/**
 * Generate content hash from ArrayBuffer
 */
export async function generateContentHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Get cached analysis by content hash
 * Checks memory -> D1 API -> localStorage (if not deprecated)
 */
export async function getCachedAnalysis(
  contentHash: string
): Promise<CachedAnalysis | null> {
  // Check memory cache first
  if (memoryCache.has(contentHash)) {
    return memoryCache.get(contentHash)!;
  }

  // Try API first (D1 is source of truth)
  try {
    const response = await fetch(`/api/analysis?hash=${encodeURIComponent(contentHash)}`);
    if (response.ok) {
      const analysis = await response.json() as CachedAnalysis;
      memoryCache.set(contentHash, analysis);
      if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
        saveToLocalCache(contentHash, analysis);
      }
      return analysis;
    }
  } catch (e) {
    console.error("Failed to fetch analysis from API:", e);
  }

  // Fall back to localStorage only if deprecation is disabled
  if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
    const localCache = getLocalCache();
    if (localCache[contentHash]) {
      memoryCache.set(contentHash, localCache[contentHash]);
      return localCache[contentHash];
    }
  }

  return null;
}

/**
 * Save analysis to cache
 * Saves to memory -> D1 API -> localStorage (if not deprecated)
 */
export async function saveAnalysisToCache(
  analysis: CachedAnalysis
): Promise<void> {
  // Save to memory
  memoryCache.set(analysis.contentHash, analysis);

  // Save to localStorage only if deprecation is disabled
  if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
    saveToLocalCache(analysis.contentHash, analysis);
  }

  // Save to API (non-blocking)
  try {
    await fetch("/api/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(analysis),
    });
  } catch (e) {
    console.error("Failed to save analysis to API:", e);
    // Will sync next time
  }
}

/**
 * Get multiple cached analyses
 */
export async function getCachedAnalyses(
  contentHashes: string[]
): Promise<Map<string, CachedAnalysis>> {
  const result = new Map<string, CachedAnalysis>();
  const missing: string[] = [];

  // Check memory and localStorage first
  const localCache = getLocalCache();
  for (const hash of contentHashes) {
    if (memoryCache.has(hash)) {
      result.set(hash, memoryCache.get(hash)!);
    } else if (localCache[hash]) {
      result.set(hash, localCache[hash]);
      memoryCache.set(hash, localCache[hash]);
    } else {
      missing.push(hash);
    }
  }

  // Fetch missing from API (one at a time for now)
  for (const hash of missing) {
    const analysis = await getCachedAnalysis(hash);
    if (analysis) {
      result.set(hash, analysis);
    }
  }

  return result;
}

/**
 * Clear all cached analysis
 */
export function clearAnalysisCache(): void {
  memoryCache.clear();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(LOCAL_CACHE_KEY);
  }
}

// ============================================
// LocalStorage helpers
// ============================================

function getLocalCache(): Record<string, CachedAnalysis> {
  if (typeof localStorage === "undefined") return {};
  try {
    const stored = localStorage.getItem(LOCAL_CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveToLocalCache(hash: string, analysis: CachedAnalysis): void {
  if (typeof localStorage === "undefined") return;
  try {
    const cache = getLocalCache();
    cache[hash] = analysis;

    // Limit cache size (keep last 100 entries)
    const entries = Object.entries(cache);
    if (entries.length > 100) {
      const sorted = entries.sort(
        (a, b) =>
          new Date(b[1].updatedAt || 0).getTime() -
          new Date(a[1].updatedAt || 0).getTime()
      );
      const trimmed = Object.fromEntries(sorted.slice(0, 100));
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
    }
  } catch (e) {
    console.error("Failed to save to local cache:", e);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { memory: number; local: number } {
  const localCache = getLocalCache();
  return {
    memory: memoryCache.size,
    local: Object.keys(localCache).length,
  };
}

