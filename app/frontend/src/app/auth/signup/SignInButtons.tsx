"use client";

import { useState } from "react";
import styles from "./page.module.css";

interface SignInButtonsProps {
  isSignUp?: boolean;
}

export function SignInButtons({ isSignUp = false }: SignInButtonsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Redirect to OAuth flow
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/api/auth/signin/google`;
  };

  const handleAzureSignIn = () => {
    setIsLoading(true);
    // Redirect to OAuth flow
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online'}/api/auth/signin/azure`;
  };

  return (
    <div className={styles.oauthButtons}>
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={styles.oauthButton}
      >
        {isLoading ? "Signing in..." : `${isSignUp ? "Sign up" : "Sign in"} with Google`}
      </button>
      <button
        onClick={handleAzureSignIn}
        disabled={isLoading}
        className={styles.oauthButton}
      >
        {isLoading ? "Signing in..." : `${isSignUp ? "Sign up" : "Sign in"} with Microsoft`}
      </button>
    </div>
  );
}
