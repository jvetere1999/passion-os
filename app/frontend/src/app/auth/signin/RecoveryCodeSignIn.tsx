"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeFetch, API_BASE_URL } from "@/lib/api";
import styles from "./page.module.css";

function formatRecoveryCode(value: string): string {
  const raw = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12);
  const groups = raw.match(/.{1,4}/g);
  return groups ? groups.join("-") : "";
}

export function RecoveryCodeSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!code) {
      setError("Enter a recovery code to continue.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await safeFetch(`${API_BASE_URL}/auth/recovery/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Recovery code sign in failed.");
      }

      const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
      router.push(callbackUrl ?? "/today");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Recovery code sign in failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.recoveryContainer}>
      {error && (
        <div className={styles.errorBox}>
          <p>{error}</p>
        </div>
      )}
      <label className={styles.recoveryLabel} htmlFor="recovery-code">
        Recovery code
      </label>
      <input
        id="recovery-code"
        name="recovery-code"
        className={styles.recoveryInput}
        placeholder="ABCD-1234-WXYZ"
        value={code}
        onChange={(event) => setCode(formatRecoveryCode(event.target.value))}
        autoComplete="one-time-code"
        inputMode="text"
      />
      <button
        type="button"
        onClick={handleSubmit}
        className={styles.recoveryButton}
        disabled={isLoading}
      >
        {isLoading ? "Verifying..." : "Sign in with Recovery Code"}
      </button>
      <p className={styles.recoveryHint}>
        Recovery codes are single-use. Generate a new set after signing in.
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
