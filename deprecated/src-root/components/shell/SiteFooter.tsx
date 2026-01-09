import Link from "next/link";
import styles from "./SiteFooter.module.css";

/**
 * Site-wide footer with required legal links for AdSense compliance.
 * Must be present on ALL pages.
 */
export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <span className={styles.copyright}>
          {String.fromCharCode(169)} {currentYear} Ignition
        </span>
        <span className={styles.separator}>{String.fromCharCode(8226)}</span>
        <Link href="/privacy" className={styles.link}>
          Privacy Policy
        </Link>
        <span className={styles.separator}>{String.fromCharCode(8226)}</span>
        <Link href="/terms" className={styles.link}>
          Terms of Service
        </Link>
        <span className={styles.separator}>{String.fromCharCode(8226)}</span>
        <Link href="/contact" className={styles.link}>
          Contact
        </Link>
        <span className={styles.separator}>{String.fromCharCode(8226)}</span>
        <Link href="/help" className={styles.link}>
          Need Help?
        </Link>
      </div>
    </footer>
  );
}

export default SiteFooter;

