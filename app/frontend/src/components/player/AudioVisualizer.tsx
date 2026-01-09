"use client";

/**
 * Audio Visualizer Component
 * Real-time audio visualization for the bottom player
 */

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./AudioVisualizer.module.css";

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  onClose: () => void;
}

type VisualizerMode = "bars" | "waveform" | "circular" | "spectrum";

export function AudioVisualizer({ audioElement, isPlaying, onClose }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [mode, setMode] = useState<VisualizerMode>("bars");
  const [sensitivity, setSensitivity] = useState(1.5);
  const [colorScheme, setColorScheme] = useState<"accent" | "rainbow" | "monochrome">("accent");

  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioElement) return;

    try {
      // Reuse existing context if available
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Only create source once per audio element
      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
      }

      if (!analyzerRef.current) {
        analyzerRef.current = audioContext.createAnalyser();
        analyzerRef.current.fftSize = 256;
        analyzerRef.current.smoothingTimeConstant = 0.8;

        sourceRef.current.connect(analyzerRef.current);
        analyzerRef.current.connect(audioContext.destination);
      }
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement]);

  // Get color based on scheme and position
  const getColor = useCallback((index: number, total: number, value: number) => {
    switch (colorScheme) {
      case "rainbow":
        return `hsl(${(index / total) * 360}, 80%, ${50 + value * 20}%)`;
      case "monochrome":
        return `rgba(255, 255, 255, ${0.3 + value * 0.7})`;
      case "accent":
      default:
        return `rgba(99, 102, 241, ${0.5 + value * 0.5})`;
    }
  }, [colorScheme]);

  // Draw visualization
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyzer = analyzerRef.current;
    if (!canvas || !analyzer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (mode) {
      case "bars":
        drawBars(ctx, canvas, dataArray, bufferLength);
        break;
      case "waveform":
        drawWaveform(ctx, canvas, analyzer);
        break;
      case "circular":
        drawCircular(ctx, canvas, dataArray, bufferLength);
        break;
      case "spectrum":
        drawSpectrum(ctx, canvas, dataArray, bufferLength);
        break;
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [mode, sensitivity, getColor]);

  // Bar visualization
  const drawBars = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number) => {
    const barCount = 64;
    const barWidth = (canvas.width / barCount) * 0.8;
    const gap = (canvas.width / barCount) * 0.2;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const value = (dataArray[dataIndex] / 255) * sensitivity;
      const barHeight = value * canvas.height * 0.8;

      const x = i * (barWidth + gap);
      const y = canvas.height - barHeight;

      ctx.fillStyle = getColor(i, barCount, value);
      ctx.fillRect(x, y, barWidth, barHeight);

      // Mirror reflection
      ctx.fillStyle = getColor(i, barCount, value * 0.3);
      ctx.fillRect(x, canvas.height, barWidth, barHeight * 0.2);
    }
  };

  // Waveform visualization
  const drawWaveform = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, analyzer: AnalyserNode) => {
    const bufferLength = analyzer.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteTimeDomainData(dataArray);

    ctx.lineWidth = 2;
    ctx.strokeStyle = getColor(0, 1, 0.8);
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  // Circular visualization
  const drawCircular = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.4;

    for (let i = 0; i < bufferLength; i++) {
      const value = (dataArray[i] / 255) * sensitivity;
      const angle = (i / bufferLength) * Math.PI * 2;
      const lineLength = radius + value * radius * 1.5;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * lineLength;
      const y2 = centerY + Math.sin(angle) * lineLength;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = getColor(i, bufferLength, value);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(99, 102, 241, 0.3)";
    ctx.fill();
  };

  // Spectrum visualization
  const drawSpectrum = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number) => {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (let i = 0; i < bufferLength; i++) {
      const x = (i / bufferLength) * canvas.width;
      const value = (dataArray[i] / 255) * sensitivity;
      const y = canvas.height - value * canvas.height * 0.9;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.8)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.1)");
    ctx.fillStyle = gradient;
    ctx.fill();
  };

  // Start/stop animation based on playing state
  useEffect(() => {
    if (isPlaying && analyzerRef.current) {
      draw();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, draw]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Audio Visualizer</h3>
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} className={styles.canvas} />
        {!isPlaying && (
          <div className={styles.pausedOverlay}>
            <span>Play audio to see visualization</span>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label>Mode</label>
          <div className={styles.modeButtons}>
            {(["bars", "waveform", "circular", "spectrum"] as VisualizerMode[]).map((m) => (
              <button
                key={m}
                className={`${styles.modeButton} ${mode === m ? styles.active : ""}`}
                onClick={() => setMode(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label>Sensitivity: {sensitivity.toFixed(1)}x</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label>Color</label>
          <div className={styles.colorButtons}>
            {(["accent", "rainbow", "monochrome"] as const).map((c) => (
              <button
                key={c}
                className={`${styles.colorButton} ${styles[c]} ${colorScheme === c ? styles.active : ""}`}
                onClick={() => setColorScheme(c)}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

