"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./ExerciseClient.module.css";

// Types
interface Exercise {
  id: string;
  name: string;
  description: string | null;
  category: string;
  muscle_groups: string | null;
  equipment: string | null;
  instructions: string | null;
  is_builtin: number;
  force?: string;
  level?: string;
}

interface Workout {
  id: string;
  name: string;
  description: string | null;
  workout_type: string;
  estimated_duration: number | null;
}

interface WorkoutSession {
  id: string;
  workout_id: string | null;
  workout_name: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  notes: string | null;
  rating: number | null;
}

interface ExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  is_warmup: number;
  is_failure: number;
}

interface PersonalRecord {
  id: string;
  exercise_id: string;
  exercise_name: string;
  record_type: string;
  value: number;
  reps: number | null;
  achieved_at: string;
  previous_value: number | null;
}

interface Stats {
  workouts: number;
  sets: number;
  prs: number;
}

// Categories from exercises.json
const CATEGORIES = [
  { id: "strength", label: "Strength" },
  { id: "cardio", label: "Cardio" },
  { id: "stretching", label: "Stretching" },
  { id: "plyometrics", label: "Plyometrics" },
  { id: "powerlifting", label: "Powerlifting" },
  { id: "olympic weightlifting", label: "Olympic Weightlifting" },
  { id: "strongman", label: "Strongman" },
];

const MUSCLE_GROUPS = [
  "abdominals", "abductors", "adductors", "biceps", "calves", "chest",
  "forearms", "glutes", "hamstrings", "lats", "lower back", "middle back",
  "neck", "quadriceps", "shoulders", "traps", "triceps"
];

// Recurrence options for planner
const RECURRENCE_OPTIONS = [
  { value: "", label: "One time" },
  { value: "FREQ=DAILY", label: "Daily" },
  { value: "FREQ=WEEKLY;BYDAY=MO,WE,FR", label: "Mon/Wed/Fri" },
  { value: "FREQ=WEEKLY;BYDAY=TU,TH,SA", label: "Tue/Thu/Sat" },
  { value: "FREQ=WEEKLY", label: "Weekly" },
  { value: "FREQ=WEEKLY;INTERVAL=2", label: "Every 2 weeks" },
];

export function ExerciseClient() {
  // State
  const [activeTab, setActiveTab] = useState<"library" | "workouts" | "programs" | "history" | "records">("library");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ workouts: 0, sets: 0, prs: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [muscleFilter, setMuscleFilter] = useState("");

  // Modal states
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  const [showActiveSession, setShowActiveSession] = useState(false);
  const [showLinkPlanner, setShowLinkPlanner] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [activeSession, setActiveSession] = useState<{ id: string; sets: ExerciseSet[] } | null>(null);

  // Form states
  const [newExercise, setNewExercise] = useState({
    name: "",
    description: "",
    category: "strength",
    muscle_groups: [] as string[],
    equipment: [] as string[],
    instructions: "",
  });

  // Workout sections type
  interface WorkoutSection {
    id: string;
    name: string;
    type: "warmup" | "main" | "cooldown" | "superset" | "circuit";
    exercises: { exercise_id: string; exercise_name: string; target_sets: number; target_reps: string; rest_seconds: number }[];
  }

  const [newWorkout, setNewWorkout] = useState({
    name: "",
    description: "",
    workout_type: "strength",
    estimated_duration: 60,
    sections: [{ id: `section_${Date.now()}`, name: "Main", type: "main" as const, exercises: [] }] as WorkoutSection[],
    // Legacy flat exercises for backward compatibility
    exercises: [] as { exercise_id: string; exercise_name: string; target_sets: number; target_reps: string; rest_seconds: number }[],
  });
  const [activeSection, setActiveSection] = useState(0);
  const [plannerLink, setPlannerLink] = useState({
    title: "",
    start_time: "",
    end_time: "",
    recurrence_rule: "",
  });
  const [importText, setImportText] = useState("");

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [exercisesRes, workoutsRes, sessionsRes, recordsRes, statsRes] = await Promise.all([
        fetch(`/api/exercise?type=exercises&category=${categoryFilter}&search=${searchTerm}`),
        fetch("/api/exercise?type=workouts"),
        fetch("/api/exercise?type=sessions&limit=10"),
        fetch("/api/exercise?type=records"),
        fetch("/api/exercise?type=stats"),
      ]);

      if (exercisesRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await exercisesRes.json();
        setExercises(data.exercises || []);
      }
      if (workoutsRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await workoutsRes.json();
        setWorkouts(data.workouts || []);
      }
      if (sessionsRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
      if (recordsRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await recordsRes.json();
        setRecords(data.records || []);
      }
      if (statsRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await statsRes.json();
        setStats(data.stats || { workouts: 0, sets: 0, prs: 0 });
      }
    } catch (error) {
      console.error("Failed to load exercise data:", error);
    }
    setLoading(false);
  }, [categoryFilter, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    let result = exercises;
    if (muscleFilter) {
      result = result.filter((ex) => {
        try {
          const muscles = ex.muscle_groups ? JSON.parse(ex.muscle_groups) : [];
          return muscles.includes(muscleFilter);
        } catch {
          return false;
        }
      });
    }
    return result;
  }, [exercises, muscleFilter]);

  // Create exercise
  const handleCreateExercise = async () => {
    try {
      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "exercise", ...newExercise }),
      });
      if (res.ok) {
        setShowCreateExercise(false);
        setNewExercise({ name: "", description: "", category: "strength", muscle_groups: [], equipment: [], instructions: "" });
        loadData();
      }
    } catch (error) {
      console.error("Failed to create exercise:", error);
    }
  };

  // Create workout
  const handleCreateWorkout = async () => {
    try {
      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "workout", ...newWorkout }),
      });
      if (res.ok) {
        setShowCreateWorkout(false);
        setNewWorkout({
          name: "",
          description: "",
          workout_type: "strength",
          estimated_duration: 60,
          sections: [{ id: `section_${Date.now()}`, name: "Main", type: "main" as const, exercises: [] }],
          exercises: []
        });
        setActiveSection(0);
        loadData();
      }
    } catch (error) {
      console.error("Failed to create workout:", error);
    }
  };

  // Start workout session
  const handleStartWorkout = async (workoutId?: string) => {
    try {
      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "session", workout_id: workoutId }),
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await res.json();
        setActiveSession({ id: data.id, sets: [] });
        setShowActiveSession(true);
        loadData();
      }
    } catch (error) {
      console.error("Failed to start workout:", error);
    }
  };

  // Log exercise set
  const handleLogSet = async (exerciseId: string, reps: number, weight: number, rpe?: number) => {
    if (!activeSession) return;
    try {
      const setNumber = activeSession.sets.filter((s) => s.exercise_id === exerciseId).length + 1;
      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "set",
          workout_session_id: activeSession.id,
          exercise_id: exerciseId,
          set_number: setNumber,
          reps,
          weight,
          rpe,
        }),
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await res.json();
        const newSet: ExerciseSet = {
          id: data.id,
          exercise_id: exerciseId,
          set_number: setNumber,
          reps,
          weight,
          rpe: rpe || null,
          is_warmup: 0,
          is_failure: 0,
        };
        setActiveSession((prev) => prev ? { ...prev, sets: [...prev.sets, newSet] } : null);
        if (data.newPR) {
          alert(`New Personal Record! ${weight} lbs for ${reps} reps!`);
          loadData();
        }
      }
    } catch (error) {
      console.error("Failed to log set:", error);
    }
  };

  // Complete session
  const handleCompleteSession = async (rating?: number, notes?: string) => {
    if (!activeSession) return;
    try {
      await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "complete_session",
          session_id: activeSession.id,
          rating,
          notes,
        }),
      });
      setActiveSession(null);
      setShowActiveSession(false);
      loadData();
    } catch (error) {
      console.error("Failed to complete session:", error);
    }
  };

  // Link to planner
  const handleLinkToPlanner = async () => {
    if (!selectedWorkout) return;
    try {
      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "link_to_planner",
          workout_id: selectedWorkout.id,
          ...plannerLink,
        }),
      });
      if (res.ok) {
        setShowLinkPlanner(false);
        setPlannerLink({ title: "", start_time: "", end_time: "", recurrence_rule: "" });
        alert("Workout scheduled successfully!");
      }
    } catch (error) {
      console.error("Failed to link to planner:", error);
    }
  };

  // Link to quest
  const handleLinkToQuest = async (workout: Workout, isRepeatable: boolean, repeatFrequency?: string) => {
    try {
      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "link_to_quest",
          workout_id: workout.id,
          title: `Complete: ${workout.name}`,
          description: workout.description || `Complete the ${workout.name} workout`,
          xp_value: 50,
          is_repeatable: isRepeatable,
          repeat_frequency: repeatFrequency,
        }),
      });
      if (res.ok) {
        alert("Quest created successfully!");
      }
    } catch (error) {
      console.error("Failed to create quest:", error);
    }
  };

  // Import exercises
  const handleImport = async () => {
    try {
      const parsed = JSON.parse(importText);
      const exercisesToImport = Array.isArray(parsed) ? parsed : [parsed];

      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "import_exercises", exercises: exercisesToImport }),
      });

      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await res.json();
        alert(`Successfully imported ${data.imported} exercises!`);
        setShowImport(false);
        setImportText("");
        loadData();
      }
    } catch (error) {
      console.error("Failed to import:", error);
      alert("Invalid JSON format. Please check your input.");
    }
  };

  // Add exercise to new workout (to active section)
  const addExerciseToWorkout = (exercise: Exercise) => {
    setNewWorkout((prev) => {
      const updatedSections = [...prev.sections];
      if (updatedSections[activeSection]) {
        updatedSections[activeSection] = {
          ...updatedSections[activeSection],
          exercises: [
            ...updatedSections[activeSection].exercises,
            {
              exercise_id: exercise.id,
              exercise_name: exercise.name,
              target_sets: 3,
              target_reps: "8-12",
              rest_seconds: 90,
            },
          ],
        };
      }
      return { ...prev, sections: updatedSections };
    });
  };

  // Add new section to workout
  const addWorkoutSection = (type: "warmup" | "main" | "cooldown" | "superset" | "circuit") => {
    const names: Record<string, string> = {
      warmup: "Warmup",
      main: "Main",
      cooldown: "Cooldown",
      superset: "Superset",
      circuit: "Circuit",
    };
    setNewWorkout((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: `section_${Date.now()}`, name: names[type], type, exercises: [] },
      ],
    }));
    setActiveSection(newWorkout.sections.length);
  };

  // Remove section from workout
  const removeWorkoutSection = (index: number) => {
    if (newWorkout.sections.length <= 1) return;
    setNewWorkout((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
    if (activeSection >= index && activeSection > 0) {
      setActiveSection(activeSection - 1);
    }
  };

  // Remove exercise from section
  const removeExerciseFromSection = (sectionIndex: number, exerciseIndex: number) => {
    setNewWorkout((prev) => {
      const updatedSections = [...prev.sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        exercises: updatedSections[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex),
      };
      return { ...prev, sections: updatedSections };
    });
  };

  // Remove exercise from workout (legacy)
  const removeExerciseFromWorkout = (index: number) => {
    setNewWorkout((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }));
  };

  // Delete workout
  const handleDeleteWorkout = async (id: string) => {
    if (!confirm("Delete this workout?")) return;
    try {
      await fetch(`/api/exercise?type=workout&id=${id}`, { method: "DELETE" });
      loadData();
    } catch (error) {
      console.error("Failed to delete workout:", error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.workouts}</span>
          <span className={styles.statLabel}>Workouts This Week</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.sets}</span>
          <span className={styles.statLabel}>Sets</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{stats.prs}</span>
          <span className={styles.statLabel}>PRs</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={() => handleStartWorkout()}>
          Start Workout
        </button>
        <button className={styles.secondaryButton} onClick={() => setShowCreateWorkout(true)}>
          Create Workout
        </button>
        <button className={styles.secondaryButton} onClick={() => setShowCreateExercise(true)}>
          Add Exercise
        </button>
        <button className={styles.secondaryButton} onClick={() => setShowImport(true)}>
          Import
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "library" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("library")}
        >
          Exercise Library
        </button>
        <button
          className={`${styles.tab} ${activeTab === "workouts" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("workouts")}
        >
          My Workouts
        </button>
        <button
          className={`${styles.tab} ${activeTab === "programs" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("programs")}
        >
          Programs
        </button>
        <button
          className={`${styles.tab} ${activeTab === "history" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
        <button
          className={`${styles.tab} ${activeTab === "records" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("records")}
        >
          Personal Records
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {loading && <div className={styles.loading}>Loading...</div>}

        {/* Exercise Library */}
        {activeTab === "library" && !loading && (
          <div className={styles.library}>
            <div className={styles.filters}>
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <select
                value={muscleFilter}
                onChange={(e) => setMuscleFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">All Muscles</option>
                {MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className={styles.exerciseGrid}>
              {filteredExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onAddToWorkout={() => {
                    if (showCreateWorkout) {
                      addExerciseToWorkout(exercise);
                    }
                  }}
                  showAddButton={showCreateWorkout}
                />
              ))}
              {filteredExercises.length === 0 && (
                <div className={styles.emptyState}>
                  <p>No exercises found</p>
                  <button onClick={() => setShowCreateExercise(true)}>Create one</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Workouts */}
        {activeTab === "workouts" && !loading && (
          <div className={styles.workoutList}>
            {workouts.map((workout) => (
              <div key={workout.id} className={styles.workoutCard}>
                <div className={styles.workoutInfo}>
                  <h3>{workout.name}</h3>
                  <p>{workout.description}</p>
                  <span className={styles.workoutMeta}>
                    {workout.workout_type} - {workout.estimated_duration || "?"} min
                  </span>
                </div>
                <div className={styles.workoutActions}>
                  <button onClick={() => handleStartWorkout(workout.id)}>Start</button>
                  <button onClick={() => { setSelectedWorkout(workout); setShowLinkPlanner(true); }}>Schedule</button>
                  <button onClick={() => handleLinkToQuest(workout, false)}>Quest (Once)</button>
                  <button onClick={() => handleLinkToQuest(workout, true, "daily")}>Daily Quest</button>
                  <button onClick={() => handleDeleteWorkout(workout.id)} className={styles.dangerButton}>Delete</button>
                </div>
              </div>
            ))}
            {workouts.length === 0 && (
              <div className={styles.emptyState}>
                <p>No workouts yet</p>
                <button onClick={() => setShowCreateWorkout(true)}>Create your first workout</button>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {activeTab === "history" && !loading && (
          <div className={styles.historyList}>
            {sessions.map((session) => (
              <div key={session.id} className={styles.sessionCard}>
                <div className={styles.sessionInfo}>
                  <h3>{session.workout_name || "Quick Workout"}</h3>
                  <p>{new Date(session.started_at).toLocaleDateString()}</p>
                  <span className={`${styles.statusBadge} ${styles[session.status]}`}>
                    {session.status}
                  </span>
                </div>
                {session.rating && (
                  <div className={styles.rating}>
                    {"*".repeat(session.rating)}{"*".repeat(5 - session.rating).replace(/\*/g, "-")}
                  </div>
                )}
              </div>
            ))}
            {sessions.length === 0 && (
              <div className={styles.emptyState}>
                <p>No workout history yet</p>
                <button onClick={() => handleStartWorkout()}>Start your first workout</button>
              </div>
            )}
          </div>
        )}

        {/* Personal Records */}
        {activeTab === "records" && !loading && (
          <div className={styles.recordsList}>
            {records.map((record) => (
              <div key={record.id} className={styles.recordCard}>
                <div className={styles.recordInfo}>
                  <h3>{record.exercise_name}</h3>
                  <p className={styles.recordValue}>
                    {record.value} lbs x {record.reps} reps
                  </p>
                  <span className={styles.recordDate}>
                    {new Date(record.achieved_at).toLocaleDateString()}
                  </span>
                </div>
                {record.previous_value && (
                  <div className={styles.improvement}>
                    +{(record.value - record.previous_value).toFixed(1)} lbs
                  </div>
                )}
              </div>
            ))}
            {records.length === 0 && (
              <div className={styles.emptyState}>
                <p>No personal records yet</p>
                <span>Complete workouts to set records</span>
              </div>
            )}
          </div>
        )}

        {/* Training Programs */}
        {activeTab === "programs" && !loading && (
          <div className={styles.programsList}>
            <div className={styles.programsHeader}>
              <p className={styles.programsDescription}>
                Multi-week training plans that auto-schedule workouts to your planner.
              </p>
              <button className={styles.secondaryButton} onClick={() => alert("Program creation coming soon!")}>
                Create Program
              </button>
            </div>

            <div className={styles.programsGrid}>
              <div className={styles.programCard}>
                <div className={styles.programBadge}>Coming Soon</div>
                <h3>Strength Builder</h3>
                <p>4-week progressive overload program</p>
                <div className={styles.programMeta}>
                  <span>4 weeks</span>
                  <span>4 days/week</span>
                  <span>Intermediate</span>
                </div>
              </div>

              <div className={styles.programCard}>
                <div className={styles.programBadge}>Coming Soon</div>
                <h3>HIIT Circuit</h3>
                <p>6-week cardio and strength combo</p>
                <div className={styles.programMeta}>
                  <span>6 weeks</span>
                  <span>3 days/week</span>
                  <span>All Levels</span>
                </div>
              </div>

              <div className={styles.programCard}>
                <div className={styles.programBadge}>Coming Soon</div>
                <h3>Hypertrophy</h3>
                <p>8-week muscle building program</p>
                <div className={styles.programMeta}>
                  <span>8 weeks</span>
                  <span>5 days/week</span>
                  <span>Advanced</span>
                </div>
              </div>
            </div>

            <div className={styles.programTip}>
              <strong>Tip:</strong> Programs automatically schedule your workouts to the planner and track your progress over multiple weeks.
              They include deload weeks and progressive overload built-in.
            </div>
          </div>
        )}
      </div>

      {/* Create Exercise Modal */}
      {showCreateExercise && (
        <Modal title="Create Exercise" onClose={() => setShowCreateExercise(false)}>
          <div className={styles.form}>
            <input
              type="text"
              placeholder="Exercise name"
              value={newExercise.name}
              onChange={(e) => setNewExercise((p) => ({ ...p, name: e.target.value }))}
            />
            <textarea
              placeholder="Description"
              value={newExercise.description}
              onChange={(e) => setNewExercise((p) => ({ ...p, description: e.target.value }))}
            />
            <select
              value={newExercise.category}
              onChange={(e) => setNewExercise((p) => ({ ...p, category: e.target.value }))}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <div className={styles.checkboxGroup}>
              <label>Muscle Groups:</label>
              {MUSCLE_GROUPS.map((m) => (
                <label key={m} className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={newExercise.muscle_groups.includes(m)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewExercise((p) => ({ ...p, muscle_groups: [...p.muscle_groups, m] }));
                      } else {
                        setNewExercise((p) => ({ ...p, muscle_groups: p.muscle_groups.filter((x) => x !== m) }));
                      }
                    }}
                  />
                  {m}
                </label>
              ))}
            </div>
            <textarea
              placeholder="Instructions (one step per line)"
              value={newExercise.instructions}
              onChange={(e) => setNewExercise((p) => ({ ...p, instructions: e.target.value }))}
            />
            <button onClick={handleCreateExercise}>Create Exercise</button>
          </div>
        </Modal>
      )}

      {/* Create Workout Modal */}
      {showCreateWorkout && (
        <Modal title="Create Workout" onClose={() => setShowCreateWorkout(false)} large>
          <div className={styles.form}>
            <input
              type="text"
              placeholder="Workout name"
              value={newWorkout.name}
              onChange={(e) => setNewWorkout((p) => ({ ...p, name: e.target.value }))}
            />
            <textarea
              placeholder="Description"
              value={newWorkout.description}
              onChange={(e) => setNewWorkout((p) => ({ ...p, description: e.target.value }))}
            />
            <div className={styles.row}>
              <select
                value={newWorkout.workout_type}
                onChange={(e) => setNewWorkout((p) => ({ ...p, workout_type: e.target.value }))}
              >
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
                <option value="hiit">HIIT</option>
                <option value="flexibility">Flexibility</option>
                <option value="mixed">Mixed</option>
              </select>
              <input
                type="number"
                placeholder="Duration (min)"
                value={newWorkout.estimated_duration}
                onChange={(e) => setNewWorkout((p) => ({ ...p, estimated_duration: parseInt(e.target.value) || 60 }))}
              />
            </div>

            {/* Sections */}
            <div className={styles.sectionsHeader}>
              <h4>Workout Sections</h4>
              <div className={styles.sectionActions}>
                <button type="button" className={styles.smallBtn} onClick={() => addWorkoutSection("warmup")}>+ Warmup</button>
                <button type="button" className={styles.smallBtn} onClick={() => addWorkoutSection("main")}>+ Main</button>
                <button type="button" className={styles.smallBtn} onClick={() => addWorkoutSection("superset")}>+ Superset</button>
                <button type="button" className={styles.smallBtn} onClick={() => addWorkoutSection("circuit")}>+ Circuit</button>
                <button type="button" className={styles.smallBtn} onClick={() => addWorkoutSection("cooldown")}>+ Cooldown</button>
              </div>
            </div>

            {/* Section Tabs */}
            <div className={styles.sectionTabs}>
              {newWorkout.sections.map((section, idx) => (
                <button
                  key={section.id}
                  type="button"
                  className={`${styles.sectionTab} ${activeSection === idx ? styles.activeSectionTab : ""}`}
                  onClick={() => setActiveSection(idx)}
                >
                  <span className={styles.sectionType}>{section.type}</span>
                  <span className={styles.sectionName}>{section.name}</span>
                  {newWorkout.sections.length > 1 && (
                    <span className={styles.removeSection} onClick={(e) => { e.stopPropagation(); removeWorkoutSection(idx); }}>x</span>
                  )}
                </button>
              ))}
            </div>

            {/* Active Section Content */}
            {newWorkout.sections[activeSection] && (
              <div className={styles.sectionContent}>
                <input
                  type="text"
                  placeholder="Section name"
                  value={newWorkout.sections[activeSection].name}
                  onChange={(e) => {
                    const updated = [...newWorkout.sections];
                    updated[activeSection].name = e.target.value;
                    setNewWorkout((p) => ({ ...p, sections: updated }));
                  }}
                  className={styles.sectionNameInput}
                />

                <div className={styles.workoutExercises}>
                  {newWorkout.sections[activeSection].exercises.length === 0 ? (
                    <p className={styles.emptySection}>No exercises yet. Search in Library tab and click &quot;Add&quot; to include exercises.</p>
                  ) : (
                    newWorkout.sections[activeSection].exercises.map((ex, i) => (
                      <div key={i} className={styles.workoutExerciseItem}>
                        <span className={styles.exerciseName}>{ex.exercise_name}</span>
                        <input
                          type="number"
                          placeholder="Sets"
                          value={ex.target_sets}
                          onChange={(e) => {
                            const updated = [...newWorkout.sections];
                            updated[activeSection].exercises[i].target_sets = parseInt(e.target.value) || 3;
                            setNewWorkout((p) => ({ ...p, sections: updated }));
                          }}
                          style={{ width: "60px" }}
                        />
                        <input
                          type="text"
                          placeholder="Reps"
                          value={ex.target_reps}
                          onChange={(e) => {
                            const updated = [...newWorkout.sections];
                            updated[activeSection].exercises[i].target_reps = e.target.value;
                            setNewWorkout((p) => ({ ...p, sections: updated }));
                          }}
                          style={{ width: "60px" }}
                        />
                        <input
                          type="number"
                          placeholder="Rest (s)"
                          value={ex.rest_seconds}
                          onChange={(e) => {
                            const updated = [...newWorkout.sections];
                            updated[activeSection].exercises[i].rest_seconds = parseInt(e.target.value) || 90;
                            setNewWorkout((p) => ({ ...p, sections: updated }));
                          }}
                          style={{ width: "70px" }}
                        />
                        <button type="button" onClick={() => removeExerciseFromSection(activeSection, i)}>X</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <p className={styles.hint}>Tip: Select a section tab above, then search exercises in the Library tab and click &quot;Add&quot; to include them.</p>

            <button onClick={handleCreateWorkout} disabled={!newWorkout.name}>Create Workout</button>
          </div>
        </Modal>
      )}

      {/* Active Session Modal */}
      {showActiveSession && activeSession && (
        <Modal title="Active Workout" onClose={() => setShowActiveSession(false)} large>
          <ActiveSessionPanel
            sessionId={activeSession.id}
            sets={activeSession.sets}
            exercises={exercises}
            onLogSet={handleLogSet}
            onComplete={handleCompleteSession}
          />
        </Modal>
      )}

      {/* Link to Planner Modal */}
      {showLinkPlanner && selectedWorkout && (
        <Modal title="Schedule Workout" onClose={() => setShowLinkPlanner(false)}>
          <div className={styles.form}>
            <input
              type="text"
              placeholder="Event title"
              value={plannerLink.title || selectedWorkout.name}
              onChange={(e) => setPlannerLink((p) => ({ ...p, title: e.target.value }))}
            />
            <div className={styles.row}>
              <input
                type="datetime-local"
                value={plannerLink.start_time}
                onChange={(e) => setPlannerLink((p) => ({ ...p, start_time: e.target.value }))}
              />
              <input
                type="datetime-local"
                value={plannerLink.end_time}
                onChange={(e) => setPlannerLink((p) => ({ ...p, end_time: e.target.value }))}
              />
            </div>
            <select
              value={plannerLink.recurrence_rule}
              onChange={(e) => setPlannerLink((p) => ({ ...p, recurrence_rule: e.target.value }))}
            >
              {RECURRENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button onClick={handleLinkToPlanner}>Schedule</button>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {showImport && (
        <Modal title="Import Exercises" onClose={() => setShowImport(false)}>
          <div className={styles.form}>
            <p className={styles.importHelp}>
              Paste JSON in the following format:
            </p>
            <pre className={styles.importFormat}>
{`[
  {
    "name": "Exercise Name",
    "category": "strength",
    "primaryMuscles": ["chest", "triceps"],
    "equipment": "barbell",
    "instructions": ["Step 1", "Step 2"]
  }
]`}
            </pre>
            <textarea
              placeholder="Paste JSON here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
            />
            <button onClick={handleImport}>Import</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Exercise Card Component
function ExerciseCard({ exercise, onAddToWorkout, showAddButton }: {
  exercise: Exercise;
  onAddToWorkout: () => void;
  showAddButton: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const muscles = exercise.muscle_groups ? JSON.parse(exercise.muscle_groups) : [];
  const equipment = exercise.equipment ? JSON.parse(exercise.equipment) : [];

  return (
    <div className={styles.exerciseCard}>
      <div className={styles.exerciseHeader} onClick={() => setExpanded(!expanded)}>
        <h3>{exercise.name}</h3>
        <span className={styles.categoryBadge}>{exercise.category}</span>
      </div>
      {expanded && (
        <div className={styles.exerciseDetails}>
          {muscles.length > 0 && (
            <p><strong>Muscles:</strong> {muscles.join(", ")}</p>
          )}
          {equipment.length > 0 && (
            <p><strong>Equipment:</strong> {equipment.join(", ")}</p>
          )}
          {exercise.instructions && (
            <div className={styles.instructions}>
              <strong>Instructions:</strong>
              <ol>
                {exercise.instructions.split("\n").map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
      {showAddButton && (
        <button className={styles.addButton} onClick={onAddToWorkout}>
          Add to Workout
        </button>
      )}
    </div>
  );
}

// Modal Component
function Modal({ title, children, onClose, large }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  large?: boolean;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${large ? styles.modalLarge : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeButton}>X</button>
        </div>
        <div className={styles.modalContent}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Active Session Panel
function ActiveSessionPanel({
  sessionId: _sessionId,
  sets,
  exercises,
  onLogSet,
  onComplete
}: {
  sessionId: string;
  sets: ExerciseSet[];
  exercises: Exercise[];
  onLogSet: (exerciseId: string, reps: number, weight: number, rpe?: number) => void;
  onComplete: (rating?: number, notes?: string) => void;
}) {
  const [selectedExercise, setSelectedExercise] = useState("");
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState(0);
  const [rpe, setRpe] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(3);

  const handleLog = () => {
    if (!selectedExercise) return;
    onLogSet(selectedExercise, reps, weight, rpe);
  };

  const groupedSets = sets.reduce((acc, set) => {
    if (!acc[set.exercise_id]) acc[set.exercise_id] = [];
    acc[set.exercise_id].push(set);
    return acc;
  }, {} as Record<string, ExerciseSet[]>);

  return (
    <div className={styles.activeSession}>
      <div className={styles.setLogger}>
        <h3>Log Set</h3>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
        >
          <option value="">Select exercise...</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
        <div className={styles.setInputs}>
          <div>
            <label>Weight (lbs)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <label>Reps</label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <label>RPE (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={rpe || ""}
              onChange={(e) => setRpe(e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </div>
        <button onClick={handleLog} disabled={!selectedExercise}>Log Set</button>
      </div>

      <div className={styles.sessionSets}>
        <h3>Logged Sets</h3>
        {Object.entries(groupedSets).map(([exerciseId, exSets]) => {
          const exercise = exercises.find((e) => e.id === exerciseId);
          return (
            <div key={exerciseId} className={styles.exerciseSets}>
              <h4>{exercise?.name || exerciseId}</h4>
              <div className={styles.setsList}>
                {exSets.map((set) => (
                  <div key={set.id} className={styles.setItem}>
                    Set {set.set_number}: {set.weight} lbs x {set.reps} reps
                    {set.rpe && ` @ RPE ${set.rpe}`}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {sets.length === 0 && <p className={styles.noSets}>No sets logged yet</p>}
      </div>

      <div className={styles.completeSession}>
        <h3>Finish Workout</h3>
        <div>
          <label>Rating (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value) || 3)}
          />
        </div>
        <textarea
          placeholder="Workout notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button onClick={() => onComplete(rating, notes)} className={styles.completeButton}>
          Complete Workout
        </button>
      </div>
    </div>
  );
}

export default ExerciseClient;

