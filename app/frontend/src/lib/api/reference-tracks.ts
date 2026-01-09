/**
 * Reference Tracks API Client
 *
 * Centralized API wrapper for reference tracks, analysis, annotations, and regions.
 * All R2 access goes through backend signed URLs - frontend never has R2 credentials.
 *
 * REFACTOR: Uses shared client (January 2026)
 */

import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  ApiError,
} from './client';

// Re-export ApiError as ApiClientError for backward compatibility
export { ApiError as ApiClientError };

// Compatibility wrapper for the api object pattern used by this module
const api = {
  async get<T>(path: string): Promise<T> {
    return apiGet<T>(path);
  },

  async post<T>(path: string, options?: { body?: unknown }): Promise<T> {
    return apiPost<T>(path, options?.body);
  },

  async patch<T>(path: string, options?: { body?: unknown }): Promise<T> {
    return apiPatch<T>(path, options?.body);
  },

  async delete<T>(path: string): Promise<T> {
    return apiDelete<T>(path);
  },
};

// ============================================
// Types
// ============================================

export interface ReferenceTrackResponse {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  r2_key: string;
  file_size_bytes: number;
  mime_type: string;
  duration_seconds: number | null;
  artist: string | null;
  album: string | null;
  genre: string | null;
  bpm: number | null;
  key_signature: string | null;
  tags: string[];
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackAnalysisResponse {
  id: string;
  track_id: string;
  analysis_type: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  summary: Record<string, unknown>;
  created_at: string;
}

export interface AnnotationResponse {
  id: string;
  track_id: string;
  user_id: string;
  start_time_ms: number;
  end_time_ms: number | null;
  title: string;
  content: string | null;
  category: 'general' | 'technique' | 'mix' | 'mastering' | 'arrangement' | 'production';
  color: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegionResponse {
  id: string;
  track_id: string;
  user_id: string;
  start_time_ms: number;
  end_time_ms: number;
  name: string;
  section_type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'breakdown' | 'buildup' | 'drop' | 'outro' | 'custom';
  color: string;
  is_loop: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FrameManifestResponse {
  version: string;
  hop_ms: number;
  frame_count: number;
  duration_ms: number;
  sample_rate: number;
  bands: BandDefinition[];
  bytes_per_frame: number;
  frame_layout: FrameLayoutEntry[];
  fingerprint: string | null;
  analyzer_version: string;
  chunk_size_frames: number;
  total_chunks: number;
}

export interface BandDefinition {
  name: string;
  data_type: 'float32' | 'float64' | 'int16' | 'uint8';
  size: number;
  description?: string;
  unit?: string;
  min_value?: number;
  max_value?: number;
}

export interface FrameLayoutEntry {
  band_name: string;
  byte_offset: number;
  byte_size: number;
}

export interface FrameChunkResponse {
  chunk_index: number;
  start_frame: number;
  end_frame: number;
  start_time_ms: number;
  end_time_ms: number;
  frame_count: number;
  data_base64: string;
}

export interface FrameDataResponse {
  manifest: FrameManifestResponse;
  requested_range: { from_ms: number; to_ms: number };
  actual_range: { from_ms: number; to_ms: number };
  chunks: FrameChunkResponse[];
  total_frames: number;
  total_bytes: number;
}

export interface AnalysisEvent {
  type: string;
  time_ms: number;
  duration_ms?: number;
  confidence?: number;
  data?: Record<string, unknown>;
}

export interface EventsResponse {
  analysis_id: string;
  events: AnalysisEvent[];
  count: number;
}

export interface SignedUrlResponse {
  url: string;
  expires_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

// ============================================
// Input Types
// ============================================

export interface CreateTrackInput {
  name: string;
  description?: string;
  r2_key: string;
  file_size_bytes: number;
  mime_type: string;
  duration_seconds?: number;
  artist?: string;
  album?: string;
  genre?: string;
  bpm?: number;
  key_signature?: string;
  tags?: string[];
}

export interface UpdateTrackInput {
  name?: string;
  description?: string;
  duration_seconds?: number;
  artist?: string;
  album?: string;
  genre?: string;
  bpm?: number;
  key_signature?: string;
  tags?: string[];
}

export interface CreateAnnotationInput {
  start_time_ms: number;
  end_time_ms?: number;
  title: string;
  content?: string;
  category?: AnnotationResponse['category'];
  color?: string;
  is_private?: boolean;
}

export interface UpdateAnnotationInput {
  start_time_ms?: number;
  end_time_ms?: number;
  title?: string;
  content?: string;
  category?: AnnotationResponse['category'];
  color?: string;
}

export interface CreateRegionInput {
  start_time_ms: number;
  end_time_ms: number;
  name: string;
  section_type?: RegionResponse['section_type'];
  color?: string;
  is_loop?: boolean;
  notes?: string;
}

export interface UpdateRegionInput {
  start_time_ms?: number;
  end_time_ms?: number;
  name?: string;
  section_type?: RegionResponse['section_type'];
  color?: string;
  is_loop?: boolean;
  notes?: string;
}

// ============================================
// Reference Tracks API
// ============================================

export const referenceTracksApi = {
  // --- Tracks ---

  async listTracks(page = 1, pageSize = 20): Promise<PaginatedResponse<ReferenceTrackResponse>> {
    return api.get<PaginatedResponse<ReferenceTrackResponse>>(
      `/reference/tracks?page=${page}&page_size=${pageSize}`
    );
  },

  async getTrack(id: string): Promise<ReferenceTrackResponse> {
    return api.get<ReferenceTrackResponse>(`/reference/tracks/${id}`);
  },

  async createTrack(input: CreateTrackInput): Promise<ReferenceTrackResponse> {
    return api.post<ReferenceTrackResponse>('/reference/tracks', { body: input });
  },

  async updateTrack(id: string, input: UpdateTrackInput): Promise<ReferenceTrackResponse> {
    return api.patch<ReferenceTrackResponse>(`/reference/tracks/${id}`, { body: input });
  },

  async deleteTrack(id: string): Promise<void> {
    return api.delete(`/reference/tracks/${id}`);
  },

  // --- Upload ---

  async initUpload(filename: string, mimeType: string, fileSize: number): Promise<SignedUrlResponse & { r2_key: string }> {
    return api.post<SignedUrlResponse & { r2_key: string }>('/reference/upload/init', {
      body: { filename, mime_type: mimeType, file_size: fileSize }
    });
  },

  async uploadFile(signedUrl: string, file: File): Promise<void> {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
  },

  // --- Streaming ---

  async getStreamUrl(trackId: string): Promise<SignedUrlResponse> {
    return api.get<SignedUrlResponse>(`/reference/tracks/${trackId}/stream`);
  },

  // --- Analysis ---

  async getAnalysis(trackId: string): Promise<TrackAnalysisResponse | null> {
    try {
      return await api.get<TrackAnalysisResponse>(`/reference/tracks/${trackId}/analysis`);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.isNotFound()) {
        return null;
      }
      throw e;
    }
  },

  async startAnalysis(trackId: string, analysisType = 'full'): Promise<TrackAnalysisResponse> {
    return api.post<TrackAnalysisResponse>(`/reference/tracks/${trackId}/analysis`, {
      body: { analysis_type: analysisType }
    });
  },

  // --- Annotations ---

  async listAnnotations(trackId: string): Promise<AnnotationResponse[]> {
    const result = await api.get<{ annotations: AnnotationResponse[] }>(
      `/reference/tracks/${trackId}/annotations`
    );
    return result.annotations;
  },

  async getAnnotation(annotationId: string): Promise<AnnotationResponse> {
    return api.get<AnnotationResponse>(`/reference/annotations/${annotationId}`);
  },

  async createAnnotation(trackId: string, input: CreateAnnotationInput): Promise<AnnotationResponse> {
    return api.post<AnnotationResponse>(`/reference/tracks/${trackId}/annotations`, { body: input });
  },

  async updateAnnotation(annotationId: string, input: UpdateAnnotationInput): Promise<AnnotationResponse> {
    return api.patch<AnnotationResponse>(`/reference/annotations/${annotationId}`, { body: input });
  },

  async deleteAnnotation(annotationId: string): Promise<void> {
    return api.delete(`/reference/annotations/${annotationId}`);
  },

  // --- Regions ---

  async listRegions(trackId: string): Promise<RegionResponse[]> {
    const result = await api.get<{ regions: RegionResponse[] }>(
      `/reference/tracks/${trackId}/regions`
    );
    return result.regions;
  },

  async getRegion(regionId: string): Promise<RegionResponse> {
    return api.get<RegionResponse>(`/reference/regions/${regionId}`);
  },

  async createRegion(trackId: string, input: CreateRegionInput): Promise<RegionResponse> {
    return api.post<RegionResponse>(`/reference/tracks/${trackId}/regions`, { body: input });
  },

  async updateRegion(regionId: string, input: UpdateRegionInput): Promise<RegionResponse> {
    return api.patch<RegionResponse>(`/reference/regions/${regionId}`, { body: input });
  },

  async deleteRegion(regionId: string): Promise<void> {
    return api.delete(`/reference/regions/${regionId}`);
  },
};

// ============================================
// Frames API
// ============================================

export const framesApi = {
  async getManifest(analysisId: string): Promise<FrameManifestResponse> {
    return api.get<FrameManifestResponse>(`/frames/analysis/${analysisId}/manifest`);
  },

  async getFrames(analysisId: string, fromMs: number, toMs: number): Promise<FrameDataResponse> {
    return api.get<FrameDataResponse>(
      `/frames/analysis/${analysisId}/frames?from_ms=${fromMs}&to_ms=${toMs}`
    );
  },

  async getChunk(analysisId: string, chunkIndex: number): Promise<FrameChunkResponse> {
    return api.get<FrameChunkResponse>(`/frames/analysis/${analysisId}/chunks/${chunkIndex}`);
  },

  async getEvents(
    analysisId: string,
    options?: { fromMs?: number; toMs?: number; eventType?: string }
  ): Promise<EventsResponse> {
    const params = new URLSearchParams();
    if (options?.fromMs !== undefined) params.set('from_ms', String(options.fromMs));
    if (options?.toMs !== undefined) params.set('to_ms', String(options.toMs));
    if (options?.eventType) params.set('event_type', options.eventType);

    const query = params.toString();
    const url = `/frames/analysis/${analysisId}/events${query ? `?${query}` : ''}`;
    return api.get<EventsResponse>(url);
  },
};

// ============================================
// Frame Data Parsing Utilities
// ============================================

/**
 * Decode base64 frame data into typed arrays
 */
export function decodeFrameData(
  base64Data: string,
  layout: FrameLayoutEntry[],
  frameCount: number
): Map<string, Float32Array> {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const buffer = bytes.buffer;
  const dataView = new DataView(buffer);

  const bytesPerFrame = layout.reduce((sum, entry) => sum + entry.byte_size, 0);
  const result = new Map<string, Float32Array>();

  // Initialize arrays for each band
  for (const entry of layout) {
    const valuesPerFrame = entry.byte_size / 4; // Assuming float32
    result.set(entry.band_name, new Float32Array(frameCount * valuesPerFrame));
  }

  // Parse frames
  for (let f = 0; f < frameCount; f++) {
    const frameOffset = f * bytesPerFrame;

    for (const entry of layout) {
      const bandArray = result.get(entry.band_name)!;
      const valuesPerFrame = entry.byte_size / 4;
      const bandOffset = frameOffset + entry.byte_offset;

      for (let v = 0; v < valuesPerFrame; v++) {
        const value = dataView.getFloat32(bandOffset + v * 4, true); // little-endian
        bandArray[f * valuesPerFrame + v] = value;
      }
    }
  }

  return result;
}

/**
 * Get a single band's data from decoded frames
 */
export function getBandData(
  decodedFrames: Map<string, Float32Array>,
  bandName: string
): Float32Array | null {
  return decodedFrames.get(bandName) ?? null;
}

/**
 * Convert frame index to time in milliseconds
 */
export function frameToTimeMs(frame: number, hopMs: number): number {
  return frame * hopMs;
}

/**
 * Convert time in milliseconds to frame index
 */
export function timeToFrame(timeMs: number, hopMs: number): number {
  return Math.floor(timeMs / hopMs);
}

