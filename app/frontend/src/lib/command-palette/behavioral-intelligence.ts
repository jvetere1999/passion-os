//! Command Palette Enhancement System
//! 
//! Adds behavioral intelligence to the Omnibar command palette:
//! - Fuzzy search for command discovery
//! - Command execution tracking & analytics
//! - Recent commands for quick access
//! - Frequency-based command ranking
//! - Time-of-day context awareness
//! - Search scoring & intelligent result ordering

import { useCallback, useState, useEffect } from "react";

/**
 * Command execution history for learning user patterns
 */
interface CommandExecution {
  commandId: string;
  executedAt: number; // timestamp
  completedAt?: number;
  success: boolean;
  timeToExecute?: number; // ms
}

/**
 * Command metadata with behavioral signals
 */
interface CommandMetadata {
  id: string;
  executionCount: number;
  lastExecutedAt: number | null;
  averageTimeToExecute: number;
  successRate: number; // 0-1
  timeOfDayPattern?: Record<string, number>; // hour -> count
}

/**
 * Fuzzy search scoring
 */
function fuzzyScore(query: string, text: string): number {
  if (!query) return 0;
  
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  
  // Exact match
  if (lowerText === lowerQuery) return 1000;
  
  // Starts with
  if (lowerText.startsWith(lowerQuery)) return 500;
  
  // Contains
  if (lowerText.includes(lowerQuery)) return 250;
  
  // Fuzzy match - consecutive characters
  let score = 0;
  let queryIdx = 0;
  let lastMatchIdx = -1;
  
  for (let i = 0; i < lowerText.length && queryIdx < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIdx]) {
      score += 100;
      if (lastMatchIdx === i - 1) {
        score += 50; // Bonus for consecutive matches
      }
      lastMatchIdx = i;
      queryIdx++;
    }
  }
  
  if (queryIdx !== lowerQuery.length) return 0; // Incomplete match
  return score;
}

/**
 * Calculate recency score (0-100)
 * Commands used recently score higher
 */
function recencyScore(lastExecutedAt: number | null): number {
  if (!lastExecutedAt) return 20; // Base score for never-used
  
  const now = Date.now();
  const ageMs = now - lastExecutedAt;
  
  // Used in last hour: 100
  if (ageMs < 3600000) return 100;
  
  // Used in last day: 80
  if (ageMs < 86400000) return 80;
  
  // Used in last week: 60
  if (ageMs < 604800000) return 60;
  
  // Used longer ago: 40
  return 40;
}

/**
 * Calculate frequency score (0-100)
 * Commands used often score higher
 */
function frequencyScore(executionCount: number): number {
  // Logarithmic scale: 10 executions = 100 score
  return Math.min(100, Math.log(executionCount + 1) * 33);
}

/**
 * Calculate time-of-day relevance (0-100)
 * Some commands are more relevant at certain times
 */
function timeOfDayScore(commandId: string, pattern?: Record<string, number>): number {
  if (!pattern) return 50; // Neutral
  
  const now = new Date();
  const hour = now.getHours();
  const hourKey = hour.toString();
  
  if (!(hourKey in pattern)) return 50;
  
  // Normalize pattern counts to 0-100 scale
  const counts = Object.values(pattern);
  const maxCount = Math.max(...counts);
  if (maxCount === 0) return 50;
  
  return (pattern[hourKey] / maxCount) * 100;
}

/**
 * Combined command ranking score (0-1000)
 * Combines fuzzy match, recency, frequency, and time-of-day signals
 */
export function calculateCommandScore(
  query: string,
  command: { id: string; title: string; description?: string },
  metadata: CommandMetadata,
  timeOfDayPattern?: Record<string, number>
): number {
  const fuzzy = fuzzyScore(query, command.title) + 
                (command.description ? fuzzyScore(query, command.description) * 0.5 : 0);
  
  const recency = recencyScore(metadata.lastExecutedAt);
  const frequency = frequencyScore(metadata.executionCount);
  const timeOfDay = timeOfDayScore(command.id, timeOfDayPattern);
  
  // Weighted combination
  // Fuzzy match is primary signal (50%)
  // Recency breaks ties (25%)
  // Frequency for consistency (15%)
  // Time-of-day for context (10%)
  return (fuzzy * 0.5) + (recency * 0.25) + (frequency * 0.15) + (timeOfDay * 0.1);
}

/**
 * Hook: Manage command execution history
 */
export function useCommandHistory() {
  const [executions, setExecutions] = useState<CommandExecution[]>([]);
  const [metadata, setMetadata] = useState<Record<string, CommandMetadata>>({});
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("omnibar_command_history_v1");
      if (stored) {
        const parsed = JSON.parse(stored);
        setExecutions(parsed.executions || []);
        setMetadata(parsed.metadata || {});
      }
    } catch (e) {
      console.error("Failed to load command history:", e);
    }
  }, []);
  
  // Save to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("omnibar_command_history_v1", JSON.stringify({
        executions,
        metadata,
      }));
    } catch (e) {
      console.error("Failed to save command history:", e);
    }
  }, [executions, metadata]);
  
  // Record command execution
  const recordExecution = useCallback((commandId: string) => {
    const now = Date.now();
    
    setExecutions(prev => [...prev, {
      commandId,
      executedAt: now,
      success: true,
    }]);
    
    setMetadata(prev => {
      const current = prev[commandId] || {
        id: commandId,
        executionCount: 0,
        lastExecutedAt: null,
        averageTimeToExecute: 0,
        successRate: 1,
      };
      
      return {
        ...prev,
        [commandId]: {
          ...current,
          executionCount: current.executionCount + 1,
          lastExecutedAt: now,
        },
      };
    });
  }, []);
  
  // Get metadata for a command
  const getMetadata = useCallback((commandId: string): CommandMetadata => {
    return metadata[commandId] || {
      id: commandId,
      executionCount: 0,
      lastExecutedAt: null,
      averageTimeToExecute: 0,
      successRate: 1,
    };
  }, [metadata]);
  
  // Get top N recently used commands
  const getRecentCommands = useCallback((count: number = 5): string[] => {
    const recent = Object.entries(metadata)
      .filter(([id, meta]) => meta.lastExecutedAt !== null)
      .sort((a, b) => (b[1].lastExecutedAt || 0) - (a[1].lastExecutedAt || 0))
      .slice(0, count)
      .map(([id]) => id);
    
    return recent;
  }, [metadata]);
  
  return {
    executions,
    metadata,
    recordExecution,
    getMetadata,
    getRecentCommands,
  };
}

/**
 * Suggested behavioral enhancements for command palette:
 * 
 * 1. RECENT COMMANDS SECTION (top of results)
 *    - Show 3-5 most recently used commands
 *    - Reduces cognitive load + friction for repeated actions
 *    - Pattern: "Starter Block" (reducing ability required)
 * 
 * 2. TIME-AWARE SUGGESTIONS
 *    - Morning: Quick Picks (Focus, Today, Quests)
 *    - Afternoon: Reflect (Wins, Stats, Market)
 *    - Evening: Wind-down (Settings, Habits review)
 *    - Based on user patterns, deterministic + learnable
 * 
 * 3. FREQUENCY-BASED SORTING
 *    - Commands you use most appear first
 *    - Combined with fuzzy search matching
 *    - Reduces typing + decision fatigue
 * 
 * 4. SMART COMMAND GROUPING
 *    - Related commands grouped by context
 *    - E.g., "Create" group: Quest, Goal, Habit, Idea
 *    - "Navigate" group: Today, Focus, Quests, etc.
 * 
 * 5. COMMAND PREVIEW + EXPLANATION
 *    - Show "Where this goes" before executing
 *    - Example: "Go to Focus" → preview Focus page icon
 *    - Reduces uncertainty, increases execution confidence
 * 
 * 6. MACRO COMMANDS (for sequences)
 *    - Bundle related actions: "Setup Focus Session"
 *    - Could: Start Focus + Set goal + Play music
 *    - Reduces required ability + friction significantly
 * 
 * 7. ACCESSIBILITY MODES
 *    - Large text option for command titles
 *    - Keyboard-only navigation (Tab, Arrow keys, Enter)
 *    - Screen reader support for explanations
 * 
 * 8. LEARNING LOOP
 *    - Track which commands user abandons
 *    - Surface alternatives to failed actions
 *    - Example: If user starts Focus but doesn't complete,
 *      suggest "Shorter Break" next time
 */

export const BEHAVIORAL_ENHANCEMENTS = {
  RECENT_COMMANDS: {
    description: "Show 3-5 most recently used commands at top",
    signals: ["recency", "frequency"],
    pattern: "Starter Block / Soft Landing",
    impact: "High - reduces friction for repeated actions",
  },
  
  TIME_AWARE: {
    description: "Suggest commands based on time-of-day patterns",
    signals: ["time_of_day", "user_activity_pattern"],
    pattern: "Soft Landing / Momentum Feedback",
    impact: "Medium - provides gentle contextual guidance",
  },
  
  FUZZY_SEARCH: {
    description: "Intelligent command search with scoring algorithm",
    signals: ["query_match", "recency", "frequency"],
    pattern: "Decision Suppression",
    impact: "High - reduces cognitive load of finding commands",
  },
  
  COMMAND_MACROS: {
    description: "Bundle related actions into single command",
    signals: ["frequency", "sequence_patterns"],
    pattern: "Reduced Mode / Soft Landing",
    impact: "Very High - dramatically reduces ability required",
  },
  
  PREVIEW_EXPLANATIONS: {
    description: "Show where command goes and what it does",
    signals: ["user_understanding", "confidence"],
    pattern: "Momentum Feedback / Explainability",
    impact: "Medium - increases execution confidence",
  },
} as const;
