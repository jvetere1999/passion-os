"use client";

/**
 * Chord Quality Recognition Game
 * Identify chord types by ear
 */

import { useState, useCallback, useRef, useEffect } from "react";
import styles from "./ChordGame.module.css";

interface ChordType {
  id: string;
  name: string;
  shortName: string;
  intervals: number[]; // Semitones from root
  color: string;
}

const CHORD_TYPES: ChordType[] = [
  { id: "major", name: "Major", shortName: "Maj", intervals: [0, 4, 7], color: "#4CAF50" },
  { id: "minor", name: "Minor", shortName: "min", intervals: [0, 3, 7], color: "#2196F3" },
  { id: "dim", name: "Diminished", shortName: "dim", intervals: [0, 3, 6], color: "#9C27B0" },
  { id: "aug", name: "Augmented", shortName: "aug", intervals: [0, 4, 8], color: "#FF9800" },
  { id: "sus2", name: "Suspended 2nd", shortName: "sus2", intervals: [0, 2, 7], color: "#00BCD4" },
  { id: "sus4", name: "Suspended 4th", shortName: "sus4", intervals: [0, 5, 7], color: "#009688" },
  { id: "maj7", name: "Major 7th", shortName: "Maj7", intervals: [0, 4, 7, 11], color: "#8BC34A" },
  { id: "min7", name: "Minor 7th", shortName: "min7", intervals: [0, 3, 7, 10], color: "#3F51B5" },
  { id: "dom7", name: "Dominant 7th", shortName: "7", intervals: [0, 4, 7, 10], color: "#F44336" },
  { id: "dim7", name: "Diminished 7th", shortName: "dim7", intervals: [0, 3, 6, 9], color: "#673AB7" },
];

const DIFFICULTY_SETTINGS = {
  beginner: {
    chords: ["major", "minor"],
    label: "Beginner",
    description: "Major vs Minor",
  },
  easy: {
    chords: ["major", "minor", "dim", "aug"],
    label: "Easy",
    description: "Basic triads",
  },
  medium: {
    chords: ["major", "minor", "dim", "sus2", "sus4", "dom7"],
    label: "Medium",
    description: "Triads + suspensions",
  },
  hard: {
    chords: ["major", "minor", "dim", "aug", "sus2", "sus4", "maj7", "min7", "dom7", "dim7"],
    label: "Hard",
    description: "All chord types",
  },
};

type Difficulty = keyof typeof DIFFICULTY_SETTINGS;

interface GameState {
  currentChord: ChordType | null;
  rootNote: number;
  score: number;
  streak: number;
  totalQuestions: number;
  answeredCorrect: boolean | null;
  isPlaying: boolean;
  gameStarted: boolean;
}

export function ChordGame() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [playArpeggio, setPlayArpeggio] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentChord: null,
    rootNote: 60,
    score: 0,
    streak: 0,
    totalQuestions: 0,
    answeredCorrect: null,
    isPlaying: false,
    gameStarted: false,
  });

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

  const playNote = useCallback((freq: number, startTime: number, duration: number, volume: number = 0.2) => {
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle"; // Softer sound for chords
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume, startTime + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }, [getAudioContext]);

  const playChord = useCallback(() => {
    if (!gameState.currentChord) return;

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    setGameState(prev => ({ ...prev, isPlaying: true }));

    const notes = gameState.currentChord.intervals.map(i => gameState.rootNote + i);
    const noteVolume = 0.15 / Math.sqrt(notes.length); // Normalize volume for chord size

    if (playArpeggio) {
      // Play as arpeggio
      notes.forEach((note, idx) => {
        const freq = midiToFreq(note);
        playNote(freq, now + idx * 0.2, 1.5 - idx * 0.15, noteVolume * 1.5);
      });
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: false }));
      }, (notes.length * 200 + 1200));
    } else {
      // Play all notes together
      notes.forEach(note => {
        const freq = midiToFreq(note);
        playNote(freq, now, 1.5, noteVolume);
      });
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: false }));
      }, 1600);
    }
  }, [gameState, playArpeggio, midiToFreq, playNote, getAudioContext]);

  const generateQuestion = useCallback(() => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const availableChords = CHORD_TYPES.filter(c => settings.chords.includes(c.id));

    const chord = availableChords[Math.floor(Math.random() * availableChords.length)];
    const rootNote = 48 + Math.floor(Math.random() * 12); // C3 to B3

    setGameState(prev => ({
      ...prev,
      currentChord: chord,
      rootNote,
      answeredCorrect: null,
      gameStarted: true,
    }));
  }, [difficulty]);

  const handleAnswer = useCallback((chordId: string) => {
    if (!gameState.currentChord || gameState.answeredCorrect !== null) return;

    const isCorrect = chordId === gameState.currentChord.id;

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
      currentChord: null,
      rootNote: 60,
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
    if (gameState.gameStarted && gameState.answeredCorrect === null && gameState.currentChord) {
      const timer = setTimeout(() => {
        playChord();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentChord, gameState.answeredCorrect, gameState.gameStarted, playChord]);

  const currentSettings = DIFFICULTY_SETTINGS[difficulty];
  const availableChords = CHORD_TYPES.filter(c => currentSettings.chords.includes(c.id));

  return (
    <div className={styles.game}>
      {!gameState.gameStarted ? (
        <div className={styles.setup}>
          <h2 className={styles.setupTitle}>Chord Quality Recognition</h2>
          <p className={styles.setupDescription}>
            Listen to a chord and identify its quality (major, minor, etc.)
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
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={playArpeggio}
                onChange={(e) => setPlayArpeggio(e.target.checked)}
              />
              <span>Play as arpeggio (notes one at a time)</span>
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
            <div className={styles.playMode}>
              {playArpeggio ? "Arpeggio" : "Block Chord"}
            </div>

            <button
              className={`${styles.playButton} ${gameState.isPlaying ? styles.playing : ""}`}
              onClick={playChord}
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
                  <span>Correct! It was {gameState.currentChord?.name}</span>
                ) : (
                  <span>It was {gameState.currentChord?.name}</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.answersGrid}>
            {availableChords.map((chord) => (
              <button
                key={chord.id}
                className={`${styles.answerBtn} ${
                  gameState.answeredCorrect !== null && 
                  chord.id === gameState.currentChord?.id
                    ? styles.correctAnswer
                    : ""
                }`}
                style={{ "--chord-color": chord.color } as React.CSSProperties}
                onClick={() => handleAnswer(chord.id)}
                disabled={gameState.answeredCorrect !== null}
              >
                <span className={styles.chordShort}>{chord.shortName}</span>
                <span className={styles.chordName}>{chord.name}</span>
                <span className={styles.chordNotes}>
                  {chord.intervals.length} notes
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

