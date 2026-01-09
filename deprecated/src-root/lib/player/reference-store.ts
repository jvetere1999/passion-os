"use client";

/**
 * Reference Tracks Store
 * Local-only storage for reference track libraries
 * Uses localStorage/IndexedDB - not synced to cloud
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ============================================
// Types
// ============================================

export interface Marker {
  id: string;
  time: number; // seconds
  label: string;
  color: string;
  type: "section" | "drop" | "buildup" | "breakdown" | "intro" | "outro" | "hook" | "verse" | "chorus" | "bridge" | "custom";
}

export interface ReferenceTrack {
  id: string;
  name: string;
  artist: string;
  album?: string;
  duration: number; // seconds
  bpm?: number;
  key?: string; // e.g., "Am", "C#m", "F"
  genre?: string;
  tags: string[];
  libraryId: string;
  filePath: string; // local file path or blob URL
  fileSize: number; // bytes
  addedAt: string; // ISO date
  lastPlayedAt?: string;
  playCount: number;
  markers: Marker[];
  notes: string;
  // Analysis data (computed on first load)
  analysis?: {
    peakDb: number;
    rmsDb: number;
    lufs?: number;
    waveformData?: number[]; // normalized 0-1 values
    frequencyProfile?: "bass-heavy" | "mid-focused" | "bright" | "balanced";
  };
}

export interface Library {
  id: string;
  name: string;
  description?: string;
  color: string;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceState {
  // Libraries
  libraries: Library[];
  currentLibraryId: string | null;

  // Tracks
  tracks: ReferenceTrack[];

  // UI State
  searchQuery: string;
  selectedTags: string[];
  sortBy: "name" | "artist" | "bpm" | "key" | "addedAt" | "lastPlayedAt";
  sortOrder: "asc" | "desc";

  // Analysis panel
  analysisPanelOpen: boolean;
  analyzingTrackId: string | null;
}

interface ReferenceActions {
  // Library management
  createLibrary: (name: string, description?: string, color?: string) => Library;
  updateLibrary: (id: string, updates: Partial<Omit<Library, "id" | "createdAt">>) => void;
  deleteLibrary: (id: string) => void;
  setCurrentLibrary: (id: string | null) => void;

  // Track management
  addTrack: (track: Omit<ReferenceTrack, "id" | "addedAt" | "playCount" | "markers" | "notes">) => ReferenceTrack;
  updateTrack: (id: string, updates: Partial<Omit<ReferenceTrack, "id" | "addedAt">>) => void;
  deleteTrack: (id: string) => void;
  incrementPlayCount: (id: string) => void;

  // Markers
  addMarker: (trackId: string, marker: Omit<Marker, "id">) => void;
  updateMarker: (trackId: string, markerId: string, updates: Partial<Omit<Marker, "id">>) => void;
  deleteMarker: (trackId: string, markerId: string) => void;

  // Tags
  addTag: (trackId: string, tag: string) => void;
  removeTag: (trackId: string, tag: string) => void;
  getAllTags: () => string[];

  // Search & Filter
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSortBy: (sortBy: ReferenceState["sortBy"]) => void;
  setSortOrder: (order: ReferenceState["sortOrder"]) => void;

  // Analysis panel
  openAnalysisPanel: (trackId: string) => void;
  closeAnalysisPanel: () => void;
  setAnalysis: (trackId: string, analysis: ReferenceTrack["analysis"]) => void;

  // Search
  searchTracks: (query: string) => ReferenceTrack[];
  getFilteredTracks: () => ReferenceTrack[];
}

// ============================================
// Helpers
// ============================================

const generateId = () => `ref_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const LIBRARY_COLORS = [
  "#ff764d", "#50b8b8", "#87c157", "#ffc107", "#ff6b9d",
  "#64d2ff", "#b8d060", "#e87878", "#8bb8e8", "#20a070"
];

// Fuzzy search scoring
function fuzzyScore(query: string, text: string): number {
  if (!query) return 1;
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  // Exact match
  if (lowerText === lowerQuery) return 100;

  // Starts with
  if (lowerText.startsWith(lowerQuery)) return 80;

  // Contains
  if (lowerText.includes(lowerQuery)) return 60;

  // Fuzzy character matching
  let score = 0;
  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      score += 10;
      queryIndex++;
    }
  }

  return queryIndex === lowerQuery.length ? score : 0;
}

// ============================================
// Initial State
// ============================================

const initialState: ReferenceState = {
  libraries: [],
  currentLibraryId: null,
  tracks: [],
  searchQuery: "",
  selectedTags: [],
  sortBy: "addedAt",
  sortOrder: "desc",
  analysisPanelOpen: false,
  analyzingTrackId: null,
};

// ============================================
// Store
// ============================================

export const useReferenceStore = create<ReferenceState & ReferenceActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Library management
      createLibrary: (name, description, color) => {
        const library: Library = {
          id: generateId(),
          name,
          description,
          color: color || LIBRARY_COLORS[get().libraries.length % LIBRARY_COLORS.length],
          trackCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          libraries: [...state.libraries, library],
          currentLibraryId: state.currentLibraryId || library.id,
        }));
        return library;
      },

      updateLibrary: (id, updates) => {
        set((state) => ({
          libraries: state.libraries.map((lib) =>
            lib.id === id
              ? { ...lib, ...updates, updatedAt: new Date().toISOString() }
              : lib
          ),
        }));
      },

      deleteLibrary: (id) => {
        set((state) => ({
          libraries: state.libraries.filter((lib) => lib.id !== id),
          tracks: state.tracks.filter((track) => track.libraryId !== id),
          currentLibraryId:
            state.currentLibraryId === id
              ? state.libraries.find((lib) => lib.id !== id)?.id || null
              : state.currentLibraryId,
        }));
      },

      setCurrentLibrary: (id) => {
        set({ currentLibraryId: id });
      },

      // Track management
      addTrack: (trackData) => {
        const track: ReferenceTrack = {
          ...trackData,
          id: generateId(),
          addedAt: new Date().toISOString(),
          playCount: 0,
          markers: [],
          notes: "",
        };
        set((state) => {
          const newTracks = [...state.tracks, track];
          // Update library track count
          const libraries = state.libraries.map((lib) =>
            lib.id === track.libraryId
              ? { ...lib, trackCount: lib.trackCount + 1, updatedAt: new Date().toISOString() }
              : lib
          );
          return { tracks: newTracks, libraries };
        });
        return track;
      },

      updateTrack: (id, updates) => {
        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === id ? { ...track, ...updates } : track
          ),
        }));
      },

      deleteTrack: (id) => {
        set((state) => {
          const track = state.tracks.find((t) => t.id === id);
          if (!track) return state;

          return {
            tracks: state.tracks.filter((t) => t.id !== id),
            libraries: state.libraries.map((lib) =>
              lib.id === track.libraryId
                ? { ...lib, trackCount: Math.max(0, lib.trackCount - 1), updatedAt: new Date().toISOString() }
                : lib
            ),
          };
        });
      },

      incrementPlayCount: (id) => {
        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === id
              ? {
                  ...track,
                  playCount: track.playCount + 1,
                  lastPlayedAt: new Date().toISOString(),
                }
              : track
          ),
        }));
      },

      // Markers
      addMarker: (trackId, marker) => {
        const newMarker: Marker = { ...marker, id: generateId() };
        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === trackId
              ? { ...track, markers: [...track.markers, newMarker].sort((a, b) => a.time - b.time) }
              : track
          ),
        }));
      },

      updateMarker: (trackId, markerId, updates) => {
        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === trackId
              ? {
                  ...track,
                  markers: track.markers
                    .map((m) => (m.id === markerId ? { ...m, ...updates } : m))
                    .sort((a, b) => a.time - b.time),
                }
              : track
          ),
        }));
      },

      deleteMarker: (trackId, markerId) => {
        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === trackId
              ? { ...track, markers: track.markers.filter((m) => m.id !== markerId) }
              : track
          ),
        }));
      },

      // Tags
      addTag: (trackId, tag) => {
        const normalizedTag = tag.trim().toLowerCase();
        if (!normalizedTag) return;

        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === trackId && !track.tags.includes(normalizedTag)
              ? { ...track, tags: [...track.tags, normalizedTag] }
              : track
          ),
        }));
      },

      removeTag: (trackId, tag) => {
        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === trackId
              ? { ...track, tags: track.tags.filter((t) => t !== tag) }
              : track
          ),
        }));
      },

      getAllTags: () => {
        const tags = new Set<string>();
        get().tracks.forEach((track) => {
          track.tags.forEach((tag) => tags.add(tag));
        });
        return Array.from(tags).sort();
      },

      // Search & Filter
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedTags: (tags) => set({ selectedTags: tags }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),

      // Analysis panel
      openAnalysisPanel: (trackId) => {
        set({ analysisPanelOpen: true, analyzingTrackId: trackId });
      },

      closeAnalysisPanel: () => {
        set({ analysisPanelOpen: false, analyzingTrackId: null });
      },

      setAnalysis: (trackId, analysis) => {
        set((state) => ({
          tracks: state.tracks.map((track) =>
            track.id === trackId ? { ...track, analysis } : track
          ),
        }));
      },

      // Search with fuzzy matching
      searchTracks: (query) => {
        const { tracks, currentLibraryId } = get();

        if (!query.trim()) return tracks;

        const scored = tracks.map((track) => {
          const nameScore = fuzzyScore(query, track.name);
          const artistScore = fuzzyScore(query, track.artist);
          const tagScore = Math.max(0, ...track.tags.map((t) => fuzzyScore(query, t)));
          const genreScore = track.genre ? fuzzyScore(query, track.genre) : 0;

          // Boost score if in current library
          const libraryBoost = track.libraryId === currentLibraryId ? 20 : 0;

          const totalScore = Math.max(nameScore, artistScore, tagScore, genreScore) + libraryBoost;

          return { track, score: totalScore };
        });

        return scored
          .filter((s) => s.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((s) => s.track);
      },

      getFilteredTracks: () => {
        const { tracks, currentLibraryId, searchQuery, selectedTags, sortBy, sortOrder } = get();

        let filtered = searchQuery ? get().searchTracks(searchQuery) : [...tracks];

        // Filter by current library if set
        if (currentLibraryId) {
          // Show current library first, then others
          filtered.sort((a, b) => {
            if (a.libraryId === currentLibraryId && b.libraryId !== currentLibraryId) return -1;
            if (b.libraryId === currentLibraryId && a.libraryId !== currentLibraryId) return 1;
            return 0;
          });
        }

        // Filter by tags
        if (selectedTags.length > 0) {
          filtered = filtered.filter((track) =>
            selectedTags.every((tag) => track.tags.includes(tag))
          );
        }

        // Sort (if not already sorted by search)
        if (!searchQuery) {
          filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
              case "name":
                comparison = a.name.localeCompare(b.name);
                break;
              case "artist":
                comparison = a.artist.localeCompare(b.artist);
                break;
              case "bpm":
                comparison = (a.bpm || 0) - (b.bpm || 0);
                break;
              case "key":
                comparison = (a.key || "").localeCompare(b.key || "");
                break;
              case "addedAt":
                comparison = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
                break;
              case "lastPlayedAt":
                comparison =
                  new Date(a.lastPlayedAt || 0).getTime() -
                  new Date(b.lastPlayedAt || 0).getTime();
                break;
            }

            return sortOrder === "asc" ? comparison : -comparison;
          });
        }

        return filtered;
      },
    }),
    {
      name: "passion-os-reference-tracks",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        libraries: state.libraries,
        currentLibraryId: state.currentLibraryId,
        tracks: state.tracks,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const useCurrentLibrary = () =>
  useReferenceStore((state) =>
    state.libraries.find((lib) => lib.id === state.currentLibraryId)
  );

export const useLibraries = () => useReferenceStore((state) => state.libraries);

export const useFilteredTracks = () => {
  const getFilteredTracks = useReferenceStore((state) => state.getFilteredTracks);
  return getFilteredTracks();
};

export const useAnalyzingTrack = () =>
  useReferenceStore((state) =>
    state.analyzingTrackId
      ? state.tracks.find((t) => t.id === state.analyzingTrackId)
      : null
  );

export const useAnalysisPanelOpen = () =>
  useReferenceStore((state) => state.analysisPanelOpen);

