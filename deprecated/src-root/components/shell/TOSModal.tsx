/**
 * TOS Acceptance Modal
 * Shows when user needs to accept Terms of Service
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./TOSModal.module.css";

interface TOSModalProps {
  onAccept: () => void;
}

export function TOSModal({ onAccept }: TOSModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [hasRead, setHasRead] = useState(false);

  const handleAccept = async () => {
    if (!hasRead) {
      alert("Please confirm that you have read the Terms of Service.");
      return;
    }

    setIsAccepting(true);
    try {
      const response = await fetch("/api/auth/accept-tos", {
        method: "POST",
      });

      if (response.ok) {
        onAccept();
      } else {
        alert("Failed to accept Terms of Service. Please try again.");
      }
    } catch (error) {
      console.error("Failed to accept TOS:", error);
      alert("Failed to accept Terms of Service. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Terms of Service</h2>
        <p className={styles.subtitle}>
          Before you can use Ignition, please review and accept our Terms of Service.
        </p>

        <div className={styles.content}>
          <div className={styles.scrollArea}>
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing or using Ignition, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the service.
            </p>

            <h3>2. Age Requirement</h3>
            <p>
              You must be at least 16 years old to use Ignition. By using the service,
              you confirm that you meet this age requirement.
            </p>

            <h3>3. Account Responsibility</h3>
            <p>
              You are responsible for maintaining the confidentiality of your account
              and for all activities that occur under your account.
            </p>

            <h3>4. Acceptable Use</h3>
            <p>
              You agree to use Ignition only for lawful purposes and in accordance
              with these Terms. You agree not to use the service in any way that could
              damage, disable, or impair the service.
            </p>

            <h3>5. Data and Privacy</h3>
            <p>
              Your use of Ignition is also governed by our Privacy Policy. Please review
              our <Link href="/privacy">Privacy Policy</Link> to understand how we collect,
              use, and protect your information.
            </p>

            <h3>6. Service Modifications</h3>
            <p>
              We reserve the right to modify or discontinue the service at any time,
              with or without notice. We shall not be liable to you or any third party
              for any modification, suspension, or discontinuance of the service.
            </p>

            <h3>7. Termination</h3>
            <p>
              We may terminate or suspend your account at any time for any reason.
              You may also delete your account at any time through the Settings page.
            </p>

            <h3>8. Disclaimer of Warranties</h3>
            <p>
              The service is provided as is without warranties of any kind.
              We do not warrant that the service will be uninterrupted or error-free.
            </p>

            <h3>9. Limitation of Liability</h3>
            <p>
              In no event shall Ignition be liable for any indirect, incidental,
              special, or consequential damages arising from your use of the service.
            </p>

            <h3>10. Changes to Terms</h3>
            <p>
              We reserve the right to update these Terms at any time. Continued use
              of the service after changes constitutes acceptance of the new Terms.
            </p>
          </div>
        </div>

        <div className={styles.footer}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={hasRead}
              onChange={(e) => setHasRead(e.target.checked)}
            />
            <span>I have read and agree to the Terms of Service and Privacy Policy</span>
          </label>

          <button
            className={styles.acceptButton}
            onClick={handleAccept}
            disabled={isAccepting || !hasRead}
          >
            {isAccepting ? "Accepting..." : "Accept and Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

