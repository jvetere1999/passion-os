/**
 * Contact Page
 */

import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact Us - Ignition",
  description: "Get in touch with the Ignition team.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            &larr; Back to Home
          </Link>
          <h1 className={styles.title}>Contact Us</h1>
          <p className={styles.subtitle}>
            Have questions, feedback, or need support? We&apos;re here to help.
          </p>
        </header>

        <main className={styles.content}>
          <div className={styles.grid}>
            <section className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Email Support</h2>
              <p className={styles.cardDescription}>
                For general inquiries and support requests
              </p>
              <a href="mailto:support@ignition.app" className={styles.cardLink}>
                support@ignition.app
              </a>
            </section>

            <section className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Privacy Concerns</h2>
              <p className={styles.cardDescription}>
                For data privacy and GDPR-related requests
              </p>
              <a href="mailto:privacy@ignition.app" className={styles.cardLink}>
                privacy@ignition.app
              </a>
            </section>

            <section className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Bug Reports</h2>
              <p className={styles.cardDescription}>
                Found a bug? Let us know so we can fix it
              </p>
              <a href="mailto:bugs@ignition.app" className={styles.cardLink}>
                bugs@ignition.app
              </a>
            </section>

            <section className={styles.card}>
              <div className={styles.cardIcon}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <h2 className={styles.cardTitle}>Feature Requests</h2>
              <p className={styles.cardDescription}>
                Have an idea to make Ignition better?
              </p>
              <a href="mailto:ideas@ignition.app" className={styles.cardLink}>
                ideas@ignition.app
              </a>
            </section>
          </div>

          <section className={styles.infoSection}>
            <h2>Response Time</h2>
            <p>
              We aim to respond to all inquiries within 2-3 business days. For urgent matters,
              please include &quot;URGENT&quot; in your email subject line.
            </p>
          </section>

          <section className={styles.infoSection}>
            <h2>Before Contacting Us</h2>
            <p>Please review our documentation:</p>
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link> - Data collection and your rights</li>
              <li><Link href="/terms">Terms of Service</Link> - Usage guidelines and policies</li>
              <li><Link href="/about">About</Link> - Learn more about Ignition</li>
            </ul>
          </section>

          <section className={styles.infoSection}>
            <h2>For Logged-In Users</h2>
            <p>
              If you have an account, you can submit bug reports and feature requests directly from
              the app. Navigate to Settings &rarr; Feedback to use the built-in submission form.
            </p>
          </section>
        </main>

        <footer className={styles.footer}>
          <Link href="/privacy">Privacy Policy</Link>
          <span className={styles.divider}>|</span>
          <Link href="/terms">Terms of Service</Link>
          <span className={styles.divider}>|</span>
          <Link href="/">Home</Link>
        </footer>
      </div>
    </div>
  );
}

