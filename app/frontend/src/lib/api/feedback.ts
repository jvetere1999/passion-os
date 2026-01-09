/**
 * Feedback API
 *
 * API client methods for user feedback submissions.
 * All calls go through the backend at api.ecent.online.
 *
 * Wave 4: Feedback routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost } from './client';

// ============================================
// Types
// ============================================

export interface Feedback {
  id: string;
  feedback_type: 'bug' | 'feature' | 'other';
  title: string;
  description: string;
  status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  admin_response: string | null;
  created_at: string;
}

export interface CreateFeedbackRequest {
  type: 'bug' | 'feature' | 'other';
  title: string;
  description: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface FeedbackListResponse {
  data: {
    feedback: Feedback[];
  };
}

interface FeedbackResponse {
  data: Feedback;
}

// ============================================
// API Functions
// ============================================

/**
 * List all feedback submissions for the current user
 */
export async function getFeedback(): Promise<Feedback[]> {
  const response = await apiGet<FeedbackListResponse>('/api/feedback');
  return response.data.feedback;
}

/**
 * Submit new feedback
 */
export async function submitFeedback(
  feedback: CreateFeedbackRequest
): Promise<Feedback> {
  const response = await apiPost<FeedbackResponse>('/api/feedback', feedback);
  return response.data;
}

/**
 * Submit a bug report
 */
export async function submitBugReport(
  title: string,
  description: string,
  priority?: 'low' | 'normal' | 'high' | 'urgent'
): Promise<Feedback> {
  return submitFeedback({
    type: 'bug',
    title,
    description,
    priority,
  });
}

/**
 * Submit a feature request
 */
export async function submitFeatureRequest(
  title: string,
  description: string
): Promise<Feedback> {
  return submitFeedback({
    type: 'feature',
    title,
    description,
  });
}
