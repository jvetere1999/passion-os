/**
 * API Endpoints Registry
 * Centralized list of all endpoints available for testing in the admin console
 */

export interface ApiEndpoint {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  requiresAuth: boolean;
  params?: {
    name: string;
    type: "string" | "uuid" | "number" | "date";
    required: boolean;
    example: string;
  }[];
  body?: {
    name: string;
    type: string;
    required: boolean;
    example: string | Record<string, unknown>;
  }[];
}

export const API_ENDPOINTS: ApiEndpoint[] = [
  // Auth endpoints
  {
    id: "auth-me",
    name: "Get Current User",
    method: "GET",
    path: "/api/auth/me",
    description: "Get currently authenticated user profile",
    requiresAuth: true,
  },
  {
    id: "auth-logout",
    name: "Logout",
    method: "POST",
    path: "/api/auth/logout",
    description: "Logout current user and clear session",
    requiresAuth: true,
  },

  // User endpoints
  {
    id: "user-get",
    name: "Get User Profile",
    method: "GET",
    path: "/api/user",
    description: "Get user profile with stats",
    requiresAuth: true,
  },
  {
    id: "user-settings-get",
    name: "Get User Settings",
    method: "GET",
    path: "/api/user/settings",
    description: "Get user preferences and settings",
    requiresAuth: true,
  },
  {
    id: "user-settings-update",
    name: "Update User Settings",
    method: "PUT",
    path: "/api/user/settings",
    description: "Update user preferences",
    requiresAuth: true,
    body: [
      {
        name: "theme",
        type: "string",
        required: false,
        example: "dark",
      },
      {
        name: "notifications_enabled",
        type: "boolean",
        required: false,
        example: "true",
      },
    ],
  },

  // Sync endpoint
  {
    id: "sync",
    name: "Sync Data",
    method: "GET",
    path: "/api/sync",
    description: "Poll for user data updates (badges, habits, focus, plans)",
    requiresAuth: true,
    params: [
      {
        name: "version",
        type: "string",
        required: false,
        example: "2.0.0",
      },
    ],
  },

  // Daily dashboard
  {
    id: "today",
    name: "Get Today Dashboard",
    method: "GET",
    path: "/api/today",
    description: "Get today's dashboard with habits, plans, focus, and quick picks",
    requiresAuth: true,
  },

  // Habits endpoints
  {
    id: "habits-list",
    name: "List Habits",
    method: "GET",
    path: "/api/habits",
    description: "Get all user habits",
    requiresAuth: true,
  },
  {
    id: "habits-create",
    name: "Create Habit",
    method: "POST",
    path: "/api/habits",
    description: "Create a new habit",
    requiresAuth: true,
    body: [
      {
        name: "title",
        type: "string",
        required: true,
        example: "Morning meditation",
      },
      {
        name: "description",
        type: "string",
        required: false,
        example: "10 minutes of meditation",
      },
      {
        name: "goal_frequency",
        type: "number",
        required: true,
        example: "7",
      },
    ],
  },
  {
    id: "habits-complete",
    name: "Complete Habit",
    method: "POST",
    path: "/api/habits/:id/complete",
    description: "Mark a habit as completed",
    requiresAuth: true,
    params: [
      {
        name: "id",
        type: "uuid",
        required: true,
        example: "550e8400-e29b-41d4-a716-446655440000",
      },
    ],
  },

  // Plans endpoints
  {
    id: "plans-list",
    name: "List Daily Plans",
    method: "GET",
    path: "/api/plans",
    description: "Get all daily plans for current user",
    requiresAuth: true,
  },
  {
    id: "plans-create",
    name: "Create Daily Plan",
    method: "POST",
    path: "/api/plans",
    description: "Create a new daily plan",
    requiresAuth: true,
    body: [
      {
        name: "title",
        type: "string",
        required: true,
        example: "Weekly review",
      },
      {
        name: "description",
        type: "string",
        required: false,
        example: "Review progress and plan week",
      },
    ],
  },

  // Focus endpoints
  {
    id: "focus-active",
    name: "Get Active Focus Session",
    method: "GET",
    path: "/api/focus",
    description: "Get current active focus session if any",
    requiresAuth: true,
  },
  {
    id: "focus-start",
    name: "Start Focus Session",
    method: "POST",
    path: "/api/focus",
    description: "Start a new focus session",
    requiresAuth: true,
    body: [
      {
        name: "duration_minutes",
        type: "number",
        required: true,
        example: "25",
      },
      {
        name: "goal",
        type: "string",
        required: false,
        example: "Complete project proposal",
      },
    ],
  },
  {
    id: "focus-stop",
    name: "Stop Focus Session",
    method: "POST",
    path: "/api/focus/stop",
    description: "Stop current focus session",
    requiresAuth: true,
  },

  // Gamification endpoints
  {
    id: "gamification-progress",
    name: "Get Gamification Progress",
    method: "GET",
    path: "/api/gamification/progress",
    description: "Get XP, coins, level, and streaks",
    requiresAuth: true,
  },
  {
    id: "gamification-badges",
    name: "List Badges",
    method: "GET",
    path: "/api/gamification/badges",
    description: "Get user badges and achievements",
    requiresAuth: true,
  },

  // Admin endpoints
  {
    id: "admin-users",
    name: "List Users (Admin)",
    method: "GET",
    path: "/api/admin/users",
    description: "Get list of all users (admin only)",
    requiresAuth: true,
    params: [
      {
        name: "limit",
        type: "number",
        required: false,
        example: "50",
      },
      {
        name: "offset",
        type: "number",
        required: false,
        example: "0",
      },
    ],
  },
  {
    id: "admin-user-detail",
    name: "Get User Details (Admin)",
    method: "GET",
    path: "/api/admin/users/:id",
    description: "Get detailed user information (admin only)",
    requiresAuth: true,
    params: [
      {
        name: "id",
        type: "uuid",
        required: true,
        example: "550e8400-e29b-41d4-a716-446655440000",
      },
    ],
  },
];

export function getEndpointById(id: string): ApiEndpoint | undefined {
  return API_ENDPOINTS.find((ep) => ep.id === id);
}

export function groupEndpointsByModule(): Record<string, ApiEndpoint[]> {
  const groups: Record<string, ApiEndpoint[]> = {};

  API_ENDPOINTS.forEach((ep) => {
    const moduleName = ep.path.split("/")[2] || "other"; // Extract module from path
    if (!groups[moduleName]) {
      groups[moduleName] = [];
    }
    groups[moduleName].push(ep);
  });

  return groups;
}
