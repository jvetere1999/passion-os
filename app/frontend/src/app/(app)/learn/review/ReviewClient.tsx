"use client";

/**
 * Review Client Component
 * Spaced repetition flashcard review system
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";

interface ReviewCard {
  id: string;
  front: string;
  back: string;
  conceptId: string | null;
  cardType: "definition" | "identification" | "application";
  dueAt: string;
  intervalDays: number;
  ease: number;
  lapses: number;
}

interface ReviewSession {
  cards: ReviewCard[];
  newCardsToday: number;
  reviewCardsToday: number;
  estimatedMinutes: number;
}

// SM-2 algorithm implementation
function calculateNextReview(card: ReviewCard, grade: number) {
  let newEase = card.ease;
  let newInterval = card.intervalDays;
  let newLapses = card.lapses;

  if (grade === 0) {
    // Again - reset interval
    newInterval = 1;
    newLapses = card.lapses + 1;
    newEase = Math.max(1.3, card.ease - 0.2);
  } else if (grade === 1) {
    // Hard
    newInterval = Math.max(1, card.intervalDays * 1.2);
    newEase = Math.max(1.3, card.ease - 0.15);
  } else if (grade === 2) {
    // Good
    if (card.intervalDays < 1) {
      newInterval = 1;
    } else {
      newInterval = card.intervalDays * card.ease;
    }
  } else {
    // Easy
    newInterval = card.intervalDays * card.ease * 1.3;
    newEase = card.ease + 0.15;
  }

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + Math.round(newInterval));

  return {
    ...card,
    intervalDays: newInterval,
    ease: newEase,
    lapses: newLapses,
    dueAt: dueAt.toISOString(),
  };
}

// Mock cards for development
const MOCK_CARDS: ReviewCard[] = [
  {
    id: "1",
    front: "What is a wavetable?",
    back: "A wavetable is a collection of single-cycle waveforms that can be morphed between. Each position in the wavetable represents a different timbre.",
    conceptId: "wavetable",
    cardType: "definition",
    dueAt: new Date().toISOString(),
    intervalDays: 1,
    ease: 2.5,
    lapses: 0,
  },
  {
    id: "2",
    front: "What happens when you increase the resonance of a low-pass filter?",
    back: "Increasing resonance boosts frequencies near the cutoff point, creating a peak in the frequency response. At high resonance values, the filter can self-oscillate.",
    conceptId: "resonance",
    cardType: "application",
    dueAt: new Date().toISOString(),
    intervalDays: 2,
    ease: 2.3,
    lapses: 1,
  },
  {
    id: "3",
    front: "Identify: In Serum, where is the unison control located?",
    back: "The unison control is located in the oscillator section, below the wavetable display. It includes Voice count, Detune, Blend, and Width parameters.",
    conceptId: "unison",
    cardType: "identification",
    dueAt: new Date().toISOString(),
    intervalDays: 1,
    ease: 2.5,
    lapses: 0,
  },
];

interface ReviewClientProps {
  userId: string;
}

export function ReviewClient({ userId }: ReviewClientProps) {
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  useEffect(() => {
    // Load review session
    const mockSession: ReviewSession = {
      cards: MOCK_CARDS,
      newCardsToday: 5,
      reviewCardsToday: MOCK_CARDS.length,
      estimatedMinutes: Math.ceil(MOCK_CARDS.length * 0.5),
    };
    setSession(mockSession);
    setLoading(false);
  }, [userId]);

  const currentCard = session?.cards[currentIndex];

  const handleGrade = useCallback(
    (grade: number) => {
      if (!currentCard) return;

      // Update stats
      const statKey = ["again", "hard", "good", "easy"][grade] as keyof typeof sessionStats;
      setSessionStats((prev) => ({ ...prev, [statKey]: prev[statKey] + 1 }));

      // Calculate next review (would save to DB in real implementation)
      const _updated = calculateNextReview(currentCard, grade);

      // Move to next card
      setReviewed((prev) => prev + 1);
      setShowAnswer(false);

      if (currentIndex < (session?.cards.length || 0) - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionComplete(true);
      }
    },
    [currentCard, currentIndex, session?.cards.length]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (sessionComplete) return;

      if (!showAnswer) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setShowAnswer(true);
        }
      } else {
        if (e.key === "1") handleGrade(0);
        else if (e.key === "2") handleGrade(1);
        else if (e.key === "3") handleGrade(2);
        else if (e.key === "4") handleGrade(3);
      }
    },
    [showAnswer, handleGrade, sessionComplete]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading review session...</p>
      </div>
    );
  }

  if (!session || session.cards.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h2>All caught up!</h2>
          <p>You have no cards due for review right now.</p>
          <p className={styles.nextReview}>
            Next review: <strong>Tomorrow</strong>
          </p>
          <Link href="/learn" className={styles.backBtn}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const total = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
    const retention = total > 0 ? Math.round(((sessionStats.good + sessionStats.easy) / total) * 100) : 0;

    return (
      <div className={styles.page}>
        <div className={styles.completeState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h2>Session Complete!</h2>
          <p>You reviewed {reviewed} cards</p>

          <div className={styles.sessionStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{retention}%</span>
              <span className={styles.statLabel}>Retention</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.again}`}>{sessionStats.again}</span>
              <span className={styles.statLabel}>Again</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.hard}`}>{sessionStats.hard}</span>
              <span className={styles.statLabel}>Hard</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.good}`}>{sessionStats.good}</span>
              <span className={styles.statLabel}>Good</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.easy}`}>{sessionStats.easy}</span>
              <span className={styles.statLabel}>Easy</span>
            </div>
          </div>

          <Link href="/learn" className={styles.backBtn}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.progress}>
          <span>
            {reviewed + 1} / {session.cards.length}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((reviewed + 1) / session.cards.length) * 100}%` }}
            />
          </div>
        </div>
        <Link href="/learn" className={styles.exitBtn}>
          Exit
        </Link>
      </header>

      <div className={styles.cardContainer}>
        <div className={`${styles.card} ${showAnswer ? styles.flipped : ""}`}>
          <div className={styles.cardFront}>
            <span className={styles.cardType}>{currentCard?.cardType}</span>
            <p className={styles.cardText}>{currentCard?.front}</p>
            <button className={styles.showBtn} onClick={() => setShowAnswer(true)}>
              Show Answer
              <span className={styles.shortcut}>Space</span>
            </button>
          </div>

          {showAnswer && (
            <div className={styles.cardBack}>
              <span className={styles.cardType}>{currentCard?.cardType}</span>
              <p className={styles.cardQuestion}>{currentCard?.front}</p>
              <div className={styles.divider} />
              <p className={styles.cardAnswer}>{currentCard?.back}</p>
            </div>
          )}
        </div>

        {showAnswer && (
          <div className={styles.gradeButtons}>
            <button className={`${styles.gradeBtn} ${styles.again}`} onClick={() => handleGrade(0)}>
              <span className={styles.gradeLabel}>Again</span>
              <span className={styles.gradeInterval}>1d</span>
              <span className={styles.gradeKey}>1</span>
            </button>
            <button className={`${styles.gradeBtn} ${styles.hard}`} onClick={() => handleGrade(1)}>
              <span className={styles.gradeLabel}>Hard</span>
              <span className={styles.gradeInterval}>
                {Math.round(currentCard?.intervalDays ? currentCard.intervalDays * 1.2 : 1)}d
              </span>
              <span className={styles.gradeKey}>2</span>
            </button>
            <button className={`${styles.gradeBtn} ${styles.good}`} onClick={() => handleGrade(2)}>
              <span className={styles.gradeLabel}>Good</span>
              <span className={styles.gradeInterval}>
                {Math.round(
                  currentCard?.intervalDays
                    ? currentCard.intervalDays * currentCard.ease
                    : 1
                )}d
              </span>
              <span className={styles.gradeKey}>3</span>
            </button>
            <button className={`${styles.gradeBtn} ${styles.easy}`} onClick={() => handleGrade(3)}>
              <span className={styles.gradeLabel}>Easy</span>
              <span className={styles.gradeInterval}>
                {Math.round(
                  currentCard?.intervalDays
                    ? currentCard.intervalDays * currentCard.ease * 1.3
                    : 4
                )}d
              </span>
              <span className={styles.gradeKey}>4</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewClient;

