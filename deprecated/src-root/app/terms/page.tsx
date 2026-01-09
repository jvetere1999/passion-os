/**
 * Terms of Service Page
 */

import type { Metadata } from "next";
import Link from "next/link";
import styles from "../privacy/page.module.css";

export const metadata: Metadata = {
  title: "Terms of Service - Ignition",
  description: "Terms of service for using Ignition.",
};

export default function TermsPage() {
  const lastUpdated = "January 5, 2026";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            &larr; Back to Home
          </Link>
          <h1 className={styles.title}>Terms of Service</h1>
          <p className={styles.lastUpdated}>Last Updated: {lastUpdated}</p>
        </header>

        <main className={styles.content}>
          <section className={styles.section}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using Ignition (&quot;Service&quot;), you agree to be bound by these Terms of
              Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Eligibility</h2>
            <p>
              <strong>You must be at least 16 years of age to use this Service.</strong> By using
              Ignition, you represent and warrant that you are at least 16 years old. If you are
              under 16, you are not permitted to use this Service.
            </p>
            <p>
              We require age verification during the registration process and reserve the right to
              terminate accounts of users who misrepresent their age.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Account Registration</h2>
            <p>To use the Service, you must:</p>
            <ul>
              <li>Create an account using Google or Microsoft authentication</li>
              <li>Verify that you are 16 years of age or older</li>
              <li>Accept these Terms of Service</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
            </ul>
            <p>
              We reserve the right to deny or revoke access for any reason at our sole discretion.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul>
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious code or content</li>
              <li>Impersonate another person or entity</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Share your account with others</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. User Content</h2>
            <p>
              You retain ownership of content you create in the Service (events, goals, notes, etc.).
              By using the Service, you grant us a license to store and process this content solely
              for the purpose of providing the Service to you.
            </p>
            <p>
              Audio files uploaded to the Reference Library are stored locally on your device and
              are not transmitted to our servers.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Virtual Currency and Rewards</h2>
            <p>
              The Service includes virtual currency (&quot;Coins&quot;) and experience points (&quot;XP&quot;). These have
              no monetary value and cannot be exchanged for real currency. Virtual items and rewards
              are for personal motivation and entertainment only.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access.
              We may modify, suspend, or discontinue the Service at any time without notice.
            </p>
          </section>

          <section className={styles.section}>
            <h2>8. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violation of these Terms or
              for any other reason at our discretion. Upon termination, your right to use the
              Service ceases immediately.
            </p>
            <p>
              You may delete your account at any time through the Settings page or by contacting us.
            </p>
          </section>

          <section className={styles.section}>
            <h2>9. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, SECURE, OR UNINTERRUPTED.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF
              THE SERVICE.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Changes to Terms</h2>
            <p>
              We may update these Terms at any time. Continued use of the Service after changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className={styles.section}>
            <h2>12. Contact</h2>
            <p>
              For questions about these Terms, contact us at:
            </p>
            <ul>
              <li>Email: <a href="mailto:legal@passion-os.app">legal@passion-os.app</a></li>
              <li>Contact Page: <Link href="/contact">passion-os.app/contact</Link></li>
            </ul>
          </section>
        </main>

        <footer className={styles.footer}>
          <Link href="/privacy">Privacy Policy</Link>
          <span className={styles.divider}>|</span>
          <Link href="/contact">Contact Us</Link>
          <span className={styles.divider}>|</span>
          <Link href="/">Home</Link>
        </footer>
      </div>
    </div>
  );
}

