/**
 * Admin API Client
 * API client for admin operations (users, stats, quests, skills, feedback)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ============================================
// User Types
// ============================================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: string;
  approved: boolean;
  tos_accepted: boolean;
  last_activity_at?: string;
  created_at: string;
}

export interface AdminUserWithStats extends AdminUser {
  level?: number;
  total_xp?: number;
}

export interface AdminUsersResponse {
  users: AdminUserWithStats[];
  total: number;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
  tables_cleaned: number;
}

// ============================================
// Stats Types
// ============================================

export interface UserStats {
  total_users: number;
  tos_accepted: number;
  admins: number;
  active_7d: number;
  active_30d: number;
}

export interface ContentStats {
  exercises: number;
  learn_topics: number;
  learn_lessons: number;
  learn_drills: number;
  universal_quests: number;
  user_quests: number;
  market_items: number;
}

export interface ActivityStats {
  total_focus_sessions: number;
  completed_focus: number;
  total_focus_minutes: number;
  total_events: number;
  events_24h: number;
  habit_completions: number;
  total_goals: number;
  total_ideas: number;
  total_books: number;
  reference_tracks: number;
}

export interface GamificationStats {
  total_coins_distributed: number;
  total_xp_distributed: number;
  achievements_earned: number;
  total_purchases: number;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_activity_at?: string;
}

export interface RecentEvent {
  user_id: string;
  user_name?: string;
  event_type: string;
  created_at: string;
}

export interface AdminStatsResponse {
  users: UserStats;
  content: ContentStats;
  activity: ActivityStats;
  gamification: GamificationStats;
  recent_users: RecentUser[];
  recent_events: RecentEvent[];
}

// ============================================
// Feedback Types
// ============================================

export interface AdminFeedback {
  id: string;
  user_id: string;
  user_email?: string;
  feedback_type: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  admin_response?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface UpdateFeedbackInput {
  status?: string;
  priority?: string;
  admin_response?: string;
}

export interface AdminFeedbackResponse {
  feedback: AdminFeedback[];
}

// ============================================
// Quest Types
// ============================================

export interface AdminQuest {
  id: string;
  title: string;
  description?: string;
  quest_type: string;
  xp_reward: number;
  coin_reward: number;
  target: number;
  skill_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateQuestInput {
  title: string;
  description?: string;
  quest_type?: string;
  xp_reward?: number;
  coin_reward?: number;
  target?: number;
  skill_id?: string;
}

export interface UpdateQuestInput {
  title?: string;
  description?: string;
  quest_type?: string;
  xp_reward?: number;
  coin_reward?: number;
  target?: number;
  is_active?: boolean;
}

export interface AdminQuestsResponse {
  quests: AdminQuest[];
}

// ============================================
// Skill Types
// ============================================

export interface AdminSkill {
  id: string;
  name: string;
  description?: string;
  color: string;
  max_level: number;
  xp_scaling_base: number;
  xp_scaling_multiplier: number;
  display_order: number;
  is_active: boolean;
}

export interface CreateSkillInput {
  id: string;
  name: string;
  description?: string;
  color?: string;
  max_level?: number;
  xp_scaling_base?: number;
  xp_scaling_multiplier?: number;
}

export interface UpdateSkillInput {
  name?: string;
  description?: string;
  color?: string;
  max_level?: number;
  xp_scaling_base?: number;
  xp_scaling_multiplier?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface AdminSkillsResponse {
  skills: AdminSkill[];
}

// ============================================
// DB Health Types
// ============================================

export interface TableInfo {
  name: string;
  row_count: number;
}

export interface DbHealthResponse {
  status: string;
  tables: TableInfo[];
  total_size_estimate: string;
}

// ============================================
// Admin Info
// ============================================

export interface AdminInfo {
  version: string;
  modules: string[];
  role_required: string;
}

// ============================================
// API Functions
// ============================================

/** Get admin info */
export async function getAdminInfo(): Promise<AdminInfo> {
  const res = await fetch(`${API_BASE}/admin`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Admin info failed: ${res.status}`);
  return res.json() as Promise<AdminInfo>;
}

// ============================================
// User Management
// ============================================

/** List all users */
export async function listUsers(): Promise<AdminUsersResponse> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`List users failed: ${res.status}`);
  return res.json() as Promise<AdminUsersResponse>;
}

/** Get a single user */
export async function getUser(userId: string): Promise<AdminUserWithStats> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Get user failed: ${res.status}`);
  return res.json() as Promise<AdminUserWithStats>;
}

/** Delete a user and all their data */
export async function deleteUser(userId: string): Promise<DeleteUserResponse> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Delete user failed: ${res.status}`);
  return res.json() as Promise<DeleteUserResponse>;
}

// ============================================
// Statistics
// ============================================

/** Get platform statistics */
export async function getStats(): Promise<AdminStatsResponse> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Get stats failed: ${res.status}`);
  return res.json() as Promise<AdminStatsResponse>;
}

// ============================================
// Feedback Management
// ============================================

/** List all feedback */
export async function listFeedback(): Promise<AdminFeedbackResponse> {
  const res = await fetch(`${API_BASE}/admin/feedback`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`List feedback failed: ${res.status}`);
  return res.json() as Promise<AdminFeedbackResponse>;
}

/** Update feedback status/response */
export async function updateFeedback(
  feedbackId: string,
  input: UpdateFeedbackInput
): Promise<AdminFeedback> {
  const res = await fetch(`${API_BASE}/admin/feedback/${feedbackId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Update feedback failed: ${res.status}`);
  return res.json() as Promise<AdminFeedback>;
}

// ============================================
// Quest Management
// ============================================

/** List all universal quests */
export async function listQuests(): Promise<AdminQuestsResponse> {
  const res = await fetch(`${API_BASE}/admin/quests`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`List quests failed: ${res.status}`);
  return res.json() as Promise<AdminQuestsResponse>;
}

/** Get a single quest */
export async function getQuest(questId: string): Promise<AdminQuest> {
  const res = await fetch(`${API_BASE}/admin/quests/${questId}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Get quest failed: ${res.status}`);
  return res.json() as Promise<AdminQuest>;
}

/** Create a universal quest */
export async function createQuest(input: CreateQuestInput): Promise<AdminQuest> {
  const res = await fetch(`${API_BASE}/admin/quests`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Create quest failed: ${res.status}`);
  return res.json() as Promise<AdminQuest>;
}

/** Update a quest */
export async function updateQuest(
  questId: string,
  input: UpdateQuestInput
): Promise<AdminQuest> {
  const res = await fetch(`${API_BASE}/admin/quests/${questId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Update quest failed: ${res.status}`);
  return res.json() as Promise<AdminQuest>;
}

/** Delete a quest */
export async function deleteQuest(
  questId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/quests/${questId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Delete quest failed: ${res.status}`);
  return res.json() as Promise<{ success: boolean; message: string }>;
}

// ============================================
// Skill Management
// ============================================

/** List all skill definitions */
export async function listSkills(): Promise<AdminSkillsResponse> {
  const res = await fetch(`${API_BASE}/admin/skills`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`List skills failed: ${res.status}`);
  return res.json() as Promise<AdminSkillsResponse>;
}

/** Get a single skill */
export async function getSkill(skillId: string): Promise<AdminSkill> {
  const res = await fetch(`${API_BASE}/admin/skills/${skillId}`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Get skill failed: ${res.status}`);
  return res.json() as Promise<AdminSkill>;
}

/** Create or update a skill */
export async function createSkill(input: CreateSkillInput): Promise<AdminSkill> {
  const res = await fetch(`${API_BASE}/admin/skills`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Create skill failed: ${res.status}`);
  return res.json() as Promise<AdminSkill>;
}

/** Update a skill */
export async function updateSkill(
  skillId: string,
  input: UpdateSkillInput
): Promise<AdminSkill> {
  const res = await fetch(`${API_BASE}/admin/skills/${skillId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Update skill failed: ${res.status}`);
  return res.json() as Promise<AdminSkill>;
}

/** Delete a skill */
export async function deleteSkill(
  skillId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/admin/skills/${skillId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Delete skill failed: ${res.status}`);
  return res.json() as Promise<{ success: boolean; message: string }>;
}

// ============================================
// Database Health
// ============================================

/** Get database health status */
export async function getDbHealth(): Promise<DbHealthResponse> {
  const res = await fetch(`${API_BASE}/admin/db-health`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Get DB health failed: ${res.status}`);
  return res.json() as Promise<DbHealthResponse>;
}

// ============================================
// Audit Log Types
// ============================================

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  user_email?: string;
  event_type: string;
  resource_type?: string;
  resource_id?: string;
  action: string;
  status: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface AuditLogQuery {
  event_type?: string;
  user_id?: string;
  resource_type?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  total: number;
}

// ============================================
// Audit Log Functions
// ============================================

/** List audit log entries with optional filters */
export async function listAuditEntries(
  query?: AuditLogQuery
): Promise<AuditLogResponse> {
  const params = new URLSearchParams();
  if (query?.event_type) params.set("event_type", query.event_type);
  if (query?.user_id) params.set("user_id", query.user_id);
  if (query?.resource_type) params.set("resource_type", query.resource_type);
  if (query?.status) params.set("status", query.status);
  if (query?.limit) params.set("limit", String(query.limit));
  if (query?.offset) params.set("offset", String(query.offset));

  const url = `${API_BASE}/admin/audit${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`List audit entries failed: ${res.status}`);
  return res.json() as Promise<AuditLogResponse>;
}

/** Get distinct event types for filter dropdown */
export async function getAuditEventTypes(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/admin/audit/event-types`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Get event types failed: ${res.status}`);
  return res.json() as Promise<string[]>;
}
