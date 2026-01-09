"use client";

/**
 * UnifiedBottomBar Component
 * Single stateful bottom bar containing:
 * - Focus timer with circular progress
 * - Audio player with controls
 * - Waveform progress bar
 * - Visualizer popup (iTunes-style)
 * - Analysis popup
 *
 * STORAGE RULE: Focus pause state is fetched from D1 via /api/focus/pause API.
 * localStorage is DEPRECATED for focus_paused_state (behavior-affecting data).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  usePlayerStore,
  useCurrentTrack,
  usePlayerVisible,
  useIsPlaying,
  useCurrentTime,
  useDuration,
  usePlayerSettings,
  togglePlayPause,
  pause,
  seek,
  setVolume,
  formatTime,
  initAudioController,
  loadPlayerSettings,
  loadQueueState,
  migratePlayerStorage,
  loadAndPlay,
  savePlayerSettings,
  clearQueueState,
} from "@/lib/player";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import styles from "./UnifiedBottomBar.module.css";

// ============================================
// Types
// ============================================

interface FocusSession {
  id: string;
  started_at: string;
  planned_duration: number;
  status: "active" | "completed" | "abandoned";
  mode: "focus" | "break" | "long_break";
}

interface PausedState {
  mode: "focus" | "break" | "long_break";
  timeRemaining: number;
  pausedAt: string;
}

const MODE_LABELS: Record<string, string> = {
  focus: "Focus",
  break: "Break",
  long_break: "Long Break",
};

// ============================================
// iTunes-Style Visualizer (Active + Flowing)
// ============================================

interface VisualizerProps {
  isPlaying: boolean;
  onClose: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  size: number;
  type: "spark" | "orb" | "trail";
}

interface Ribbon {
  points: Array<{ x: number; y: number; hue: number }>;
  hue: number;
  width: number;
  speed: number;
  amplitude: number;
  frequency: number;
  phase: number;
}

function ITunesVisualizer({ isPlaying, onClose }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const ribbonsRef = useRef<Ribbon[]>([]);
  const timeRef = useRef(0);
  const bassHistoryRef = useRef<number[]>([]);
  const trebleHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Initialize ribbons on resize
      ribbonsRef.current = [];
      for (let i = 0; i < 5; i++) {
        ribbonsRef.current.push({
          points: [],
          hue: (i / 5) * 360,
          width: 3 + Math.random() * 4,
          speed: 0.5 + Math.random() * 1.5,
          amplitude: 50 + Math.random() * 100,
          frequency: 0.01 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };
    resize();
    window.addEventListener("resize", resize);

    // Setup audio analyser
    const audioController = (window as unknown as {
      __audioController?: {
        audio: HTMLAudioElement;
        context?: AudioContext;
        analyser?: AnalyserNode;
        source?: MediaElementAudioSourceNode;
      }
    }).__audioController;

    if (audioController?.audio) {
      try {
        if (!audioController.context) {
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioController.context = new AudioContextClass();
          audioController.source = audioController.context.createMediaElementSource(audioController.audio);
          audioController.analyser = audioController.context.createAnalyser();
          audioController.analyser.fftSize = 512;
          audioController.analyser.smoothingTimeConstant = 0.7;
          audioController.source.connect(audioController.analyser);
          audioController.analyser.connect(audioController.context.destination);
        }
        analyserRef.current = audioController.analyser || null;
      } catch (err) {
        console.error("[Visualizer] Failed to setup audio context:", err);
      }
    }

    let hueBase = 0;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      timeRef.current += 0.016;
      const time = timeRef.current;

      // Get frequency data
      const analyser = analyserRef.current;
      let dataArray: Uint8Array<ArrayBuffer>;
      let bass = 0;
      let mid = 0;
      let treble = 0;
      let overall = 0;

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength) as Uint8Array<ArrayBuffer>;
        analyser.getByteFrequencyData(dataArray);

        // Calculate frequency bands
        const bassEnd = Math.floor(bufferLength * 0.1);
        const midEnd = Math.floor(bufferLength * 0.5);

        for (let i = 0; i < bassEnd; i++) bass += dataArray[i];
        for (let i = bassEnd; i < midEnd; i++) mid += dataArray[i];
        for (let i = midEnd; i < bufferLength; i++) treble += dataArray[i];

        bass = bass / bassEnd / 255;
        mid = mid / (midEnd - bassEnd) / 255;
        treble = treble / (bufferLength - midEnd) / 255;
        overall = (bass + mid + treble) / 3;
      } else {
        // Idle animation
        dataArray = new Uint8Array(128) as Uint8Array<ArrayBuffer>;
        for (let i = 0; i < 128; i++) {
          dataArray[i] = Math.sin(time * 2 + i * 0.1) * 30 + 40;
        }
        bass = 0.3 + Math.sin(time) * 0.1;
        mid = 0.3 + Math.sin(time * 1.3) * 0.1;
        treble = 0.3 + Math.sin(time * 1.7) * 0.1;
        overall = 0.3;
      }

      // Track bass/treble history for reactive effects
      bassHistoryRef.current.push(bass);
      trebleHistoryRef.current.push(treble);
      if (bassHistoryRef.current.length > 30) bassHistoryRef.current.shift();
      if (trebleHistoryRef.current.length > 30) trebleHistoryRef.current.shift();

      // Detect beats
      const avgBass = bassHistoryRef.current.reduce((a, b) => a + b, 0) / bassHistoryRef.current.length;
      const isBeat = bass > avgBass * 1.3 && bass > 0.4;

      // Update hue based on music
      hueBase = (hueBase + 0.3 + overall * 2) % 360;

      // Clear with motion blur effect
      ctx.fillStyle = `rgba(0, 0, 0, ${0.08 + overall * 0.05})`;
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // === LAYER 1: Background glow pulse ===
      const glowRadius = Math.min(width, height) * 0.4 * (1 + bass * 0.3);
      const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
      bgGradient.addColorStop(0, `hsla(${hueBase}, 80%, 50%, ${0.15 + bass * 0.2})`);
      bgGradient.addColorStop(0.5, `hsla(${(hueBase + 60) % 360}, 70%, 40%, ${0.08 + mid * 0.1})`);
      bgGradient.addColorStop(1, "transparent");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // === LAYER 2: Flowing ribbons ===
      ribbonsRef.current.forEach((ribbon, ri) => {
        ribbon.phase += ribbon.speed * 0.02 * (1 + overall);
        ribbon.hue = (hueBase + ri * 72) % 360;

        // Generate ribbon points
        const newPoint = {
          x: width + 50,
          y: centerY + Math.sin(time * ribbon.frequency * 100 + ribbon.phase) * ribbon.amplitude * (1 + bass * 0.5),
          hue: ribbon.hue,
        };
        ribbon.points.push(newPoint);

        // Move points left
        ribbon.points.forEach(p => {
          p.x -= 3 + overall * 5;
          p.y += Math.sin(time * 3 + p.x * 0.01) * (0.5 + treble * 2);
        });

        // Remove off-screen points
        ribbon.points = ribbon.points.filter(p => p.x > -50);

        // Draw ribbon
        if (ribbon.points.length > 2) {
          ctx.beginPath();
          ctx.moveTo(ribbon.points[0].x, ribbon.points[0].y);

          for (let i = 1; i < ribbon.points.length - 1; i++) {
            const xc = (ribbon.points[i].x + ribbon.points[i + 1].x) / 2;
            const yc = (ribbon.points[i].y + ribbon.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(ribbon.points[i].x, ribbon.points[i].y, xc, yc);
          }

          const ribbonGradient = ctx.createLinearGradient(0, 0, width, 0);
          ribbonGradient.addColorStop(0, `hsla(${ribbon.hue}, 80%, 60%, 0)`);
          ribbonGradient.addColorStop(0.3, `hsla(${ribbon.hue}, 80%, 60%, ${0.4 + overall * 0.4})`);
          ribbonGradient.addColorStop(0.7, `hsla(${(ribbon.hue + 30) % 360}, 80%, 60%, ${0.4 + overall * 0.4})`);
          ribbonGradient.addColorStop(1, `hsla(${(ribbon.hue + 60) % 360}, 80%, 60%, 0.1)`);

          ctx.strokeStyle = ribbonGradient;
          ctx.lineWidth = ribbon.width * (1 + bass * 0.5);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
      });

      // === LAYER 3: Central orb with frequency rings ===
      const orbRadius = 60 + bass * 40;

      // Outer rings
      for (let r = 0; r < 5; r++) {
        const ringRadius = orbRadius + r * 25 + Math.sin(time * 2 + r) * 10;
        const ringAlpha = 0.3 - r * 0.05;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${(hueBase + r * 40) % 360}, 70%, 60%, ${ringAlpha * (0.5 + mid)})`;
        ctx.lineWidth = 2 + treble * 3;
        ctx.stroke();
      }

      // Central orb gradient
      const orbGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, orbRadius);
      orbGradient.addColorStop(0, `hsla(${hueBase}, 90%, 70%, ${0.8 + bass * 0.2})`);
      orbGradient.addColorStop(0.5, `hsla(${(hueBase + 40) % 360}, 80%, 50%, 0.5)`);
      orbGradient.addColorStop(1, `hsla(${(hueBase + 80) % 360}, 70%, 40%, 0.1)`);

      ctx.beginPath();
      ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = orbGradient;
      ctx.fill();

      // === LAYER 4: Frequency bars (radial) ===
      const numBars = 64;
      const barData = dataArray.slice(0, numBars);

      for (let i = 0; i < numBars; i++) {
        const angle = (i / numBars) * Math.PI * 2 - Math.PI / 2;
        const amplitude = barData[i] / 255;
        const barLength = amplitude * 80 + 10;

        const innerRadius = orbRadius + 15;
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * (innerRadius + barLength);
        const y2 = centerY + Math.sin(angle) * (innerRadius + barLength);

        const barHue = (hueBase + (i / numBars) * 120) % 360;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `hsla(${barHue}, 80%, ${50 + amplitude * 30}%, ${0.5 + amplitude * 0.5})`;
        ctx.lineWidth = 3 + amplitude * 2;
        ctx.lineCap = "round";
        ctx.stroke();

        // Spawn particles on high amplitude
        if (amplitude > 0.75 && Math.random() > 0.7) {
          particlesRef.current.push({
            x: x2,
            y: y2,
            vx: Math.cos(angle) * (2 + amplitude * 4),
            vy: Math.sin(angle) * (2 + amplitude * 4),
            life: 1,
            maxLife: 1,
            hue: barHue,
            size: 2 + amplitude * 4,
            type: "spark",
          });
        }
      }

      // === LAYER 5: Beat-reactive burst ===
      if (isBeat) {
        // Spawn burst particles
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 8;
          particlesRef.current.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            hue: hueBase + Math.random() * 60,
            size: 3 + Math.random() * 5,
            type: "orb",
          });
        }
      }

      // === LAYER 6: Floating orbs ===
      if (Math.random() > 0.95) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: height + 20,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2,
          life: 1,
          maxLife: 1,
          hue: hueBase + Math.random() * 120,
          size: 5 + Math.random() * 10,
          type: "orb",
        });
      }

      // === Update and draw particles ===
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.type === "orb" ? 0.008 : 0.025;
        p.vx *= 0.98;
        p.vy *= 0.98;

        if (p.type === "orb") {
          p.vy -= 0.02; // Float up
        }

        if (p.life > 0) {
          const alpha = p.life;
          const size = p.size * (p.type === "spark" ? p.life : (0.5 + p.life * 0.5));

          if (p.type === "orb") {
            const orbG = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
            orbG.addColorStop(0, `hsla(${p.hue}, 80%, 70%, ${alpha * 0.8})`);
            orbG.addColorStop(0.5, `hsla(${p.hue}, 70%, 50%, ${alpha * 0.4})`);
            orbG.addColorStop(1, `hsla(${p.hue}, 60%, 40%, 0)`);
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
            ctx.fillStyle = orbG;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${alpha})`;
            ctx.fill();
          }
          return true;
        }
        return false;
      });

      // Limit particles
      if (particlesRef.current.length > 300) {
        particlesRef.current = particlesRef.current.slice(-300);
      }

      // === LAYER 7: Vignette ===
      const vignetteGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.7);
      vignetteGradient.addColorStop(0, "transparent");
      vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, width, height);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);


  return (
    <div className={styles.visualizerPopup}>
      <div className={styles.visualizerHeader}>
        <span className={styles.visualizerTitle}>Visualizer</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close visualizer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <canvas ref={canvasRef} className={styles.visualizerCanvas} />
    </div>
  );
}

// ============================================
// Analysis Popup Component
// ============================================

interface AnalysisPopupProps {
  track: { id: string; title: string; artist?: string };
  onClose: () => void;
}

function AnalysisPopup({ track, onClose }: AnalysisPopupProps) {
  const [analysis, setAnalysis] = useState<{
    bpm?: number;
    key?: string;
    energy?: number;
    sections?: Array<{ start: number; label: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analysis?trackId=${track.id}`);
        if (response.ok) {
          const data = await response.json() as {
            bpm?: number;
            key?: string;
            energy?: number;
            sections?: Array<{ start: number; label: string }>;
          };
          setAnalysis(data);
        }
      } catch (err) {
        console.error("[Analysis] Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [track.id]);

  return (
    <div className={styles.analysisPopup}>
      <div className={styles.analysisHeader}>
        <div>
          <h3 className={styles.analysisTitle}>{track.title}</h3>
          {track.artist && <p className={styles.analysisArtist}>{track.artist}</p>}
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close analysis">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className={styles.analysisContent}>
        {loading ? (
          <p className={styles.analysisLoading}>Analyzing track...</p>
        ) : analysis ? (
          <div className={styles.analysisGrid}>
            {analysis.bpm && (
              <div className={styles.analysisStat}>
                <span className={styles.statLabel}>BPM</span>
                <span className={styles.statValue}>{analysis.bpm}</span>
              </div>
            )}
            {analysis.key && (
              <div className={styles.analysisStat}>
                <span className={styles.statLabel}>Key</span>
                <span className={styles.statValue}>{analysis.key}</span>
              </div>
            )}
            {analysis.energy !== undefined && (
              <div className={styles.analysisStat}>
                <span className={styles.statLabel}>Energy</span>
                <span className={styles.statValue}>{Math.round(analysis.energy * 100)}%</span>
              </div>
            )}
          </div>
        ) : (
          <p className={styles.analysisEmpty}>No analysis available</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function UnifiedBottomBar() {
  // Player state
  const track = useCurrentTrack();
  const isPlayerVisible = usePlayerVisible();
  const isPlaying = useIsPlaying();
  const currentTime = useCurrentTime();
  const duration = useDuration();
  const settings = usePlayerSettings();

  // Focus state
  const [focusSession, setFocusSession] = useState<FocusSession | null>(null);
  const [pausedState, setPausedState] = useState<PausedState | null>(null);
  const [focusTimeRemaining, setFocusTimeRemaining] = useState(0);
  const [focusLoading, setFocusLoading] = useState(true);
  const [showFocusPopup, setShowFocusPopup] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Player UI state
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const audioInitialized = useRef(false);
  const lastLoadedTrackId = useRef<string | null>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  // Initialize audio controller
  useEffect(() => {
    if (audioInitialized.current) return;
    audioInitialized.current = true;

    initAudioController();
    migratePlayerStorage();

    const savedSettings = loadPlayerSettings();
    usePlayerStore.getState().updateSettings(savedSettings);
    setVolume(savedSettings.volume);

    const savedQueue = loadQueueState();
    if (savedQueue && savedQueue.queue.length > 0) {
      usePlayerStore.getState().restoreQueue(
        savedQueue.queue,
        savedQueue.queueIndex,
        savedQueue.currentTime
      );
    }
  }, []);

  // Load new track
  useEffect(() => {
    const state = usePlayerStore.getState();
    if (
      state.currentTrack &&
      state.status === "loading" &&
      state.currentTrack.id !== lastLoadedTrackId.current
    ) {
      lastLoadedTrackId.current = state.currentTrack.id;
      loadAndPlay(state.currentTrack.audioUrl);
    }
  }, [track]);

  // Focus: Check for paused state - D1 is source of truth
  const checkPausedState = useCallback(async () => {
    // Always check D1 first (source of truth)
    try {
      const response = await fetch("/api/focus/pause");
      if (response.ok) {
        const data = await response.json() as { pauseState: PausedState | null };
        if (data.pauseState) {
          setPausedState(data.pauseState);
          setFocusTimeRemaining(data.pauseState.timeRemaining);
          return true;
        }
      }
    } catch {
      // Ignore D1 fetch errors
    }

    // Only fall back to localStorage if deprecation is disabled
    if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
      try {
        const stored = localStorage.getItem("focus_paused_state");
        if (stored) {
          const parsed = JSON.parse(stored) as PausedState;
          const pausedTime = new Date(parsed.pausedAt).getTime();
          const hourAgo = Date.now() - 60 * 60 * 1000;
          if (pausedTime > hourAgo) {
            setPausedState(parsed);
            setFocusTimeRemaining(parsed.timeRemaining);
            return true;
          } else {
            localStorage.removeItem("focus_paused_state");
          }
        }
      } catch {
        localStorage.removeItem("focus_paused_state");
      }
    }

    setPausedState(null);
    return false;
  }, []);

  // Focus: Fetch active session
  const fetchFocusSession = useCallback(async () => {
    try {
      const response = await fetch("/api/focus/active");
      if (response.ok) {
        const data = await response.json() as { session?: FocusSession | null };
        if (data.session && data.session.status === "active") {
          setFocusSession(data.session);
          setPausedState(null);
          const startTime = new Date(data.session.started_at).getTime();
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const remaining = Math.max(0, data.session.planned_duration - elapsed);
          setFocusTimeRemaining(remaining);
        } else {
          setFocusSession(null);
          await checkPausedState();
        }
      }
    } catch {
      // Ignore
    } finally {
      setFocusLoading(false);
    }
  }, [checkPausedState]);

  // Focus: Initialize
  useEffect(() => {
    checkPausedState();
    fetchFocusSession();
    const pollInterval = setInterval(fetchFocusSession, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchFocusSession, checkPausedState]);

  // Focus: Timer countdown
  useEffect(() => {
    if (!focusSession || focusSession.status !== "active") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setFocusTimeRemaining((prev) => {
        if (prev <= 1) {
          fetchFocusSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [focusSession, fetchFocusSession]);

  // Body padding
  useEffect(() => {
    const showBar = (!focusLoading && (focusSession || pausedState)) || (isPlayerVisible && track);
    if (showBar) {
      document.body.style.paddingBottom = "90px";
    } else {
      document.body.style.paddingBottom = "";
    }
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [focusLoading, focusSession, pausedState, isPlayerVisible, track]);

  // Handlers
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    seek(percent * duration);
  }, [duration]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    usePlayerStore.getState().updateSettings({ volume: value });
    savePlayerSettings({ ...settings, volume: value });
  }, [settings]);

  const handleClosePlayer = useCallback(() => {
    pause();
    usePlayerStore.getState().clearQueue();
    clearQueueState();
    lastLoadedTrackId.current = null;
    usePlayerStore.getState().setVisible(false);
    setShowVisualizer(false);
    setShowAnalysis(false);
  }, []);

  const handleDismissFocus = useCallback(async () => {
    // Always clean up localStorage (even if deprecated, for cleanup)
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("focus_paused_state");
    }
    setPausedState(null);
    // Clear from D1 (source of truth)
    try {
      await fetch("/api/focus/pause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
    } catch { /* ignore */ }
  }, []);

  // Computed state
  const isFocusActive = focusSession !== null && focusSession.status === "active";
  const isFocusPaused = !focusSession && pausedState !== null;
  const showFocus = !focusLoading && (isFocusActive || isFocusPaused);
  const showPlayer = isPlayerVisible && track;
  const showBar = showFocus || showPlayer;

  if (!showBar) return null;

  const currentMode = focusSession?.mode || pausedState?.mode || "focus";
  const focusTotalDuration = focusSession?.planned_duration || (pausedState?.timeRemaining ? pausedState.timeRemaining * 2 : 25 * 60);
  const focusProgress = focusTotalDuration > 0 ? 1 - (focusTimeRemaining / focusTotalDuration) : 0;

  // Circular progress
  const circleRadius = 18;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - focusProgress);

  // Player progress
  const playerProgress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div className={styles.bottomBar}>
        <div className={styles.content}>
          {/* Focus Section */}
          {showFocus && (
            <div className={styles.focusSection}>
              <button
                className={styles.focusDialButton}
                onClick={() => setShowFocusPopup(true)}
                aria-label="Open focus timer"
              >
                <div className={styles.circularTimer}>
                  <svg className={styles.circularSvg} viewBox="0 0 44 44">
                    <circle
                      cx="22"
                      cy="22"
                      r={circleRadius}
                      fill="none"
                      stroke="var(--color-border-primary)"
                      strokeWidth={strokeWidth}
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r={circleRadius}
                      fill="none"
                      stroke="var(--color-accent-primary)"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      transform="rotate(-90 22 22)"
                      className={styles.progressCircle}
                    />
                  </svg>
                  <span className={styles.focusModeIcon}>
                    {currentMode === "focus" ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                        <line x1="12" y1="2" x2="12" y2="12" />
                      </svg>
                    )}
                  </span>
                </div>
              </button>
              <div className={styles.focusInfo}>
                <span className={styles.focusMode}>{MODE_LABELS[currentMode]}</span>
                {isFocusPaused && <span className={styles.pausedBadge}>Paused</span>}
              </div>
              {isFocusPaused && (
                <button className={styles.dismissBtn} onClick={handleDismissFocus} aria-label="Dismiss">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Separator */}
          {showFocus && showPlayer && <div className={styles.separator} />}

          {/* Player Section */}
          {showPlayer && (
            <div className={styles.playerSection}>
              {/* Waveform / Progress Bar */}
              <div className={styles.waveformWrapper} ref={waveformRef} onClick={handleSeek}>
                <div className={styles.waveformTrack}>
                  <div className={styles.waveformProgress} style={{ width: `${playerProgress}%` }} />
                  <div className={styles.waveformBars}>
                    {Array.from({ length: 60 }).map((_, i) => {
                      const height = 20 + Math.sin(i * 0.3) * 30 + Math.cos(i * 0.5) * 20;
                      const isPast = (i / 60) * 100 < playerProgress;
                      return (
                        <div
                          key={i}
                          className={`${styles.waveformBar} ${isPast ? styles.played : ""}`}
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Controls row */}
              <div className={styles.controlsRow}>
                {/* Track info */}
                <div className={styles.trackInfo}>
                  <span className={styles.trackTitle}>{track.title}</span>
                  {track.artist && <span className={styles.trackArtist}>{track.artist}</span>}
                </div>

                {/* Playback controls */}
                <div className={styles.playbackControls}>
                  <button className={styles.controlBtn} onClick={() => usePlayerStore.getState().previous()} aria-label="Previous">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                    </svg>
                  </button>
                  <button className={styles.playBtn} onClick={togglePlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <button className={styles.controlBtn} onClick={() => usePlayerStore.getState().next()} aria-label="Next">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                    </svg>
                  </button>
                </div>

                {/* Time */}
                <div className={styles.timeDisplay}>
                  <span>{formatTime(currentTime)}</span>
                  <span className={styles.timeSep}>/</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Secondary controls */}
                <div className={styles.secondaryControls}>
                  {/* Volume */}
                  <div className={styles.volumeControl}>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                    </svg>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.volume}
                      onChange={handleVolumeChange}
                      className={styles.volumeSlider}
                      aria-label="Volume"
                    />
                  </div>

                  {/* Visualizer toggle */}
                  <button
                    className={`${styles.controlBtn} ${showVisualizer ? styles.active : ""}`}
                    onClick={() => { setShowVisualizer(!showVisualizer); setShowAnalysis(false); }}
                    aria-label="Visualizer"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M4 9v6h2V9H4zm4-3v12h2V6H8zm4-2v16h2V4h-2zm4 4v8h2v-8h-2zm4 2v4h2v-4h-2z" />
                    </svg>
                  </button>

                  {/* Analysis toggle */}
                  <button
                    className={`${styles.controlBtn} ${showAnalysis ? styles.active : ""}`}
                    onClick={() => { setShowAnalysis(!showAnalysis); setShowVisualizer(false); }}
                    aria-label="Analysis"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                    </svg>
                  </button>

                  {/* Close */}
                  <button className={styles.closeBtn} onClick={handleClosePlayer} aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Focus Popup */}
      {showFocusPopup && (
        <div className={styles.popupOverlay} onClick={() => setShowFocusPopup(false)}>
          <div className={styles.focusPopup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.focusPopupHeader}>
              <h3>{MODE_LABELS[currentMode]}</h3>
              <button onClick={() => setShowFocusPopup(false)} className={styles.closeBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.focusPopupContent}>
              <div className={styles.bigCircularTimer}>
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border-primary)" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={(2 * Math.PI * 42) * (1 - focusProgress)}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className={styles.bigTimerText}>
                  {Math.floor(focusTimeRemaining / 60)}:{(focusTimeRemaining % 60).toString().padStart(2, "0")}
                </div>
              </div>
              {isFocusPaused && <p className={styles.pausedText}>Session paused</p>}
              <Link href="/focus" className={styles.openFocusLink} onClick={() => setShowFocusPopup(false)}>
                Open Focus Page
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Visualizer Popup */}
      {showVisualizer && (
        <div className={styles.popupOverlay} onClick={() => setShowVisualizer(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <ITunesVisualizer isPlaying={isPlaying} onClose={() => setShowVisualizer(false)} />
          </div>
        </div>
      )}

      {/* Analysis Popup */}
      {showAnalysis && track && (
        <div className={styles.popupOverlay} onClick={() => setShowAnalysis(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <AnalysisPopup track={track} onClose={() => setShowAnalysis(false)} />
          </div>
        </div>
      )}
    </>
  );
}
