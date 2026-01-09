/**
 * AudioSegment Component
 *
 * DROP-IN REPLACEMENT INTEGRATION GUIDE
 * =====================================
 *
 * This component is designed to replace an existing visualizer section.
 * To integrate:
 *
 * 1. Import the component:
 *    import { AudioSegment } from "@/components/audio/AudioSegment";
 *
 * 2. Replace your existing visualizer with:
 *    <AudioSegment
 *      src="/path/to/audio.mp3"
 *      title="Track Title"
 *      artist="Artist Name"
 *      artwork="/path/to/artwork.jpg"
 *    />
 *
 * 3. The component handles all audio playback, visualization, and controls.
 *
 * CORS REQUIREMENTS:
 * For cross-origin audio to work with visualizers, the audio server MUST
 * send proper CORS headers:
 *   Access-Control-Allow-Origin: *  (or specific origin)
 *
 * Without CORS headers, the AudioContext will be unable to analyze the audio
 * due to browser security restrictions.
 *
 * FEATURES:
 * - Three visualizer modes: Butterchurn (Milkdrop), AudioMotion (Spectrum), WaveSurfer
 * - Bass-enhanced audio processing (EQ + compression)
 * - Bass-reactive shake effect
 * - Full keyboard control
 * - Fullscreen support
 * - Media Session API integration
 * - Responsive design
 *
 * Edge-safe: All browser APIs are guarded and only run client-side.
 */

"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Image from "next/image";
import type {
  VisualizerAdapter,
  VisualizerContext,
  VisualizerMode,
  ShakeConfig,
  AudioProcessingConfig,
} from "./types";
import {
  DEFAULT_SHAKE_CONFIG,
  DEFAULT_AUDIO_PROCESSING,
  KEYBOARD_SHORTCUTS,
} from "./types";
import { ButterchurnAdapter } from "./adapters/ButterchurnAdapter";
import { AudioMotionAdapter } from "./adapters/AudioMotionAdapter";
import { WaveSurferAdapter } from "./adapters/WaveSurferAdapter";
import styles from "./AudioSegment.module.css";

// ============================================
// Props
// ============================================

interface AudioSegmentProps {
  /** Audio source URL */
  src: string;
  /** Track title */
  title: string;
  /** Artist name */
  artist?: string;
  /** Album name */
  album?: string;
  /** Artwork URL */
  artwork?: string;
  /** Initial volume (0-1) */
  initialVolume?: number;
  /** Initial visualizer mode */
  initialMode?: VisualizerMode;
  /** Audio processing config (bass enhancement) */
  audioProcessing?: Partial<AudioProcessingConfig>;
  /** Shake effect config */
  shakeConfig?: Partial<ShakeConfig>;
  /** Called when playback state changes */
  onPlayStateChange?: (isPlaying: boolean) => void;
  /** Called when track ends */
  onEnded?: () => void;
  /** Custom class name */
  className?: string;
}

// ============================================
// Mode Labels
// ============================================

const MODE_LABELS: Record<VisualizerMode, string> = {
  butterchurn: "Milkdrop",
  audiomotion: "Spectrum",
  wavesurfer: "Waveform",
};

const MODE_ORDER: VisualizerMode[] = ["butterchurn", "audiomotion", "wavesurfer"];

// ============================================
// Component
// ============================================

export function AudioSegment({
  src,
  title,
  artist,
  album,
  artwork,
  initialVolume = 0.8,
  initialMode = "butterchurn",
  audioProcessing: audioProcessingOverride,
  shakeConfig: shakeConfigOverride,
  onPlayStateChange,
  onEnded,
  className,
}: AudioSegmentProps) {
  // ----------------------------------------
  // Refs
  // ----------------------------------------
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visualContainerRef = useRef<HTMLDivElement>(null);
  const shakeWrapperRef = useRef<HTMLDivElement>(null);

  // Audio graph refs (created once on user gesture)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bassAnalyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Visualizer ref
  const adapterRef = useRef<VisualizerAdapter | null>(null);
  const butterchurnAdapterRef = useRef<ButterchurnAdapter | null>(null);

  // Animation refs
  const shakeRafRef = useRef<number | null>(null);
  const bassEnergyRef = useRef<number>(0);

  // ----------------------------------------
  // State
  // ----------------------------------------
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>(initialMode);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [presetName, setPresetName] = useState<string>("");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Shake config state
  const [shakeEnabled, setShakeEnabled] = useState(DEFAULT_SHAKE_CONFIG.enabled);
  const [shakeConfig] = useState<ShakeConfig>({
    ...DEFAULT_SHAKE_CONFIG,
    ...shakeConfigOverride,
  });

  // Audio processing config
  const [audioConfig] = useState<AudioProcessingConfig>({
    ...DEFAULT_AUDIO_PROCESSING,
    ...audioProcessingOverride,
  });

  // ----------------------------------------
  // Check reduced motion preference
  // ----------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    // If user prefers reduced motion, disable shake by default
    if (mq.matches) {
      setShakeEnabled(false);
    }

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ----------------------------------------
  // Initialize Audio Context (on user gesture)
  // ----------------------------------------
  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current || !audioRef.current) return;

    try {
      // Create AudioContext
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      // Create single MediaElementSourceNode
      const mediaSource = audioCtx.createMediaElementSource(audioRef.current);
      mediaSourceRef.current = mediaSource;

      // Create bass-enhanced audio chain
      // 1. Low shelf filter for bass boost
      const lowShelf = audioCtx.createBiquadFilter();
      lowShelf.type = "lowshelf";
      lowShelf.frequency.value = audioConfig.lowShelfFreq;
      lowShelf.gain.value = audioConfig.lowShelfGain;

      // 2. Peaking filter for sub-bass emphasis
      const subPeak = audioCtx.createBiquadFilter();
      subPeak.type = "peaking";
      subPeak.frequency.value = audioConfig.subPeakFreq;
      subPeak.gain.value = audioConfig.subPeakGain;
      subPeak.Q.value = audioConfig.subPeakQ;

      // 3. Compressor/limiter
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = audioConfig.compThreshold;
      compressor.ratio.value = audioConfig.compRatio;
      compressor.attack.value = audioConfig.compAttack;
      compressor.release.value = audioConfig.compRelease;

      // 4. Gain node for volume control
      const gain = audioCtx.createGain();
      gain.gain.value = volume;
      gainRef.current = gain;

      // 5. Main analyser for visualizers
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // 6. Dedicated bass analyser for shake effect
      // Bandpass filter to isolate bass (20-120 Hz)
      const bassFilter = audioCtx.createBiquadFilter();
      bassFilter.type = "lowpass";
      bassFilter.frequency.value = 120;
      bassFilter.Q.value = 0.7;

      const bassAnalyser = audioCtx.createAnalyser();
      bassAnalyser.fftSize = 256;
      bassAnalyser.smoothingTimeConstant = 0.6;
      bassAnalyserRef.current = bassAnalyser;

      // Connect the chain:
      // mediaSource -> lowShelf -> subPeak -> compressor -> gain -> analyser -> destination
      //                                                       \-> bassFilter -> bassAnalyser
      mediaSource.connect(lowShelf);
      lowShelf.connect(subPeak);
      subPeak.connect(compressor);
      compressor.connect(gain);
      gain.connect(analyser);
      analyser.connect(audioCtx.destination);

      // Bass analysis chain (parallel)
      gain.connect(bassFilter);
      bassFilter.connect(bassAnalyser);

      setIsAudioReady(true);
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
    }
  }, [audioConfig, volume]);

  // ----------------------------------------
  // Mount/Switch Visualizer
  // ----------------------------------------
  const mountVisualizer = useCallback(async (mode: VisualizerMode) => {
    if (!visualContainerRef.current || !audioRef.current || !audioCtxRef.current || !analyserRef.current || !mediaSourceRef.current) {
      return;
    }

    // Unmount current adapter
    if (adapterRef.current) {
      adapterRef.current.unmount();
      adapterRef.current = null;
    }

    // Clear container
    visualContainerRef.current.innerHTML = "";

    // Create new adapter
    let adapter: VisualizerAdapter;

    switch (mode) {
      case "butterchurn":
        const bcAdapter = new ButterchurnAdapter();
        butterchurnAdapterRef.current = bcAdapter;
        adapter = bcAdapter;
        break;
      case "audiomotion":
        adapter = new AudioMotionAdapter();
        butterchurnAdapterRef.current = null;
        break;
      case "wavesurfer":
        adapter = new WaveSurferAdapter();
        butterchurnAdapterRef.current = null;
        break;
    }

    adapterRef.current = adapter;

    // Mount
    const context: VisualizerContext = {
      audioEl: audioRef.current,
      audioCtx: audioCtxRef.current,
      mediaSourceNode: mediaSourceRef.current,
      analyserNode: analyserRef.current,
      containerEl: visualContainerRef.current,
    };

    try {
      await adapter.mount(context);

      // Update preset name for Butterchurn
      if (mode === "butterchurn" && butterchurnAdapterRef.current) {
        setPresetName(butterchurnAdapterRef.current.getCurrentPresetName());
      } else {
        setPresetName("");
      }
    } catch (error) {
      console.error("Failed to mount visualizer:", error);
    }
  }, []);

  // ----------------------------------------
  // Bass-reactive Shake Effect
  // ----------------------------------------
  const updateShake = useCallback(() => {
    if (!bassAnalyserRef.current || !shakeWrapperRef.current) {
      shakeRafRef.current = requestAnimationFrame(updateShake);
      return;
    }

    const bassAnalyser = bassAnalyserRef.current;
    const wrapper = shakeWrapperRef.current;

    // Get frequency data
    const dataArray = new Uint8Array(bassAnalyser.frequencyBinCount);
    bassAnalyser.getByteFrequencyData(dataArray);

    // Calculate bass energy (average of first few bins which represent bass)
    const bassRange = Math.floor(bassAnalyser.frequencyBinCount * 0.3);
    let sum = 0;
    for (let i = 0; i < bassRange; i++) {
      sum += dataArray[i];
    }
    const rawEnergy = sum / (bassRange * 255);

    // Apply smoothing
    const smoothedEnergy =
      bassEnergyRef.current * shakeConfig.smoothing +
      rawEnergy * (1 - shakeConfig.smoothing);
    bassEnergyRef.current = smoothedEnergy;

    // Apply shake if enabled and above threshold
    if (shakeEnabled && smoothedEnergy > shakeConfig.threshold && isPlaying) {
      const intensity = shakeConfig.intensity;
      const energyFactor = (smoothedEnergy - shakeConfig.threshold) / (1 - shakeConfig.threshold);

      // Calculate transforms
      const translateX = (Math.random() - 0.5) * 2 * shakeConfig.maxTranslate * energyFactor * intensity;
      const translateY = (Math.random() - 0.5) * 2 * shakeConfig.maxTranslate * energyFactor * intensity;
      const rotate = (Math.random() - 0.5) * 2 * shakeConfig.maxRotate * energyFactor * intensity;
      const scale = 1 + (shakeConfig.maxScale - 1) * energyFactor * intensity;

      wrapper.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale})`;
    } else {
      // Decay to neutral
      wrapper.style.transform = "translate(0, 0) rotate(0deg) scale(1)";
    }

    shakeRafRef.current = requestAnimationFrame(updateShake);
  }, [shakeEnabled, shakeConfig, isPlaying]);

  // Start shake loop when audio is ready
  useEffect(() => {
    if (isAudioReady) {
      shakeRafRef.current = requestAnimationFrame(updateShake);
    }

    return () => {
      if (shakeRafRef.current) {
        cancelAnimationFrame(shakeRafRef.current);
      }
    };
  }, [isAudioReady, updateShake]);

  // ----------------------------------------
  // Media Session API
  // ----------------------------------------
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const metadata: MediaMetadataInit = {
      title,
      artist: artist || "",
      album: album || "",
    };

    if (artwork) {
      metadata.artwork = [
        { src: artwork, sizes: "512x512", type: "image/png" },
      ];
    }

    navigator.mediaSession.metadata = new MediaMetadata(metadata);

    // Set up action handlers
    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play();
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });

    navigator.mediaSession.setActionHandler("seekbackward", () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
      }
    });

    navigator.mediaSession.setActionHandler("seekforward", () => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.min(
          audioRef.current.duration || 0,
          audioRef.current.currentTime + 10
        );
      }
    });

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (audioRef.current && details.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
      navigator.mediaSession.setActionHandler("seekto", null);
    };
  }, [title, artist, album, artwork]);

  // ----------------------------------------
  // Transport Controls
  // ----------------------------------------
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    // Initialize audio context on first play (user gesture)
    if (!audioCtxRef.current) {
      initAudioContext();
    }

    // Resume AudioContext if suspended
    if (audioCtxRef.current?.state === "suspended") {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }
  }, [isPlaying, initAudioContext]);

  const seek = useCallback((delta: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      Math.min(duration, audioRef.current.currentTime + delta)
    );
  }, [duration]);

  const seekTo = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, time));
  }, [duration]);

  const changeVolume = useCallback((delta: number) => {
    setVolume((v) => {
      const newVolume = Math.max(0, Math.min(1, v + delta));
      if (gainRef.current) {
        gainRef.current.gain.value = newVolume;
      }
      if (audioRef.current) {
        audioRef.current.volume = newVolume;
      }
      return newVolume;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const newMuted = !m;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  // ----------------------------------------
  // Fullscreen
  // ----------------------------------------
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, []);

  // Handle fullscreen changes (including Escape key exit)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Resize visualizer on fullscreen change
      if (adapterRef.current) {
        setTimeout(() => adapterRef.current?.resize(), 100);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // ----------------------------------------
  // Mode Switching
  // ----------------------------------------
  const switchMode = useCallback((mode: VisualizerMode) => {
    if (mode === visualizerMode) return;
    setVisualizerMode(mode);
  }, [visualizerMode]);

  const cycleMode = useCallback((direction: 1 | -1) => {
    const currentIndex = MODE_ORDER.indexOf(visualizerMode);
    const newIndex = (currentIndex + direction + MODE_ORDER.length) % MODE_ORDER.length;
    switchMode(MODE_ORDER[newIndex]);
  }, [visualizerMode, switchMode]);

  // Mount visualizer when mode changes or audio becomes ready
  useEffect(() => {
    if (isAudioReady) {
      mountVisualizer(visualizerMode);
    }
  }, [visualizerMode, isAudioReady, mountVisualizer]);

  // ----------------------------------------
  // Preset Controls (Butterchurn only)
  // ----------------------------------------
  const nextPreset = useCallback(() => {
    if (butterchurnAdapterRef.current) {
      butterchurnAdapterRef.current.nextPreset();
      setPresetName(butterchurnAdapterRef.current.getCurrentPresetName());
    }
  }, []);

  const prevPreset = useCallback(() => {
    if (butterchurnAdapterRef.current) {
      butterchurnAdapterRef.current.previousPreset();
      setPresetName(butterchurnAdapterRef.current.getCurrentPresetName());
    }
  }, []);

  // ----------------------------------------
  // Keyboard Controls
  // ----------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const shiftKey = e.shiftKey;

      switch (key) {
        case KEYBOARD_SHORTCUTS.PLAY_PAUSE:
          e.preventDefault();
          togglePlayPause();
          break;

        case KEYBOARD_SHORTCUTS.SEEK_BACK.toLowerCase():
          e.preventDefault();
          seek(shiftKey ? -15 : -5);
          break;

        case KEYBOARD_SHORTCUTS.SEEK_FORWARD.toLowerCase():
          e.preventDefault();
          seek(shiftKey ? 15 : 5);
          break;

        case KEYBOARD_SHORTCUTS.VOLUME_DOWN.toLowerCase():
          e.preventDefault();
          changeVolume(shiftKey ? -0.1 : -0.05);
          break;

        case KEYBOARD_SHORTCUTS.VOLUME_UP.toLowerCase():
          e.preventDefault();
          changeVolume(shiftKey ? 0.1 : 0.05);
          break;

        case KEYBOARD_SHORTCUTS.MODE_BUTTERCHURN:
          e.preventDefault();
          switchMode("butterchurn");
          break;

        case KEYBOARD_SHORTCUTS.MODE_AUDIOMOTION:
          e.preventDefault();
          switchMode("audiomotion");
          break;

        case KEYBOARD_SHORTCUTS.MODE_WAVESURFER:
          e.preventDefault();
          switchMode("wavesurfer");
          break;

        case KEYBOARD_SHORTCUTS.MODE_PREV:
          e.preventDefault();
          cycleMode(-1);
          break;

        case KEYBOARD_SHORTCUTS.MODE_NEXT:
          e.preventDefault();
          cycleMode(1);
          break;

        case KEYBOARD_SHORTCUTS.FULLSCREEN:
          e.preventDefault();
          toggleFullscreen();
          break;

        case KEYBOARD_SHORTCUTS.PRESET_NEXT:
          e.preventDefault();
          nextPreset();
          break;

        case KEYBOARD_SHORTCUTS.PRESET_PREV:
          e.preventDefault();
          prevPreset();
          break;

        case KEYBOARD_SHORTCUTS.SHAKE_TOGGLE:
          e.preventDefault();
          setShakeEnabled((s) => !s);
          break;

        case KEYBOARD_SHORTCUTS.HELP_TOGGLE:
          e.preventDefault();
          setShowHelp((h) => !h);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayPause, seek, changeVolume, switchMode, cycleMode, toggleFullscreen, nextPreset, prevPreset]);

  // ----------------------------------------
  // Audio Event Handlers
  // ----------------------------------------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [onPlayStateChange, onEnded]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  // ----------------------------------------
  // Cleanup
  // ----------------------------------------
  useEffect(() => {
    return () => {
      // Cleanup visualizer
      if (adapterRef.current) {
        adapterRef.current.unmount();
      }

      // Cleanup shake animation
      if (shakeRafRef.current) {
        cancelAnimationFrame(shakeRafRef.current);
      }

      // Cleanup AudioContext
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // ----------------------------------------
  // Format time helper
  // ----------------------------------------
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ----------------------------------------
  // Render
  // ----------------------------------------
  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isFullscreen ? styles.fullscreen : ""} ${className || ""}`}
    >
      {/* Hidden audio element - crossOrigin required for audio analysis */}
      <audio
        ref={audioRef}
        src={src}
        crossOrigin="anonymous"
        preload="metadata"
      />

      {/* Shake wrapper - this layer receives the bass-reactive transform */}
      <div ref={shakeWrapperRef} className={styles.shakeWrapper}>
        {/* Visual container - visualizers render here */}
        <div ref={visualContainerRef} className={styles.visualContainer} />
      </div>

      {/* Metadata overlay */}
      <div className={styles.metadataOverlay}>
        {artwork && (
          <Image
            src={artwork}
            alt={title}
            width={48}
            height={48}
            className={styles.artwork}
            unoptimized
          />
        )}
        <div className={styles.trackInfo}>
          <div className={styles.trackTitle}>{title}</div>
          {artist && <div className={styles.trackArtist}>{artist}</div>}
        </div>
      </div>

      {/* Mode and preset indicator */}
      <div className={styles.modeIndicator}>
        <span className={styles.modeName}>{MODE_LABELS[visualizerMode]}</span>
        {presetName && visualizerMode === "butterchurn" && (
          <span className={styles.presetName}>{presetName}</span>
        )}
      </div>

      {/* Controls bar */}
      <div className={styles.controlsBar}>
        {/* Play/Pause */}
        <button
          className={styles.controlButton}
          onClick={togglePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Time display */}
        <span className={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Seek scrubber */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          className={styles.seekSlider}
          aria-label="Seek"
        />

        {/* Volume */}
        <button
          className={styles.controlButton}
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
            {isMuted || volume === 0 ? (
              <>
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" />
                <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" />
              </>
            ) : (
              <>
                <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
                <path d="M15.54,8.46a5,5,0,0,1,0,7.07" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M19.07,5a10,10,0,0,1,0,14" fill="none" stroke="currentColor" strokeWidth="2" />
              </>
            )}
          </svg>
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setIsMuted(false);
            setVolume(parseFloat(e.target.value));
          }}
          className={styles.volumeSlider}
          aria-label="Volume"
        />

        {/* Mode selector */}
        <div className={styles.modeSelector}>
          {MODE_ORDER.map((mode, index) => (
            <button
              key={mode}
              className={`${styles.modeButton} ${visualizerMode === mode ? styles.active : ""}`}
              onClick={() => switchMode(mode)}
              aria-label={`Switch to ${MODE_LABELS[mode]}`}
              title={`${MODE_LABELS[mode]} (${index + 1})`}
            >
              {MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        {/* Shake toggle */}
        <button
          className={`${styles.controlButton} ${shakeEnabled ? styles.active : ""}`}
          onClick={() => setShakeEnabled((s) => !s)}
          aria-label={shakeEnabled ? "Disable shake" : "Enable shake"}
          title="Bass Shake (S)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
            <path d="M12,2 L14,8 L20,8 L15,12 L17,18 L12,14 L7,18 L9,12 L4,8 L10,8 Z" />
          </svg>
        </button>

        {/* Fullscreen */}
        <button
          className={styles.controlButton}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title="Fullscreen (F)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon}>
            {isFullscreen ? (
              <>
                <polyline points="4,14 4,20 10,20" />
                <polyline points="20,10 20,4 14,4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </>
            ) : (
              <>
                <polyline points="15,3 21,3 21,9" />
                <polyline points="9,21 3,21 3,15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </>
            )}
          </svg>
        </button>

        {/* Help toggle */}
        <button
          className={styles.controlButton}
          onClick={() => setShowHelp((h) => !h)}
          aria-label="Show keyboard shortcuts"
          title="Help (?)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">?</text>
          </svg>
        </button>
      </div>

      {/* Help overlay */}
      {showHelp && (
        <div className={styles.helpOverlay} onClick={() => setShowHelp(false)}>
          <div className={styles.helpContent} onClick={(e) => e.stopPropagation()}>
            <h3>Keyboard Shortcuts</h3>
            <div className={styles.shortcutList}>
              <div className={styles.shortcut}><kbd>Space</kbd> Play/Pause</div>
              <div className={styles.shortcut}><kbd>Left/Right</kbd> Seek +/-5s</div>
              <div className={styles.shortcut}><kbd>Shift+Left/Right</kbd> Seek +/-15s</div>
              <div className={styles.shortcut}><kbd>Up/Down</kbd> Volume +/-5%</div>
              <div className={styles.shortcut}><kbd>Shift+Up/Down</kbd> Volume +/-10%</div>
              <div className={styles.shortcut}><kbd>1</kbd> Milkdrop visualizer</div>
              <div className={styles.shortcut}><kbd>2</kbd> Spectrum analyzer</div>
              <div className={styles.shortcut}><kbd>3</kbd> Waveform</div>
              <div className={styles.shortcut}><kbd>[</kbd> / <kbd>]</kbd> Cycle modes</div>
              <div className={styles.shortcut}><kbd>N</kbd> / <kbd>P</kbd> Next/Prev preset</div>
              <div className={styles.shortcut}><kbd>S</kbd> Toggle bass shake</div>
              <div className={styles.shortcut}><kbd>F</kbd> Toggle fullscreen</div>
              <div className={styles.shortcut}><kbd>?</kbd> Toggle this help</div>
            </div>
            {prefersReducedMotion && (
              <p className={styles.reducedMotionNote}>
                Reduced motion preference detected. Shake disabled by default.
              </p>
            )}
            <button className={styles.closeHelp} onClick={() => setShowHelp(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioSegment;

