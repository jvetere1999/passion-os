"use client";

/**
 * Arrange Client Component
 * Interactive arrangement/sequencer view with full playback and editing
 */

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  type Arrangement,
  type Lane,
  type LaneType,
  type MelodyNote,
  createArrangement,
  addLane,
  removeLane,
  updateLane,
  pitchToNoteName,
} from "@/lib/arrange";
import styles from "./page.module.css";

// Storage key for arrangements
const STORAGE_KEY = "passion_arrangements_v1";

// Chord definitions for chord lane
const CHORD_TYPES: Record<string, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
};

interface SavedArrangement {
  id: string;
  name: string;
  updatedAt: string;
}

export default function ArrangeClient() {
  const [arrangement, setArrangement] = useState<Arrangement>(() =>
    createArrangement("New Arrangement")
  );
  const [selectedLaneId, setSelectedLaneId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [snapValue, setSnapValue] = useState(0.25); // 1/16th note
  const [gridSubdivision, setGridSubdivision] = useState(4); // 1/4 = 1, 1/8 = 2, 1/16 = 4, 1/32 = 8
  const [savedArrangements, setSavedArrangements] = useState<SavedArrangement[]>([]);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize selected lane
  useEffect(() => {
    if (!selectedLaneId && arrangement.lanes.length > 0) {
      setSelectedLaneId(arrangement.lanes[0].id);
    }
  }, [arrangement.lanes, selectedLaneId]);

  // Load saved arrangements list
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, Arrangement>;
        const list = Object.values(data).map((a) => ({
          id: a.id,
          name: a.name,
          updatedAt: a.updatedAt,
        }));
        setSavedArrangements(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      }
    } catch (e) {
      console.error("Failed to load arrangements:", e);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const selectedLane = arrangement.lanes.find((l) => l.id === selectedLaneId);
  const totalBeats = arrangement.bars * arrangement.timeSignature[0];
  const cellWidth = Math.round(24 * zoom);
  const stepsPerBeat = gridSubdivision;

  // Audio synthesis
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Create drum sound using synthesis (realistic drum kit simulation)
  const playDrumSound = useCallback((pitch: number) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Different synthesis for each drum type
      if (pitch === 36) {
        // Kick drum - low sine with pitch envelope
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (pitch === 38) {
        // Snare - noise burst + tone
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        const noiseGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 1000;
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        noise.start(now);
        noise.stop(now + 0.2);

        // Tone component
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.frequency.value = 200;
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (pitch === 42 || pitch === 44) {
        // Closed hi-hat - filtered noise, short
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 8000;
        filter.Q.value = 1;
        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        noise.start(now);
        noise.stop(now + 0.05);
      } else if (pitch === 46) {
        // Open hi-hat - longer filtered noise
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 8000;
        filter.Q.value = 0.5;
        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        noise.start(now);
        noise.stop(now + 0.3);
      } else if (pitch === 49 || pitch === 57) {
        // Crash cymbal - long noise with filter sweep
        const noise = ctx.createBufferSource();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 3000;
        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        noise.start(now);
        noise.stop(now + 1.5);
      } else if (pitch === 51) {
        // Ride cymbal - metallic tone + noise
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = 400;
        osc2.type = "sine";
        osc2.frequency.value = 800;
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.8);
        osc2.stop(now + 0.8);
      } else if (pitch === 45 || pitch === 43 || pitch === 41) {
        // Low tom
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (pitch === 47 || pitch === 48 || pitch === 50) {
        // High tom
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        // Generic percussion
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 200 + (pitch - 36) * 10;
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.error("Drum playback error:", e);
    }
  }, [getAudioContext]);

  // Soft grand piano synthesis using FM synthesis for realistic timbre
  const playPianoNote = useCallback((pitch: number, duration: number) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const freq = 440 * Math.pow(2, (pitch - 69) / 12);

      // FM synthesis parameters - more realistic piano
      const masterGain = ctx.createGain();
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      masterGain.connect(compressor);
      compressor.connect(ctx.destination);

      // Piano-like ADSR envelope - longer decay for realism
      const attack = 0.005;
      const decay = 0.4;
      const sustainLevel = 0.2;
      const release = Math.min(duration * 0.5, 1.5);
      const totalDuration = Math.max(duration + release, 1.0);

      // Velocity simulation based on pitch (higher notes decay faster)
      const pitchFactor = 1 - (pitch - 21) / 108 * 0.6;
      const volume = 0.35 * pitchFactor;

      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(volume, now + attack);
      masterGain.gain.exponentialRampToValueAtTime(volume * sustainLevel, now + attack + decay);
      masterGain.gain.setValueAtTime(volume * sustainLevel, now + duration);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + totalDuration);

      // FM Carrier oscillator
      const carrier = ctx.createOscillator();
      const carrierGain = ctx.createGain();
      carrier.type = "sine";
      carrier.frequency.value = freq;
      carrierGain.gain.value = 1;
      carrier.connect(carrierGain);
      carrierGain.connect(masterGain);

      // FM Modulator for harmonic richness
      const modulator = ctx.createOscillator();
      const modulatorGain = ctx.createGain();
      modulator.type = "sine";
      modulator.frequency.value = freq * 2; // 2:1 ratio for piano-like timbre

      // Modulation depth decreases for higher notes
      const modDepth = freq * 0.5 * pitchFactor;
      modulatorGain.gain.setValueAtTime(modDepth, now);
      modulatorGain.gain.exponentialRampToValueAtTime(modDepth * 0.1, now + 0.3);

      modulator.connect(modulatorGain);
      modulatorGain.connect(carrier.frequency);

      // Second harmonic layer for body
      const harmonic2 = ctx.createOscillator();
      const harmonic2Gain = ctx.createGain();
      harmonic2.type = "sine";
      harmonic2.frequency.value = freq * 2;
      harmonic2.detune.value = 2; // Slight detune for warmth
      harmonic2Gain.gain.value = 0.3 * pitchFactor;
      harmonic2.connect(harmonic2Gain);
      harmonic2Gain.connect(masterGain);

      // Third harmonic for brightness
      const harmonic3 = ctx.createOscillator();
      const harmonic3Gain = ctx.createGain();
      harmonic3.type = "sine";
      harmonic3.frequency.value = freq * 3;
      harmonic3.detune.value = -3;
      harmonic3Gain.gain.setValueAtTime(0.15 * pitchFactor, now);
      harmonic3Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      harmonic3.connect(harmonic3Gain);
      harmonic3Gain.connect(masterGain);

      // Hammer strike transient
      const strike = ctx.createOscillator();
      const strikeGain = ctx.createGain();
      const strikeFilter = ctx.createBiquadFilter();
      strike.type = "triangle";
      strike.frequency.value = freq * 8;
      strikeFilter.type = "highpass";
      strikeFilter.frequency.value = 2000;
      strikeGain.gain.setValueAtTime(0.08, now);
      strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      strike.connect(strikeFilter);
      strikeFilter.connect(strikeGain);
      strikeGain.connect(masterGain);

      // Start all oscillators
      carrier.start(now);
      modulator.start(now);
      harmonic2.start(now);
      harmonic3.start(now);
      strike.start(now);

      // Stop all oscillators
      carrier.stop(now + totalDuration);
      modulator.stop(now + totalDuration);
      harmonic2.stop(now + totalDuration);
      harmonic3.stop(now + totalDuration);
      strike.stop(now + 0.02);
    } catch (e) {
      console.error("Piano playback error:", e);
    }
  }, [getAudioContext]);

  // Main playNote function that routes to appropriate synth
  const playNote = useCallback((pitch: number, duration: number, isDrum: boolean = false) => {
    if (isDrum) {
      playDrumSound(pitch);
    } else {
      playPianoNote(pitch, duration);
    }
  }, [playDrumSound, playPianoNote]);

  // Playback
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentBeat(-1);
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
      return;
    }

    setIsPlaying(true);
    setCurrentBeat(0);

    const stepDuration = (60 / arrangement.bpm / 4) * 1000; // 16th note in ms
    let step = 0;

    playIntervalRef.current = setInterval(() => {
      const currentStep = step;
      const beatPosition = currentStep / 4;

      // Play notes at this step
      arrangement.lanes.forEach((lane) => {
        if (lane.muted) return;

        lane.notes.forEach((note) => {
          if (Math.abs(note.startBeat - beatPosition) < 0.001) {
            const isDrum = lane.type === "drums";
            const duration = (note.duration * 60) / arrangement.bpm;
            playNote(note.pitch, duration, isDrum);
          }
        });
      });

      step++;
      setCurrentBeat(Math.floor(step / 4));

      if (step >= totalBeats * 4) {
        step = 0;
        setCurrentBeat(0);
      }
    }, stepDuration);
  }, [isPlaying, arrangement, totalBeats, playNote]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentBeat(-1);
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  // Lane operations
  const handleAddLane = useCallback((type: LaneType) => {
    const updated = addLane(arrangement, type);
    setArrangement(updated);
    setSelectedLaneId(updated.lanes[updated.lanes.length - 1].id);
  }, [arrangement]);

  const handleDeleteLane = useCallback((laneId: string) => {
    if (arrangement.lanes.length <= 1) return;
    const updated = removeLane(arrangement, laneId);
    setArrangement(updated);
    if (selectedLaneId === laneId) {
      setSelectedLaneId(updated.lanes[0]?.id ?? null);
    }
  }, [arrangement, selectedLaneId]);

  const handleToggleMute = useCallback((laneId: string) => {
    const lane = arrangement.lanes.find((l) => l.id === laneId);
    if (lane) {
      setArrangement(updateLane(arrangement, laneId, { muted: !lane.muted }));
    }
  }, [arrangement]);

  const handleToggleSolo = useCallback((laneId: string) => {
    const lane = arrangement.lanes.find((l) => l.id === laneId);
    if (lane) {
      setArrangement(updateLane(arrangement, laneId, { solo: !lane.solo }));
    }
  }, [arrangement]);

  const handleNotesChange = useCallback((laneId: string, notes: MelodyNote[]) => {
    setArrangement(updateLane(arrangement, laneId, { notes }));
  }, [arrangement]);

  const handleRenameLane = useCallback((laneId: string, name: string) => {
    setArrangement(updateLane(arrangement, laneId, { name }));
  }, [arrangement]);

  // Save/Load
  const handleSave = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data: Record<string, Arrangement> = stored ? JSON.parse(stored) : {};
      const updated = { ...arrangement, updatedAt: new Date().toISOString() };
      data[arrangement.id] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setArrangement(updated);

      // Update list
      const list = Object.values(data).map((a) => ({
        id: a.id,
        name: a.name,
        updatedAt: a.updatedAt,
      }));
      setSavedArrangements(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    } catch (e) {
      console.error("Failed to save:", e);
    }
  }, [arrangement]);

  const handleLoad = useCallback((id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, Arrangement>;
        const arr = data[id];
        if (arr) {
          setArrangement(arr);
          setSelectedLaneId(arr.lanes[0]?.id ?? null);
          setShowLoadDialog(false);
        }
      }
    } catch (e) {
      console.error("Failed to load:", e);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, Arrangement>;
        delete data[id];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        const list = Object.values(data).map((a) => ({
          id: a.id,
          name: a.name,
          updatedAt: a.updatedAt,
        }));
        setSavedArrangements(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      }
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  }, []);

  const handleNew = useCallback(() => {
    const newArrangement = createArrangement("New Arrangement");
    setArrangement(newArrangement);
    setSelectedLaneId(newArrangement.lanes[0]?.id ?? null);
    handleStop();
  }, [handleStop]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/today" className={styles.backLink}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className={styles.titleGroup}>
            <h1>Arrange</h1>
            <input
              type="text"
              className={styles.nameInput}
              value={arrangement.name}
              onChange={(e) =>
                setArrangement({
                  ...arrangement,
                  name: e.target.value,
                  updatedAt: new Date().toISOString(),
                })
              }
              placeholder="Arrangement name"
            />
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.headerBtn} onClick={handleNew} title="New">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </button>
          <button className={styles.headerBtn} onClick={handleSave} title="Save">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </button>
          <button className={styles.headerBtn} onClick={() => setShowLoadDialog(true)} title="Load">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Transport */}
      <div className={styles.transport}>
        <div className={styles.transportLeft}>
          <button className={styles.transportBtn} onClick={handleStop} title="Stop">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          </button>
          <button
            className={`${styles.transportBtn} ${isPlaying ? styles.active : ""}`}
            onClick={handlePlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
        </div>

        <div className={styles.transportCenter}>
          <div className={styles.bpmControl}>
            <label>BPM</label>
            <input
              type="number"
              min="40"
              max="300"
              value={arrangement.bpm}
              onChange={(e) =>
                setArrangement({
                  ...arrangement,
                  bpm: parseInt(e.target.value, 10) || 120,
                  updatedAt: new Date().toISOString(),
                })
              }
            />
          </div>
          <div className={styles.barsControl}>
            <label>Bars</label>
            <input
              type="number"
              min="1"
              max="16"
              value={arrangement.bars}
              onChange={(e) =>
                setArrangement({
                  ...arrangement,
                  bars: Math.min(16, Math.max(1, parseInt(e.target.value, 10) || 4)),
                  updatedAt: new Date().toISOString(),
                })
              }
            />
          </div>
          <div className={styles.timeSignature}>
            <span>{arrangement.timeSignature[0]}/{arrangement.timeSignature[1]}</span>
          </div>
          <div className={styles.gridControl}>
            <label>Grid</label>
            <div className={styles.gridButtons}>
              <button
                className={`${styles.gridBtn} ${gridSubdivision === 1 ? styles.active : ""}`}
                onClick={() => setGridSubdivision(1)}
                title="1/4 notes"
              >
                1/4
              </button>
              <button
                className={`${styles.gridBtn} ${gridSubdivision === 2 ? styles.active : ""}`}
                onClick={() => setGridSubdivision(2)}
                title="1/8 notes"
              >
                1/8
              </button>
              <button
                className={`${styles.gridBtn} ${gridSubdivision === 4 ? styles.active : ""}`}
                onClick={() => setGridSubdivision(4)}
                title="1/16 notes"
              >
                1/16
              </button>
              <button
                className={`${styles.gridBtn} ${gridSubdivision === 8 ? styles.active : ""}`}
                onClick={() => setGridSubdivision(8)}
                title="1/32 notes"
              >
                1/32
              </button>
            </div>
          </div>
          <div className={styles.zoomControl}>
            <label>Zoom</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.25"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
          </div>
          <div className={styles.snapControl}>
            <label>Snap</label>
            <select
              value={snapValue}
              onChange={(e) => setSnapValue(parseFloat(e.target.value))}
            >
              <option value="1">1/4</option>
              <option value="0.5">1/8</option>
              <option value="0.25">1/16</option>
              <option value="0.125">1/32</option>
            </select>
          </div>
        </div>

        <div className={styles.transportRight}>
          <span className={styles.position}>
            {currentBeat >= 0
              ? `${Math.floor(currentBeat / arrangement.timeSignature[0]) + 1}.${(currentBeat % arrangement.timeSignature[0]) + 1}`
              : "1.1"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.main}>
        {/* Lane List */}
        <aside className={styles.laneList}>
          <div className={styles.laneListHeader}>
            <span>Lanes</span>
            <div className={styles.addLaneBtns}>
              <button
                className={styles.addLaneBtn}
                onClick={() => handleAddLane("melody")}
                title="Add Melody Lane"
              >
                M
              </button>
              <button
                className={styles.addLaneBtn}
                onClick={() => handleAddLane("drums")}
                title="Add Drum Lane"
              >
                D
              </button>
              <button
                className={styles.addLaneBtn}
                onClick={() => handleAddLane("chord")}
                title="Add Chord Lane"
              >
                C
              </button>
            </div>
          </div>

          {arrangement.lanes.map((lane) => (
            <div
              key={lane.id}
              className={`${styles.laneItem} ${selectedLaneId === lane.id ? styles.selected : ""}`}
              onClick={() => setSelectedLaneId(lane.id)}
            >
              <div className={styles.laneColor} style={{ backgroundColor: lane.color }} />
              <input
                type="text"
                className={styles.laneNameInput}
                value={lane.name}
                onChange={(e) => handleRenameLane(lane.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className={styles.laneControls}>
                <button
                  className={`${styles.laneControlBtn} ${lane.muted ? styles.active : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMute(lane.id);
                  }}
                  title="Mute"
                >
                  M
                </button>
                <button
                  className={`${styles.laneControlBtn} ${lane.solo ? styles.activeSolo : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleSolo(lane.id);
                  }}
                  title="Solo"
                >
                  S
                </button>
                <button
                  className={styles.laneControlBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLane(lane.id);
                  }}
                  title="Delete"
                  disabled={arrangement.lanes.length <= 1}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </aside>

        {/* Piano Roll / Grid */}
        <div className={styles.editor}>
          {selectedLane ? (
            <div className={styles.pianoRoll}>
              {/* Grid Header (beat numbers) - synchronized with grid subdivision */}
              <div className={styles.gridHeader}>
                <div className={styles.pianoKeysHeader} />
                {Array.from({ length: totalBeats * stepsPerBeat }).map((_, step) => {
                  const beat = Math.floor(step / stepsPerBeat);
                  const isBarStart = step % (arrangement.timeSignature[0] * stepsPerBeat) === 0;
                  const isBeatStart = step % stepsPerBeat === 0;
                  const showLabel = isBarStart || (isBeatStart && stepsPerBeat <= 2);

                  return (
                    <div
                      key={step}
                      className={`${styles.beatMarkerStep} ${isBarStart ? styles.barStart : isBeatStart ? styles.beatStart : ""} ${currentBeat === beat ? styles.playing : ""}`}
                      style={{ width: cellWidth }}
                    >
                      {showLabel && isBarStart && (
                        <span>{Math.floor(beat / arrangement.timeSignature[0]) + 1}</span>
                      )}
                      {showLabel && isBeatStart && !isBarStart && (
                        <span className={styles.beatNum}>{(beat % arrangement.timeSignature[0]) + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grid Content */}
              <div className={styles.gridContent}>
                {selectedLane.type === "drums" ? (
                  <DrumGrid
                    lane={selectedLane}
                    totalBeats={totalBeats}
                    timeSignature={arrangement.timeSignature[0]}
                    cellWidth={cellWidth}
                    onNotesChange={(notes) => handleNotesChange(selectedLane.id, notes)}
                    playNote={playNote}
                    stepsPerBeat={stepsPerBeat}
                  />
                ) : selectedLane.type === "chord" ? (
                  <ChordGrid
                    lane={selectedLane}
                    totalBeats={totalBeats}
                    timeSignature={arrangement.timeSignature[0]}
                    cellWidth={cellWidth}
                    onNotesChange={(notes) => handleNotesChange(selectedLane.id, notes)}
                    playNote={playNote}
                    stepsPerBeat={stepsPerBeat}
                  />
                ) : (
                  <PianoGrid
                    lane={selectedLane}
                    totalBeats={totalBeats}
                    timeSignature={arrangement.timeSignature[0]}
                    cellWidth={cellWidth}
                    onNotesChange={(notes) => handleNotesChange(selectedLane.id, notes)}
                    playNote={playNote}
                    stepsPerBeat={stepsPerBeat}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <p>Select a lane to start editing</p>
              <p className={styles.emptyHint}>Or add a new lane using the buttons above</p>
            </div>
          )}
        </div>
      </div>

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className={styles.dialogOverlay} onClick={() => setShowLoadDialog(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <h2>Load Arrangement</h2>
            {savedArrangements.length === 0 ? (
              <p className={styles.dialogEmpty}>No saved arrangements yet.</p>
            ) : (
              <div className={styles.arrangementList}>
                {savedArrangements.map((arr) => (
                  <div key={arr.id} className={styles.arrangementItem}>
                    <div className={styles.arrangementInfo}>
                      <span className={styles.arrangementName}>{arr.name}</span>
                      <span className={styles.arrangementDate}>
                        {new Date(arr.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.arrangementActions}>
                      <button onClick={() => handleLoad(arr.id)}>Load</button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(arr.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className={styles.dialogClose} onClick={() => setShowLoadDialog(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}


/**
 * Drum Grid Component - with locked timeline header
 */
function DrumGrid({
  lane,
  totalBeats,
  timeSignature,
  cellWidth,
  onNotesChange,
  playNote,
  stepsPerBeat = 4,
}: {
  lane: Lane;
  totalBeats: number;
  timeSignature: number;
  cellWidth: number;
  onNotesChange: (notes: MelodyNote[]) => void;
  playNote: (pitch: number, duration: number, isDrum: boolean) => void;
  stepsPerBeat?: number;
}) {
  const drumRows = [
    { pitch: 36, name: "Kick" },
    { pitch: 38, name: "Snare" },
    { pitch: 42, name: "Closed HH" },
    { pitch: 46, name: "Open HH" },
    { pitch: 49, name: "Crash" },
    { pitch: 51, name: "Ride" },
    { pitch: 45, name: "Tom Low" },
    { pitch: 48, name: "Tom High" },
  ];

  const totalSteps = totalBeats * stepsPerBeat;
  const stepDuration = 1 / stepsPerBeat;

  const toggleNote = (pitch: number, step: number) => {
    const beatPosition = step * stepDuration;
    const existingNote = lane.notes.find(
      (n) => n.pitch === pitch && Math.abs(n.startBeat - beatPosition) < 0.001
    );

    if (existingNote) {
      onNotesChange(lane.notes.filter((n) => n.id !== existingNote.id));
    } else {
      playNote(pitch, 0.1, true);
      const newNote: MelodyNote = {
        id: crypto.randomUUID(),
        pitch,
        startBeat: beatPosition,
        duration: stepDuration,
        velocity: 100,
      };
      onNotesChange([...lane.notes, newNote]);
    }
  };

  return (
    <div className={styles.drumGridWrapper}>
      {/* Fixed Timeline Header */}
      <div className={styles.drumTimelineHeader}>
        <div className={styles.drumLabelHeader}>Drum</div>
        <div className={styles.drumTimelineCells}>
          {Array.from({ length: totalSteps }).map((_, step) => {
            const beat = Math.floor(step / stepsPerBeat);
            const isBarStart = step % (timeSignature * stepsPerBeat) === 0;
            const isBeatStart = step % stepsPerBeat === 0;
            return (
              <div
                key={step}
                className={`${styles.drumTimelineCell} ${isBarStart ? styles.barStart : isBeatStart ? styles.beatStart : ""}`}
                style={{ width: cellWidth }}
              >
                {isBarStart && <span>{Math.floor(beat / timeSignature) + 1}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Drum Rows */}
      <div className={styles.drumGrid}>
        {drumRows.map((row) => (
          <div key={row.pitch} className={styles.drumRow}>
            <div className={styles.drumLabel}>{row.name}</div>
            <div className={styles.drumCells}>
              {Array.from({ length: totalSteps }).map((_, step) => {
                const beatPosition = step * stepDuration;
                const hasNote = lane.notes.some(
                  (n) => n.pitch === row.pitch && Math.abs(n.startBeat - beatPosition) < 0.001
                );
                const isBarStart = step % (timeSignature * stepsPerBeat) === 0;
                const isBeatStart = step % stepsPerBeat === 0;

                return (
                  <div
                    key={step}
                    className={`${styles.drumCell} ${hasNote ? styles.active : ""} ${
                      isBarStart ? styles.barStart : isBeatStart ? styles.beatStart : ""
                    }`}
                    style={{ width: cellWidth, height: cellWidth }}
                    onClick={() => toggleNote(row.pitch, step)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Piano Grid Component - Full range with vertical scrolling
 */
function PianoGrid({
  lane,
  totalBeats,
  timeSignature,
  cellWidth,
  onNotesChange,
  playNote,
  stepsPerBeat = 4,
}: {
  lane: Lane;
  totalBeats: number;
  timeSignature: number;
  cellWidth: number;
  onNotesChange: (notes: MelodyNote[]) => void;
  playNote: (pitch: number, duration: number, isDrum: boolean) => void;
  stepsPerBeat?: number;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ pitch: number; step: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  // Full MIDI range: C-1 (0) to G9 (127), but we'll use practical range
  const startPitch = 21; // A0 (lowest piano key)
  const endPitch = 108; // C8 (highest piano key)
  const pitches = Array.from({ length: endPitch - startPitch + 1 }, (_, i) => endPitch - i);

  const totalSteps = totalBeats * stepsPerBeat;
  const stepDuration = 1 / stepsPerBeat; // In beats

  // Scroll to middle C (C4 = 60) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const middleCIndex = pitches.indexOf(60);
      const rowHeight = 20;
      const scrollPosition = Math.max(0, middleCIndex * rowHeight - scrollContainerRef.current.clientHeight / 2);
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  // Handle mouse up anywhere to finish drag
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging && dragStart !== null && dragEnd !== null) {
        const startStep = Math.min(dragStart.step, dragEnd);
        const endStep = Math.max(dragStart.step, dragEnd);
        const duration = (endStep - startStep + 1) * stepDuration;
        const beatPosition = startStep * stepDuration;

        // Check if note already exists
        const existingNote = lane.notes.find(
          (n) => n.pitch === dragStart.pitch && Math.abs(n.startBeat - beatPosition) < 0.001
        );

        if (!existingNote) {
          playNote(dragStart.pitch, duration, false);
          const newNote: MelodyNote = {
            id: crypto.randomUUID(),
            pitch: dragStart.pitch,
            startBeat: beatPosition,
            duration,
            velocity: 100,
          };
          onNotesChange([...lane.notes, newNote]);
        }
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };

    if (isDragging) {
      window.addEventListener("mouseup", handleMouseUp);
      return () => window.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging, dragStart, dragEnd, lane.notes, onNotesChange, playNote, stepDuration]);

  const handleMouseDown = (pitch: number, step: number) => {
    const beatPosition = step * stepDuration;
    const existingNote = lane.notes.find(
      (n) => n.pitch === pitch && Math.abs(n.startBeat - beatPosition) < 0.001
    );

    if (existingNote) {
      // Delete existing note
      onNotesChange(lane.notes.filter((n) => n.id !== existingNote.id));
    } else {
      // Start drag
      setIsDragging(true);
      setDragStart({ pitch, step });
      setDragEnd(step);
    }
  };

  const handleMouseEnter = (pitch: number, step: number) => {
    if (isDragging && dragStart && pitch === dragStart.pitch) {
      setDragEnd(step);
    }
  };

  const isBlackKey = (pitch: number) => {
    const note = pitch % 12;
    return [1, 3, 6, 8, 10].includes(note);
  };

  const isC = (pitch: number) => pitch % 12 === 0;

  // Check if a cell is part of the current drag selection
  const isInDragSelection = (pitch: number, step: number) => {
    if (!isDragging || !dragStart || dragEnd === null) return false;
    if (pitch !== dragStart.pitch) return false;
    const minStep = Math.min(dragStart.step, dragEnd);
    const maxStep = Math.max(dragStart.step, dragEnd);
    return step >= minStep && step <= maxStep;
  };

  // Check if a cell is covered by a note (for multi-step notes)
  const isNoteCovered = (pitch: number, step: number) => {
    const beatPosition = step * stepDuration;
    return lane.notes.some((n) => {
      if (n.pitch !== pitch) return false;
      const noteStart = n.startBeat;
      const noteEnd = n.startBeat + n.duration;
      return beatPosition >= noteStart - 0.001 && beatPosition < noteEnd - 0.001;
    });
  };

  // Get note at position (for showing note start)
  const getNoteAt = (pitch: number, step: number) => {
    const beatPosition = step * stepDuration;
    return lane.notes.find(
      (n) => n.pitch === pitch && Math.abs(n.startBeat - beatPosition) < 0.001
    );
  };

  return (
    <div className={styles.pianoGridWrapper}>
      {/* Fixed Timeline Header */}
      <div className={styles.pianoTimelineHeader}>
        <div className={styles.pianoKeyHeader} />
        <div className={styles.pianoTimelineCells}>
          {Array.from({ length: totalSteps }).map((_, step) => {
            const beat = Math.floor(step / stepsPerBeat);
            const isBarStart = step % (timeSignature * stepsPerBeat) === 0;
            const isBeatStart = step % stepsPerBeat === 0;
            return (
              <div
                key={step}
                className={`${styles.pianoTimelineCell} ${isBarStart ? styles.barStart : isBeatStart ? styles.beatStart : ""}`}
                style={{ width: cellWidth }}
              >
                {isBarStart && <span>{Math.floor(beat / timeSignature) + 1}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Piano Rows */}
      <div className={styles.pianoGrid} ref={scrollContainerRef}>
        {pitches.map((pitch) => (
          <div
            key={pitch}
            className={`${styles.pianoRow} ${isBlackKey(pitch) ? styles.blackKey : ""} ${isC(pitch) ? styles.octaveStart : ""}`}
          >
            <div className={`${styles.pianoKey} ${isBlackKey(pitch) ? styles.blackKeyLabel : ""}`}>
              {pitchToNoteName(pitch)}
            </div>
            <div className={styles.pianoCells}>
              {Array.from({ length: totalSteps }).map((_, step) => {
                const note = getNoteAt(pitch, step);
                const isCovered = isNoteCovered(pitch, step);
                const inDrag = isInDragSelection(pitch, step);
                const isBarStart = step % (timeSignature * stepsPerBeat) === 0;
                const isBeatStart = step % stepsPerBeat === 0;

                // Calculate note width for multi-step notes
                const noteWidth = note ? Math.round(note.duration * stepsPerBeat * cellWidth) : 0;

                return (
                  <div
                    key={step}
                    className={`${styles.pianoCell} ${isCovered && !note ? styles.noteContinue : ""} ${inDrag ? styles.dragSelection : ""} ${
                      isBarStart ? styles.barStart : isBeatStart ? styles.beatStart : ""
                    }`}
                    style={{ width: cellWidth }}
                    onMouseDown={() => handleMouseDown(pitch, step)}
                    onMouseEnter={() => handleMouseEnter(pitch, step)}
                  >
                    {note && (
                      <div
                        className={styles.noteBlock}
                        style={{ width: noteWidth }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Chord Grid Component
 */
function ChordGrid({
  lane,
  totalBeats,
  timeSignature,
  cellWidth,
  onNotesChange,
  playNote,
  stepsPerBeat = 4,
}: {
  lane: Lane;
  totalBeats: number;
  timeSignature: number;
  cellWidth: number;
  onNotesChange: (notes: MelodyNote[]) => void;
  playNote: (pitch: number, duration: number, isDrum: boolean) => void;
  stepsPerBeat?: number;
}) {
  const chordRoots = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const chordTypes = Object.keys(CHORD_TYPES);
  const [selectedType, setSelectedType] = useState("major");

  const totalSteps = totalBeats * stepsPerBeat;
  const stepDuration = 1 / stepsPerBeat;

  const rootToPitch = (root: string): number => {
    const noteMap: Record<string, number> = {
      C: 60, "C#": 61, D: 62, "D#": 63, E: 64, F: 65, "F#": 66, G: 67, "G#": 68, A: 69, "A#": 70, B: 71,
    };
    return noteMap[root] || 60;
  };

  const toggleChord = (root: string, step: number) => {
    const beatPosition = step * stepDuration;
    const rootPitch = rootToPitch(root);
    const intervals = CHORD_TYPES[selectedType];

    // Check if chord exists at this position
    const existingNotes = lane.notes.filter(
      (n) => Math.abs(n.startBeat - beatPosition) < 0.001
    );

    if (existingNotes.length > 0) {
      // Remove all notes at this position
      onNotesChange(lane.notes.filter((n) => Math.abs(n.startBeat - beatPosition) >= 0.001));
    } else {
      // Add chord notes
      const chordNotes: MelodyNote[] = intervals.map((interval) => ({
        id: crypto.randomUUID(),
        pitch: rootPitch + interval,
        startBeat: beatPosition,
        duration: 1,
        velocity: 100,
      }));

      // Play chord
      intervals.forEach((interval) => {
        playNote(rootPitch + interval, 0.3, false);
      });

      onNotesChange([...lane.notes, ...chordNotes]);
    }
  };

  return (
    <div className={styles.chordGrid}>
      <div className={styles.chordTypeSelector}>
        {chordTypes.map((type) => (
          <button
            key={type}
            className={`${styles.chordTypeBtn} ${selectedType === type ? styles.active : ""}`}
            onClick={() => setSelectedType(type)}
          >
            {type}
          </button>
        ))}
      </div>
      <div className={styles.chordRows}>
        {chordRoots.map((root) => {
          const rootPitch = rootToPitch(root);
          return (
            <div key={root} className={styles.chordRow}>
              <div className={styles.chordLabel}>{root}</div>
              <div className={styles.chordCells}>
                {Array.from({ length: totalSteps }).map((_, step) => {
                  const beatPosition = step * stepDuration;
                  const hasChord = lane.notes.some(
                    (n) => n.pitch === rootPitch && Math.abs(n.startBeat - beatPosition) < 0.001
                  );
                  const isBarStart = step % (timeSignature * stepsPerBeat) === 0;
                  const isBeatStart = step % stepsPerBeat === 0;

                  return (
                    <div
                      key={step}
                      className={`${styles.chordCell} ${hasChord ? styles.active : ""} ${
                        isBarStart ? styles.barStart : isBeatStart ? styles.beatStart : ""
                      }`}
                      style={{ width: cellWidth }}
                      onClick={() => toggleChord(root, step)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
