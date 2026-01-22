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
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <Link href="/" className={styles.logo}>
              Ignition
            </Link>
            <span className={styles.tag}>Passkey-first · Zero friction</span>
            <h1 className={styles.title}>Step in. Your vault, your focus, no passwords.</h1>
            <p className={styles.subtitle}>
              Biometric sign-in and instant onboarding. Recovery codes are a backup if your passkey isn’t available.
            </p>
            <div className={styles.pillList}>
              <span className={styles.pill}>WebAuthn</span>
              <span className={styles.pill}>Device-bound keys</span>
              <span className={styles.pill}>Session hardening</span>
              <span className={styles.pill}>Zero password reuse</span>
            </div>
          </div>
        </section>

        <div className={styles.card}>
          <h2 className={styles.title}>Sign in with your passkey</h2>
          <p className={styles.subtitle}>
            Touch or Face ID on supported devices. Use recovery only if you’ve lost access to your passkey.
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
            <h3>Passkey highlights</h3>
            <ul>
              <li>Biometric or PIN — no password database to leak</li>
              <li>Syncs via your OS keychain (iCloud Keychain / Windows Hello)</li>
              <li>Recovery codes unlock access if a passkey is lost</li>
              <li>We never see your private key — only public credentials</li>
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
