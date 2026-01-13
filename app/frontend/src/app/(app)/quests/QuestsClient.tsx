"use client";

/**
 * Quests Client Component
 * Daily and weekly quests with XP and coin rewards
 * Fetches universal quests from database
 *
 * Auto-refresh: Refetches on focus after 1 minute staleness (per SYNC.md)
 *
 * STORAGE RULE: Quest progress is stored in Postgres via /api/quests API.
 * localStorage cache is DEPRECATED when DISABLE_MASS_LOCAL_PERSISTENCE is enabled.
 *
 * FAST LOADING: Uses SyncState for instant progress display
 */

import { useState, useEffect, useCallback } from "react";
import { safeFetch, API_BASE_URL } from "@/lib/api";
import { useAutoRefresh } from "@/lib/hooks";
import { LoadingState, EmptyState } from "@/components/ui";
import { DISABLE_MASS_LOCAL_PERSISTENCE } from "@/lib/storage/deprecation";
import { useProgress, useBadges } from "@/lib/sync/SyncStateContext";
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

// Storage key for local progress cache (API is primary)
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

  // FAST LOADING: Get polled data for instant display
  const polledProgress = useProgress();
  const polledBadges = useBadges();

  const normalizeQuestType = useCallback((category?: string | null): Quest["type"] => {
    switch ((category || "").toLowerCase()) {
      case "daily":
        return "daily";
      case "weekly":
        return "weekly";
      case "special":
        return "special";
      default:
        return "special";
    }
  }, []);

  // Fetch wallet from backend
  const fetchWallet = useCallback(async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/market`);
      if (response.ok) {
        const data = await response.json() as {
          data?: { wallet?: { total_coins?: number } };
        };
        const coins = data.data?.wallet?.total_coins ?? 0;
        setWallet((prev) => ({ ...prev, coins }));
      }
    } catch (e) {
      console.error("Failed to load wallet:", e);
    }
  }, []);

  useEffect(() => {
    if (polledProgress) {
      setWallet((prev) => ({ ...prev, totalXp: polledProgress.current_xp ?? prev.totalXp }));
    }
  }, [polledProgress]);

  // Fetch quests function for reuse
  const fetchQuests = useCallback(async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/quests`);
      let apiQuests: Quest[] = [];

      if (response.ok) {
        const data = await response.json() as {
          quests?: Record<string, unknown>[];
        };
        apiQuests = (data.quests || []).map((q: Record<string, unknown>) => ({
          id: String(q.id || ""),
          title: String(q.title || ""),
          description: String(q.description || ""),
          type: normalizeQuestType(q.category as string | null | undefined),
          xpReward: Number(q.xp_reward || 10),
          coinReward: Number(q.coin_reward || 5),
          target: Number(q.target || 1),
          progress: Number(q.progress || 0),
          completed: ["completed", "claimed"].includes(String(q.status || "")),
          expiresAt: q.expires_at ? String(q.expires_at) : undefined,
        }));
      }

      // Only use localStorage fallback if deprecation is disabled
      let localProgress: Record<string, { progress: number; completed: boolean }> = {};
      if (!DISABLE_MASS_LOCAL_PERSISTENCE) {
        const storedProgress = localStorage.getItem(QUEST_PROGRESS_KEY);
        localProgress = storedProgress ? JSON.parse(storedProgress) : {};
      }

      // Merge progress - API takes priority, then local cache (if not deprecated)
      const questsWithProgress = apiQuests.map((q) => ({
        ...q,
        progress: Number.isFinite(q.progress)
          ? q.progress
          : localProgress[q.id]?.progress ?? 0,
        completed: typeof q.completed === "boolean"
          ? q.completed
          : localProgress[q.id]?.completed ?? false,
      }));

      setQuests(questsWithProgress);
    } catch (e) {
      console.error("Failed to load quests:", e);
    }
    setIsLoading(false);
  }, [normalizeQuestType]);

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

  // Sync quest progress to API
  const syncProgressToApi = useCallback(async (questId: string, progress: number) => {
    try {
      await safeFetch(`${API_BASE_URL}/api/quests/${questId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress }),
      });
    } catch (e) {
      console.error("[quests] Failed to sync progress to API:", e);
    }
  }, []);

  // Sync quest completion to API
  const syncCompletionToApi = useCallback(async (quest: Quest) => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/quests/${quest.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) return;
      const data = await response.json() as {
        result?: { xp_awarded?: number; coins_awarded?: number };
      };
      const result = data.result;
      if (result) {
        setWallet((prev) => ({
          coins: prev.coins + (result.coins_awarded || 0),
          totalXp: prev.totalXp + (result.xp_awarded || 0),
        }));
      }
    } catch (e) {
      console.error("[quests] Failed to sync completion to API:", e);
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

    // Sync to API
    syncCompletionToApi({ ...quest, progress: quest.target, completed: true });
  }, [quests, syncCompletionToApi]);

  // Add progress to a quest
  const handleAddProgress = useCallback((questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id !== questId || q.completed) return q;
        const newProgress = Math.min(q.progress + 1, q.target);
        const completed = newProgress >= q.target;

        if (completed && !q.completed) {
          // Sync completion to API
          syncCompletionToApi({ ...q, progress: newProgress, completed: true });
        } else {
          // Just sync progress
          syncProgressToApi(q.id, newProgress);
        }

        return { ...q, progress: newProgress, completed };
      })
    );
  }, [syncProgressToApi, syncCompletionToApi]);

  // Refresh quests from server
  const handleRefreshDaily = useCallback(async () => {
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/quests`);
      if (response.ok) {
        const data = await response.json() as { quests?: Record<string, unknown>[] };
        const apiQuests: Quest[] = (data.quests || []).map((q: Record<string, unknown>) => ({
          id: String(q.id || ""),
          title: String(q.title || ""),
          description: String(q.description || ""),
          type: normalizeQuestType(q.category as string | null | undefined),
          xpReward: Number(q.xp_reward || 10),
          coinReward: Number(q.coin_reward || 5),
          target: Number(q.target || 1),
          progress: Number(q.progress || 0),
          completed: ["completed", "claimed"].includes(String(q.status || "")),
        }));
        setQuests(apiQuests);
      }
    } catch (e) {
      console.error("Failed to refresh quests:", e);
    }
  }, [normalizeQuestType]);

  // Add custom quest
  const handleAddCustomQuest = useCallback(async () => {
    if (!newQuest.title.trim()) return;

    try {
      const response = await safeFetch(`${API_BASE_URL}/api/quests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newQuest.title.trim(),
          description: newQuest.description.trim() || undefined,
          category: newQuest.type,
          difficulty: "starter",
          xp_reward: newQuest.xpReward,
          coin_reward: newQuest.coinReward,
          target: newQuest.target,
          is_repeatable: false,
        }),
      });

      if (!response.ok) {
        console.error("Failed to create quest");
        return;
      }

      const data = await response.json() as { quest?: Record<string, unknown> };
      const q = data.quest || {};
      const quest: Quest = {
        id: String(q.id || ""),
        title: String(q.title || ""),
        description: String(q.description || ""),
        type: normalizeQuestType(q.category as string | null | undefined),
        xpReward: Number(q.xp_reward || 10),
        coinReward: Number(q.coin_reward || 5),
        progress: Number(q.progress || 0),
        target: Number(q.target || 1),
        completed: ["completed", "claimed"].includes(String(q.status || "")),
        expiresAt: q.expires_at ? String(q.expires_at) : undefined,
      };

      setQuests((prev) => [quest, ...prev]);
    } catch (e) {
      console.error("Failed to create quest:", e);
      return;
    }

    setNewQuest({
      title: "",
      description: "",
      type: "special",
      xpReward: 25,
      coinReward: 10,
      target: 1,
    });
    setShowAddForm(false);
  }, [newQuest, normalizeQuestType]);

  const filteredQuests = quests.filter((q) => q.type === activeTab);

  // FAST LOADING: Show instant wallet while loading full quest list
  if (isLoading) {
    const instantCoins = polledProgress?.coins ?? 0;
    const instantXp = polledProgress?.current_xp ?? 0;
    const activeQuests = polledBadges?.active_quests ?? 0;
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.title}>Quests</h1>
              <p className={styles.subtitle}>Complete quests to earn rewards</p>
            </div>
            {polledProgress && (
              <div className={styles.walletDisplay}>
                <div className={styles.walletItem}>
                  <span className={styles.coinIcon}>*</span>
                  <span className={styles.walletValue}>{instantCoins}</span>
                </div>
                <div className={styles.walletItem}>
                  <span className={styles.xpIcon}>XP</span>
                  <span className={styles.walletValue}>{instantXp}</span>
                </div>
              </div>
            )}
          </div>
          {activeQuests > 0 && (
            <p className={styles.subtitle} style={{ marginTop: "0.5rem" }}>
              {activeQuests} active quest{activeQuests !== 1 ? "s" : ""}
            </p>
          )}
        </header>
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
