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
import { useRouter } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, signIn } = useAuth();
  const router = useRouter();

  // Session guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('[AppLayout] User not authenticated, redirecting to sign in');
      signIn();
    }
  }, [isLoading, isAuthenticated, signIn]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    if (!user.approved) {
      router.replace("/pending-approval");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading page while checking auth (AuthProvider shows this via isLoading wrapper)
  // OR show loading page during redirect (user is not authenticated and signIn() was called)
  if (isLoading) {
    return null; // AuthProvider will show loading page above this layout
  }

  // If we reach here with isAuthenticated=false, signIn() has been called
  // Show loading page while the redirect happens
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          top: '-50px',
          left: '-50px',
          animation: 'float 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '50%',
          bottom: '-100px',
          right: '-50px',
          animation: 'float 8s ease-in-out infinite reverse',
        }} />

        <div style={{
          textAlign: 'center',
          animation: 'fadeIn 0.6s ease-out',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{
            marginBottom: '2.5rem',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}>
            <div style={{
              width: '70px',
              height: '70px',
              margin: '0 auto',
              background: 'white',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#667eea',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            }}>
              🎵
            </div>
          </div>

          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'white',
            margin: '0 0 0.75rem 0',
            letterSpacing: '0.5px',
          }}>
            Welcome to Passion
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.85)',
            margin: '0 0 2.5rem 0',
            fontWeight: '500',
          }}>
            Redirecting to sign in...
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '2rem',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'white',
              animation: 'bounce 1.4s infinite ease-in-out 0s',
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'white',
              animation: 'bounce 1.4s infinite ease-in-out 0.2s',
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'white',
              animation: 'bounce 1.4s infinite ease-in-out 0.4s',
            }} />
          </div>

          <p style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
          }}>
            This usually takes a few seconds...
          </p>

          <style>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.7;
              }
            }

            @keyframes float {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(20px);
              }
            }

            @keyframes bounce {
              0%, 80%, 100% {
                transform: translateY(0);
                opacity: 1;
              }
              40% {
                transform: translateY(-8px);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <SyncStateProvider>
      <AppShell>
        <OnboardingProvider>
          {children}
          <AdminButton />
        </OnboardingProvider>
      </AppShell>
    </SyncStateProvider>
  );
}
