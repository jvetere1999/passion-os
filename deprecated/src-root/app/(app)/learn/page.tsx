/**
 * Learn Dashboard Page
 * Main entry point for the learning suite
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LearnDashboard } from "./LearnDashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your learning dashboard - continue lessons, review cards, and track progress.",
};

export default async function LearnPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/learn");
  }

  return <LearnDashboard userId={session.user.id || ""} />;
}

