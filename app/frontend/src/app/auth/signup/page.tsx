import type { Metadata } from "next";
import Link from "next/link";
import { SignInButtons } from "./SignInButtons";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Ignition account with Google or Microsoft. No passwords required.",
};

export default function SignUpPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            Ignition
          </Link>
        </div>

        <div className={styles.card}>
          <h1 className={styles.title}>Create Your Ignition Account</h1>
          <p className={styles.subtitle}>
            Sign up with Google or Microsoft to get started. No passwords needed.
          </p>

          <SignInButtons isSignUp={true} />

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <p className={styles.linkText}>
            Already have an account?{" "}
            <Link href="/auth/signin" className={styles.link}>
              Sign in instead
            </Link>
          </p>

          <div className={styles.requirements}>
            <h3>Before You Sign Up</h3>
            <ul>
              <li>You must be 16 years or older</li>
              <li>You must accept our Terms of Service</li>
              <li>Your email is used only for authentication</li>
              <li>After signup, you'll set up a passkey for secure access</li>
            </ul>
          </div>

          <p className={styles.terms}>
            By signing up, you agree to our{" "}
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
