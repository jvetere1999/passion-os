"use client";

/**
 * Enhanced Omnibar (Command Palette)
 * Behavioral Modeling Features:
 * - Fuzzy search with intelligent ranking
 * - Command frequency tracking (learns usage patterns)
 * - Recent commands (quick re-execution)
 * - Predictive suggestions based on context
 * - Command execution telemetry for Dynamic UI
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { listInboxItems, createInboxItem, deleteInboxItem as deleteInboxItemAPI } from "@/lib/api/inbox";
import styles from "./Omnibar.module.css";

// ============================================
// Types
// ============================================

interface Command {
  id: string;
  title: string;
  description?: string;
  shortcut?: string;
  category: string;
  action: () => void;
}

interface InboxItem {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  tags?: string[];
}

interface CommandMetrics {
  command_id: string;
  usage_count: number;
  last_used_at: string;
  avg_time_between_uses_ms: number;
}

// ============================================
// Behavioral Constants
// ============================================

const COMMAND_METRICS_KEY = "passion_command_metrics_v1";
const MAX_RECENT_COMMANDS = 5;
const FUZZY_MATCH_THRESHOLD = 0.3; // Minimum score to display

// ============================================
// Fuzzy Search Algorithm
// ============================================

/**
 * Fuzzy match scoring: measures how well a search term matches a string
 * Returns score 0-1, where 1 is perfect match
 */
function fuzzyScore(search: string, text: string): number {
  const searchLower = search.toLowerCase();
  const textLower = text.toLowerCase();

  if (searchLower === textLower) return 1; // Perfect match
  if (!searchLower) return 0.5; // No search term
  if (!textLower.includes(searchLower)) {
    // Check character-by-character match
    let searchIdx = 0;
    let score = 0;
    for (let i = 0; i < textLower.length && searchIdx < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIdx]) {
        score++;
        searchIdx++;
      }
    }
    return searchIdx === searchLower.length ? score / textLower.length : 0;
  }

  // Substring found - boost score based on position
  const idx = textLower.indexOf(searchLower);
  const posBoost = 1 - idx / textLower.length; // Earlier = higher boost
  return 0.7 + posBoost * 0.3;
}

// ============================================
// Command Metrics Storage
// ============================================

function getCommandMetrics(): Record<string, CommandMetrics> {
  try {
    const stored = localStorage.getItem(COMMAND_METRICS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCommandMetrics(metrics: Record<string, CommandMetrics>) {
  try {
    localStorage.setItem(COMMAND_METRICS_KEY, JSON.stringify(metrics));
  } catch (e) {
    console.error("Failed to save command metrics:", e);
  }
}

function recordCommandUsage(commandId: string) {
  const metrics = getCommandMetrics();
  const now = new Date().toISOString();

  if (!metrics[commandId]) {
    metrics[commandId] = {
      command_id: commandId,
      usage_count: 0,
      last_used_at: now,
      avg_time_between_uses_ms: 0,
    };
  }

  const prev = metrics[commandId];
  const timeSinceLastUse = prev.last_used_at
    ? new Date(now).getTime() - new Date(prev.last_used_at).getTime()
    : 0;

  // Update average time between uses (exponential moving average)
  const newAvg =
    prev.usage_count === 0
      ? timeSinceLastUse
      : (prev.avg_time_between_uses_ms * prev.usage_count + timeSinceLastUse) /
        (prev.usage_count + 1);

  metrics[commandId] = {
    ...prev,
    usage_count: prev.usage_count + 1,
    last_used_at: now,
    avg_time_between_uses_ms: newAvg,
  };

  saveCommandMetrics(metrics);
}

// ============================================
// Command Definitions
// ============================================

const NAVIGATION_COMMANDS: Omit<Command, "action">[] = [
  // Start section
  { id: "nav-today", title: "Go to Today", category: "Start", shortcut: "G T" },
  { id: "nav-focus", title: "Go to Focus", category: "Start", shortcut: "G F" },
  { id: "nav-quests", title: "Go to Quests", category: "Start", shortcut: "G Q" },
  { id: "nav-ignitions", title: "Go to Ignitions", category: "Start", shortcut: "G I" },
  { id: "nav-progress", title: "Go to Progress", category: "Start" },
  // Shape section
  { id: "nav-planner", title: "Go to Planner", category: "Shape", shortcut: "G P" },
  { id: "nav-goals", title: "Go to Goals", category: "Shape" },
  { id: "nav-habits", title: "Go to Habits", category: "Shape" },
  { id: "nav-exercise", title: "Go to Exercise", category: "Shape" },
  { id: "nav-books", title: "Go to Books", category: "Shape" },
  // Reflect section
  { id: "nav-wins", title: "Go to Wins", category: "Reflect" },
  { id: "nav-stats", title: "Go to Stats", category: "Reflect" },
  { id: "nav-market", title: "Go to Market", category: "Reflect" },
  // Create section
  { id: "nav-hub", title: "Go to Shortcuts", category: "Create", shortcut: "G H" },
  { id: "nav-arrange", title: "Go to Arrange", category: "Create", shortcut: "G A" },
  { id: "nav-templates", title: "Go to Templates", category: "Create" },
  { id: "nav-reference", title: "Go to Reference", category: "Create" },
  { id: "nav-wheel", title: "Go to Harmonics", category: "Create" },
  { id: "nav-infobase", title: "Go to Infobase", category: "Create" },
  { id: "nav-ideas", title: "Go to Ideas", category: "Create" },
  // Learn section
  { id: "nav-learn", title: "Go to Learn", category: "Learn" },
  // System section
  { id: "nav-settings", title: "Go to Settings", category: "System", shortcut: "G S" },
  { id: "nav-admin", title: "Go to Admin", category: "System", description: "Admin only" },
];

const ACTION_COMMANDS: Omit<Command, "action">[] = [
  { id: "action-new-quest", title: "Create New Quest", category: "Actions", shortcut: "N Q" },
  { id: "action-new-event", title: "Create New Event", category: "Actions", shortcut: "N E" },
  { id: "action-start-focus", title: "Start Focus Session", category: "Actions", shortcut: "N F" },
  { id: "action-new-arrangement", title: "Create New Arrangement", category: "Actions" },
  { id: "action-new-idea", title: "Capture New Idea", category: "Actions", shortcut: "N I" },
  { id: "action-new-goal", title: "Create New Goal", category: "Actions" },
  { id: "action-new-habit", title: "Create New Habit", category: "Actions" },
];

const THEME_COMMANDS: Omit<Command, "action">[] = [
  { id: "theme-toggle", title: "Toggle Theme", category: "Theme", shortcut: "T T" },
  { id: "theme-light", title: "Switch to Light Theme", category: "Theme" },
  { id: "theme-dark", title: "Switch to Dark Theme", category: "Theme" },
  { id: "theme-system", title: "Use System Theme", category: "Theme" },
];

// ============================================
// Component
// ============================================

interface OmnibarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Omnibar({ isOpen, onClose }: OmnibarProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [commandMetrics, setCommandMetrics] = useState<Record<string, CommandMetrics>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Determine if we're in command mode
  const isCommandMode = input.startsWith(">");
  const searchQuery = isCommandMode ? input.slice(1).trim() : input;

  // Load inbox and metrics on mount
  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          setIsLoading(true);
          const response = await listInboxItems(1, 100);
          setInboxItems(response.items);
        } catch (error) {
          console.error("Failed to load inbox items:", error);
        } finally {
          setIsLoading(false);
        }
      })();

      // Load command metrics
      const metrics = getCommandMetrics();
      setCommandMetrics(metrics);
      
      // Load recent commands (sorted by last used)
      const recent = Object.values(metrics)
        .sort((a, b) => new Date(b.last_used_at).getTime() - new Date(a.last_used_at).getTime())
        .slice(0, MAX_RECENT_COMMANDS)
        .map((m) => m.command_id);
      setRecentCommands(recent);
    }
  }, [isOpen]);

  // Build commands with actions
  const commands: Command[] = useMemo(() => {
    const navActions: Record<string, () => void> = {
      "nav-today": () => router.push("/today"),
      "nav-focus": () => router.push("/focus"),
      "nav-quests": () => router.push("/quests"),
      "nav-ignitions": () => router.push("/ignitions"),
      "nav-progress": () => router.push("/progress"),
      "nav-planner": () => router.push("/planner"),
      "nav-goals": () => router.push("/goals"),
      "nav-habits": () => router.push("/habits"),
      "nav-exercise": () => router.push("/exercise"),
      "nav-books": () => router.push("/books"),
      "nav-wins": () => router.push("/wins"),
      "nav-stats": () => router.push("/stats"),
      "nav-market": () => router.push("/market"),
      "nav-hub": () => router.push("/hub"),
      "nav-arrange": () => router.push("/arrange"),
      "nav-templates": () => router.push("/templates"),
      "nav-reference": () => router.push("/reference"),
      "nav-wheel": () => router.push("/wheel"),
      "nav-infobase": () => router.push("/infobase"),
      "nav-ideas": () => router.push("/ideas"),
      "nav-learn": () => router.push("/learn"),
      "nav-settings": () => router.push("/settings"),
      "nav-admin": () => router.push("/admin"),
    };

    const actionActions: Record<string, () => void> = {
      "action-new-quest": () => router.push("/quests?new=true"),
      "action-new-event": () => router.push("/planner?new=true"),
      "action-start-focus": () => router.push("/focus?start=true"),
      "action-new-arrangement": () => router.push("/arrange"),
      "action-new-idea": () => router.push("/ideas?new=true"),
      "action-new-goal": () => router.push("/goals?new=true"),
      "action-new-habit": () => router.push("/habits?new=true"),
    };

    const themeActions: Record<string, () => void> = {
      "theme-toggle": () => {
        const current = document.documentElement.getAttribute("data-theme");
        document.documentElement.setAttribute("data-theme", current === "dark" ? "light" : "dark");
      },
      "theme-light": () => {
        document.documentElement.setAttribute("data-theme", "light");
      },
      "theme-dark": () => {
        document.documentElement.setAttribute("data-theme", "dark");
      },
      "theme-system": () => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
      },
    };

    return [
      ...NAVIGATION_COMMANDS.map((c) => ({ ...c, action: navActions[c.id] || (() => {}) })),
      ...ACTION_COMMANDS.map((c) => ({ ...c, action: actionActions[c.id] || (() => {}) })),
      ...THEME_COMMANDS.map((c) => ({ ...c, action: themeActions[c.id] || (() => {}) })),
    ];
  }, [router]);

  // Enhanced filtering with fuzzy search + frequency scoring
  const filteredCommands = useMemo(() => {
    if (!isCommandMode) return [];
    
    if (!searchQuery) {
      // Return recent commands first, then most used
      return commands
        .filter((c) => recentCommands.includes(c.id))
        .sort((a, b) => recentCommands.indexOf(a.id) - recentCommands.indexOf(b.id))
        .concat(
          commands
            .filter((c) => !recentCommands.includes(c.id))
            .sort((a, b) => {
              const metricsA = commandMetrics[a.id];
              const metricsB = commandMetrics[b.id];
              return (metricsB?.usage_count || 0) - (metricsA?.usage_count || 0);
            })
        );
    }

    // Fuzzy search with scoring
    const scored = commands
      .map((cmd) => {
        const titleScore = fuzzyScore(searchQuery, cmd.title);
        const categoryScore = fuzzyScore(searchQuery, cmd.category) * 0.5; // Lower weight
        const descScore = cmd.description ? fuzzyScore(searchQuery, cmd.description) * 0.3 : 0;
        const finalScore = Math.max(titleScore, categoryScore, descScore);
        
        // Boost recent commands
        const recencyBoost = recentCommands.includes(cmd.id) ? 0.2 : 0;
        const frequencyBoost = (commandMetrics[cmd.id]?.usage_count || 0) / 100 * 0.1;
        
        return { cmd, score: finalScore + recencyBoost + frequencyBoost };
      })
      .filter((s) => s.score > FUZZY_MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.cmd);

    return scored;
  }, [searchQuery, commands, recentCommands, commandMetrics, isCommandMode]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  // Filter inbox items with fuzzy search
  const filteredInbox = useMemo(() => {
    if (!searchQuery) return inboxItems;
    const lower = searchQuery.toLowerCase();
    return inboxItems.filter(
      (item) =>
        fuzzyScore(searchQuery, item.title) > FUZZY_MATCH_THRESHOLD ||
        (item.description && fuzzyScore(searchQuery, item.description) > FUZZY_MATCH_THRESHOLD)
    );
  }, [inboxItems, searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setInput("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Add new inbox item
  const addInboxItem = useCallback(async () => {
    if (!input.trim() || isCommandMode) return;

    try {
      setIsLoading(true);
      const newItem = await createInboxItem(input.trim());
      setInboxItems([newItem, ...inboxItems]);
      setInput("");
    } catch (error) {
      console.error("Failed to create inbox item:", error);
    } finally {
      setIsLoading(false);
    }
  }, [input, isCommandMode, inboxItems]);

  // Delete inbox item
  const deleteInboxItem = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await deleteInboxItemAPI(id);
      setInboxItems(inboxItems.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete inbox item:", error);
    } finally {
      setIsLoading(false);
    }
  }, [inboxItems]);

  // Execute selected command with telemetry
  const executeCommand = useCallback(() => {
    if (filteredCommands[selectedIndex]) {
      const cmd = filteredCommands[selectedIndex];
      recordCommandUsage(cmd.id);
      cmd.action();
      onClose();
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isCommandMode) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < filteredCommands.length - 1 ? prev + 1 : 0
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredCommands.length - 1
            );
            break;
          case "Enter":
            e.preventDefault();
            executeCommand();
            break;
          case "Escape":
            e.preventDefault();
            onClose();
            break;
        }
      } else {
        switch (e.key) {
          case "ArrowDown":
            if (filteredInbox.length > 0) {
              e.preventDefault();
              setSelectedIndex((prev) =>
                prev < filteredInbox.length - 1 ? prev + 1 : 0
              );
            }
            break;
          case "ArrowUp":
            if (filteredInbox.length > 0) {
              e.preventDefault();
              setSelectedIndex((prev) =>
                prev > 0 ? prev - 1 : filteredInbox.length - 1
              );
            }
            break;
          case "Enter":
            e.preventDefault();
            if (input.trim()) {
              addInboxItem();
            }
            break;
          case "Backspace":
          case "Delete":
            if (!input && filteredInbox.length > 0 && selectedIndex >= 0) {
              e.preventDefault();
              const itemToDelete = filteredInbox[selectedIndex];
              if (itemToDelete) {
                deleteInboxItem(itemToDelete.id);
                if (selectedIndex >= filteredInbox.length - 1) {
                  setSelectedIndex(Math.max(0, filteredInbox.length - 2));
                }
              }
            }
            break;
          case "Escape":
            e.preventDefault();
            onClose();
            break;
        }
      }
    },
    [isCommandMode, filteredCommands, filteredInbox, selectedIndex, input, executeCommand, addInboxItem, deleteInboxItem, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className={styles.omnibarOverlay} onClick={onClose}>
      <div className={styles.omnibarContainer} onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className={styles.inputWrapper}>
          <span className={styles.modeIndicator}>{isCommandMode ? ">" : "✏"}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={isCommandMode ? "Search commands..." : "Quick note..."}
            className={styles.input}
          />
        </div>

        {/* Results */}
        <div className={styles.results} ref={listRef}>
          {isCommandMode ? (
            // Command mode
            Object.entries(groupedCommands).length === 0 ? (
              <div className={styles.emptyState}>
                <p>No commands found</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className={styles.commandGroup}>
                  <div className={styles.groupHeader}>{category}</div>
                  {cmds.map((cmd, idx) => (
                    <div
                      key={cmd.id}
                      className={`${styles.commandItem} ${
                        filteredCommands.indexOf(cmd) === selectedIndex ? styles.selected : ""
                      }`}
                      onClick={() => {
                        setSelectedIndex(filteredCommands.indexOf(cmd));
                        executeCommand();
                      }}
                    >
                      <div className={styles.commandContent}>
                        <span className={styles.commandTitle}>{cmd.title}</span>
                        {cmd.description && (
                          <span className={styles.commandDescription}>{cmd.description}</span>
                        )}
                      </div>
                      {cmd.shortcut && <span className={styles.shortcut}>{cmd.shortcut}</span>}
                    </div>
                  ))}
                </div>
              ))
            )
          ) : // Inbox mode
          isLoading ? (
            <div className={styles.emptyState}>
              <p>Loading...</p>
            </div>
          ) : filteredInbox.length === 0 && inboxItems.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Inbox is empty</p>
              <span className={styles.emptyHint}>Type something and press Enter to add</span>
            </div>
          ) : (
            <div className={styles.inboxList}>
              {filteredInbox.map((item, index) => (
                <div
                  key={item.id}
                  data-index={index}
                  className={`${styles.inboxItem} ${index === selectedIndex ? styles.selected : ""}`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className={styles.inboxText}>{item.title}</span>
                  <div className={styles.inboxMeta}>
                    <span className={styles.inboxDate}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <button
                      className={styles.deleteBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteInboxItem(item.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {isCommandMode ? (
            <span className={styles.hint}>↵ Execute  ↑↓ Navigate  Esc Close</span>
          ) : (
            <span className={styles.hint}>↵ Add  ↑↓ Navigate  {'>'} Commands  Esc Close</span>
          )}
        </div>
      </div>
    </div>
  );
}
