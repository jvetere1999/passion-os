"use client";

/**
 * Courses Client Component
 * Browse and filter available courses
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import styles from "./page.module.css";

// Mock course data until API is ready
const MOCK_COURSES = [
  {
    id: "serum-fundamentals",
    title: "Serum Fundamentals",
    slug: "serum-fundamentals",
    synthScope: "serum" as const,
    difficulty: "beginner" as const,
    description: "Master the basics of Serum synthesis. Learn oscillators, filters, envelopes, and LFOs from the ground up.",
    learningOutcomes: [
      "Understand wavetable synthesis concepts",
      "Create patches from scratch",
      "Use modulation effectively",
      "Apply filters and effects",
    ],
    estimatedHours: 8,
    tags: ["wavetable", "synthesis", "sound-design"],
    modulesCount: 6,
    lessonsCount: 24,
    isNew: true,
  },
  {
    id: "vital-fundamentals",
    title: "Vital Fundamentals",
    slug: "vital-fundamentals",
    synthScope: "vital" as const,
    difficulty: "beginner" as const,
    description: "Get started with Vital, the free wavetable synth. Learn its unique features and create professional sounds.",
    learningOutcomes: [
      "Navigate Vital's interface",
      "Create expressive patches",
      "Use the modulation system",
      "Design your own wavetables",
    ],
    estimatedHours: 6,
    tags: ["wavetable", "synthesis", "free"],
    modulesCount: 5,
    lessonsCount: 18,
    isNew: true,
  },
  {
    id: "modulation-mastery",
    title: "Modulation Mastery",
    slug: "modulation-mastery",
    synthScope: "both" as const,
    difficulty: "intermediate" as const,
    description: "Deep dive into modulation: envelopes, LFOs, and advanced routing techniques for both Serum and Vital.",
    learningOutcomes: [
      "Master complex modulation routing",
      "Create evolving textures",
      "Build macro systems",
      "Design performance-ready patches",
    ],
    estimatedHours: 10,
    tags: ["modulation", "advanced", "techniques"],
    modulesCount: 8,
    lessonsCount: 32,
    isNew: false,
  },
  {
    id: "bass-design",
    title: "Bass Sound Design",
    slug: "bass-design",
    synthScope: "both" as const,
    difficulty: "intermediate" as const,
    description: "Create powerful bass sounds: sub bass, reese, neuro, and growl bass techniques.",
    learningOutcomes: [
      "Design powerful sub bass",
      "Create reese and neuro bass",
      "Master FM bass techniques",
      "Build layered bass patches",
    ],
    estimatedHours: 7,
    tags: ["bass", "edm", "dubstep"],
    modulesCount: 6,
    lessonsCount: 20,
    isNew: false,
  },
  {
    id: "advanced-wavetables",
    title: "Advanced Wavetable Design",
    slug: "advanced-wavetables",
    synthScope: "both" as const,
    difficulty: "advanced" as const,
    description: "Create custom wavetables, use spectral editing, and master advanced oscillator techniques.",
    learningOutcomes: [
      "Design custom wavetables",
      "Use spectral editing tools",
      "Create unique timbres",
      "Master wavetable morphing",
    ],
    estimatedHours: 12,
    tags: ["wavetable", "advanced", "spectral"],
    modulesCount: 7,
    lessonsCount: 28,
    isNew: false,
  },
];

type SynthFilter = "all" | "serum" | "vital" | "both";
type DifficultyFilter = "all" | "beginner" | "intermediate" | "advanced";

export function CoursesClient() {
  const [synthFilter, setSynthFilter] = useState<SynthFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = useMemo(() => {
    return MOCK_COURSES.filter((course) => {
      const matchesSynth =
        synthFilter === "all" ||
        course.synthScope === synthFilter ||
        course.synthScope === "both";
      const matchesDifficulty =
        difficultyFilter === "all" || course.difficulty === difficultyFilter;
      const matchesSearch =
        !searchQuery ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSynth && matchesDifficulty && matchesSearch;
    });
  }, [synthFilter, difficultyFilter, searchQuery]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Courses</h1>
        <p className={styles.subtitle}>
          Structured learning paths for Serum and Vital synthesis
        </p>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBar}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Synth:</label>
          <div className={styles.filterButtons}>
            {(["all", "serum", "vital", "both"] as const).map((value) => (
              <button
                key={value}
                className={`${styles.filterBtn} ${synthFilter === value ? styles.active : ""}`}
                onClick={() => setSynthFilter(value)}
              >
                {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Level:</label>
          <div className={styles.filterButtons}>
            {(["all", "beginner", "intermediate", "advanced"] as const).map((value) => (
              <button
                key={value}
                className={`${styles.filterBtn} ${difficultyFilter === value ? styles.active : ""}`}
                onClick={() => setDifficultyFilter(value)}
              >
                {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.courseGrid}>
        {filteredCourses.map((course) => (
          <Link
            key={course.id}
            href={`/learn/courses/${course.slug}`}
            className={styles.courseCard}
          >
            {course.isNew && <span className={styles.newBadge}>New</span>}
            <div className={styles.courseHeader}>
              <div className={styles.synthBadges}>
                {(course.synthScope === "serum" || course.synthScope === "both") && (
                  <span className={`${styles.synthBadge} ${styles.serum}`}>Serum</span>
                )}
                {(course.synthScope === "vital" || course.synthScope === "both") && (
                  <span className={`${styles.synthBadge} ${styles.vital}`}>Vital</span>
                )}
              </div>
              <span className={`${styles.difficultyBadge} ${styles[course.difficulty]}`}>
                {course.difficulty}
              </span>
            </div>
            <h2 className={styles.courseTitle}>{course.title}</h2>
            <p className={styles.courseDescription}>{course.description}</p>
            <div className={styles.courseMeta}>
              <span>{course.modulesCount} modules</span>
              <span>{course.lessonsCount} lessons</span>
              <span>~{course.estimatedHours}h</span>
            </div>
            <div className={styles.courseTags}>
              {course.tags.slice(0, 3).map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p>No courses match your filters</p>
          <button
            className={styles.clearBtn}
            onClick={() => {
              setSynthFilter("all");
              setDifficultyFilter("all");
              setSearchQuery("");
            }}
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default CoursesClient;

