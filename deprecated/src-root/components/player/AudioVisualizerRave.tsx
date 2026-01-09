"use client";

/**
 * Rave Audio Visualizer Component
 * Intense, dynamic audio visualization with particle effects and reactive motion
 */

import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./AudioVisualizer.module.css";

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  onClose: () => void;
}

type VisualizerMode = "rave" | "pulse" | "tunnel" | "particles" | "spectrum3d";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}

export function AudioVisualizer({ audioElement, isPlaying, onClose }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const beatRef = useRef({ detected: false, lastBeat: 0, energy: 0, avgEnergy: 0 });
  const historyRef = useRef<number[]>([]);

  const [mode, setMode] = useState<VisualizerMode>("rave");
  const [intensity, setIntensity] = useState(2.0);
  const [colorMode, setColorMode] = useState<"rainbow" | "neon" | "fire" | "ice">("rainbow");

  // Initialize audio context and analyzer
  useEffect(() => {
    if (!audioElement) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audioElement);
      }

      if (!analyzerRef.current) {
        analyzerRef.current = audioContext.createAnalyser();
        analyzerRef.current.fftSize = 512; // More frequency bands
        analyzerRef.current.smoothingTimeConstant = 0.6; // Less smoothing = more reactive

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

  // Beat detection
  const detectBeat = useCallback((dataArray: Uint8Array) => {
    // Calculate current energy (bass frequencies)
    let energy = 0;
    for (let i = 0; i < 10; i++) {
      energy += dataArray[i];
    }
    energy /= 10;

    // Update rolling average
    historyRef.current.push(energy);
    if (historyRef.current.length > 30) {
      historyRef.current.shift();
    }

    const avgEnergy = historyRef.current.reduce((a, b) => a + b, 0) / historyRef.current.length;
    const now = performance.now();

    // Beat detected if energy is significantly above average and enough time has passed
    const isBeat = energy > avgEnergy * 1.3 && energy > 100 && (now - beatRef.current.lastBeat) > 100;

    if (isBeat) {
      beatRef.current.lastBeat = now;
      beatRef.current.detected = true;
    } else {
      beatRef.current.detected = false;
    }

    beatRef.current.energy = energy;
    beatRef.current.avgEnergy = avgEnergy;

    return beatRef.current;
  }, []);

  // Get color based on mode and position
  const getColor = useCallback((index: number, total: number, value: number, time: number) => {
    const hueOffset = (time * 50) % 360;

    switch (colorMode) {
      case "rainbow":
        return `hsl(${(index / total) * 360 + hueOffset}, 100%, ${50 + value * 30}%)`;
      case "neon":
        const neonHues = [280, 180, 320, 200]; // Purple, cyan, pink, teal
        const neonHue = neonHues[index % neonHues.length];
        return `hsl(${neonHue}, 100%, ${50 + value * 40}%)`;
      case "fire":
        const fireHue = 30 - value * 30; // Orange to red
        return `hsl(${fireHue}, 100%, ${40 + value * 40}%)`;
      case "ice":
        const iceHue = 180 + value * 40; // Cyan to blue
        return `hsl(${iceHue}, 80%, ${50 + value * 30}%)`;
      default:
        return `hsl(${(index / total) * 360}, 100%, 60%)`;
    }
  }, [colorMode]);

  // Spawn particles on beat
  const spawnParticles = useCallback((canvas: HTMLCanvasElement, count: number, centerX?: number, centerY?: number) => {
    const cx = centerX ?? canvas.width / 2;
    const cy = centerY ?? canvas.height / 2;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        life: 1,
        maxLife: 60 + Math.random() * 60,
        hue: Math.random() * 360,
      });
    }

    // Limit particles
    if (particlesRef.current.length > 500) {
      particlesRef.current = particlesRef.current.slice(-300);
    }
  }, []);

  // Update and draw particles
  const updateParticles = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // Gravity
      p.life -= 1 / p.maxLife;

      if (p.life <= 0) return false;

      const alpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
      ctx.fill();

      // Glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.5})`;

      return true;
    });

    ctx.shadowBlur = 0;
  }, []);

  // Rave visualization - intense bars with beat response
  const drawRave = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number, beat: typeof beatRef.current, time: number) => {
    const barCount = 128;
    const barWidth = canvas.width / barCount;

    // Background pulse on beat
    if (beat.detected) {
      ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      spawnParticles(canvas, 30);
    }

    // Draw bars from both sides
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const value = (dataArray[dataIndex] / 255) * intensity;
      const barHeight = value * canvas.height * 0.5;

      // Extra height on beat
      const beatBoost = beat.detected ? 1.3 : 1;
      const finalHeight = barHeight * beatBoost;

      const x = i * barWidth;
      const centerY = canvas.height / 2;

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(x, centerY - finalHeight, x, centerY + finalHeight);
      const hue = ((i / barCount) * 360 + time * 100) % 360;
      gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.9)`);
      gradient.addColorStop(0.5, `hsla(${hue}, 100%, 50%, 1)`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0.9)`);

      ctx.fillStyle = gradient;

      // Draw mirrored bars
      ctx.fillRect(x, centerY - finalHeight, barWidth - 1, finalHeight);
      ctx.fillRect(x, centerY, barWidth - 1, finalHeight);

      // Glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
    }

    ctx.shadowBlur = 0;
    updateParticles(ctx, canvas);
  }, [intensity, spawnParticles, updateParticles]);

  // Pulse visualization - expanding rings on beat
  const drawPulse = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number, beat: typeof beatRef.current, time: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.9;

    // Calculate average levels for different frequency bands
    const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;
    const mid = dataArray.slice(10, 50).reduce((a, b) => a + b, 0) / 40 / 255;
    const high = dataArray.slice(50, bufferLength).reduce((a, b) => a + b, 0) / (bufferLength - 50) / 255;

    // Multiple pulsing circles
    const ringCount = 5;
    for (let ring = 0; ring < ringCount; ring++) {
      const baseRadius = (maxRadius / ringCount) * (ring + 1);
      const freqValue = ring < 2 ? bass : ring < 4 ? mid : high;
      const pulseRadius = baseRadius * (1 + freqValue * intensity * 0.3);

      const hue = (ring * 60 + time * 80) % 360;

      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.8 - ring * 0.1})`;
      ctx.lineWidth = 3 + freqValue * 5;
      ctx.shadowBlur = 20;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;
      ctx.stroke();
    }

    // Beat burst
    if (beat.detected) {
      spawnParticles(canvas, 50);

      // Flash circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, 0.2)`;
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    updateParticles(ctx, canvas);
  }, [intensity, spawnParticles, updateParticles]);

  // Tunnel visualization - 3D tunnel effect
  const drawTunnel = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number, beat: typeof beatRef.current, time: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const segments = 32;
    const rings = 20;

    for (let ring = rings; ring > 0; ring--) {
      const ringProgress = ring / rings;
      const baseRadius = 50 + ringProgress * Math.min(centerX, centerY) * 0.8;

      // Get frequency data for this ring
      const dataIndex = Math.floor((ring / rings) * bufferLength * 0.5);
      const value = (dataArray[dataIndex] / 255) * intensity;

      // Animate ring movement
      const zOffset = ((time * 2) % 1) * (1 / rings);
      const adjustedRing = (ringProgress + zOffset) % 1;
      const scale = 0.3 + adjustedRing * 0.7;
      const radius = baseRadius * scale * (1 + value * 0.3);

      const hue = (ring * 10 + time * 100) % 360;
      const alpha = adjustedRing * 0.8;

      ctx.beginPath();

      for (let seg = 0; seg <= segments; seg++) {
        const angle = (seg / segments) * Math.PI * 2;
        const wobble = Math.sin(angle * 4 + time * 5) * value * 20;
        const x = centerX + Math.cos(angle) * (radius + wobble);
        const y = centerY + Math.sin(angle) * (radius + wobble);

        if (seg === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
      ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
      ctx.lineWidth = 2 + value * 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${alpha * 0.8})`;
      ctx.stroke();
    }

    if (beat.detected) {
      spawnParticles(canvas, 40);
    }

    ctx.shadowBlur = 0;
    updateParticles(ctx, canvas);
  }, [intensity, spawnParticles, updateParticles]);

  // Particles visualization - reactive particle system
  const drawParticlesMode = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number, beat: typeof beatRef.current, time: number) => {
    const bass = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255;

    // Spawn particles based on audio level
    if (bass > 0.3) {
      const count = Math.floor(bass * 10 * intensity);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = bass * 10;
        const hue = (time * 100 + Math.random() * 60) % 360;
        particlesRef.current.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 3 + bass * 5,
          life: 1,
          maxLife: 100,
          hue,
        });
      }
    }

    if (beat.detected) {
      spawnParticles(canvas, 80);
    }

    // Limit
    if (particlesRef.current.length > 800) {
      particlesRef.current = particlesRef.current.slice(-500);
    }

    updateParticles(ctx, canvas);

    // Center glow
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, 100 + bass * 100
    );
    const hue = (time * 50) % 360;
    gradient.addColorStop(0, `hsla(${hue}, 100%, 60%, ${bass * 0.5})`);
    gradient.addColorStop(1, `hsla(${hue}, 100%, 60%, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [intensity, spawnParticles, updateParticles]);

  // 3D Spectrum visualization
  const drawSpectrum3D = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, dataArray: Uint8Array, bufferLength: number, beat: typeof beatRef.current, time: number) => {
    const barCount = 64;
    const perspective = 0.7;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const value = (dataArray[dataIndex] / 255) * intensity;

      const x = (i / barCount) * canvas.width;
      const barWidth = canvas.width / barCount * 0.8;

      // 3D effect - multiple layers
      const layers = 5;
      for (let layer = layers - 1; layer >= 0; layer--) {
        const depth = layer / layers;
        const layerScale = 1 - depth * perspective;
        const layerY = canvas.height * 0.8 - depth * 30;
        const barHeight = value * canvas.height * 0.6 * layerScale;

        const hue = ((i / barCount) * 360 + time * 60 + layer * 20) % 360;
        const alpha = 1 - depth * 0.6;

        ctx.fillStyle = `hsla(${hue}, 100%, ${50 + depth * 20}%, ${alpha})`;
        ctx.shadowBlur = layer === 0 ? 15 : 0;
        ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.8)`;

        const adjustedX = x + (canvas.width / 2 - x) * depth * 0.2;
        const adjustedWidth = barWidth * layerScale;

        ctx.fillRect(adjustedX, layerY - barHeight, adjustedWidth, barHeight);
      }
    }

    if (beat.detected) {
      spawnParticles(canvas, 30);
    }

    ctx.shadowBlur = 0;
    updateParticles(ctx, canvas);
  }, [intensity, spawnParticles, updateParticles]);

  // Main draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyzer = analyzerRef.current;
    if (!canvas || !analyzer) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);

    // Fade out previous frame for trails
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    timeRef.current += 0.016; // ~60fps
    const beat = detectBeat(dataArray);

    switch (mode) {
      case "rave":
        drawRave(ctx, canvas, dataArray, bufferLength, beat, timeRef.current);
        break;
      case "pulse":
        drawPulse(ctx, canvas, dataArray, bufferLength, beat, timeRef.current);
        break;
      case "tunnel":
        drawTunnel(ctx, canvas, dataArray, bufferLength, beat, timeRef.current);
        break;
      case "particles":
        drawParticlesMode(ctx, canvas, dataArray, bufferLength, beat, timeRef.current);
        break;
      case "spectrum3d":
        drawSpectrum3D(ctx, canvas, dataArray, bufferLength, beat, timeRef.current);
        break;
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [mode, detectBeat, drawRave, drawPulse, drawTunnel, drawParticlesMode, drawSpectrum3D]);

  // Start/stop animation
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
        <h3 className={styles.title}>Rave Visualizer</h3>
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
            {(["rave", "pulse", "tunnel", "particles", "spectrum3d"] as VisualizerMode[]).map((m) => (
              <button
                key={m}
                className={`${styles.modeButton} ${mode === m ? styles.active : ""}`}
                onClick={() => setMode(m)}
              >
                {m === "spectrum3d" ? "3D" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label>Intensity: {intensity.toFixed(1)}x</label>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className={styles.slider}
          />
        </div>

        <div className={styles.controlGroup}>
          <label>Colors</label>
          <div className={styles.colorButtons}>
            {(["rainbow", "neon", "fire", "ice"] as const).map((c) => (
              <button
                key={c}
                className={`${styles.colorButton} ${styles[c] || ""} ${colorMode === c ? styles.active : ""}`}
                onClick={() => setColorMode(c)}
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

