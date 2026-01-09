"use client";

/**
 * Interval Training Client Component
 * Interactive interval recognition game using Web Audio API
 */

import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./IntervalGame.module.css";

interface IntervalDef {
  semitones: number;
  name: string;
  shortName: string;
  quality: "perfect" | "major" | "minor" | "augmented" | "diminished";
}

const INTERVALS: IntervalDef[] = [
  { semitones: 0, name: "Unison", shortName: "P1", quality: "perfect" },
  { semitones: 1, name: "Minor 2nd", shortName: "m2", quality: "minor" },
  { semitones: 2, name: "Major 2nd", shortName: "M2", quality: "major" },
  { semitones: 3, name: "Minor 3rd", shortName: "m3", quality: "minor" },
  { semitones: 4, name: "Major 3rd", shortName: "M3", quality: "major" },
  { semitones: 5, name: "Perfect 4th", shortName: "P4", quality: "perfect" },
  { semitones: 6, name: "Tritone", shortName: "TT", quality: "augmented" },
  { semitones: 7, name: "Perfect 5th", shortName: "P5", quality: "perfect" },
  { semitones: 8, name: "Minor 6th", shortName: "m6", quality: "minor" },
  { semitones: 9, name: "Major 6th", shortName: "M6", quality: "major" },
  { semitones: 10, name: "Minor 7th", shortName: "m7", quality: "minor" },
  { semitones: 11, name: "Major 7th", shortName: "M7", quality: "major" },
  { semitones: 12, name: "Octave", shortName: "P8", quality: "perfect" },
];

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  beginner: {
    intervals: [0, 5, 7, 12], // Unison, P4, P5, Octave
    label: "Beginner",
    description: "Perfect intervals only",
  },
  easy: {
    intervals: [3, 4, 5, 7], // m3, M3, P4, P5
    label: "Easy",
    description: "Common intervals",
  },
  medium: {
    intervals: [1, 2, 3, 4, 5, 7, 8, 9], // All except tritone, 7ths
    label: "Medium",
    description: "Most intervals",
  },
  hard: {
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // All
    label: "Hard",
    description: "All intervals",
  },
};

type Difficulty = keyof typeof DIFFICULTY_SETTINGS;
type Direction = "ascending" | "descending" | "harmonic";

interface GameState {
  currentInterval: IntervalDef | null;
  baseNote: number;
  direction: Direction;
  score: number;
  streak: number;
  totalQuestions: number;
  answeredCorrect: boolean | null;
  isPlaying: boolean;
  gameStarted: boolean;
}

export function IntervalGame() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [includeDescending, setIncludeDescending] = useState(false);
  const [includeHarmonic, setIncludeHarmonic] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentInterval: null,
    baseNote: 60, // Middle C
    direction: "ascending",
    score: 0,
    streak: 0,
    totalQuestions: 0,
    answeredCorrect: null,
    isPlaying: false,
    gameStarted: false,
  });

  // Initialize audio context
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

  // Convert MIDI note to frequency
  const midiToFreq = useCallback((midi: number) => {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }, []);

  // Play a single note
  const playNote = useCallback((freq: number, startTime: number, duration: number) => {
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
    gain.gain.setValueAtTime(0.3, startTime + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }, [getAudioContext]);

  // Play the current interval
  const playInterval = useCallback(() => {
    if (!gameState.currentInterval) return;

    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const noteDuration = 0.8;
    const gap = 0.1;

    const baseFreq = midiToFreq(gameState.baseNote);
    const targetFreq = midiToFreq(gameState.baseNote + gameState.currentInterval.semitones);

    setGameState(prev => ({ ...prev, isPlaying: true }));

    if (gameState.direction === "harmonic") {
      // Play both notes together
      playNote(baseFreq, now, noteDuration);
      playNote(targetFreq, now, noteDuration);
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: false }));
      }, noteDuration * 1000);
    } else if (gameState.direction === "ascending") {
      // Play base then target
      playNote(baseFreq, now, noteDuration);
      playNote(targetFreq, now + noteDuration + gap, noteDuration);
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: false }));
      }, (noteDuration * 2 + gap) * 1000);
    } else {
      // Descending: play target then base
      playNote(targetFreq, now, noteDuration);
      playNote(baseFreq, now + noteDuration + gap, noteDuration);
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: false }));
      }, (noteDuration * 2 + gap) * 1000);
    }
  }, [gameState, getAudioContext, midiToFreq, playNote]);

  // Generate a new question
  const generateQuestion = useCallback(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const allowedIntervals = settings.intervals;

    // Pick random interval
    const intervalIndex = allowedIntervals[Math.floor(Math.random() * allowedIntervals.length)];
    const interval = INTERVALS.find(i => i.semitones === intervalIndex)!;

    // Pick random base note (C3 to C5)
    const baseNote = 48 + Math.floor(Math.random() * 24);

    // Pick direction
    const directions: Direction[] = ["ascending"];
    if (includeDescending) directions.push("descending");
    if (includeHarmonic) directions.push("harmonic");
    const direction = directions[Math.floor(Math.random() * directions.length)];

    setGameState(prev => ({
      ...prev,
      currentInterval: interval,
      baseNote,
      direction,
      answeredCorrect: null,
      gameStarted: true,
    }));
  }, [difficulty, includeDescending, includeHarmonic]);

  // Handle answer
  const handleAnswer = useCallback((selectedInterval: IntervalDef) => {
    if (!gameState.currentInterval || gameState.answeredCorrect !== null) return;

    const isCorrect = selectedInterval.semitones === gameState.currentInterval.semitones;

    setGameState(prev => ({
      ...prev,
      answeredCorrect: isCorrect,
      score: prev.score + (isCorrect ? 1 : 0),
      streak: isCorrect ? prev.streak + 1 : 0,
      totalQuestions: prev.totalQuestions + 1,
    }));

    // Auto-advance after feedback
    setTimeout(() => {
      generateQuestion();
    }, 1500);
  }, [gameState, generateQuestion]);

  // Start game
  const startGame = useCallback(() => {
    setGameState({
      currentInterval: null,
      baseNote: 60,
      direction: "ascending",
      score: 0,
      streak: 0,
      totalQuestions: 0,
      answeredCorrect: null,
      isPlaying: false,
      gameStarted: false,
    });
    generateQuestion();
  }, [generateQuestion]);

  // Auto-play when new question generated
  useEffect(() => {
    if (gameState.currentInterval && gameState.answeredCorrect === null) {
      const timer = setTimeout(() => {
        playInterval();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentInterval, gameState.answeredCorrect, playInterval]);

  const currentSettings = DIFFICULTY_SETTINGS[difficulty];
  const availableIntervals = INTERVALS.filter(i =>
    currentSettings.intervals.includes(i.semitones)
  );

  return (
    <div className={styles.game}>
      {!gameState.gameStarted ? (
        <div className={styles.setup}>
          <h2 className={styles.setupTitle}>Interval Recognition</h2>
          <p className={styles.setupDescription}>
            Listen to two notes and identify the interval between them.
          </p>

          <div className={styles.settingsGroup}>
            <label className={styles.settingsLabel}>Difficulty</label>
            <div className={styles.difficultyButtons}>
              {Object.entries(DIFFICULTY_SETTINGS).map(([key, settings]) => (
                <button
                  key={key}
                  className={`${styles.difficultyBtn} ${difficulty === key ? styles.active : ""}`}
                  onClick={() => setDifficulty(key as Difficulty)}
                >
                  <span className={styles.diffLabel}>{settings.label}</span>
                  <span className={styles.diffDesc}>{settings.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.settingsGroup}>
            <label className={styles.settingsLabel}>Options</label>
            <div className={styles.checkboxes}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={includeDescending}
                  onChange={(e) => setIncludeDescending(e.target.checked)}
                />
                <span>Include descending intervals</span>
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={includeHarmonic}
                  onChange={(e) => setIncludeHarmonic(e.target.checked)}
                />
                <span>Include harmonic intervals (both notes at once)</span>
              </label>
            </div>
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
            <div className={styles.directionBadge}>
              {gameState.direction === "ascending" && "Ascending"}
              {gameState.direction === "descending" && "Descending"}
              {gameState.direction === "harmonic" && "Harmonic"}
            </div>

            <button
              className={`${styles.playButton} ${gameState.isPlaying ? styles.playing : ""}`}
              onClick={playInterval}
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
                  <span>Correct! It was {gameState.currentInterval?.name}</span>
                ) : (
                  <span>It was {gameState.currentInterval?.name}</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.answersGrid}>
            {availableIntervals.map((interval) => (
              <button
                key={interval.semitones}
                className={`${styles.answerBtn} ${
                  gameState.answeredCorrect !== null && 
                  interval.semitones === gameState.currentInterval?.semitones
                    ? styles.correctAnswer
                    : ""
                }`}
                onClick={() => handleAnswer(interval)}
                disabled={gameState.answeredCorrect !== null}
              >
                <span className={styles.intervalShort}>{interval.shortName}</span>
                <span className={styles.intervalName}>{interval.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

