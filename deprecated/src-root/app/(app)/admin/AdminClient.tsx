"use client";

/**
 * Admin Client Component
 * Admin dashboard with user list, quests, feedback, skills, and database operations
 */

import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";

type AdminTab = "users" | "quests" | "feedback" | "skills" | "content" | "stats" | "database";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  level?: number;
  totalXp?: number;
  tosAccepted?: boolean;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: string;
  xpReward: number;
  coinReward: number;
  target: number;
  skillId: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Feedback {
  id: string;
  userId: string;
  userEmail?: string;
  type: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

interface SkillDefinition {
  id: string;
  name: string;
  description: string | null;
  color: string;
  maxLevel: number;
  xpScalingBase: number;
  xpScalingMultiplier: number;
  displayOrder: number;
  isActive: boolean;
}

interface AdminClientProps {
  userEmail: string;
}

export function AdminClient({ userEmail }: AdminClientProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [skills, setSkills] = useState<SkillDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuestForm, setShowQuestForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    userId: string;
    userEmail: string;
    confirmText: string;
    error: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    userId: "",
    userEmail: "",
    confirmText: "",
    error: "",
    isDeleting: false,
  });

  // Quest form state
  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    type: "daily",
    xpReward: 25,
    coinReward: 10,
    target: 1,
    skillId: "proficiency",
  });

  // Skill form state
  const [newSkill, setNewSkill] = useState({
    id: "",
    name: "",
    description: "",
    color: "#8b5cf6",
    maxLevel: 10,
    xpScalingBase: 100,
    xpScalingMultiplier: 1.5,
  });

  // Editing skill state
  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null);

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/${activeTab}`);
      if (response.ok) {
        const data = await response.json() as { users?: User[]; quests?: Quest[]; feedback?: Feedback[]; skills?: SkillDefinition[] };
        switch (activeTab) {
          case "users":
            setUsers(data.users || []);
            break;
          case "quests":
            setQuests(data.quests || []);
            break;
          case "feedback":
            setFeedback(data.feedback || []);
            break;
          case "skills":
            setSkills(data.skills || []);
            break;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${activeTab}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open delete confirmation modal
  const openDeleteModal = (userId: string, email: string) => {
    setDeleteModal({
      isOpen: true,
      userId,
      userEmail: email,
      confirmText: "",
      error: "",
      isDeleting: false,
    });
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      userId: "",
      userEmail: "",
      confirmText: "",
      error: "",
      isDeleting: false,
    });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (deleteModal.confirmText !== "DELETE") {
      setDeleteModal((prev) => ({ ...prev, error: "Please type DELETE exactly to confirm" }));
      return;
    }

    setDeleteModal((prev) => ({ ...prev, isDeleting: true, error: "" }));

    try {
      const response = await fetch(`/api/admin/users?userId=${deleteModal.userId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteModal.userId));
        closeDeleteModal();
      } else {
        const data = await response.json() as { error?: string };
        setDeleteModal((prev) => ({
          ...prev,
          isDeleting: false,
          error: data.error || "Failed to delete user"
        }));
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      setDeleteModal((prev) => ({
        ...prev,
        isDeleting: false,
        error: "Network error. Please try again."
      }));
    }
  };

  // Quest actions
  const handleCreateQuest = async () => {
    try {
      const response = await fetch("/api/admin/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuest),
      });
      if (response.ok) {
        setNewQuest({
          title: "",
          description: "",
          type: "daily",
          xpReward: 25,
          coinReward: 10,
          target: 1,
          skillId: "proficiency",
        });
        setShowQuestForm(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create quest:", error);
    }
  };

  const handleToggleQuest = async (questId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/quests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId, isActive: !isActive }),
      });
      if (response.ok) {
        setQuests((prev) => prev.map((q) => (q.id === questId ? { ...q, isActive: !isActive } : q)));
      }
    } catch (error) {
      console.error("Failed to toggle quest:", error);
    }
  };

  // Feedback actions
  const handleUpdateFeedbackStatus = async (feedbackId: string, status: string) => {
    try {
      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId, status }),
      });
      if (response.ok) {
        setFeedback((prev) => prev.map((f) => (f.id === feedbackId ? { ...f, status } : f)));
      }
    } catch (error) {
      console.error("Failed to update feedback:", error);
    }
  };

  // Skill actions
  const handleSaveSkill = async () => {
    try {
      const response = await fetch("/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSkill),
      });
      if (response.ok) {
        setNewSkill({
          id: "",
          name: "",
          description: "",
          color: "#8b5cf6",
          maxLevel: 10,
          xpScalingBase: 100,
          xpScalingMultiplier: 1.5,
        });
        setShowSkillForm(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to save skill:", error);
    }
  };

  const handleUpdateSkill = async () => {
    if (!editingSkill) return;
    try {
      const response = await fetch("/api/admin/skills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSkill.id,
          name: editingSkill.name,
          description: editingSkill.description,
          color: editingSkill.color,
          maxLevel: editingSkill.maxLevel,
          xpScalingBase: editingSkill.xpScalingBase,
          xpScalingMultiplier: editingSkill.xpScalingMultiplier,
          isActive: editingSkill.isActive,
        }),
      });
      if (response.ok) {
        setSkills((prev) =>
          prev.map((s) => (s.id === editingSkill.id ? editingSkill : s))
        );
        setEditingSkill(null);
      }
    } catch (error) {
      console.error("Failed to update skill:", error);
    }
  };

  const handleToggleSkill = async (skillId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/skills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: skillId, isActive: !isActive }),
      });
      if (response.ok) {
        setSkills((prev) =>
          prev.map((s) => (s.id === skillId ? { ...s, isActive: !isActive } : s))
        );
      }
    } catch (error) {
      console.error("Failed to toggle skill:", error);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm(`Are you sure you want to delete the skill "${skillId}"? This cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/skills?id=${skillId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSkills((prev) => prev.filter((s) => s.id !== skillId));
      }
    } catch (error) {
      console.error("Failed to delete skill:", error);
    }
  };


  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Admin Console</h1>
          <p className={styles.subtitle}>Logged in as {userEmail}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(["users", "quests", "feedback", "skills", "content", "stats", "database"] as AdminTab[]).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === "users" && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>All Users ({users.length})</h2>
                <div className={styles.userList}>
                  {users.map((user) => (
                    <div key={user.id} className={styles.userCard}>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{user.name || "No name"}</span>
                        <span className={styles.userEmail}>{user.email}</span>
                        <span className={styles.userMeta}>
                          Level {user.level || 1} - {user.totalXp || 0} XP
                        </span>
                      </div>
                      <div className={styles.userActions}>
                        <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                          {user.role}
                        </span>
                        <button
                          className={styles.deleteButton}
                          onClick={() => openDeleteModal(user.id, user.email)}
                          title="Delete user and all data"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quests Tab */}
            {activeTab === "quests" && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Quest Management</h2>
                  <button
                    className={styles.addButton}
                    onClick={() => setShowQuestForm(!showQuestForm)}
                  >
                    {showQuestForm ? "Cancel" : "+ New Quest"}
                  </button>
                </div>

                {showQuestForm && (
                  <div className={styles.form}>
                    <input
                      type="text"
                      placeholder="Quest Title"
                      value={newQuest.title}
                      onChange={(e) => setNewQuest({ ...newQuest, title: e.target.value })}
                      className={styles.input}
                    />
                    <textarea
                      placeholder="Description"
                      value={newQuest.description}
                      onChange={(e) => setNewQuest({ ...newQuest, description: e.target.value })}
                      className={styles.textarea}
                    />
                    <div className={styles.formRow}>
                      <select
                        value={newQuest.type}
                        onChange={(e) => setNewQuest({ ...newQuest, type: e.target.value })}
                        className={styles.select}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="special">Special</option>
                        <option value="achievement">Achievement</option>
                      </select>
                      <select
                        value={newQuest.skillId}
                        onChange={(e) => setNewQuest({ ...newQuest, skillId: e.target.value })}
                        className={styles.select}
                      >
                        <option value="proficiency">Proficiency</option>
                        <option value="knowledge">Knowledge</option>
                        <option value="guts">Guts</option>
                        <option value="kindness">Kindness</option>
                        <option value="charm">Charm</option>
                      </select>
                    </div>
                    <div className={styles.formRow}>
                      <input
                        type="number"
                        placeholder="XP Reward"
                        value={newQuest.xpReward}
                        onChange={(e) => setNewQuest({ ...newQuest, xpReward: parseInt(e.target.value) || 0 })}
                        className={styles.input}
                      />
                      <input
                        type="number"
                        placeholder="Coin Reward"
                        value={newQuest.coinReward}
                        onChange={(e) => setNewQuest({ ...newQuest, coinReward: parseInt(e.target.value) || 0 })}
                        className={styles.input}
                      />
                      <input
                        type="number"
                        placeholder="Target"
                        value={newQuest.target}
                        onChange={(e) => setNewQuest({ ...newQuest, target: parseInt(e.target.value) || 1 })}
                        className={styles.input}
                      />
                    </div>
                    <button className={styles.submitButton} onClick={handleCreateQuest}>
                      Create Quest
                    </button>
                  </div>
                )}

                <div className={styles.questList}>
                  {quests.map((quest) => (
                    <div key={quest.id} className={`${styles.questCard} ${!quest.isActive ? styles.inactive : ""}`}>
                      <div className={styles.questInfo}>
                        <div className={styles.questHeader}>
                          <span className={styles.questTitle}>{quest.title}</span>
                          <span className={`${styles.questType} ${styles[quest.type]}`}>{quest.type}</span>
                        </div>
                        <p className={styles.questDescription}>{quest.description}</p>
                        <div className={styles.questMeta}>
                          <span>+{quest.xpReward} XP</span>
                          <span>+{quest.coinReward} Coins</span>
                          <span>Target: {quest.target}</span>
                          <span>Skill: {quest.skillId}</span>
                        </div>
                      </div>
                      <button
                        className={quest.isActive ? styles.deactivateButton : styles.activateButton}
                        onClick={() => handleToggleQuest(quest.id, quest.isActive)}
                      >
                        {quest.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Tab */}
            {activeTab === "feedback" && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>User Feedback</h2>
                <div className={styles.feedbackList}>
                  {feedback.length === 0 ? (
                    <p className={styles.emptyState}>No feedback submitted yet.</p>
                  ) : (
                    feedback.map((item) => (
                      <div key={item.id} className={styles.feedbackCard}>
                        <div className={styles.feedbackHeader}>
                          <span className={`${styles.feedbackType} ${styles[item.type]}`}>{item.type}</span>
                          <span className={`${styles.feedbackStatus} ${styles[item.status]}`}>{item.status}</span>
                        </div>
                        <h3 className={styles.feedbackTitle}>{item.title}</h3>
                        <p className={styles.feedbackDescription}>{item.description}</p>
                        <div className={styles.feedbackMeta}>
                          <span>From: {item.userEmail || item.userId}</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.feedbackActions}>
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateFeedbackStatus(item.id, e.target.value)}
                            className={styles.statusSelect}
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === "skills" && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Skill Definitions</h2>
                  <button
                    className={styles.addButton}
                    onClick={() => setShowSkillForm(!showSkillForm)}
                  >
                    {showSkillForm ? "Cancel" : "+ New Skill"}
                  </button>
                </div>

                {showSkillForm && (
                  <div className={styles.form}>
                    <div className={styles.formRow}>
                      <input
                        type="text"
                        placeholder="Skill ID (e.g., wisdom)"
                        value={newSkill.id}
                        onChange={(e) => setNewSkill({ ...newSkill, id: e.target.value })}
                        className={styles.input}
                      />
                      <input
                        type="text"
                        placeholder="Display Name"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Description"
                      value={newSkill.description}
                      onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                      className={styles.input}
                    />
                    <div className={styles.formRow}>
                      <div className={styles.colorInputWrapper}>
                        <label className={styles.inputLabel}>Color</label>
                        <input
                          type="color"
                          value={newSkill.color}
                          onChange={(e) => setNewSkill({ ...newSkill, color: e.target.value })}
                          className={styles.colorInput}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Max Level</label>
                        <input
                          type="number"
                          value={newSkill.maxLevel}
                          onChange={(e) => setNewSkill({ ...newSkill, maxLevel: parseInt(e.target.value) || 10 })}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Base XP</label>
                        <input
                          type="number"
                          value={newSkill.xpScalingBase}
                          onChange={(e) => setNewSkill({ ...newSkill, xpScalingBase: parseInt(e.target.value) || 100 })}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>XP Multiplier</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newSkill.xpScalingMultiplier}
                          onChange={(e) => setNewSkill({ ...newSkill, xpScalingMultiplier: parseFloat(e.target.value) || 1.5 })}
                          className={styles.input}
                        />
                      </div>
                    </div>
                    <button className={styles.submitButton} onClick={handleSaveSkill}>
                      Create Skill
                    </button>
                  </div>
                )}

                {/* Edit Skill Modal */}
                {editingSkill && (
                  <div className={styles.form}>
                    <h3 className={styles.formTitle}>Edit Skill: {editingSkill.id}</h3>
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Display Name</label>
                        <input
                          type="text"
                          value={editingSkill.name}
                          onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.colorInputWrapper}>
                        <label className={styles.inputLabel}>Color</label>
                        <input
                          type="color"
                          value={editingSkill.color}
                          onChange={(e) => setEditingSkill({ ...editingSkill, color: e.target.value })}
                          className={styles.colorInput}
                        />
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>Description</label>
                      <input
                        type="text"
                        value={editingSkill.description || ""}
                        onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Max Level</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editingSkill.maxLevel}
                          onChange={(e) => setEditingSkill({ ...editingSkill, maxLevel: parseInt(e.target.value) || 10 })}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>Base XP (per level)</label>
                        <input
                          type="number"
                          min="1"
                          value={editingSkill.xpScalingBase}
                          onChange={(e) => setEditingSkill({ ...editingSkill, xpScalingBase: parseInt(e.target.value) || 100 })}
                          className={styles.input}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>XP Multiplier</label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          value={editingSkill.xpScalingMultiplier}
                          onChange={(e) => setEditingSkill({ ...editingSkill, xpScalingMultiplier: parseFloat(e.target.value) || 1.5 })}
                          className={styles.input}
                        />
                      </div>
                    </div>
                    <p className={styles.formHint}>
                      XP for level N = Base * Multiplier^(N-1).
                      Example: Level 5 = {editingSkill.xpScalingBase} * {editingSkill.xpScalingMultiplier}^4 = {Math.round(editingSkill.xpScalingBase * Math.pow(editingSkill.xpScalingMultiplier, 4))} XP
                    </p>
                    <div className={styles.formRow}>
                      <button className={styles.submitButton} onClick={handleUpdateSkill}>
                        Save Changes
                      </button>
                      <button className={styles.cancelButton} onClick={() => setEditingSkill(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className={styles.skillList}>
                  {skills.length === 0 ? (
                    <p className={styles.emptyState}>No skills defined yet. Create one above.</p>
                  ) : (
                    skills.map((skill) => (
                      <div
                        key={skill.id}
                        className={`${styles.skillCard} ${!skill.isActive ? styles.inactive : ""}`}
                        style={{ borderLeftColor: skill.color }}
                      >
                        <div className={styles.skillInfo}>
                          <div className={styles.skillHeader}>
                            <span className={styles.skillName} style={{ color: skill.color }}>{skill.name}</span>
                            <span className={styles.skillId}>({skill.id})</span>
                            {!skill.isActive && <span className={styles.inactiveBadge}>Inactive</span>}
                          </div>
                          <p className={styles.skillDescription}>{skill.description || "No description"}</p>
                          <div className={styles.skillMeta}>
                            <span>Max Level: {skill.maxLevel}</span>
                            <span>Base XP: {skill.xpScalingBase}</span>
                            <span>Multiplier: {skill.xpScalingMultiplier}x</span>
                            <span>Order: {skill.displayOrder}</span>
                          </div>
                        </div>
                        <div className={styles.skillActions}>
                          <button
                            className={styles.editButton}
                            onClick={() => setEditingSkill(skill)}
                            title="Edit skill"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            className={skill.isActive ? styles.deactivateButton : styles.activateButton}
                            onClick={() => handleToggleSkill(skill.id, skill.isActive)}
                            title={skill.isActive ? "Deactivate" : "Activate"}
                          >
                            {skill.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteSkill(skill.id)}
                            title="Delete skill"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Content Tab */}
            {activeTab === "content" && (
              <ContentTab />
            )}

            {/* Stats Tab */}
            {activeTab === "stats" && (
              <StatsTab users={users} quests={quests} feedback={feedback} skills={skills} />
            )}

            {/* Database Tab */}
            {activeTab === "database" && (
              <DatabaseTab />
            )}
          </>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className={styles.modalOverlay} onClick={closeDeleteModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete User</h3>
            <p className={styles.modalText}>
              You are about to permanently delete <strong>{deleteModal.userEmail}</strong> and ALL their data.
            </p>
            <p className={styles.modalWarning}>
              This action cannot be undone. All focus sessions, quests, workouts, goals, and other data will be permanently removed.
            </p>
            <div className={styles.modalInputGroup}>
              <label className={styles.modalLabel}>Type DELETE to confirm:</label>
              <input
                type="text"
                value={deleteModal.confirmText}
                onChange={(e) => setDeleteModal((prev) => ({ ...prev, confirmText: e.target.value, error: "" }))}
                className={styles.modalInput}
                placeholder="DELETE"
                autoFocus
              />
              {deleteModal.error && (
                <p className={styles.modalError}>{deleteModal.error}</p>
              )}
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={closeDeleteModal}
                disabled={deleteModal.isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                onClick={handleDeleteConfirm}
                disabled={deleteModal.isDeleting}
              >
                {deleteModal.isDeleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Database Tab Component
 * Backup, restore, and documentation access
 */
function DatabaseTab() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [dbInfo, setDbInfo] = useState<{ currentVersion: number; currentVersionName: string } | null>(null);
  const [restoreResult, setRestoreResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/backup")
      .then((res) => res.json() as Promise<{ currentVersion: number; currentVersionName: string }>)
      .then((data) => setDbInfo(data))
      .catch(console.error);
  }, []);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch("/api/admin/backup", { method: "POST" });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `passion-os-backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to create backup");
      }
    } catch (error) {
      console.error("Backup failed:", error);
      alert("Backup failed");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      alert("Please select a backup file");
      return;
    }

    if (!confirm("This will overwrite existing data. Are you sure?")) {
      return;
    }

    setIsRestoring(true);
    setRestoreResult(null);
    try {
      const text = await restoreFile.text();
      const data = JSON.parse(text);

      const response = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json() as { originalVersion?: number; restoredVersion?: number; error?: string };
      if (response.ok) {
        setRestoreResult(`Restored successfully from v${result.originalVersion} to v${result.restoredVersion}`);
      } else {
        setRestoreResult(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Restore failed:", error);
      setRestoreResult("Restore failed: Invalid backup file");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className={styles.databasePage}>
      {/* Version Card */}
      <div className={styles.dbVersionCard}>
        <div className={styles.dbVersionIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </div>
        <div className={styles.dbVersionInfo}>
          <span className={styles.dbVersionLabel}>Database Version</span>
          <span className={styles.dbVersionValue}>v{dbInfo?.currentVersion || "..."}</span>
          <span className={styles.dbVersionMigration}>{dbInfo?.currentVersionName || "Loading..."}</span>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className={styles.dbActionsGrid}>
        {/* Backup Card */}
        <div className={styles.dbActionCard}>
          <div className={styles.dbActionHeader}>
            <div className={styles.dbActionIcon} style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h3 className={styles.dbActionTitle}>Backup Database</h3>
          </div>
          <p className={styles.dbActionDesc}>
            Download a complete JSON backup of all tables with version metadata for safe migration.
          </p>
          <button
            className={styles.dbBackupButton}
            onClick={handleBackup}
            disabled={isBackingUp}
          >
            {isBackingUp ? "Creating..." : "Download Backup"}
          </button>
        </div>

        {/* Restore Card */}
        <div className={styles.dbActionCard}>
          <div className={styles.dbActionHeader}>
            <div className={styles.dbActionIcon} style={{ background: "rgba(249, 115, 22, 0.1)", color: "#f97316" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className={styles.dbActionTitle}>Restore Database</h3>
          </div>
          <p className={styles.dbActionDesc}>
            Upload a backup file to restore. Older versions are automatically migrated.
          </p>
          <div className={styles.dbRestoreForm}>
            <label className={styles.dbFileLabel}>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                className={styles.dbFileInput}
              />
              <span className={styles.dbFileName}>
                {restoreFile ? restoreFile.name : "Choose backup file..."}
              </span>
            </label>
            <button
              className={styles.dbRestoreButton}
              onClick={handleRestore}
              disabled={isRestoring || !restoreFile}
            >
              {isRestoring ? "Restoring..." : "Restore"}
            </button>
          </div>
          {restoreResult && (
            <p className={restoreResult.startsWith("Error") ? styles.dbResultError : styles.dbResultSuccess}>
              {restoreResult}
            </p>
          )}
        </div>

        {/* Documentation Card */}
        <div className={styles.dbActionCard}>
          <div className={styles.dbActionHeader}>
            <div className={styles.dbActionIcon} style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
            </div>
            <h3 className={styles.dbActionTitle}>Documentation</h3>
          </div>
          <p className={styles.dbActionDesc}>
            View complete database schema, API routes, table definitions, and technical specs.
          </p>
          <a href="/admin/docs" className={styles.dbDocsLink}>
            View Technical Docs
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Content Tab Component
 * Manage seeded content: lessons, templates, glossary, etc.
 */
interface ContentItem {
  id: string;
  [key: string]: unknown;
}

function ContentTab() {
  const [contentType, setContentType] = useState("lessons");
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const contentTypes = [
    { key: "lessons", label: "Learn Lessons" },
    { key: "drills", label: "Ear Training Drills" },
    { key: "topics", label: "Learn Topics" },
    { key: "templates", label: "Plan Templates" },
    { key: "recipes", label: "Production Recipes" },
    { key: "glossary", label: "Glossary Terms" },
    { key: "shortcuts", label: "DAW Shortcuts" },
    { key: "ignitions", label: "Ignition Packs" },
    { key: "market", label: "Market Items" },
    { key: "achievements", label: "Achievements" },
    { key: "infobase", label: "Infobase (Public)" },
  ];

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/content?type=${contentType}`);
        const json: Record<string, ContentItem[]> = await res.json();
        setContent(json[contentType] || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [contentType]);

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Content Management</h2>

      {/* Content Type Selector */}
      <div className={styles.contentTypeSelector}>
        {contentTypes.map((ct) => (
          <button
            key={ct.key}
            className={`${styles.contentTypeButton} ${contentType === ct.key ? styles.active : ""}`}
            onClick={() => setContentType(ct.key)}
          >
            {ct.label}
          </button>
        ))}
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className={styles.loading}>Loading...</div>
      ) : (
        <div className={styles.contentList}>
          <div className={styles.contentHeader}>
            <span className={styles.contentCount}>{content.length} items</span>
          </div>
          {content.length === 0 ? (
            <p className={styles.emptyState}>No {contentType} found.</p>
          ) : (
            <div className={styles.contentGrid}>
              {content.map((item) => (
                <div key={item.id} className={styles.contentCard}>
                  <div className={styles.contentCardHeader}>
                    <span className={styles.contentId}>{item.id}</span>
                  </div>
                  <div className={styles.contentCardBody}>
                    {Object.entries(item)
                      .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key} className={styles.contentField}>
                          <span className={styles.contentFieldLabel}>{key}:</span>
                          <span className={styles.contentFieldValue}>
                            {typeof value === "string" && value.length > 50
                              ? value.substring(0, 50) + "..."
                              : String(value ?? "-")}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Stats Tab Component
 * Enhanced platform statistics
 */
interface StatsData {
  users?: { total_users: number; tos_accepted: number; admins: number; active_7d: number; active_30d: number };
  content?: { exercises: number; learn_topics: number; learn_lessons: number; learn_drills: number; universal_quests: number; user_quests: number; ignition_packs: number; market_items: number; plan_templates: number; infobase_public: number; glossary_terms: number; daw_shortcuts: number; recipe_templates: number };
  activity?: { total_focus_sessions: number; completed_focus: number; total_focus_minutes: number; total_events: number; events_24h: number; habit_completions: number; total_goals: number; total_ideas: number; total_books: number; reference_tracks: number };
  gamification?: { total_coins_distributed: number; total_xp_distributed: number; achievements_earned: number; total_purchases: number; ledger_entries: number };
  onboarding?: { status: string; count: number }[];
}

interface StatsTabProps {
  users: User[];
  quests: Quest[];
  feedback: Feedback[];
  skills: SkillDefinition[];
}

function StatsTab({ users, quests, feedback, skills }: StatsTabProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json() as StatsData;
        setStats(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className={styles.loading}>Loading statistics...</div>;
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Platform Statistics</h2>

      {/* Quick Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.users?.total_users || users.length}</span>
          <span className={styles.statLabel}>Total Users</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.users?.active_7d || 0}</span>
          <span className={styles.statLabel}>Active (7d)</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{quests.filter((q) => q.isActive).length}</span>
          <span className={styles.statLabel}>Active Quests</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{skills.filter((s) => s.isActive).length}</span>
          <span className={styles.statLabel}>Active Skills</span>
        </div>
      </div>

      {/* Content Stats */}
      <h3 className={styles.statsSubtitle}>Content</h3>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.content?.exercises || 0}</span>
          <span className={styles.statLabel}>Exercises</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.content?.learn_lessons || 0}</span>
          <span className={styles.statLabel}>Lessons</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.content?.learn_drills || 0}</span>
          <span className={styles.statLabel}>Drills</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.content?.universal_quests || 0}</span>
          <span className={styles.statLabel}>Universal Quests</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.content?.ignition_packs || 0}</span>
          <span className={styles.statLabel}>Ignition Packs</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.content?.market_items || 0}</span>
          <span className={styles.statLabel}>Market Items</span>
        </div>
      </div>

      {/* Activity Stats */}
      <h3 className={styles.statsSubtitle}>Activity</h3>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.activity?.completed_focus || 0}</span>
          <span className={styles.statLabel}>Focus Sessions</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{Math.round(stats?.activity?.total_focus_minutes || 0)}</span>
          <span className={styles.statLabel}>Focus Minutes</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.activity?.events_24h || 0}</span>
          <span className={styles.statLabel}>Events (24h)</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.activity?.total_ideas || 0}</span>
          <span className={styles.statLabel}>Ideas</span>
        </div>
      </div>

      {/* Gamification Stats */}
      <h3 className={styles.statsSubtitle}>Gamification</h3>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.gamification?.total_coins_distributed || 0}</span>
          <span className={styles.statLabel}>Coins Distributed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.gamification?.total_xp_distributed || 0}</span>
          <span className={styles.statLabel}>XP Distributed</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.gamification?.achievements_earned || 0}</span>
          <span className={styles.statLabel}>Achievements Earned</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats?.gamification?.total_purchases || 0}</span>
          <span className={styles.statLabel}>Market Purchases</span>
        </div>
      </div>

      {/* Onboarding Stats */}
      {stats?.onboarding && stats.onboarding.length > 0 && (
        <>
          <h3 className={styles.statsSubtitle}>Onboarding</h3>
          <div className={styles.statsGrid}>
            {stats.onboarding.map((ob) => (
              <div key={ob.status} className={styles.statCard}>
                <span className={styles.statValue}>{ob.count}</span>
                <span className={styles.statLabel}>{ob.status}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Feedback Stats */}
      <h3 className={styles.statsSubtitle}>Feedback</h3>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{feedback.filter((f) => f.status === "open").length}</span>
          <span className={styles.statLabel}>Open</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{feedback.filter((f) => f.status === "in_progress").length}</span>
          <span className={styles.statLabel}>In Progress</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{feedback.filter((f) => f.status === "resolved").length}</span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{feedback.length}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
      </div>
    </div>
  );
}

