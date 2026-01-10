/**
 * Today Page (Home within app shell)
 * Dashboard view showing today's overview and quick actions
 *
 * This is a thin server component that renders TodayClient.
 * All data fetching happens client-side via API calls to the backend.
 *
 * Architecture:
 * - Frontend performs 0% data logic
 * - All data flows through Rust backend at api.ecent.online
 * - Middleware handles auth protection (no server-side auth check needed)
 */

import type { Metadata } from "next";
import { TodayClient } from "./TodayClient";

export const metadata: Metadata = {
  title: "Today",
  description: "Your daily dashboard - quests, focus sessions, and progress.",
};

export default async function TodayPage() {
  // Auth is handled by middleware - no server-side check needed
  // This prevents redirect loops caused by SSR not forwarding cookies properly

  const greeting = getGreeting();

  return (
    <TodayClient
      greeting={greeting}
    />
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
