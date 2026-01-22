"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeFetch, API_BASE_URL } from "@/lib/api";
import {
  isWebAuthnSupported,
  normalizeRequestOptions,
  serializeAssertionResponse,
} from "@/lib/auth/webauthn";
import styles from "./page.module.css";

/**
 * Passkey Sign In Component
 * Uses WebAuthn credentials for authentication
 */
export function PasskeySignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [email, setEmail] = useState("");

  // Check WebAuthn support on mount
  useEffect(() => {
    setIsSupported(isWebAuthnSupported());
  }, []);

  const handlePasskeySignIn = async () => {
    if (!isSupported) {
      setError("WebAuthn is not supported on your device");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email to continue");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get assertion options from backend
      const optionsUrl = new URL(`${API_BASE_URL}/auth/webauthn/signin-options`);
      optionsUrl.searchParams.set("email", email.trim());
      const optionsResponse = await safeFetch(optionsUrl.toString(), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!optionsResponse.ok) {
        throw new Error("Failed to get authentication options");
      }

      const data = (await optionsResponse.json()) as any;
      const options = normalizeRequestOptions(data.options || data);

      const assertion = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential | null;

      if (!assertion) {
        throw new Error("Authentication cancelled");
      }

      const payload = serializeAssertionResponse(assertion);

      const verifyResponse = await safeFetch(`${API_BASE_URL}/auth/webauthn/signin-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: payload }),
      });

      if (!verifyResponse.ok) {
        const errorData = (await verifyResponse
          .json()
          .catch(() => ({}))) as any;
        throw new Error(
          errorData.message || "Authentication failed"
        );
      }

      const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
      router.push(callbackUrl ?? "/today");
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

      <label className={styles.fieldLabel} htmlFor="passkey-email">
        Email
      </label>
      <input
        id="passkey-email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (error) setError(null);
        }}
        className={styles.fieldInput}
      />

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

function getSafeCallbackUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return null;
}
