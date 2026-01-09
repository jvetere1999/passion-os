/**
 * Player Module Index
 * Re-exports all player functionality
 */

// Types
export type {
  RepeatMode,
  PlayerStatus,
  QueueTrack,
  PlayerSettings,
  PlayerState,
  WaveformPeaks,
  WaveformData,
  WaveformCacheEntry,
  FrequencyBand,
  FrequencySpectrum,
  AudioAnalysis,
  AudioAnnotations,
  AudioAnnotationMarker,
  AudioAnnotationRegion,
  AudioAnnotationNote,
} from "./types";

export { DEFAULT_SETTINGS, ANNOTATION_COLORS } from "./types";

// Store
export {
  usePlayerStore,
  useCurrentTrack,
  usePlayerStatus,
  useIsPlaying,
  usePlayerVisible,
  usePlayerSettings,
  useCurrentTime,
  useDuration,
  useQueue,
  useQueueIndex,
} from "./store";

// Audio controller
export {
  initAudioController,
  loadAndPlay,
  play,
  pause,
  togglePlayPause,
  seek,
  seekByPercent,
  setVolume,
  getVolume,
  skipForward,
  skipBackward,
  getAudioElement,
  disposeAudioController,
} from "./audio";

// Waveform
export {
  generateWaveform,
  generateWaveformFromBuffer,
  getCachedWaveform,
  cacheWaveform,
  clearWaveformCache,
  generateBlobHash,
} from "./waveform";

// Analysis
export {
  analyzeAudio,
  analyzeFrequencySpectrum,
  getAmplitudeColor,
  createEmptyAnnotations,
  addMarker,
  updateMarker,
  removeMarker,
  addRegion,
  updateRegion,
  removeRegion,
  addAnnotationNote,
  removeAnnotationNote,
  formatTime,
  formatTimeWithMs,
} from "./analysis";

// Persistence
export {
  loadPlayerSettings,
  savePlayerSettings,
  loadQueueState,
  saveQueueState,
  saveQueueStateImmediate,
  clearQueueState,
  migratePlayerStorage,
  PLAYER_STORAGE_VERSION,
} from "./persist";

export type { QueueStorage, SerializedQueueTrack } from "./persist";

// Reference Tracks Store
export {
  useReferenceStore,
  useCurrentLibrary,
  useLibraries,
  useFilteredTracks,
  useAnalyzingTrack,
  useAnalysisPanelOpen,
} from "./reference-store";

export type {
  ReferenceTrack,
  Library,
  Marker,
  ReferenceState,
} from "./reference-store";

// Local Audio Storage (IndexedDB)
export {
  storeAudioFile,
  getAudioFileUrl,
  getAudioFileMetadata,
  deleteAudioFile,
  deleteAudioFiles,
  getAllAudioFileIds,
  getStorageUsed,
  clearAllAudioFiles,
} from "./local-storage";

// Analysis Cache (D1 + localStorage)
export {
  getCachedAnalysis,
  saveAnalysisToCache,
  getCachedAnalyses,
  clearAnalysisCache,
  getCacheStats,
  generateContentHash,
  type CachedAnalysis,
} from "./analysis-cache";

