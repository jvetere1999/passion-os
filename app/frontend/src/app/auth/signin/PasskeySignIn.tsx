"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeFetch, API_BASE_URL } from "@/lib/api";
import styles from "./page.module.css";

/**
 * Passkey Sign In Component
 * Uses WebAuthn credentials for authentication
 */
export function PasskeySignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check WebAuthn support on mount
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      (!!window.PublicKeyCredential ||
        !!(navigator as any).credentials);
    setIsSupported(supported);
  }, []);

  const handlePasskeySignIn = async () => {
    if (!isSupported) {
      setError("WebAuthn is not supported on your device");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get assertion options from backend
      const optionsResponse = await safeFetch(
        `${API_BASE_URL}/api/auth/webauthn/signin-options`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!optionsResponse.ok) {
        throw new Error("Failed to get authentication options");
      }

      const data = await optionsResponse.json();
      const options = data.options || data;

      // Get assertion (user verifies with biometric/PIN)
      const assertion = await (navigator.credentials as any).get(options);

      if (!assertion) {
        throw new Error("Authentication cancelled");
      }

      // Verify assertion on backend
      const verifyResponse = await safeFetch(
        `${API_BASE_URL}/api/auth/webauthn/signin-verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assertion }),
        }
      );

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse
          .json()
          .catch(() => ({}));
        throw new Error(
          errorData.message || "Authentication failed"
        );
      }

      // Success - redirect to dashboard
      router.push("/today");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      console.error("[Passkey SignIn] Error:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className={styles.passKeyContainer}>
        <div className={styles.errorBox}>
          <p>
            WebAuthn is not supported on your browser. Please use a modern browser (Chrome, Safari, Edge, Firefox).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.passKeyContainer}>
      {error && (
        <div className={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={handlePasskeySignIn}
        disabled={isLoading}
        className={styles.passKeyButton}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>
          {isLoading ? "Verifying..." : "Sign in with Passkey"}
        </span>
      </button>

      <p className={styles.passKeyHint}>
        Use your fingerprint, face, or device PIN to sign in securely.
      </p>
    </div>
  );
}
