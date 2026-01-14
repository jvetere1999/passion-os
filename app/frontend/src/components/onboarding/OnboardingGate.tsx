"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { TOSModal } from "@/components/shell/TOSModal";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.ageVerified) {
      router.replace("/age-verification");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</div>
    );
  }

  if (!user.ageVerified) {
    // Redirect handled by useEffect
    return null;
  }

  if (!user.tosAccepted) {
    // Show TOS modal, refresh session after acceptance
    return <TOSModal onAccept={refresh} />;
  }

  return <>{children}</>;
}
