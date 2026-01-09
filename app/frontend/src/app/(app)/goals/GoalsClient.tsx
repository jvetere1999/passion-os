"use client";

/**
 * Goals Client Component
 * Long-term goals with milestones
 *
 * STORAGE RULE: Goals data should be stored in D1 via /api/goals API.
 * localStorage is DEPRECATED when DISABLE_MASS_LOCAL_PERSISTENCE is enabled.
 */

import { useState, useEffect, useCallback } from "react";
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

// Storage key
const GOALS_KEY = "passion_goals_v1";

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

  // Load goals - D1 is source of truth
  useEffect(() => {
    async function loadGoals() {
      // Try to fetch from D1 first
      try {
        const response = await fetch("/api/goals");
        if (response.ok) {
          const data = await response.json() as { goals?: Goal[] };
          if (data.goals && data.goals.length > 0) {
            setGoals(data.goals);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch goals from D1:", e);
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
  }, []);

  // Save goals - only to localStorage if deprecation is disabled
  useEffect(() => {
    if (!isLoading && !DISABLE_MASS_LOCAL_PERSISTENCE) {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    }
  }, [goals, isLoading]);

  // Add a new goal
  const handleAddGoal = useCallback(() => {
    if (!newGoal.title.trim()) return;

    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
      category: newGoal.category,
      deadline: newGoal.deadline || undefined,
      milestones: [],
      createdAt: new Date().toISOString(),
      completed: false,
    };

    setGoals((prev) => [goal, ...prev]);
    setNewGoal({ title: "", description: "", category: "personal", deadline: "" });
    setShowAddForm(false);
  }, [newGoal]);

  // Add milestone to goal
  const handleAddMilestone = useCallback((goalId: string, title: string) => {
    if (!title.trim()) return;

    const updatedGoal = goals.find(g => g.id === goalId);
    if (updatedGoal) {
      const newMilestones = [
        ...updatedGoal.milestones,
        { id: `ms-${Date.now()}`, title: title.trim(), completed: false },
      ];
      const updated = { ...updatedGoal, milestones: newMilestones };

      setGoals((prev) =>
        prev.map((g) => (g.id !== goalId ? g : updated))
      );

      // Sync to D1
      fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", ...updated }),
      }).catch(console.error);
    }
  }, [goals]);

  // Toggle milestone completion
  const handleToggleMilestone = useCallback((goalId: string, milestoneId: string) => {
    setGoals((prev) => {
      const newGoals = prev.map((g) => {
        if (g.id !== goalId) return g;
        const milestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const allComplete = milestones.length > 0 && milestones.every((m) => m.completed);
        return { ...g, milestones, completed: allComplete };
      });

      // Sync updated goal to D1
      const updatedGoal = newGoals.find(g => g.id === goalId);
      if (updatedGoal) {
        fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update", ...updatedGoal }),
        }).catch(console.error);
      }

      return newGoals;
    });
  }, []);

  // Delete goal
  const handleDeleteGoal = useCallback((goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));

    // Sync to D1
    fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: goalId }),
    }).catch(console.error);
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

