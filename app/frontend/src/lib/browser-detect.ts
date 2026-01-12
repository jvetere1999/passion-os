/**
 * Browser Detection Utility (2026-01-11)
 *
 * Detects Zen Browser and applies CSS overrides for compatibility.
 */

export function detectZenBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes("zen");
}

export function applyZenBrowserOverrides(): void {
  if (typeof document === "undefined") {
    return;
  }

  if (detectZenBrowser()) {
    // Add Zen Browser marker class to document
    document.documentElement.setAttribute("data-browser", "zen");

    // Log for debugging
    console.debug("[BrowserDetect] Zen Browser detected - applying overrides");
  }
}

/**
 * Initialize browser detection
 * Call this in a useEffect in your root layout component
 */
export function initZenBrowserDetection(): void {
  if (typeof window !== "undefined") {
    applyZenBrowserOverrides();
  }
}
