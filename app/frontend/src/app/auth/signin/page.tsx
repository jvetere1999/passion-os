import type { Metadata } from "next";
import Link from "next/link";
import { PasskeySignIn } from "./PasskeySignIn";
import { RecoveryCodeSignIn } from "./RecoveryCodeSignIn";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Ignition with your passkey. Fast, secure, passwordless authentication.",
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
            Use your passkey to sign in securely. No passwords, just biometrics or PIN.
          </p>

          <PasskeySignIn />

          <div className={styles.divider}>
            <span>recovery option</span>
          </div>

          <RecoveryCodeSignIn />

          <div className={styles.divider}>
            <span>new here?</span>
          </div>

          <p className={styles.linkText}>
            <Link href="/auth/signup" className={styles.link}>
              Create an account
            </Link>
          </p>

          <div className={styles.requirements}>
            <h3>About Passkeys</h3>
            <ul>
              <li>Faster than passwords - use biometric or PIN</li>
              <li>More secure - no passwords to steal</li>
              <li>Works across your devices</li>
              <li>Set up your passkey during account creation</li>
              <li>Keep recovery codes somewhere safe, just in case</li>
            </ul>
          </div>

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
