/**
 * Reference Tracks Hooks
 *
 * React hooks for managing reference tracks, annotations, and regions.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  referenceTracksApi,
  framesApi,
  decodeFrameData,
  type ReferenceTrackResponse,
  type TrackAnalysisResponse,
  type AnnotationResponse,
  type RegionResponse,
  type FrameManifestResponse,
  type EventsResponse,
  type CreateAnnotationInput,
  type UpdateAnnotationInput,
  type CreateRegionInput,
  type UpdateRegionInput,
} from '@/lib/api/reference-tracks';

// ============================================
// Track Hooks
// ============================================

export interface UseTracksResult {
  tracks: ReferenceTrackResponse[];
  loading: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  refresh: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
}

export function useTracks(pageSize = 20): UseTracksResult {
  const [tracks, setTracks] = useState<ReferenceTrackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({ total: 0, hasNext: false, hasPrev: false });

  const fetchTracks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await referenceTracksApi.listTracks(page, pageSize);
      setTracks(result.data);
      setPagination({
        total: result.total,
        hasNext: result.has_next,
        hasPrev: result.has_prev,
      });
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch tracks'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const totalPages = Math.ceil(pagination.total / pageSize);

  return {
    tracks,
    loading,
    error,
    page,
    totalPages,
    hasNext: pagination.hasNext,
    hasPrev: pagination.hasPrev,
    refresh: fetchTracks,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
  };
}

// ============================================
// Single Track Hook
// ============================================

export interface UseTrackResult {
  track: ReferenceTrackResponse | null;
  analysis: TrackAnalysisResponse | null;
  annotations: AnnotationResponse[];
  regions: RegionResponse[];
  loading: boolean;
  error: Error | null;
  streamUrl: string | null;
  refresh: () => Promise<void>;
  addAnnotation: (input: CreateAnnotationInput) => Promise<AnnotationResponse>;
  updateAnnotation: (id: string, input: UpdateAnnotationInput) => Promise<AnnotationResponse>;
  deleteAnnotation: (id: string) => Promise<void>;
  addRegion: (input: CreateRegionInput) => Promise<RegionResponse>;
  updateRegion: (id: string, input: UpdateRegionInput) => Promise<RegionResponse>;
  deleteRegion: (id: string) => Promise<void>;
}

export function useTrack(trackId: string | null): UseTrackResult {
  const [track, setTrack] = useState<ReferenceTrackResponse | null>(null);
  const [analysis, setAnalysis] = useState<TrackAnalysisResponse | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationResponse[]>([]);
  const [regions, setRegions] = useState<RegionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const fetchTrack = useCallback(async () => {
    if (!trackId) {
      setTrack(null);
      setAnalysis(null);
      setAnnotations([]);
      setRegions([]);
      setStreamUrl(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [trackData, analysisData, annotationsData, regionsData, streamData] = await Promise.all([
        referenceTracksApi.getTrack(trackId),
        referenceTracksApi.getAnalysis(trackId),
        referenceTracksApi.listAnnotations(trackId),
        referenceTracksApi.listRegions(trackId),
        referenceTracksApi.getStreamUrl(trackId),
      ]);

      setTrack(trackData);
      setAnalysis(analysisData);
      setAnnotations(annotationsData);
      setRegions(regionsData);
      setStreamUrl(streamData.url);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch track'));
    } finally {
      setLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    fetchTrack();
  }, [fetchTrack]);

  const addAnnotation = useCallback(async (input: CreateAnnotationInput) => {
    if (!trackId) throw new Error('No track selected');
    const annotation = await referenceTracksApi.createAnnotation(trackId, input);
    setAnnotations((prev) => [...prev, annotation].sort((a, b) => a.start_time_ms - b.start_time_ms));
    return annotation;
  }, [trackId]);

  const updateAnnotation = useCallback(async (id: string, input: UpdateAnnotationInput) => {
    const updated = await referenceTracksApi.updateAnnotation(id, input);
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? updated : a)).sort((a, b) => a.start_time_ms - b.start_time_ms)
    );
    return updated;
  }, []);

  const deleteAnnotation = useCallback(async (id: string) => {
    await referenceTracksApi.deleteAnnotation(id);
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addRegion = useCallback(async (input: CreateRegionInput) => {
    if (!trackId) throw new Error('No track selected');
    const region = await referenceTracksApi.createRegion(trackId, input);
    setRegions((prev) => [...prev, region].sort((a, b) => a.start_time_ms - b.start_time_ms));
    return region;
  }, [trackId]);

  const updateRegion = useCallback(async (id: string, input: UpdateRegionInput) => {
    const updated = await referenceTracksApi.updateRegion(id, input);
    setRegions((prev) =>
      prev.map((r) => (r.id === id ? updated : r)).sort((a, b) => a.start_time_ms - b.start_time_ms)
    );
    return updated;
  }, []);

  const deleteRegion = useCallback(async (id: string) => {
    await referenceTracksApi.deleteRegion(id);
    setRegions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return {
    track,
    analysis,
    annotations,
    regions,
    loading,
    error,
    streamUrl,
    refresh: fetchTrack,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    addRegion,
    updateRegion,
    deleteRegion,
  };
}

// ============================================
// Frame Data Hook
// ============================================

export interface UseFrameDataResult {
  manifest: FrameManifestResponse | null;
  loading: boolean;
  error: Error | null;
  getFramesForRange: (fromMs: number, toMs: number) => Promise<Map<string, Float32Array>>;
  events: EventsResponse | null;
}

export function useFrameData(analysisId: string | null): UseFrameDataResult {
  const [manifest, setManifest] = useState<FrameManifestResponse | null>(null);
  const [events, setEvents] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Cache for fetched chunks
  const chunkCache = useRef<Map<number, Map<string, Float32Array>>>(new Map());

  useEffect(() => {
    if (!analysisId) {
      setManifest(null);
      setEvents(null);
      chunkCache.current.clear();
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      framesApi.getManifest(analysisId),
      framesApi.getEvents(analysisId),
    ])
      .then(([manifestData, eventsData]) => {
        setManifest(manifestData);
        setEvents(eventsData);
        chunkCache.current.clear();
      })
      .catch((e) => {
        setError(e instanceof Error ? e : new Error('Failed to fetch frame data'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [analysisId]);

  const getFramesForRange = useCallback(
    async (fromMs: number, toMs: number): Promise<Map<string, Float32Array>> => {
      if (!analysisId || !manifest) {
        return new Map();
      }

      const frameData = await framesApi.getFrames(analysisId, fromMs, toMs);

      // Combine all chunks
      const allFrames = new Map<string, Float32Array>();

      for (const chunk of frameData.chunks) {
        const decoded = decodeFrameData(
          chunk.data_base64,
          manifest.frame_layout,
          chunk.frame_count
        );

        // Merge into allFrames
        for (const [bandName, data] of decoded) {
          const existing = allFrames.get(bandName);
          if (existing) {
            const combined = new Float32Array(existing.length + data.length);
            combined.set(existing);
            combined.set(data, existing.length);
            allFrames.set(bandName, combined);
          } else {
            allFrames.set(bandName, data);
          }
        }
      }

      return allFrames;
    },
    [analysisId, manifest]
  );

  return {
    manifest,
    loading,
    error,
    getFramesForRange,
    events,
  };
}

// ============================================
// Upload Hook
// ============================================

export interface UseUploadResult {
  uploading: boolean;
  progress: number;
  error: Error | null;
  uploadTrack: (file: File, metadata?: { name?: string; artist?: string; album?: string }) => Promise<ReferenceTrackResponse>;
}

export function useUpload(): UseUploadResult {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadTrack = useCallback(
    async (
      file: File,
      metadata?: { name?: string; artist?: string; album?: string }
    ): Promise<ReferenceTrackResponse> => {
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // 1. Get signed upload URL
        setProgress(10);
        const { url: signedUrl, r2_key } = await referenceTracksApi.initUpload(
          file.name,
          file.type,
          file.size
        );

        // 2. Upload to R2
        setProgress(20);
        await referenceTracksApi.uploadFile(signedUrl, file);
        setProgress(80);

        // 3. Create track record
        const track = await referenceTracksApi.createTrack({
          name: metadata?.name ?? file.name.replace(/\.[^/.]+$/, ''),
          r2_key,
          file_size_bytes: file.size,
          mime_type: file.type,
          artist: metadata?.artist,
          album: metadata?.album,
        });
        setProgress(100);

        return track;
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Upload failed');
        setError(err);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  return {
    uploading,
    progress,
    error,
    uploadTrack,
  };
}

