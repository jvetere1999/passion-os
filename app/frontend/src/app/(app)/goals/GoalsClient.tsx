"use client";

/**
 * Goals Client Component
 * Long-term goals with milestones
 *
 * STORAGE RULE: Goals data should be stored in the backend via /api/goals API.
 * localStorage is DEPRECATED when DISABLE_MASS_LOCAL_PERSISTENCE is enabled.
 */

import { useState, useEffect, useCallback } from "react";
import { safeFetch, API_BASE_URL } from "@/lib/api";
import { getMemoryCache, setMemoryCache } from "@/lib/cache/memory";
import { LoadingState } from "@/components/ui";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import styles from "./page.module.css";

interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: "health" | "career" | "personal" | "creative" | "financial";
  deadline?: string;
  milestones: Milestone[];
  createdAt: string;
  completed: boolean;
}

interface MilestoneApiResponse {
  id: string;
  title: string;
  description?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
}

interface GoalApiResponse {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  progress: number;
  priority: number;
  milestones: MilestoneApiResponse[];
  total_milestones: number;
  completed_milestones: number;
}

// Storage key
const GOALS_KEY = "passion_goals_v1";
const GOALS_CACHE_KEY = "goals";

const CATEGORY_COLORS: Record<string, string> = {
  health: "#4caf50",
  career: "#2196f3",
  personal: "#9c27b0",
  creative: "#ff9800",
  financial: "#ffd700",
};

const CATEGORY_LABELS: Record<string, string> = {
  health: "Health & Fitness",
  career: "Career & Work",
  personal: "Personal Growth",
  creative: "Creative Projects",
  financial: "Financial",
};

export function GoalsClient() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "personal" as Goal["category"],
    deadline: "",
  });

  const cachedGoals = getMemoryCache<{ goals: Goal[] }>(GOALS_CACHE_KEY);
  useEffect(() => {
    if (cachedGoals?.data?.goals?.length) {
      setGoals(cachedGoals.data.goals);
      setIsLoading(false);
    }
  }, [cachedGoals]);

  const mapGoalFromApi = useCallback((goal: GoalApiResponse): Goal => {
    return {
      id: goal.id,
      title: goal.title,
      description: goal.description || "",
      category: (goal.category || "personal") as Goal["category"],
      deadline: goal.target_date || undefined,
      milestones: (goal.milestones || []).map((m) => ({
        id: m.id,
        title: m.title,
        completed: m.is_completed,
      })),
      createdAt: goal.started_at || new Date().toISOString(),
      completed: goal.status === "completed",
    };
  }, []);

  // Load goals - backend is source of truth
  useEffect(() => {
    async function loadGoals() {
      try {
        const response = await safeFetch(`${API_BASE_URL}/api/goals`);
        if (response.ok) {
          const data = await response.json() as { goals?: GoalApiResponse[] };
          const mapped = (data.goals || []).map(mapGoalFromApi);
          setGoals(mapped);
          setMemoryCache(GOALS_CACHE_KEY, { goals: mapped });
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.error("Failed to fetch goals from API:", e);
      }

      // Only fall back to localStorage if deprecation is disabled
      if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
        try {
          const stored = localStorage.getItem(GOALS_KEY);
          if (stored) {
            setGoals(JSON.parse(stored));
          }
        } catch (e) {
          console.error("Failed to load goals from localStorage:", e);
        }
      }
      setIsLoading(false);
    }

    loadGoals();
  }, [mapGoalFromApi]);

  // Save goals - only to localStorage if deprecation is disabled
  useEffect(() => {
    if (!isLoading && !DISABLE_MASS_LOCAL_PERSISTENCE) {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoading]);

  // Add a new goal
  const handleAddGoal = useCallback(async () => {
    if (!newGoal.title.trim()) return;
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newGoal.title.trim(),
          description: newGoal.description.trim() || undefined,
          category: newGoal.category,
          target_date: newGoal.deadline || undefined,
          priority: 0,
        }),
      });
      if (!response.ok) {
        console.error("Failed to create goal");
        return;
      }
      const data = await response.json() as { goal?: GoalApiResponse };
      if (data.goal) {
        const mapped = mapGoalFromApi(data.goal);
        setGoals((prev) => {
          const next = [mapped, ...prev];
          setMemoryCache(GOALS_CACHE_KEY, { goals: next });
          return next;
        });
      }
      setNewGoal({ title: "", description: "", category: "personal", deadline: "" });
      setShowAddForm(false);
    } catch (e) {
      console.error("Failed to create goal:", e);
    }
  }, [newGoal, mapGoalFromApi]);

  // Add milestone to goal
  const handleAddMilestone = useCallback(async (goalId: string, title: string) => {
    if (!title.trim()) return;
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/goals/${goalId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: undefined }),
      });
      if (!response.ok) {
        console.error("Failed to add milestone");
        return;
      }
      const data = await response.json() as { milestone?: MilestoneApiResponse };
      if (!data.milestone) return;

      const milestone = data.milestone;
      setGoals((prev) => {
        const next = prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                milestones: [
                  ...g.milestones,
                  { id: milestone.id, title: milestone.title, completed: milestone.is_completed },
                ],
              }
            : g
        );
        setMemoryCache(GOALS_CACHE_KEY, { goals: next });
        return next;
      });
    } catch (e) {
      console.error("Failed to add milestone:", e);
    }
  }, []);

  // Complete milestone
  const handleToggleMilestone = useCallback(async (goalId: string, milestoneId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    const milestone = goal?.milestones.find((m) => m.id === milestoneId);
    if (!milestone || milestone.completed) return;

    try {
      const response = await safeFetch(`${API_BASE_URL}/api/goals/milestones/${milestoneId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        console.error("Failed to complete milestone");
        return;
      }
      const data = await response.json() as {
        result?: { milestone?: MilestoneApiResponse; goal_progress?: number; goal_completed?: boolean };
      };
      if (data.result?.milestone) {
        setGoals((prev) => {
          const next = prev.map((g) => {
            if (g.id !== goalId) return g;
            const updatedMilestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: true } : m
            );
            return { ...g, milestones: updatedMilestones, completed: data.result?.goal_completed ?? g.completed };
          });
          setMemoryCache(GOALS_CACHE_KEY, { goals: next });
          return next;
        });
      }
    } catch (e) {
      console.error("Failed to complete milestone:", e);
    }
  }, [goals]);

  // Delete goal
  const handleDeleteGoal = useCallback(async (goalId: string) => {
    setGoals((prev) => {
      const next = prev.filter((g) => g.id !== goalId);
      setMemoryCache(GOALS_CACHE_KEY, { goals: next });
      return next;
    });
    try {
      await safeFetch(`${API_BASE_URL}/api/goals/${goalId}`, { method: "DELETE" });
    } catch (e) {
      console.error("Failed to delete goal:", e);
    }
  }, []);

  // Calculate progress
  const getProgress = (goal: Goal): number => {
    if (goal.milestones.length === 0) return goal.completed ? 100 : 0;
    const completed = goal.milestones.filter((m) => m.completed).length;
    return Math.round((completed / goal.milestones.length) * 100);
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState message="Loading goals..." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Goals</h1>
            <p className={styles.subtitle}>Track your long-term aspirations</p>
          </div>
          <button
            className={styles.addButton}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Cancel" : "+ New Goal"}
          </button>
        </div>
      </header>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className={styles.addForm}>
          <input
            type="text"
            className={styles.input}
            placeholder="Goal title..."
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
          />
          <textarea
            className={styles.textarea}
            placeholder="Description (optional)"
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
          />
          <div className={styles.formRow}>
            <select
              className={styles.select}
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as Goal["category"] })}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <input
              type="date"
              className={styles.dateInput}
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
            />
            <button className={styles.submitButton} onClick={handleAddGoal}>
              Add Goal
            </button>
          </div>
        </div>
      )}

      {/* Active Goals */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Active Goals ({activeGoals.length})</h2>
        {activeGoals.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No active goals. Set a goal to get started!</p>
          </div>
        ) : (
          <div className={styles.goalsList}>
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={getProgress(goal)}
                categoryColor={CATEGORY_COLORS[goal.category]}
                onAddMilestone={handleAddMilestone}
                onToggleMilestone={handleToggleMilestone}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Completed ({completedGoals.length})</h2>
          <div className={styles.goalsList}>
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                progress={100}
                categoryColor={CATEGORY_COLORS[goal.category]}
                onAddMilestone={handleAddMilestone}
                onToggleMilestone={handleToggleMilestone}
                onDelete={handleDeleteGoal}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// Goal Card Component
interface GoalCardProps {
  goal: Goal;
  progress: number;
  categoryColor: string;
  onAddMilestone: (goalId: string, title: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
  onDelete: (goalId: string) => void;
}

function GoalCard({ goal, progress, categoryColor, onAddMilestone, onToggleMilestone, onDelete }: GoalCardProps) {
  const [showMilestones, setShowMilestones] = useState(false);
  const [newMilestone, setNewMilestone] = useState("");

  const handleAddMilestone = () => {
    if (newMilestone.trim()) {
      onAddMilestone(goal.id, newMilestone);
      setNewMilestone("");
    }
  };

  return (
    <div
      className={`${styles.goalCard} ${goal.completed ? styles.completed : ""}`}
      style={{ "--goal-color": categoryColor } as React.CSSProperties}
    >
      <div className={styles.goalHeader}>
        <div className={styles.goalInfo}>
          <span className={styles.categoryBadge}>{CATEGORY_LABELS[goal.category]}</span>
          <h3 className={styles.goalTitle}>{goal.title}</h3>
          {goal.description && (
            <p className={styles.goalDescription}>{goal.description}</p>
          )}
        </div>
        <div className={styles.goalProgress}>
          <div className={styles.progressCircle}>
            <svg viewBox="0 0 36 36">
              <path
                className={styles.progressBg}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={styles.progressFill}
                strokeDasharray={`${progress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={styles.progressValue}>{progress}%</span>
          </div>
        </div>
      </div>

      {goal.deadline && (
        <div className={styles.deadline}>
          Target: {new Date(goal.deadline).toLocaleDateString()}
        </div>
      )}

      <div className={styles.goalActions}>
        <button
          className={styles.expandButton}
          onClick={() => setShowMilestones(!showMilestones)}
        >
          {showMilestones ? "Hide" : "Milestones"} ({goal.milestones.length})
        </button>
        <button
          className={styles.deleteButton}
          onClick={() => onDelete(goal.id)}
        >
          Delete
        </button>
      </div>

      {showMilestones && (
        <div className={styles.milestones}>
          {goal.milestones.map((m) => (
            <label key={m.id} className={styles.milestone}>
              <input
                type="checkbox"
                checked={m.completed}
                onChange={() => onToggleMilestone(goal.id, m.id)}
              />
              <span className={m.completed ? styles.completed : ""}>{m.title}</span>
            </label>
          ))}
          <div className={styles.addMilestone}>
            <input
              type="text"
              placeholder="Add milestone..."
              value={newMilestone}
              onChange={(e) => setNewMilestone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMilestone()}
            />
            <button onClick={handleAddMilestone}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}
