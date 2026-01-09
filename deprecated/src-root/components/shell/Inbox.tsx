"use client";

/**
 * Inbox Component
 * Quick capture for thoughts, notes, and ideas
 */

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Inbox.module.css";

interface InboxItem {
  id: string;
  text: string;
  createdAt: string;
  type: "note" | "task" | "idea";
}

const STORAGE_KEY = "passion_inbox_v1";

interface InboxProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Inbox({ isOpen, onClose }: InboxProps) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<InboxItem["type"]>("note");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load inbox:", e);
    }
  }, []);

  // Save items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save inbox:", e);
    }
  }, [items]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    if (!newText.trim()) return;

    const item: InboxItem = {
      id: crypto.randomUUID(),
      text: newText.trim(),
      createdAt: new Date().toISOString(),
      type: newType,
    };

    setItems((prev) => [item, ...prev]);
    setNewText("");
  }, [newText, newType]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSubmit, onClose]
  );

  const handleDelete = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClear = useCallback(() => {
    if (confirm("Clear all inbox items?")) {
      setItems([]);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.inbox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Inbox</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Capture a thought, task, or idea..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div className={styles.inputActions}>
            <div className={styles.typeSelector}>
              <button
                className={`${styles.typeBtn} ${newType === "note" ? styles.active : ""}`}
                onClick={() => setNewType("note")}
              >
                Note
              </button>
              <button
                className={`${styles.typeBtn} ${newType === "task" ? styles.active : ""}`}
                onClick={() => setNewType("task")}
              >
                Task
              </button>
              <button
                className={`${styles.typeBtn} ${newType === "idea" ? styles.active : ""}`}
                onClick={() => setNewType("idea")}
              >
                Idea
              </button>
            </div>
            <button className={styles.addBtn} onClick={handleSubmit} disabled={!newText.trim()}>
              Add
            </button>
          </div>
        </div>

        <div className={styles.items}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <p>Your inbox is empty</p>
              <span>Capture thoughts quickly with the inbox</span>
            </div>
          ) : (
            <>
              <div className={styles.itemsHeader}>
                <span>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                <button className={styles.clearBtn} onClick={handleClear}>
                  Clear all
                </button>
              </div>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <span className={`${styles.itemType} ${styles[item.type]}`}>
                    {item.type}
                  </span>
                  <p className={styles.itemText}>{item.text}</p>
                  <span className={styles.itemDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Inbox;

