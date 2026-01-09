/**
 * Auth.js API route handler
 * Handles OAuth callbacks and session management
 */

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Force dynamic rendering for auth routes
export const dynamic = "force-dynamic";

