/**
 * OnboardingProvider - Server component that checks onboarding state
 * and renders the OnboardingModal client component
 *
 * Architecture (backend-first):
 * - Session from backend via auth()
 * - Onboarding state fetched from backend API
 * - OnboardingModal handles client-side interactions
 *
 * TODO: Full integration pending backend onboarding endpoint deployment
 */

import { auth } from "@/lib/auth";
import { OnboardingModal } from "./OnboardingModal";

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.ecent.online";

interface OnboardingState {
  status: "not_started" | "in_progress" | "completed" | "skipped";
  started_at: string | null;
  completed_at: string | null;
  skipped_at: string | null;
  can_resume: boolean;
}

interface OnboardingResponse {
  needs_onboarding: boolean;
  state: OnboardingState | null;
}

async function getOnboardingData(cookieHeader: string): Promise<OnboardingResponse | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/onboarding`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      // If 404 or error, assume onboarding not needed
      return { needs_onboarding: false, state: null };
    }

    const result = await response.json() as { data?: OnboardingResponse };
    return result.data ?? { needs_onboarding: false, state: null };
  } catch (error) {
    console.error("[OnboardingProvider] Error fetching onboarding:", error);
    return null;
  }
}

export async function OnboardingProvider() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  try {
    // Get cookies to forward to backend
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const data = await getOnboardingData(cookieHeader);

    // Don't render if no data or doesn't need onboarding
    if (!data || !data.needs_onboarding) {
      return null;
    }

    // Don't render if already completed/skipped
    if (data.state?.status === "completed" || data.state?.status === "skipped") {
      return null;
    }

    // Pass null for flow/state - modal will fetch its own data
    // This is a transitional state until backend is fully integrated
    return (
      <OnboardingModal
        initialState={null}
        flow={null}
        userId={session.user.id}
      />
    );
  } catch (error) {
    console.error("Failed to load onboarding:", error);
    return null;
  }
}

