/**
 * OAuth Callback Handler
 * 
 * Receives redirect from OAuth providers (Google, Microsoft).
 * Verifies session was created and redirects to onboarding or dashboard.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait for backend to set session cookie
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if session was established
        const sessionResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/auth/session`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!sessionResponse.ok) {
          setStatus("Session check failed");
          setTimeout(() => router.push("/auth/signin"), 2000);
          return;
        }

        const data = (await sessionResponse.json()) as any;
        
        if (data.user) {
          // Session established - redirect to next step
          setStatus("Session established, redirecting...");
          // Check if user has completed onboarding
          router.push(data.user.onboarding_completed ? "/today" : "/onboarding");
        } else {
          setStatus("No session found, redirecting to signin...");
          setTimeout(() => router.push("/auth/signin"), 2000);
        }
      } catch (error) {
        console.error("Callback error:", error);
        setStatus("Error processing callback");
        setTimeout(() => router.push("/auth/signin"), 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      height: "100vh",
      flexDirection: "column",
      gap: "1rem"
    }}>
      <h1>Completing Sign In</h1>
      <p>{status}</p>
    </div>
  );
}
