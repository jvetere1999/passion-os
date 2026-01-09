"use client";

/**
 * Note Recognition Game
 * Identify single notes and octaves by ear
 */

import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./NoteGame.module.css";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const OCTAVES = [3, 4, 5]; // C3 to B5

type GameMode = "notes" | "octaves" | "both";

interface GameState {
  currentNote: number; // MIDI note number
  score: number;
  streak: number;
  totalQuestions: number;
  answeredCorrect: boolean | null;
  isPlaying: boolean;
  gameStarted: boolean;
}

export function NoteGame() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [mode, setMode] = useState<GameMode>("notes");
  const [useFlats, setUseFlats] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentNote: 60,
    score: 0,
    streak: 0,
    totalQuestions: 0,
    answeredCorrect: null,
    isPlaying: false,
    gameStarted: false,
  });

  // Reference note (for "both" mode, user hears A4 first)
  const referenceNote = 69; // A4

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const midiToFreq = useCallback((midi: number) => {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }, []);

  const midiToNoteName = useCallback((midi: number) => {
    const noteIndex = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    let noteName = NOTE_NAMES[noteIndex];

    if (useFlats && noteName.includes("#")) {
      const flatIndex = (noteIndex + 1) % 12;
      noteName = NOTE_NAMES[flatIndex] + "b";
    }

    return { note: noteName, octave, full: `${noteName}${octave}` };
  }, [useFlats]);

  const playNote = useCallback((midiNote: number, startTime: number, duration: number) => {
    const ctx = getAudioContext();
    const freq = midiToFreq(midiNote);

    // Create a richer tone with harmonics
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.value = freq;

    osc2.type = "sine";
    osc2.frequency.value = freq * 2; // First harmonic

    const gain2 = ctx.createGain();
    gain2.gain.value = 0.15; // Softer harmonic

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.1, startTime + duration * 0.5);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc1.connect(gain);
    osc2.connect(gain2);
    gain2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
  }, [getAudioContext, midiToFreq]);

  const playCurrentNote = useCallback(() => {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    setGameState(prev => ({ ...prev, isPlaying: true }));

    if (mode === "both") {
      // Play reference A4 first, then the target note
      playNote(referenceNote, now, 0.8);
      playNote(gameState.currentNote, now + 1, 1.2);
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: false }));
      }, 2200);
    } else {
      playNote(gameState.currentNote, now, 1.2);
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: false }));
      }, 1300);
    }
  }, [mode, gameState.currentNote, playNote, getAudioContext]);

  const generateQuestion = useCallback(() => {
    let newNote: number;

    if (mode === "octaves") {
      // Fixed note (A), random octave
      const octave = OCTAVES[Math.floor(Math.random() * OCTAVES.length)];
      newNote = 21 + (octave * 12); // A in that octave
    } else {
      // Random note in range C3-B5
      const minNote = 48; // C3
      const maxNote = 83; // B5
      newNote = minNote + Math.floor(Math.random() * (maxNote - minNote + 1));
    }

    setGameState(prev => ({
      ...prev,
      currentNote: newNote,
      answeredCorrect: null,
      gameStarted: true,
    }));
  }, [mode]);

  const handleNoteAnswer = useCallback((noteIndex: number) => {
    if (gameState.answeredCorrect !== null) return;

    const correctNoteIndex = gameState.currentNote % 12;
    const isCorrect = noteIndex === correctNoteIndex;

    setGameState(prev => ({
      ...prev,
      answeredCorrect: isCorrect,
      score: prev.score + (isCorrect ? 1 : 0),
      streak: isCorrect ? prev.streak + 1 : 0,
      totalQuestions: prev.totalQuestions + 1,
    }));

    setTimeout(() => {
      generateQuestion();
    }, 1500);
  }, [gameState, generateQuestion]);

  const handleOctaveAnswer = useCallback((octave: number) => {
    if (gameState.answeredCorrect !== null) return;

    const correctOctave = Math.floor(gameState.currentNote / 12) - 1;
    const isCorrect = octave === correctOctave;

    setGameState(prev => ({
      ...prev,
      answeredCorrect: isCorrect,
      score: prev.score + (isCorrect ? 1 : 0),
      streak: isCorrect ? prev.streak + 1 : 0,
      totalQuestions: prev.totalQuestions + 1,
    }));

    setTimeout(() => {
      generateQuestion();
    }, 1500);
  }, [gameState, generateQuestion]);

  const startGame = useCallback(() => {
    setGameState({
      currentNote: 60,
      score: 0,
      streak: 0,
      totalQuestions: 0,
      answeredCorrect: null,
      isPlaying: false,
      gameStarted: false,
    });
    generateQuestion();
  }, [generateQuestion]);

  useEffect(() => {
    if (gameState.gameStarted && gameState.answeredCorrect === null) {
      const timer = setTimeout(() => {
        playCurrentNote();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentNote, gameState.answeredCorrect, gameState.gameStarted, playCurrentNote]);

  const currentNoteInfo = midiToNoteName(gameState.currentNote);

  return (
    <div className={styles.game}>
      {!gameState.gameStarted ? (
        <div className={styles.setup}>
          <h2 className={styles.setupTitle}>Note Recognition</h2>
          <p className={styles.setupDescription}>
            Listen and identify single notes or octaves.
          </p>

          <div className={styles.settingsGroup}>
            <label className={styles.settingsLabel}>Mode</label>
            <div className={styles.modeButtons}>
              <button
                className={`${styles.modeBtn} ${mode === "notes" ? styles.active : ""}`}
                onClick={() => setMode("notes")}
              >
                <span className={styles.modeLabel}>Note Names</span>
                <span className={styles.modeDesc}>Identify the pitch class (C, D, E...)</span>
              </button>
              <button
                className={`${styles.modeBtn} ${mode === "octaves" ? styles.active : ""}`}
                onClick={() => setMode("octaves")}
              >
                <span className={styles.modeLabel}>Octaves</span>
                <span className={styles.modeDesc}>Identify which octave (3, 4, 5)</span>
              </button>
              <button
                className={`${styles.modeBtn} ${mode === "both" ? styles.active : ""}`}
                onClick={() => setMode("both")}
              >
                <span className={styles.modeLabel}>Full Note</span>
                <span className={styles.modeDesc}>Note + Octave (e.g., A4)</span>
              </button>
            </div>
          </div>

          <div className={styles.settingsGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={useFlats}
                onChange={(e) => setUseFlats(e.target.checked)}
              />
              <span>Show flats instead of sharps</span>
            </label>
          </div>

          <button className={styles.startButton} onClick={startGame}>
            Start Training
          </button>
        </div>
      ) : (
        <div className={styles.gamePlay}>
          <div className={styles.gameHeader}>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{gameState.score}</span>
                <span className={styles.statLabel}>Correct</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{gameState.totalQuestions}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>{gameState.streak}</span>
                <span className={styles.statLabel}>Streak</span>
              </div>
            </div>
            <button className={styles.resetBtn} onClick={startGame}>
              Reset
            </button>
          </div>

          <div className={styles.questionArea}>
            {mode === "both" && (
              <div className={styles.reference}>
                Reference: A4 plays first
              </div>
            )}

            <button
              className={`${styles.playButton} ${gameState.isPlaying ? styles.playing : ""}`}
              onClick={playCurrentNote}
              disabled={gameState.isPlaying}
            >
              {gameState.isPlaying ? (
                <span className={styles.playingIndicator}>Playing...</span>
              ) : (
                <>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Play Again</span>
                </>
              )}
            </button>

            {gameState.answeredCorrect !== null && (
              <div className={`${styles.feedback} ${gameState.answeredCorrect ? styles.correct : styles.incorrect}`}>
                {gameState.answeredCorrect ? (
                  <span>Correct! It was {currentNoteInfo.full}</span>
                ) : (
                  <span>It was {currentNoteInfo.full}</span>
                )}
              </div>
            )}
          </div>

          {/* Note answers */}
          {(mode === "notes" || mode === "both") && (
            <div className={styles.noteGrid}>
              {NOTE_NAMES.map((note, idx) => {
                let displayNote = note;
                if (useFlats && note.includes("#")) {
                  const flatIndex = (idx + 1) % 12;
                  displayNote = NOTE_NAMES[flatIndex] + "b";
                }
                const isBlackKey = note.includes("#");
                const correctIdx = gameState.currentNote % 12;

                return (
                  <button
                    key={idx}
                    className={`${styles.noteBtn} ${isBlackKey ? styles.black : styles.white} ${
                      gameState.answeredCorrect !== null && idx === correctIdx
                        ? styles.correctAnswer
                        : ""
                    }`}
                    onClick={() => handleNoteAnswer(idx)}
                    disabled={gameState.answeredCorrect !== null}
                  >
                    {displayNote}
                  </button>
                );
              })}
            </div>
          )}

          {/* Octave answers */}
          {(mode === "octaves" || mode === "both") && (
            <div className={styles.octaveGrid}>
              <span className={styles.octaveLabel}>Octave:</span>
              {OCTAVES.map((octave) => {
                const correctOctave = Math.floor(gameState.currentNote / 12) - 1;
                return (
                  <button
                    key={octave}
                    className={`${styles.octaveBtn} ${
                      gameState.answeredCorrect !== null && octave === correctOctave
                        ? styles.correctAnswer
                        : ""
                    }`}
                    onClick={() => handleOctaveAnswer(octave)}
                    disabled={gameState.answeredCorrect !== null}
                  >
                    {octave}
                  </button>
                );
              })}
            </div>
          )}

          {/* Piano keyboard visual */}
          <div className={styles.keyboard}>
            <div className={styles.keyboardLabel}>
              {mode === "both" ? "Select note then octave" : "Listen and select"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

