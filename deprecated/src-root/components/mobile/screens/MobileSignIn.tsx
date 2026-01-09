"use client";

/**
 * Mobile Sign In Screen
 */

import { signIn } from "next-auth/react";
import styles from "./MobileSignIn.module.css";

export function MobileSignIn() {
  const handleSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/m" });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        {/* Logo */}
        <div className={styles.logo}>
          <svg width="64" height="64" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="mobileFlameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#8B0000"/>
                <stop offset="100%" stopColor="#DC143C"/>
              </linearGradient>
            </defs>
            <path d="M3 22 Q4.5 16 6 12 Q7.5 6 5 2 Q9 5 7.5 12 Q6.5 17 7.5 22 Z" fill="url(#mobileFlameGrad)"/>
            <path d="M9 22 Q10.5 14 12 9 Q13.5 3 12 0 Q15 4 13.5 10 Q12 17 13.5 22 Z" fill="url(#mobileFlameGrad)"/>
            <path d="M16.5 22 Q18 16 19.5 11 Q21 5 19 1 Q22.5 7 21 14 Q19.5 19 21 22 Z" fill="url(#mobileFlameGrad)"/>
          </svg>
          <h1>Ignition</h1>
          <p>Start without friction</p>
        </div>

        {/* Sign In Buttons */}
        <div className={styles.buttons}>
          <button
            className={`${styles.signInBtn} ${styles.google}`}
            onClick={() => handleSignIn("google")}
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <button
            className={`${styles.signInBtn} ${styles.microsoft}`}
            onClick={() => handleSignIn("azure-ad")}
          >
            <MicrosoftIcon />
            <span>Continue with Microsoft</span>
          </button>
        </div>

        {/* Terms */}
        <p className={styles.terms}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

