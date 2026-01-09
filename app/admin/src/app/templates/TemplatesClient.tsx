"use client";

/**
 * Templates Admin Page Client Component
 * Admin CRUD interface for listening prompt templates
 */

import { useState, useEffect, useCallback } from "react";
import {
  templatesApi,
  ListeningPromptTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateCategory,
  TemplateDifficulty,
  TEMPLATE_CATEGORIES,
  TEMPLATE_DIFFICULTIES,
} from "../../lib/api/templates";
import styles from "./templates.module.css";

interface TemplatesClientProps {
  userEmail: string;
}

export function TemplatesClient({ userEmail }: TemplatesClientProps) {
  const [templates, setTemplates] = useState<ListeningPromptTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ListeningPromptTemplate | null>(null);

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | "">("");
  const [difficultyFilter, setDifficultyFilter] = useState<TemplateDifficulty | "">("");
  const [activeOnly, setActiveOnly] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateTemplateInput>({
    name: "",
    description: "",
    category: "general",
    difficulty: "beginner",
    prompt_text: "",
    hints: [],
    expected_observations: [],
    tags: [],
    display_order: 0,
    is_active: true,
  });

  // Load templates
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await templatesApi.listTemplates({
        category: categoryFilter || undefined,
        difficulty: difficultyFilter || undefined,
        active_only: activeOnly || undefined,
      });
      setTemplates(response.templates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, difficultyFilter, activeOnly]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "general",
      difficulty: "beginner",
      prompt_text: "",
      hints: [],
      expected_observations: [],
      tags: [],
      display_order: 0,
      is_active: true,
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  // Open form for editing
  const openEditForm = (template: ListeningPromptTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      category: template.category,
      difficulty: template.difficulty,
      prompt_text: template.prompt_text,
      hints: template.hints,
      expected_observations: template.expected_observations,
      tags: template.tags,
      display_order: template.display_order,
      is_active: template.is_active,
    });
    setShowForm(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingTemplate) {
        const updateInput: UpdateTemplateInput = {
          name: formData.name,
          description: formData.description || undefined,
          category: formData.category,
          difficulty: formData.difficulty,
          prompt_text: formData.prompt_text,
          hints: formData.hints,
          expected_observations: formData.expected_observations,
          tags: formData.tags,
          display_order: formData.display_order,
          is_active: formData.is_active,
        };
        await templatesApi.updateTemplate(editingTemplate.id, updateInput);
      } else {
        await templatesApi.createTemplate(formData);
      }
      resetForm();
      loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await templatesApi.deleteTemplate(id);
      loadTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete template");
    }
  };

  // Handle array field change (hints, observations, tags)
  const handleArrayFieldChange = (
    field: "hints" | "expected_observations" | "tags",
    value: string
  ) => {
    const items = value
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setFormData((prev) => ({ ...prev, [field]: items }));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Listening Prompt Templates</h1>
        <p className={styles.subtitle}>
          Admin-curated templates for critical listening exercises
        </p>
        <p className={styles.userInfo}>Logged in as: {userEmail}</p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {/* Filters */}
      <div className={styles.filters}>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as TemplateCategory | "")}
          className={styles.filterSelect}
        >
          <option value="">All Categories</option>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as TemplateDifficulty | "")}
          className={styles.filterSelect}
        >
          <option value="">All Difficulties</option>
          {TEMPLATE_DIFFICULTIES.map((diff) => (
            <option key={diff.value} value={diff.value}>
              {diff.label}
            </option>
          ))}
        </select>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Active only
        </label>

        <button onClick={() => setShowForm(true)} className={styles.addButton}>
          + Add Template
        </button>
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{editingTemplate ? "Edit Template" : "Create Template"}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <label>
                  Name *
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className={styles.input}
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label>
                  Description
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className={styles.textarea}
                    rows={2}
                  />
                </label>
              </div>

              <div className={styles.formRowGrid}>
                <label>
                  Category
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value as TemplateCategory,
                      }))
                    }
                    className={styles.select}
                  >
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Difficulty
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        difficulty: e.target.value as TemplateDifficulty,
                      }))
                    }
                    className={styles.select}
                  >
                    {TEMPLATE_DIFFICULTIES.map((diff) => (
                      <option key={diff.value} value={diff.value}>
                        {diff.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Display Order
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        display_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className={styles.input}
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label>
                  Prompt Text *
                  <textarea
                    value={formData.prompt_text}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, prompt_text: e.target.value }))
                    }
                    required
                    className={styles.textarea}
                    rows={4}
                    placeholder="What should the user listen for?"
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label>
                  Hints (one per line)
                  <textarea
                    value={formData.hints?.join("\n") || ""}
                    onChange={(e) => handleArrayFieldChange("hints", e.target.value)}
                    className={styles.textarea}
                    rows={3}
                    placeholder="Guidance for what to focus on..."
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label>
                  Expected Observations (one per line)
                  <textarea
                    value={formData.expected_observations?.join("\n") || ""}
                    onChange={(e) =>
                      handleArrayFieldChange("expected_observations", e.target.value)
                    }
                    className={styles.textarea}
                    rows={3}
                    placeholder="What users should typically notice..."
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label>
                  Tags (one per line)
                  <textarea
                    value={formData.tags?.join("\n") || ""}
                    onChange={(e) => handleArrayFieldChange("tags", e.target.value)}
                    className={styles.textarea}
                    rows={2}
                    placeholder="mixing, bass, EQ..."
                  />
                </label>
              </div>

              <div className={styles.formRow}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                  />
                  Active
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={resetForm} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {editingTemplate ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Templates List */}
      {isLoading ? (
        <div className={styles.loading}>Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className={styles.empty}>
          No templates found. Click &quot;Add Template&quot; to create one.
        </div>
      ) : (
        <div className={styles.templatesList}>
          {templates.map((template) => (
            <div key={template.id} className={styles.templateCard}>
              <div className={styles.templateHeader}>
                <h3 className={styles.templateName}>{template.name}</h3>
                <div className={styles.templateBadges}>
                  <span className={styles.categoryBadge}>{template.category}</span>
                  <span className={styles.difficultyBadge}>{template.difficulty}</span>
                  {!template.is_active && (
                    <span className={styles.inactiveBadge}>Inactive</span>
                  )}
                </div>
              </div>

              {template.description && (
                <p className={styles.templateDescription}>{template.description}</p>
              )}

              <div className={styles.templatePrompt}>
                <strong>Prompt:</strong> {template.prompt_text}
              </div>

              {template.hints.length > 0 && (
                <div className={styles.templateHints}>
                  <strong>Hints:</strong>
                  <ul>
                    {template.hints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}

              {template.tags.length > 0 && (
                <div className={styles.templateTags}>
                  {template.tags.map((tag, i) => (
                    <span key={i} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.templateActions}>
                <button
                  onClick={() => openEditForm(template)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

