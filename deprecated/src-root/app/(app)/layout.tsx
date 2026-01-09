/**
 * App Layout with Shell
 * Wraps all authenticated routes with the AppShell
 */

import { AppShell } from "@/components/shell";
import { OnboardingProvider } from "@/components/onboarding";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      {children}
      <OnboardingProvider />
    </AppShell>
  );
}

