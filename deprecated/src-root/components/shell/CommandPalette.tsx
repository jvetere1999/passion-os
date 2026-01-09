"use client";

/**
 * Command Palette Component
 * Global keyboard navigation with Cmd/Ctrl+K
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./CommandPalette.module.css";

interface Command {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  category: string;
  action: () => void;
}

const NAVIGATION_COMMANDS: Omit<Command, "action">[] = [
  { id: "nav-today", title: "Go to Today", category: "Navigation", shortcut: "G T" },
  { id: "nav-hub", title: "Go to Hub", category: "Navigation", shortcut: "G H" },
  { id: "nav-focus", title: "Go to Focus", category: "Navigation", shortcut: "G F" },
  { id: "nav-planner", title: "Go to Planner", category: "Navigation", shortcut: "G P" },
  { id: "nav-quests", title: "Go to Quests", category: "Navigation", shortcut: "G Q" },
  { id: "nav-progress", title: "Go to Progress", category: "Navigation" },
  { id: "nav-arrange", title: "Go to Arrange", category: "Navigation", shortcut: "G A" },
  { id: "nav-templates", title: "Go to Templates", category: "Navigation" },
  { id: "nav-reference", title: "Go to Reference", category: "Navigation" },
  { id: "nav-infobase", title: "Go to Infobase", category: "Navigation", shortcut: "G I" },
  { id: "nav-exercise", title: "Go to Exercise", category: "Navigation" },
  { id: "nav-settings", title: "Go to Settings", category: "Navigation", shortcut: "G S" },
];

const ACTION_COMMANDS: Omit<Command, "action">[] = [
  { id: "action-new-quest", title: "Create New Quest", category: "Actions", shortcut: "N Q" },
  { id: "action-new-event", title: "Create New Event", category: "Actions", shortcut: "N E" },
  { id: "action-start-focus", title: "Start Focus Session", category: "Actions", shortcut: "N F" },
  { id: "action-new-arrangement", title: "Create New Arrangement", category: "Actions" },
  { id: "action-inbox", title: "Open Inbox", category: "Actions", shortcut: "I" },
];

const THEME_COMMANDS: Omit<Command, "action">[] = [
  { id: "theme-toggle", title: "Toggle Theme", category: "Theme", shortcut: "T T" },
  { id: "theme-light", title: "Switch to Light Theme", category: "Theme" },
  { id: "theme-dark", title: "Switch to Dark Theme", category: "Theme" },
  { id: "theme-system", title: "Use System Theme", category: "Theme" },
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build commands with actions
  const commands: Command[] = useMemo(() => {
    const navActions: Record<string, () => void> = {
      "nav-today": () => router.push("/today"),
      "nav-hub": () => router.push("/hub"),
      "nav-focus": () => router.push("/focus"),
      "nav-planner": () => router.push("/planner"),
      "nav-quests": () => router.push("/quests"),
      "nav-progress": () => router.push("/progress"),
      "nav-arrange": () => router.push("/arrange"),
      "nav-templates": () => router.push("/templates"),
      "nav-reference": () => router.push("/reference"),
      "nav-infobase": () => router.push("/infobase"),
      "nav-exercise": () => router.push("/exercise"),
      "nav-settings": () => router.push("/settings"),
    };

    const actionActions: Record<string, () => void> = {
      "action-new-quest": () => router.push("/quests?new=true"),
      "action-new-event": () => router.push("/planner?new=true"),
      "action-start-focus": () => router.push("/focus?start=true"),
      "action-new-arrangement": () => router.push("/arrange"),
      "action-inbox": () => {/* Will be handled separately */},
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

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands;
    const lower = search.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower) ||
        c.description?.toLowerCase().includes(lower)
    );
  }, [commands, search]);

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

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedEl?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.palette}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <div className={styles.inputWrapper}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className={styles.escHint}>ESC</kbd>
        </div>

        <div className={styles.results} ref={listRef}>
          {filteredCommands.length === 0 ? (
            <div className={styles.empty}>
              <p>No commands found for &ldquo;{search}&rdquo;</p>
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
                      className={`${styles.command} ${index === selectedIndex ? styles.selected : ""}`}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <span className={styles.commandTitle}>{cmd.title}</span>
                      {cmd.shortcut && (
                        <kbd className={styles.shortcut}>{cmd.shortcut}</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.hint}>
            <kbd>↑↓</kbd> to navigate
          </span>
          <span className={styles.hint}>
            <kbd>Enter</kbd> to select
          </span>
          <span className={styles.hint}>
            <kbd>Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;

