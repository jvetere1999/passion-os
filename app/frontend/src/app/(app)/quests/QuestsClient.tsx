"use client";

/**
 * Quests Client Component
 * Daily and weekly quests with XP and coin rewards
 * Fetches universal quests from database
 *
 * Auto-refresh: Refetches on focus after 1 minute staleness (per SYNC.md)
 *
 * STORAGE RULE: Quest progress is stored in D1 via /api/quests API.
 * localStorage cache is DEPRECATED when DISABLE_MASS_LOCAL_PERSISTENCE is enabled.
 */

import { useState, useEffect, useCallback } from "react";
import { useAutoRefresh } from "@/lib/hooks";
import { LoadingState, EmptyState } from "@/components/ui";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import styles from "./page.module.css";

interface Quest {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly" | "special";
  xpReward: number;
  coinReward: number;
  progress: number;
  target: number;
  completed: boolean;
  expiresAt?: string;
  skillId?: string;
}

// Storage key for local progress cache (D1 is primary)
const QUEST_PROGRESS_KEY = "passion_quest_progress_v1";

export function QuestsClient() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [wallet, setWallet] = useState({ coins: 0, totalXp: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "special">("daily");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    type: "special" as Quest["type"],
    xpReward: 25,
    coinReward: 10,
    target: 1,
  });

  // Fetch wallet from D1
  const fetchWallet = useCallback(async () => {
    try {
      const response = await fetch("/api/market");
      if (response.ok) {
        const data = await response.json() as { wallet?: { coins?: number; xp?: number } };
        if (data.wallet) {
          setWallet({
            coins: data.wallet.coins || 0,
            totalXp: data.wallet.xp || 0,
          });
        }
      }
    } catch (e) {
      console.error("Failed to load wallet:", e);
    }
  }, []);

  // Fetch quests function for reuse
  const fetchQuests = useCallback(async () => {
    try {
      const response = await fetch("/api/quests");
      let apiQuests: Quest[] = [];
      let d1Progress: Record<string, { progress: number; completed: boolean }> = {};

      if (response.ok) {
        const data = await response.json() as {
          quests?: Record<string, unknown>[];
          userProgress?: Record<string, { progress: number; completed: boolean }>;
        };
        apiQuests = (data.quests || []).map((q: Record<string, unknown>) => ({
          id: String(q.id || ""),
          title: String(q.title || ""),
          description: String(q.description || ""),
          type: (q.type as Quest["type"]) || "daily",
          xpReward: Number(q.xpReward || q.xp_reward || 10),
          coinReward: Number(q.coinReward || q.coin_reward || 5),
          target: Number(q.target || 1),
          progress: 0,
          completed: false,
          skillId: q.skillId as string | undefined,
        }));
        d1Progress = data.userProgress || {};
      }

      // Only use localStorage fallback if deprecation is disabled
      let localProgress: Record<string, { progress: number; completed: boolean }> = {};
      if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
        const storedProgress = localStorage.getItem(QUEST_PROGRESS_KEY);
        localProgress = storedProgress ? JSON.parse(storedProgress) : {};
      }

      // Merge progress - D1 takes priority, then local cache (if not deprecated)
      const questsWithProgress = apiQuests.map((q) => ({
        ...q,
        progress: d1Progress[q.id]?.progress ?? localProgress[q.id]?.progress ?? 0,
        completed: d1Progress[q.id]?.completed ?? localProgress[q.id]?.completed ?? false,
      }));

      setQuests(questsWithProgress);
    } catch (e) {
      console.error("Failed to load quests:", e);
    }
    setIsLoading(false);
  }, []);

  // Auto-refresh: refetch on focus after 1 minute staleness
  // Pauses on page unload, soft refreshes on reload if stale
  // Disabled when add form is open (user might be typing)
  useAutoRefresh({
    onRefresh: fetchQuests,
    refreshKey: "quests",
    stalenessMs: 60000, // 1 minute per SYNC.md contract
    refreshOnMount: true,
    refetchOnFocus: true,
    refetchOnVisible: true,
    enabled: !showAddForm && !isLoading, // Disable when form is open or loading
  });

  // Load quests and wallet on mount
  useEffect(() => {
    fetchQuests();
    fetchWallet();
  }, [fetchQuests, fetchWallet]);

  // Save quest progress when it changes - only to localStorage if not deprecated
  useEffect(() => {
    if (!isLoading && quests.length > 0 && !DISABLE_MASS_LOCAL_PERSISTENCE) {
      const progress: Record<string, { progress: number; completed: boolean }> = {};
      quests.forEach((q) => {
        progress[q.id] = { progress: q.progress, completed: q.completed };
      });
      localStorage.setItem(QUEST_PROGRESS_KEY, JSON.stringify(progress));
    }
  }, [quests, isLoading]);

  // Sync quest progress to D1
  const syncProgressToD1 = useCallback(async (questId: string, progress: number) => {
    try {
      await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "progress", questId, progress }),
      });
    } catch (e) {
      console.error("[quests] Failed to sync progress to D1:", e);
    }
  }, []);

  // Sync quest completion to D1
  const syncCompletionToD1 = useCallback(async (quest: Quest) => {
    try {
      await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "complete",
          questId: quest.id,
          progress: quest.target,
          xpReward: quest.xpReward,
          coinReward: quest.coinReward,
          skillId: quest.skillId,
        }),
      });
    } catch (e) {
      console.error("[quests] Failed to sync completion to D1:", e);
    }
  }, []);

  // Complete a quest manually (for testing)
  const handleCompleteQuest = useCallback((questId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (!quest || quest.completed) return;

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId || q.completed) return q;
        return { ...q, progress: q.target, completed: true };
      })
    );

    setWallet((prev) => ({
      coins: prev.coins + quest.coinReward,
      totalXp: prev.totalXp + quest.xpReward,
    }));

    // Sync to D1
    syncCompletionToD1({ ...quest, progress: quest.target, completed: true });
  }, [quests, syncCompletionToD1]);

  // Add progress to a quest
  const handleAddProgress = useCallback((questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId || q.completed) return q;
        const newProgress = Math.min(q.progress + 1, q.target);
        const completed = newProgress >= q.target;

        if (completed && !q.completed) {
          // Award rewards
          setWallet((w) => ({
            coins: w.coins + q.coinReward,
            totalXp: w.totalXp + q.xpReward,
          }));
          // Sync completion to D1
          syncCompletionToD1({ ...q, progress: newProgress, completed: true });
        } else {
          // Just sync progress
          syncProgressToD1(q.id, newProgress);
        }

        return { ...q, progress: newProgress, completed };
      })
    );
  }, [syncProgressToD1, syncCompletionToD1]);

  // Refresh quests from server
  const handleRefreshDaily = useCallback(async () => {
    try {
      const response = await fetch("/api/quests");
      if (response.ok) {
        const data = await response.json() as { quests?: Record<string, unknown>[] };
        const apiQuests: Quest[] = (data.quests || []).map((q: Record<string, unknown>) => ({
          id: String(q.id || ""),
          title: String(q.title || ""),
          description: String(q.description || ""),
          type: (q.type as Quest["type"]) || "daily",
          xpReward: Number(q.xpReward || q.xp_reward || 10),
          coinReward: Number(q.coinReward || q.coin_reward || 5),
          target: Number(q.target || 1),
          progress: 0,
          completed: false,
        }));
        setQuests(apiQuests);
      }
    } catch (e) {
      console.error("Failed to refresh quests:", e);
    }
  }, []);

  // Add custom quest
  const handleAddCustomQuest = useCallback(() => {
    if (!newQuest.title.trim()) return;

    const quest: Quest = {
      id: `custom-${Date.now()}`,
      title: newQuest.title.trim(),
      description: newQuest.description.trim(),
      type: newQuest.type,
      xpReward: newQuest.xpReward,
      coinReward: newQuest.coinReward,
      progress: 0,
      target: newQuest.target,
      completed: false,
    };

    setQuests((prev) => [quest, ...prev]);
    setNewQuest({
      title: "",
      description: "",
      type: "special",
      xpReward: 25,
      coinReward: 10,
      target: 1,
    });
    setShowAddForm(false);
  }, [newQuest]);

  const filteredQuests = quests.filter((q) => q.type === activeTab);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState message="Loading quests..." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Quests</h1>
            <p className={styles.subtitle}>Complete quests to earn rewards</p>
          </div>
          <div className={styles.walletDisplay}>
            <div className={styles.walletItem}>
              <span className={styles.coinIcon}>*</span>
              <span className={styles.walletValue}>{wallet.coins}</span>
            </div>
            <div className={styles.walletItem}>
              <span className={styles.xpIcon}>XP</span>
              <span className={styles.walletValue}>{wallet.totalXp}</span>
            </div>
          </div>
          <button
            className={styles.addQuestButton}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Cancel" : "+ New Quest"}
          </button>
        </div>
      </header>

      {/* Add Quest Form */}
      {showAddForm && (
        <div className={styles.addForm}>
          <input
            type="text"
            className={styles.formInput}
            placeholder="Quest title..."
            value={newQuest.title}
            onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
          />
          <input
            type="text"
            className={styles.formInput}
            placeholder="Description..."
            value={newQuest.description}
            onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
          />
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Type</label>
              <select
                className={styles.formSelect}
                value={newQuest.type}
                onChange={(e) => setNewQuest({ ...newQuest, type: e.target.value as Quest["type"] })}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="special">Special</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Target</label>
              <input
                type="number"
                className={styles.formInput}
                value={newQuest.target}
                onChange={(e) => setNewQuest({ ...newQuest, target: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>XP Reward</label>
              <input
                type="number"
                className={styles.formInput}
                value={newQuest.xpReward}
                onChange={(e) => setNewQuest({ ...newQuest, xpReward: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Coin Reward</label>
              <input
                type="number"
                className={styles.formInput}
                value={newQuest.coinReward}
                onChange={(e) => setNewQuest({ ...newQuest, coinReward: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
          </div>
          <button className={styles.submitButton} onClick={handleAddCustomQuest}>
            Add Quest
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "daily" ? styles.active : ""}`}
          onClick={() => setActiveTab("daily")}
        >
          Daily
        </button>
        <button
          className={`${styles.tab} ${activeTab === "weekly" ? styles.active : ""}`}
          onClick={() => setActiveTab("weekly")}
        >
          Weekly
        </button>
        <button
          className={`${styles.tab} ${activeTab === "special" ? styles.active : ""}`}
          onClick={() => setActiveTab("special")}
        >
          Special
        </button>
      </div>

      {/* Quest List */}
      <div className={styles.questList}>
        {filteredQuests.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} quests available`}
            description={activeTab === "daily" ? "Generate new quests to get started" : undefined}
            action={activeTab === "daily" ? {
              label: "Generate New Daily Quests",
              onClick: handleRefreshDaily,
            } : undefined}
          />
        ) : (
          filteredQuests.map((quest) => (
            <div
              key={quest.id}
              className={`${styles.questCard} ${quest.completed ? styles.completed : ""}`}
            >
              <div className={styles.questInfo}>
                <h3 className={styles.questTitle}>{quest.title}</h3>
                <p className={styles.questDescription}>{quest.description}</p>
                <div className={styles.questProgress}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(quest.progress / quest.target) * 100}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    {quest.progress}/{quest.target}
                  </span>
                </div>
              </div>
              <div className={styles.questRewards}>
                <div className={styles.reward}>
                  <span className={styles.rewardIcon}>*</span>
                  <span>{quest.coinReward}</span>
                </div>
                <div className={styles.reward}>
                  <span className={styles.rewardIcon}>XP</span>
                  <span>{quest.xpReward}</span>
                </div>
                {!quest.completed && (
                  <button
                    className={styles.progressButton}
                    onClick={() => handleAddProgress(quest.id)}
                  >
                    +1
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

