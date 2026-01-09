"use client";

/**
 * Diagnostic Assessment Page
 * Initial skill level assessment for personalized learning
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  conceptId: string;
}

const DIAGNOSTIC_QUESTIONS: Question[] = [
  {
    id: "1",
    category: "Oscillators",
    question: "What is a wavetable?",
    options: [
      "A database of audio samples",
      "A collection of single-cycle waveforms that can be morphed between",
      "A type of audio effect",
      "A MIDI controller",
    ],
    correctAnswer: 1,
    conceptId: "wavetable",
  },
  {
    id: "2",
    category: "Oscillators",
    question: "What does increasing unison voices typically do to a sound?",
    options: [
      "Makes it quieter",
      "Reduces stereo width",
      "Makes it thicker and wider",
      "Removes harmonics",
    ],
    correctAnswer: 2,
    conceptId: "unison",
  },
  {
    id: "3",
    category: "Filters",
    question: "A low-pass filter allows frequencies to pass that are:",
    options: [
      "Above the cutoff frequency",
      "Below the cutoff frequency",
      "At exactly the cutoff frequency",
      "In a narrow band around the cutoff",
    ],
    correctAnswer: 1,
    conceptId: "filter",
  },
  {
    id: "4",
    category: "Filters",
    question: "What happens at high resonance values on a filter?",
    options: [
      "The filter stops working",
      "All frequencies are boosted equally",
      "Frequencies near the cutoff are boosted, creating a peak",
      "The sound becomes completely silent",
    ],
    correctAnswer: 2,
    conceptId: "resonance",
  },
  {
    id: "5",
    category: "Envelopes",
    question: "In an ADSR envelope, what does the 'D' (Decay) control?",
    options: [
      "Time to reach maximum level from silence",
      "Time to fall from peak to sustain level",
      "The level held while a note is pressed",
      "Time to fade out after note release",
    ],
    correctAnswer: 1,
    conceptId: "envelope",
  },
  {
    id: "6",
    category: "Modulation",
    question: "An LFO typically operates at what frequency range?",
    options: [
      "20Hz - 20kHz (audible range)",
      "Below 20Hz (sub-audible)",
      "Above 20kHz (ultrasonic)",
      "Exactly 440Hz",
    ],
    correctAnswer: 1,
    conceptId: "lfo",
  },
  {
    id: "7",
    category: "Modulation",
    question: "What is modulation routing?",
    options: [
      "Connecting speakers to an amplifier",
      "Assigning a modulation source to control a parameter",
      "Recording audio to a track",
      "Saving a preset",
    ],
    correctAnswer: 1,
    conceptId: "modulation",
  },
  {
    id: "8",
    category: "Synthesis",
    question: "FM synthesis creates complex timbres by:",
    options: [
      "Adding reverb to simple waves",
      "Filtering white noise",
      "Modulating one oscillator's frequency with another at audio rates",
      "Playing multiple samples simultaneously",
    ],
    correctAnswer: 2,
    conceptId: "fm-synthesis",
  },
];

export default function DiagnosticPage() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const question = DIAGNOSTIC_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / DIAGNOSTIC_QUESTIONS.length) * 100;

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      setAnswers((prev) => ({
        ...prev,
        [question.id]: answerIndex,
      }));

      if (currentQuestion < DIAGNOSTIC_QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        setShowResults(true);
      }
    },
    [currentQuestion, question.id]
  );

  const calculateResults = () => {
    let correct = 0;
    const weakConcepts: string[] = [];

    DIAGNOSTIC_QUESTIONS.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      } else {
        weakConcepts.push(q.conceptId);
      }
    });

    const score = Math.round((correct / DIAGNOSTIC_QUESTIONS.length) * 100);
    return { score, correct, total: DIAGNOSTIC_QUESTIONS.length, weakConcepts };
  };

  const handleComplete = () => {
    // In a real implementation, this would save to the database
    router.push("/learn");
  };

  if (showResults) {
    const results = calculateResults();

    return (
      <div className={styles.page}>
        <div className={styles.resultsCard}>
          <div className={styles.scoreCircle}>
            <span className={styles.scoreValue}>{results.score}%</span>
          </div>
          <h2>Assessment Complete</h2>
          <p>
            You answered {results.correct} out of {results.total} questions correctly.
          </p>

          {results.weakConcepts.length > 0 && (
            <div className={styles.weakAreas}>
              <h3>Areas to Focus On</h3>
              <ul>
                {results.weakConcepts.map((concept) => (
                  <li key={concept}>{concept.replace(/-/g, " ")}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.recommendations}>
            <h3>Recommended Starting Point</h3>
            <p>
              {results.score >= 80
                ? "You have a solid foundation. Consider starting with Modulation Mastery or an intermediate course."
                : results.score >= 50
                ? "You know the basics. Start with Serum or Vital Fundamentals to fill in the gaps."
                : "Begin with the fundamentals course for your synth of choice to build a strong foundation."}
            </p>
          </div>

          <button className={styles.completeBtn} onClick={handleComplete}>
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Skill Assessment</h1>
        <p>Answer these questions to get personalized course recommendations</p>
      </header>

      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.questionCard}>
        <span className={styles.category}>{question.category}</span>
        <span className={styles.questionNumber}>
          Question {currentQuestion + 1} of {DIAGNOSTIC_QUESTIONS.length}
        </span>
        <h2 className={styles.questionText}>{question.question}</h2>

        <div className={styles.options}>
          {question.options.map((option, index) => (
            <button
              key={index}
              className={styles.optionBtn}
              onClick={() => handleAnswer(index)}
            >
              <span className={styles.optionLetter}>
                {String.fromCharCode(65 + index)}
              </span>
              <span className={styles.optionText}>{option}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

