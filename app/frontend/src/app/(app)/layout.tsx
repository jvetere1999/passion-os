/**
 * App Layout with Shell
 * Wraps all authenticated routes with the AppShell and SyncStateProvider.
 *
 * SYNC STATE:
 * The SyncStateProvider enables 30-second polling for UI optimization data
 * (badges, progress, focus status, plan status). This data is memory-only
 * and NOT persisted to localStorage.
 *
 * SESSION GUARD:
 * Ensures user is authenticated before rendering protected routes.
 */

"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/shell";
import { OnboardingProvider } from "@/components/onboarding";
import { AdminButton } from "@/components/admin/AdminButton";
import { SyncStateProvider } from "@/lib/sync/SyncStateContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, signIn } = useAuth();

  // Session guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      signIn();
    }
  }, [isLoading, isAuthenticated, signIn]);

  // Show nothing while checking auth or redirecting
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <SyncStateProvider>
      <AppShell>
        {children}
        <OnboardingProvider />
        <AdminButton />
      </AppShell>
    </SyncStateProvider>
  );
}

