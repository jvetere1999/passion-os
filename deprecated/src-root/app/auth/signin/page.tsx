import type { Metadata } from "next";
import Link from "next/link";
import { SignInButtons } from "./SignInButtons";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Ignition with Google or Microsoft. A starter engine for focus, movement, and learning.",
};

export default function SignInPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            Ignition
          </Link>
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>Sign In to Ignition</h1>
          <p className={styles.subtitle}>
            Use your Google or Microsoft account to sign in securely. No passwords required.
          </p>

          <SignInButtons />

          <div className={styles.requirements}>
            <h3>Before You Sign In</h3>
            <ul>
              <li>You must be 16 years or older</li>
              <li>You must accept our Terms of Service</li>
              <li>Your email is used only for authentication</li>
            </ul>
          </div>

          <p className={styles.newUser}>
            First time here?{" "}
            <Link href="/age-verification">Verify your age first</Link>
          </p>

          <p className={styles.terms}>
            By signing in, you agree to our{" "}
            <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </div>

        <p className={styles.backLink}>
          <Link href="/">Back to Home</Link>
        </p>
      </div>
    </main>
  );
}

