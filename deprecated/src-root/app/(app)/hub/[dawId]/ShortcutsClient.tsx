"use client";

/**
 * Shortcuts Client Component
 * Interactive shortcuts browser with filtering, search, and OS toggle
 * Supports quick mode via ?quick=1 query param
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { QuickModeHeader } from "@/components/ui/QuickModeHeader";
import styles from "./ShortcutsClient.module.css";

interface Shortcut {
  id: string;
  action: string;
  keys: string[];
  keysWin?: string[];
  category: string;
  description?: string;
  tags?: string[];
  context?: string;
}

interface DAWData {
  id: string;
  name: string;
  color: string;
  version?: string;
  shortcuts: Shortcut[];
  categories: string[];
}

type OSType = "mac" | "windows";
type ViewMode = "list" | "grid";

interface FilterState {
  search: string;
  category: string;
  tag: string;
  context: string;
}

// Cookie helpers
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Detect user OS
function detectOS(): OSType {
  if (typeof navigator === "undefined") return "mac";
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  if (platform.includes("mac") || userAgent.includes("mac")) return "mac";
  if (platform.includes("win") || userAgent.includes("win")) return "windows";
  return "mac";
}

// Key display mapping for better visuals
const KEY_SYMBOLS: Record<string, { mac: string; win: string; display: string }> = {
  cmd: { mac: "\u2318", win: "Ctrl", display: "Command" },
  command: { mac: "\u2318", win: "Ctrl", display: "Command" },
  ctrl: { mac: "\u2303", win: "Ctrl", display: "Control" },
  control: { mac: "\u2303", win: "Ctrl", display: "Control" },
  alt: { mac: "\u2325", win: "Alt", display: "Alt/Option" },
  option: { mac: "\u2325", win: "Alt", display: "Option" },
  shift: { mac: "\u21E7", win: "Shift", display: "Shift" },
  enter: { mac: "\u23CE", win: "Enter", display: "Enter" },
  return: { mac: "\u23CE", win: "Enter", display: "Return" },
  tab: { mac: "\u21E5", win: "Tab", display: "Tab" },
  space: { mac: "\u2423", win: "Space", display: "Space" },
  backspace: { mac: "\u232B", win: "Backspace", display: "Backspace" },
  delete: { mac: "\u2326", win: "Delete", display: "Delete" },
  escape: { mac: "\u238B", win: "Esc", display: "Escape" },
  esc: { mac: "\u238B", win: "Esc", display: "Escape" },
  up: { mac: "\u2191", win: "\u2191", display: "Up Arrow" },
  down: { mac: "\u2193", win: "\u2193", display: "Down Arrow" },
  left: { mac: "\u2190", win: "\u2190", display: "Left Arrow" },
  right: { mac: "\u2192", win: "\u2192", display: "Right Arrow" },
  home: { mac: "\u2196", win: "Home", display: "Home" },
  end: { mac: "\u2198", win: "End", display: "End" },
  pageup: { mac: "\u21DE", win: "PgUp", display: "Page Up" },
  pagedown: { mac: "\u21DF", win: "PgDn", display: "Page Down" },
};

// Parse Unicode symbols to readable keys
function parseKey(key: string): string {
  const symbolMap: Record<string, string> = {
    "\u2318": "Cmd",
    "\u2325": "Option",
    "\u21E7": "Shift",
    "\u2303": "Ctrl",
    "\u23CE": "Enter",
    "\u21E5": "Tab",
    "\u2423": "Space",
    "\u232B": "Backspace",
    "\u2326": "Delete",
    "\u238B": "Esc",
    "\u2191": "Up",
    "\u2193": "Down",
    "\u2190": "Left",
    "\u2192": "Right",
  };
  return symbolMap[key] || key;
}

function formatKey(key: string, os: OSType): string {
  const parsed = parseKey(key);
  const lower = parsed.toLowerCase();
  const mapping = KEY_SYMBOLS[lower];
  if (mapping) {
    return os === "mac" ? mapping.mac : mapping.win;
  }
  // Mac symbol to Windows conversion
  if (os === "windows") {
    if (key === "\u2318" || lower === "cmd" || lower === "command") return "Ctrl";
    if (key === "\u2325" || lower === "option") return "Alt";
  }
  return key;
}

function getKeyClass(key: string): string {
  const parsed = parseKey(key).toLowerCase();

  // Modifier keys (Cmd/Ctrl)
  if (["cmd", "command", "\u2318", "ctrl", "control", "\u2303"].includes(parsed)) {
    return styles.keyModifier;
  }
  // Shift key
  if (["shift", "\u21E7"].includes(parsed)) {
    return styles.keyShift;
  }
  // Alt/Option key
  if (["alt", "option", "\u2325"].includes(parsed)) {
    return styles.keyAlt;
  }
  // Arrow keys
  if (["up", "down", "left", "right", "\u2191", "\u2193", "\u2190", "\u2192"].includes(parsed)) {
    return styles.keyArrow;
  }
  // Function keys
  if (/^f([1-9]|1[0-2])$/i.test(parsed)) {
    return styles.keyFunction;
  }
  // Single letter/number keys
  if (parsed.length === 1 && /[a-z0-9]/i.test(parsed)) {
    return styles.keyLetter;
  }
  // Special keys (Enter, Tab, Space, etc)
  return styles.keySpecial;
}

interface ShortcutsClientProps {
  daw: DAWData;
}

export function ShortcutsClient({ daw }: ShortcutsClientProps) {
  // State
  const [os, setOs] = useState<OSType>("mac");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    tag: "",
    context: "",
  });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);
  const [isQuickMode, setIsQuickMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect quick mode from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const quick = params.get("quick") === "1";
      setIsQuickMode(quick);
      // Auto-focus search in quick mode
      if (quick && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  }, []);

  // Initialize from cookies and detect OS
  useEffect(() => {
    const savedOs = getCookie("shortcuts_os") as OSType | null;
    const savedView = getCookie("shortcuts_view") as ViewMode | null;
    const savedDawFilters = getCookie(`shortcuts_filters_${daw.id}`);

    if (savedOs) {
      setOs(savedOs);
    } else {
      const detected = detectOS();
      setOs(detected);
      setCookie("shortcuts_os", detected);
    }

    if (savedView) {
      setViewMode(savedView);
    }

    if (savedDawFilters) {
      try {
        const parsed = JSON.parse(savedDawFilters);
        setFilters((prev) => ({ ...prev, ...parsed }));
      } catch {
        // Ignore parse errors
      }
    }

    // Expand all categories by default
    setExpandedCategories(new Set(daw.categories));
    setInitialized(true);
  }, [daw.id, daw.categories]);

  // Save preferences to cookies
  useEffect(() => {
    if (!initialized) return;
    setCookie("shortcuts_os", os);
  }, [os, initialized]);

  useEffect(() => {
    if (!initialized) return;
    setCookie("shortcuts_view", viewMode);
  }, [viewMode, initialized]);

  useEffect(() => {
    if (!initialized) return;
    setCookie(`shortcuts_filters_${daw.id}`, JSON.stringify({ category: filters.category, tag: filters.tag }));
  }, [filters.category, filters.tag, daw.id, initialized]);

  // Get unique tags from shortcuts
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    daw.shortcuts.forEach((s) => {
      s.tags?.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [daw.shortcuts]);

  // Get unique contexts
  const allContexts = useMemo(() => {
    const contexts = new Set<string>();
    daw.shortcuts.forEach((s) => {
      if (s.context) contexts.add(s.context);
    });
    return Array.from(contexts).sort();
  }, [daw.shortcuts]);

  // Filter shortcuts
  const filteredShortcuts = useMemo(() => {
    return daw.shortcuts.filter((shortcut) => {
      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matches =
          shortcut.action.toLowerCase().includes(query) ||
          shortcut.description?.toLowerCase().includes(query) ||
          shortcut.keys.some((k) => parseKey(k).toLowerCase().includes(query)) ||
          shortcut.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matches) return false;
      }

      // Category filter
      if (filters.category && shortcut.category !== filters.category) {
        return false;
      }

      // Tag filter
      if (filters.tag && !shortcut.tags?.includes(filters.tag)) {
        return false;
      }

      // Context filter
      if (filters.context && shortcut.context !== filters.context) {
        return false;
      }

      return true;
    });
  }, [daw.shortcuts, filters]);

  // Group filtered shortcuts by category
  const shortcutsByCategory = useMemo(() => {
    return filteredShortcuts.reduce(
      (acc, shortcut) => {
        if (!acc[shortcut.category]) {
          acc[shortcut.category] = [];
        }
        acc[shortcut.category].push(shortcut);
        return acc;
      },
      {} as Record<string, Shortcut[]>
    );
  }, [filteredShortcuts]);

  // Handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  }, []);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, category: e.target.value }));
  }, []);

  const handleTagChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, tag: e.target.value }));
  }, []);

  const handleContextChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, context: e.target.value }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: "", category: "", tag: "", context: "" });
  }, []);

  const hasActiveFilters = filters.search || filters.category || filters.tag || filters.context;

  return (
    <div className={styles.page}>
      {/* Quick Mode Header */}
      {isQuickMode && <QuickModeHeader title="Quick Start - Shortcuts" />}

      {/* Header */}
      <header className={styles.header}>
        <Link href="/hub" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Hub
        </Link>

        <div className={styles.titleRow}>
          <div className={styles.dawIcon} style={{ backgroundColor: daw.color }}>
            <span>{daw.name[0]}</span>
          </div>
          <div>
            <h1 className={styles.title}>{daw.name}</h1>
            <p className={styles.version}>Version {daw.version}</p>
          </div>
        </div>

        <p className={styles.subtitle}>
          {filteredShortcuts.length} of {daw.shortcuts.length} shortcuts
        </p>
      </header>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        {/* OS Toggle */}
        <div className={styles.osToggle}>
          <button
            className={`${styles.osButton} ${os === "mac" ? styles.active : ""}`}
            onClick={() => setOs("mac")}
            title="Show Mac shortcuts"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Mac
          </button>
          <button
            className={`${styles.osButton} ${os === "windows" ? styles.active : ""}`}
            onClick={() => setOs("windows")}
            title="Show Windows shortcuts"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 12V6.75l6-1.32v6.48L3 12zm8.25 0V5.04l9.75-2.13v9.09H11.25zm0 .88h9.75v9.08l-9.75-2.13V12.88zM3 12.75l6 .09v6.48l-6-1.32V12.75z"/>
            </svg>
            Windows
          </button>
        </div>

        {/* View Toggle */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewButton} ${viewMode === "list" ? styles.active : ""}`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            className={`${styles.viewButton} ${viewMode === "grid" ? styles.active : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrapper}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            placeholder={`Search ${daw.name} shortcuts...`}
            value={filters.search}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={filters.category}
            onChange={handleCategoryChange}
            className={styles.filterSelect}
          >
            <option value="">All Categories</option>
            {daw.categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {allTags.length > 0 && (
            <select
              value={filters.tag}
              onChange={handleTagChange}
              className={styles.filterSelect}
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          )}

          {allContexts.length > 0 && (
            <select
              value={filters.context}
              onChange={handleContextChange}
              className={styles.filterSelect}
            >
              <option value="">All Contexts</option>
              {allContexts.map((ctx) => (
                <option key={ctx} value={ctx}>{ctx}</option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <button className={styles.clearButton} onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Shortcuts List */}
      <div className={styles.categories}>
        {Object.entries(shortcutsByCategory).length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p>No shortcuts found matching your filters.</p>
            <button className={styles.clearButton} onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          Object.entries(shortcutsByCategory).map(([category, shortcuts]) => (
            <section key={category} className={styles.category}>
              <button
                className={styles.categoryHeader}
                onClick={() => toggleCategory(category)}
              >
                <h2 className={styles.categoryTitle}>{category}</h2>
                <span className={styles.categoryCount}>{shortcuts.length}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`${styles.chevron} ${expandedCategories.has(category) ? styles.expanded : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {expandedCategories.has(category) && (
                <div className={`${styles.shortcutList} ${viewMode === "grid" ? styles.gridView : ""}`}>
                  {shortcuts.map((shortcut) => (
                    <div key={shortcut.id} className={styles.shortcutItem}>
                      <div className={styles.shortcutInfo}>
                        <span className={styles.shortcutAction}>{shortcut.action}</span>
                        {shortcut.description && (
                          <span className={styles.shortcutDescription}>{shortcut.description}</span>
                        )}
                        {shortcut.context && (
                          <span className={styles.shortcutContext}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            {shortcut.context}
                          </span>
                        )}
                        {shortcut.tags && shortcut.tags.length > 0 && (
                          <div className={styles.shortcutTags}>
                            {shortcut.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className={styles.tag}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={styles.shortcutKeys}>
                        {/* Use Windows keys if available and OS is Windows, otherwise use Mac keys with conversion */}
                        {(os === "windows" && shortcut.keysWin ? shortcut.keysWin : shortcut.keys).map((key, i, arr) => (
                          <span key={i}>
                            <kbd className={`${styles.key} ${getKeyClass(key)}`}>
                              {formatKey(key, os)}
                            </kbd>
                            {i < arr.length - 1 && (
                              <span className={styles.keySeparator}>+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

