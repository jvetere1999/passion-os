/**
 * Settings Client Component
 * Interactive settings controls
 */

"use client";

import { useState } from "react";
import { safeFetch, API_BASE_URL } from "@/lib/api";
import { signOut } from "@/lib/auth/api-auth";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { useAuth } from "@/lib/hooks/useAuth";
import styles from "./page.module.css";

interface SettingsClientProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }; // Optional - will use useAuth() if not provided
}

export function SettingsClient({ user: propUser }: SettingsClientProps = {}) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/user/export`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `passion-os-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to export data:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") {
      alert("Please type DELETE to confirm.");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await safeFetch(`${API_BASE_URL}/api/user/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Sign out and redirect to home
        await signOut();
      } else {
        const data = await response.json() as { error?: string };
        alert(data.error || "Failed to delete account.");
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.sections}>
      {/* Account Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <div className={styles.sectionContent}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Name</label>
            <div className={styles.fieldValue}>{user?.name || "Not set"}</div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Email</label>
            <div className={styles.fieldValue}>{user?.email || "Not set"}</div>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        <div className={styles.sectionContent}>
          <ThemeSelector />
        </div>
      </section>

      {/* Focus Settings */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Focus Timer</h2>
        <div className={styles.sectionContent}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="focusDuration">
              Focus Duration
            </label>
            <select id="focusDuration" className={styles.select} defaultValue="25">
              <option value="15">15 minutes</option>
              <option value="25">25 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="breakDuration">
              Break Duration
            </label>
            <select id="breakDuration" className={styles.select} defaultValue="5">
              <option value="3">3 minutes</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="longBreakDuration">
              Long Break Duration
            </label>
            <select
              id="longBreakDuration"
              className={styles.select}
              defaultValue="15"
            >
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notifications</h2>
        <div className={styles.sectionContent}>
          <div className={styles.fieldRow}>
            <div>
              <label className={styles.fieldLabel}>Timer Sounds</label>
              <p className={styles.fieldDescription}>
                Play a sound when focus sessions end
              </p>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" defaultChecked />
              <span className={styles.toggleSlider} />
            </label>
          </div>
          <div className={styles.fieldRow}>
            <div>
              <label className={styles.fieldLabel}>Browser Notifications</label>
              <p className={styles.fieldDescription}>
                Show notifications for timer events
              </p>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" defaultChecked />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data Management</h2>
        <div className={styles.sectionContent}>
          <div className={styles.dangerItem}>
            <div>
              <span className={styles.fieldLabel}>Export Data</span>
              <p className={styles.fieldDescription}>
                Download all your data as JSON
              </p>
            </div>
            <button
              className={styles.secondaryButton}
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? "Exporting..." : "Export"}
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitleDanger}>Danger Zone</h2>
        <div className={styles.sectionContentDanger}>
          <div className={styles.dangerItem}>
            <div>
              <span className={styles.fieldLabel}>Delete Account</span>
              <p className={styles.fieldDescription}>
                Permanently delete your account and all data. This action cannot be undone.
              </p>
            </div>
            {!showDeleteConfirm ? (
              <button
                className={styles.dangerButton}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </button>
            ) : (
              <div className={styles.deleteConfirm}>
                <p className={styles.deleteWarning}>
                  Type DELETE to confirm permanent deletion:
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="Type DELETE"
                  className={styles.deleteInput}
                />
                <div className={styles.deleteActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirm("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.dangerButton}
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirm !== "DELETE"}
                  >
                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
