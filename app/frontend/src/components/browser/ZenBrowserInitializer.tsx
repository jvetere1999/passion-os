"use client";

import { useEffect } from "react";
import { initZenBrowserDetection } from "@/lib/browser-detect";

/**
 * ZenBrowserInitializer - Client component
 *
 * Applies Zen Browser compatibility CSS on mount
 * This is a lightweight component that just runs detection once on load
 */
export function ZenBrowserInitializer() {
  useEffect(() => {
    initZenBrowserDetection();
  }, []);

  return null;
}
