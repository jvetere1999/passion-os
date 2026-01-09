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
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { TodayClient } from "./TodayClient";

export const metadata: Metadata = {
  title: "Today",
  description: "Your daily dashboard - quests, focus sessions, and progress.",
};

export default async function TodayPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/today");
  }

  const greeting = getGreeting();
  const firstName = session.user.name?.split(" ")[0] || "there";

  return (
    <TodayClient
      greeting={greeting}
      firstName={firstName}
      userId={session.user.id}
    />
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
