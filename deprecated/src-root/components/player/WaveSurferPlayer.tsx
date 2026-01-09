"use client";

/**
 * WaveSurferPlayer Component
 * Uses wavesurfer.js for reliable cross-browser waveform visualization
 */

import { useEffect, useRef, useState } from "react";

interface WaveSurferPlayerProps {
  audioUrl: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  height?: number;
  waveColor?: string;
  progressColor?: string;
  cursorColor?: string;
}

export function WaveSurferPlayer({
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  onSeek,
  height = 32,
  waveColor = "rgba(255, 255, 255, 0.3)",
  progressColor = "var(--color-accent-primary)",
  cursorColor = "var(--color-accent-primary)",
}: WaveSurferPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<import("wavesurfer.js").default | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastUrlRef = useRef<string>("");

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    let ws: import("wavesurfer.js").default | null = null;

    const initWaveSurfer = async () => {
      try {
        const WaveSurfer = (await import("wavesurfer.js")).default;

        if (!containerRef.current) return;

        ws = WaveSurfer.create({
          container: containerRef.current,
          height,
          waveColor,
          progressColor,
          cursorColor,
          cursorWidth: 2,
          barWidth: 2,
          barGap: 1,
          barRadius: 1,
          normalize: true,
          interact: true,
          hideScrollbar: true,
          backend: "WebAudio",
        });

        ws.on("ready", () => {
          setIsReady(true);
          setIsLoading(false);
        });

        ws.on("error", (err) => {
          console.error("[WaveSurferPlayer] Error:", err);
          setIsLoading(false);
        });

        ws.on("interaction", () => {
          if (ws) {
            const seekTime = ws.getCurrentTime();
            onSeek(seekTime);
          }
        });

        wavesurferRef.current = ws;
      } catch (err) {
        console.error("[WaveSurferPlayer] Failed to initialize:", err);
        setIsLoading(false);
      }
    };

    initWaveSurfer();

    return () => {
      if (ws) {
        ws.destroy();
      }
    };
  }, [height, waveColor, progressColor, cursorColor, onSeek]);

  // Load audio URL
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !audioUrl || audioUrl === lastUrlRef.current) return;

    lastUrlRef.current = audioUrl;
    setIsLoading(true);
    setIsReady(false);

    ws.load(audioUrl);
  }, [audioUrl]);

  // Sync playback state
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !isReady) return;

    if (isPlaying && !ws.isPlaying()) {
      // Don't actually play - we're syncing with external audio
      // ws.play();
    } else if (!isPlaying && ws.isPlaying()) {
      ws.pause();
    }
  }, [isPlaying, isReady]);

  // Sync current time (for external audio control)
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !isReady || !duration) return;

    const wsTime = ws.getCurrentTime();
    const diff = Math.abs(wsTime - currentTime);

    // Only seek if difference is significant (to avoid constant seeking)
    if (diff > 0.5) {
      ws.seekTo(currentTime / duration);
    }
  }, [currentTime, duration, isReady]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          opacity: isLoading ? 0.5 : 1,
          transition: "opacity 0.2s ease",
        }}
      />
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-text-muted)",
            fontSize: "12px",
          }}
        >
          Loading waveform...
        </div>
      )}
    </div>
  );
}

export default WaveSurferPlayer;
