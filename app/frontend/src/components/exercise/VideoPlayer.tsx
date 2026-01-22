"use client";

import { useState } from "react";
import styles from "./VideoPlayer.module.css";

interface VideoPlayerProps {
  videoUrl: string | null | undefined;
  title?: string;
  fallback?: React.ReactNode;
}

/**
 * Video Player Component
 * 
 * Gracefully handles exercise video embedding with:
 * - YouTube URL detection and conversion to embed format
 * - Fallback for invalid/missing URLs
 * - Error handling with user-friendly messages
 * - Responsive sizing
 * 
 * Supported formats:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/v/VIDEO_ID
 */
export function VideoPlayer({ videoUrl, title, fallback }: VideoPlayerProps) {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Early return if no URL provided
  if (!videoUrl) {
    return (
      <div className={styles.videoPlaceholder}>
        {fallback || (
          <div className={styles.placeholder}>
            <p>📹 No video available</p>
            <p className={styles.subtitle}>Check back soon for a demonstration</p>
          </div>
        )}
      </div>
    );
  }

  /**
   * Extract YouTube video ID from various URL formats
   * Returns null if URL is not a valid YouTube URL
   */
  function extractYoutubeId(url: string): string | null {
    try {
      const urlObj = new URL(url);
      
      // Format: youtu.be/VIDEO_ID
      if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.substring(1);
      }
      
      // Format: youtube.com/watch?v=VIDEO_ID or youtube.com/v/VIDEO_ID
      if (urlObj.hostname.includes("youtube.com")) {
        const id = urlObj.searchParams.get("v");
        if (id) return id;
        
        // Format: /v/VIDEO_ID
        const pathMatch = urlObj.pathname.match(/\/v\/(.+)/);
        if (pathMatch) return pathMatch[1];
        
        // Format: /embed/VIDEO_ID
        const embedMatch = urlObj.pathname.match(/\/embed\/(.+)/);
        if (embedMatch) return embedMatch[1];
      }
    } catch {
      // Invalid URL format
      return null;
    }

    // If URL is already in embed format or direct ID
    if (url.match(/^[a-zA-Z0-9_-]{11}$/)) {
      return url;
    }

    return null;
  }

  const videoId = extractYoutubeId(videoUrl);

  // Handle invalid video URL
  if (!videoId || error) {
    return (
      <div className={styles.videoError}>
        <div className={styles.errorContent}>
          <p>⚠️ Video unavailable</p>
          <p className={styles.errorDetails}>
            {error ? "Failed to load video" : "Invalid video URL format"}
          </p>
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
            >
              Watch on YouTube →
            </a>
          )}
        </div>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <div className={styles.videoContainer}>
      <div className={styles.videoWrapper}>
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
          </div>
        )}
        <iframe
          src={embedUrl}
          title={title}
          className={styles.videoFrame}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
        />
      </div>
    </div>
  );
}
