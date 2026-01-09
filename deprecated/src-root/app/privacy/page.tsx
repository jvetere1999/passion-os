/**
 * Privacy Policy Page
 */

import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy - Ignition",
  description: "Privacy policy and data collection practices for Ignition.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "January 5, 2026";

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backLink}>
            &larr; Back to Home
          </Link>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.lastUpdated}>Last Updated: {lastUpdated}</p>
        </header>

        <main className={styles.content}>
          <section className={styles.section}>
            <h2>1. Introduction</h2>
            <p>
              Welcome to Ignition (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our application (&quot;Service&quot;).
            </p>
            <p>
              <strong>Age Requirement:</strong> This Service is intended for users who are 16 years of age
              or older. We do not knowingly collect personal information from individuals under 16. If you
              are under 16, please do not use this Service.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Information We Collect</h2>

            <h3>2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul>
              <li>Email address (via Google or Microsoft OAuth)</li>
              <li>Display name</li>
              <li>Profile picture URL (if provided by OAuth provider)</li>
              <li>Date of birth (for age verification only - we only store confirmation you are 16+)</li>
            </ul>

            <h3>2.2 Usage Data</h3>
            <p>We automatically collect:</p>
            <ul>
              <li>Focus session durations and completion status</li>
              <li>Quest progress and completion data</li>
              <li>Calendar events and planner data you create</li>
              <li>Exercise logs and workout data</li>
              <li>Habit completion records</li>
              <li>Learning progress (lessons, reviews)</li>
              <li>Skill progression and XP earned</li>
              <li>Virtual currency (coins) balance and transactions</li>
              <li>Last activity timestamp (when you last used any feature)</li>
              <li>Aggregate counts of feature usage by type (e.g., number of focus sessions completed)</li>
            </ul>
            <p>
              <strong>Note:</strong> We collect when and what type of activity occurred, but not the content
              of your work (e.g., we know you completed a focus session, but not what you were focusing on).
            </p>

            <h3>2.3 Technical Data</h3>
            <p>We may collect:</p>
            <ul>
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address (for security purposes)</li>
              <li>Access timestamps</li>
            </ul>

            <h3>2.4 Audio Files and Uploads</h3>
            <p>
              If you use features that involve file uploads (such as Reference Library or audio assets for ear training):
            </p>
            <ul>
              <li>Files you upload are stored securely on Cloudflare R2 (object storage)</li>
              <li>Files are associated with your user account and accessible only to you</li>
              <li>We store metadata about uploaded files (filename, size, upload date, file type)</li>
              <li>Uploaded files are encrypted at rest and in transit</li>
              <li>You can delete your uploaded files at any time</li>
              <li>When you delete your account, all associated uploaded files are also deleted</li>
            </ul>
            <p>
              <strong>Important:</strong> You are responsible for ensuring you have the right to upload any
              files, including music or audio tracks. We do not analyze, share, or use your uploaded content
              for any purpose other than providing the Service to you.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Provide and maintain the Service</li>
              <li>Track your progress across focus sessions, quests, and goals</li>
              <li>Calculate and display your skill levels and achievements</li>
              <li>Sync your data across devices</li>
              <li>Send important account notifications</li>
              <li>Improve and optimize the Service</li>
              <li>Respond to your feedback and support requests</li>
              <li>Provide a personalized experience based on your usage patterns (see 3.1)</li>
            </ul>

            <h3>3.1 Personalized Experience</h3>
            <p>
              We may use aggregate counts of your feature usage to personalize your dashboard. This includes:
            </p>
            <ul>
              <li>Showing shortcuts to features you use most frequently</li>
              <li>Reminding you of features you used recently</li>
              <li>Providing a gentler experience if you return after an extended absence</li>
            </ul>
            <p>
              This personalization uses only aggregate counts (e.g., &quot;15 focus sessions in 14 days&quot;),
              not content. It is based on explicit, deterministic rules (not AI or machine learning)
              and does not share any data with third parties.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Data Storage and Security</h2>
            <p>
              Your data is stored securely on Cloudflare&apos;s infrastructure, including:
            </p>
            <ul>
              <li><strong>Cloudflare D1:</strong> SQLite database for structured data</li>
              <li><strong>Cloudflare R2:</strong> Object storage for cached analysis data</li>
            </ul>
            <p>
              We implement industry-standard security measures including encryption in transit (HTTPS)
              and secure authentication via OAuth 2.0.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Data Sharing</h2>
            <p>We do NOT sell your personal information. We may share data only:</p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With service providers who assist in operating our Service (Cloudflare)</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Request an export of your data in a portable format</li>
              <li><strong>Withdraw Consent:</strong> Stop using the Service at any time</li>
            </ul>
            <p>
              To exercise these rights, contact us at the email address below.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Cookies and Local Storage</h2>
            <p>We use:</p>
            <ul>
              <li><strong>Session cookies:</strong> For authentication</li>
              <li><strong>Local storage:</strong> For theme preferences, expand/collapse states, and UI settings</li>
              <li><strong>Session storage:</strong> For temporary UI state within a browser session
                (e.g., acknowledgment banners). Session storage data is automatically cleared when you close your browser.</li>
            </ul>
            <p>We do not use third-party tracking cookies or advertising cookies.</p>
          </section>

          <section className={styles.section}>
            <h2>8. Third-Party Services</h2>
            <p>We integrate with:</p>
            <ul>
              <li><strong>Google OAuth:</strong> For sign-in (subject to Google&apos;s Privacy Policy)</li>
              <li><strong>Microsoft OAuth:</strong> For sign-in (subject to Microsoft&apos;s Privacy Policy)</li>
              <li><strong>Cloudflare:</strong> For hosting and infrastructure</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>9. Children&apos;s Privacy</h2>
            <p>
              This Service is not intended for children under 16 years of age. We do not knowingly
              collect personal information from children under 16. If we discover that we have collected
              information from a child under 16, we will delete that information immediately.
            </p>
            <p>
              If you are a parent or guardian and believe your child has provided us with personal
              information, please contact us immediately.
            </p>
          </section>

          <section className={styles.section}>
            <h2>10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by
              posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
            </p>
          </section>

          <section className={styles.section}>
            <h2>11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights,
              please contact us:
            </p>
            <ul>
              <li>Email: <a href="mailto:privacy@passion-os.app">privacy@passion-os.app</a></li>
              <li>Contact Page: <Link href="/contact">ignition.ecent.online/contact</Link></li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>12. Consent</h2>
            <p>
              By using Ignition, you consent to this Privacy Policy and agree to its terms.
            </p>
          </section>
        </main>

        <footer className={styles.footer}>
          <Link href="/terms">Terms of Service</Link>
          <span className={styles.divider}>|</span>
          <Link href="/contact">Contact Us</Link>
          <span className={styles.divider}>|</span>
          <Link href="/">Home</Link>
        </footer>
      </div>
    </div>
  );
}

