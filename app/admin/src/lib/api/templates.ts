/**
 * Admin Templates API Client
 * API client for listening prompt templates CRUD operations
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Types
export interface ListeningPromptTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  prompt_text: string;
  hints: string[];
  expected_observations: string[];
  tags: string[];
  display_order: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ListeningPromptPreset {
  id: string;
  name: string;
  description?: string;
  template_id?: string;
  preset_type: PresetType;
  config: Record<string, unknown>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateWithPresets extends ListeningPromptTemplate {
  presets: ListeningPromptPreset[];
}

export type TemplateCategory =
  | "general"
  | "frequency"
  | "dynamics"
  | "spatial"
  | "arrangement"
  | "production"
  | "mixing"
  | "mastering"
  | "genre_specific";

export type TemplateDifficulty = "beginner" | "intermediate" | "advanced" | "expert";

export type PresetType = "focus" | "comparison" | "loop" | "visualization";

export interface CreateTemplateInput {
  name: string;
  description?: string;
  category?: TemplateCategory;
  difficulty?: TemplateDifficulty;
  prompt_text: string;
  hints?: string[];
  expected_observations?: string[];
  tags?: string[];
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: TemplateCategory;
  difficulty?: TemplateDifficulty;
  prompt_text?: string;
  hints?: string[];
  expected_observations?: string[];
  tags?: string[];
  display_order?: number;
  is_active?: boolean;
}

export interface CreatePresetInput {
  name: string;
  description?: string;
  preset_type?: PresetType;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface UpdatePresetInput {
  name?: string;
  description?: string;
  template_id?: string | null;
  preset_type?: PresetType;
  config?: Record<string, unknown>;
  is_active?: boolean;
}

export interface TemplateListOptions {
  category?: TemplateCategory;
  difficulty?: TemplateDifficulty;
  active_only?: boolean;
  page?: number;
  page_size?: number;
}

export interface TemplateListResponse {
  templates: ListeningPromptTemplate[];
  total: number;
  page: number;
  page_size: number;
}

// API Client
class TemplatesApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE}/admin/templates`;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Template operations
  async listTemplates(options: TemplateListOptions = {}): Promise<TemplateListResponse> {
    const params = new URLSearchParams();
    if (options.category) params.set("category", options.category);
    if (options.difficulty) params.set("difficulty", options.difficulty);
    if (options.active_only !== undefined) params.set("active_only", String(options.active_only));
    if (options.page) params.set("page", String(options.page));
    if (options.page_size) params.set("page_size", String(options.page_size));

    const query = params.toString();
    return this.request<TemplateListResponse>(query ? `?${query}` : "");
  }

  async getTemplate(id: string): Promise<{ template: TemplateWithPresets }> {
    return this.request<{ template: TemplateWithPresets }>(`/${id}`);
  }

  async createTemplate(input: CreateTemplateInput): Promise<{ template: ListeningPromptTemplate }> {
    return this.request<{ template: ListeningPromptTemplate }>("", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateTemplate(id: string, input: UpdateTemplateInput): Promise<{ template: ListeningPromptTemplate }> {
    return this.request<{ template: ListeningPromptTemplate }>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async deleteTemplate(id: string): Promise<{ deleted: boolean; message: string }> {
    return this.request<{ deleted: boolean; message: string }>(`/${id}`, {
      method: "DELETE",
    });
  }

  // Preset operations
  async listPresets(templateId: string): Promise<{ presets: ListeningPromptPreset[] }> {
    return this.request<{ presets: ListeningPromptPreset[] }>(`/${templateId}/presets`);
  }

  async createPreset(templateId: string, input: CreatePresetInput): Promise<{ preset: ListeningPromptPreset }> {
    return this.request<{ preset: ListeningPromptPreset }>(`/${templateId}/presets`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async getPreset(id: string): Promise<{ preset: ListeningPromptPreset }> {
    return this.request<{ preset: ListeningPromptPreset }>(`/presets/${id}`);
  }

  async updatePreset(id: string, input: UpdatePresetInput): Promise<{ preset: ListeningPromptPreset }> {
    return this.request<{ preset: ListeningPromptPreset }>(`/presets/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async deletePreset(id: string): Promise<{ deleted: boolean; message: string }> {
    return this.request<{ deleted: boolean; message: string }>(`/presets/${id}`, {
      method: "DELETE",
    });
  }
}

export const templatesApi = new TemplatesApiClient();

// Export constants for UI
export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "frequency", label: "Frequency" },
  { value: "dynamics", label: "Dynamics" },
  { value: "spatial", label: "Spatial" },
  { value: "arrangement", label: "Arrangement" },
  { value: "production", label: "Production" },
  { value: "mixing", label: "Mixing" },
  { value: "mastering", label: "Mastering" },
  { value: "genre_specific", label: "Genre Specific" },
];

export const TEMPLATE_DIFFICULTIES: { value: TemplateDifficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export const PRESET_TYPES: { value: PresetType; label: string }[] = [
  { value: "focus", label: "Focus" },
  { value: "comparison", label: "Comparison" },
  { value: "loop", label: "Loop" },
  { value: "visualization", label: "Visualization" },
];

