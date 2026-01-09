"use client";

/**
 * Omnibar Component
 * Unified command palette + inbox
 * - Default mode: Quick capture notes/tasks
 * - Command mode (starts with >): Navigate and execute actions
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  text: string;
  createdAt: string;
  type: "note" | "task" | "idea";
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

const INBOX_STORAGE_KEY = "passion_inbox_v1";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Determine if we're in command mode
  const isCommandMode = input.startsWith(">");
  const searchQuery = isCommandMode ? input.slice(1).trim() : input;

  // Load inbox items
  useEffect(() => {
    try {
      const stored = localStorage.getItem(INBOX_STORAGE_KEY);
      if (stored) {
        setInboxItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load inbox:", e);
    }
  }, []);

  // Save inbox items
  const saveInboxItems = useCallback((items: InboxItem[]) => {
    setInboxItems(items);
    try {
      localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save inbox:", e);
    }
  }, []);

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
        localStorage.setItem("theme", current === "dark" ? "light" : "dark");
      },
      "theme-light": () => {
        document.documentElement.setAttribute("data-theme", "light");
        localStorage.setItem("theme", "light");
      },
      "theme-dark": () => {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("theme", "dark");
      },
      "theme-system": () => {
        localStorage.removeItem("theme");
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

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!searchQuery) return commands;
    const lower = searchQuery.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [commands, searchQuery]);

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

  // Filter inbox items
  const filteredInbox = useMemo(() => {
    if (!searchQuery) return inboxItems;
    const lower = searchQuery.toLowerCase();
    return inboxItems.filter((item) => item.text.toLowerCase().includes(lower));
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
  const addInboxItem = useCallback(() => {
    if (!input.trim() || isCommandMode) return;

    const item: InboxItem = {
      id: crypto.randomUUID(),
      text: input.trim(),
      createdAt: new Date().toISOString(),
      type: "note",
    };

    saveInboxItems([item, ...inboxItems]);
    setInput("");
  }, [input, isCommandMode, inboxItems, saveInboxItems]);

  // Delete inbox item
  const deleteInboxItem = useCallback((id: string) => {
    saveInboxItems(inboxItems.filter((item) => item.id !== id));
  }, [inboxItems, saveInboxItems]);

  // Execute selected command
  const executeCommand = useCallback(() => {
    if (filteredCommands[selectedIndex]) {
      filteredCommands[selectedIndex].action();
      onClose();
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isCommandMode) {
        // Command mode keyboard handling
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
        // Inbox mode keyboard handling
        switch (e.key) {
          case "ArrowDown":
            // Navigate inbox items when input is empty or has search query
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
            // Delete selected inbox item when input is empty
            if (!input && filteredInbox.length > 0 && selectedIndex >= 0) {
              e.preventDefault();
              const itemToDelete = filteredInbox[selectedIndex];
              if (itemToDelete) {
                deleteInboxItem(itemToDelete.id);
                // Adjust selection if needed
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
    [isCommandMode, filteredCommands.length, filteredInbox, selectedIndex, input, executeCommand, addInboxItem, deleteInboxItem, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [input]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.omnibar} onClick={(e) => e.stopPropagation()}>
        {/* Input Area */}
        <div className={styles.inputWrapper}>
          {isCommandMode ? (
            <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 10 4 15 9 20" />
              <path d="M20 4v7a4 4 0 0 1-4 4H4" />
            </svg>
          ) : (
            <svg className={styles.icon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          )}
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder={isCommandMode ? "Type a command..." : "Add a note or type > for commands..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className={styles.hints}>
            {isCommandMode ? (
              <span className={styles.modeHint}>Command Mode</span>
            ) : (
              <span className={styles.modeHint}>Inbox</span>
            )}
            <kbd className={styles.escHint}>ESC</kbd>
          </div>
        </div>

        {/* Results Area */}
        <div className={styles.results} ref={listRef}>
          {isCommandMode ? (
            // Command Mode Results
            filteredCommands.length === 0 ? (
              <div className={styles.empty}>
                <p>No commands found</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category} className={styles.group}>
                  <div className={styles.groupTitle}>{category}</div>
                  {cmds.map((cmd) => {
                    const index = filteredCommands.indexOf(cmd);
                    return (
                      <button
                        key={cmd.id}
                        data-index={index}
                        className={`${styles.item} ${index === selectedIndex ? styles.selected : ""}`}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <span className={styles.itemTitle}>{cmd.title}</span>
                        {cmd.shortcut && (
                          <kbd className={styles.shortcut}>{cmd.shortcut}</kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )
          ) : (
            // Inbox Mode Results
            <>
              {input.trim() && (
                <div className={styles.addHint}>
                  Press <kbd>Enter</kbd> to add note
                </div>
              )}
              {filteredInbox.length === 0 && !input.trim() ? (
                <div className={styles.empty}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                  </svg>
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
                      onClick={() => {
                        // Could open item for editing in the future
                        setSelectedIndex(index);
                      }}
                    >
                      <span className={styles.inboxText}>{item.text}</span>
                      <div className={styles.inboxMeta}>
                        <span className={styles.inboxDate}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          className={styles.deleteBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteInboxItem(item.id);
                          }}
                          title="Delete (Backspace)"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          {isCommandMode ? (
            <>
              <span className={styles.footerHint}>
                <kbd>Up/Down</kbd> navigate
              </span>
              <span className={styles.footerHint}>
                <kbd>Enter</kbd> execute
              </span>
            </>
          ) : (
            <>
              <span className={styles.footerHint}>
                <kbd>Up/Down</kbd> select
              </span>
              <span className={styles.footerHint}>
                <kbd>Backspace</kbd> delete
              </span>
              <span className={styles.footerHint}>
                <kbd>Enter</kbd> add note
              </span>
              <span className={styles.footerHint}>
                Type <kbd>&gt;</kbd> for commands
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Omnibar;

