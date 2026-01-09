"use client";

import { useEffect, useRef } from "react";
import styles from "./AdUnit.module.css";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Get publisher ID from environment
const ADSENSE_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
}

/**
 * Google AdSense ad unit component.
 *
 * @param slot - Ad unit slot ID from AdSense dashboard
 * @param format - Ad format (default: "auto")
 * @param responsive - Enable full-width responsive ads (default: true)
 * @param className - Additional CSS class names
 *
 * @example
 * // Get slot ID when you create a new ad unit in AdSense
 * <AdUnit slot="1234567890" />
 */
export function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className,
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !ADSENSE_PUBLISHER_ID) return;

    try {
      if (typeof window !== "undefined" && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch (error) {
      // AdSense not loaded or blocked - fail silently
      console.warn("AdSense not available");
    }
  }, []);

  // Don't render if no publisher ID configured
  if (!ADSENSE_PUBLISHER_ID) {
    return null;
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${styles.adUnit} ${className ?? ""}`}
      style={{ display: "block" }}
      data-ad-client={`ca-${ADSENSE_PUBLISHER_ID}`}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}

export default AdUnit;

