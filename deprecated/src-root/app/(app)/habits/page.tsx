/**
 * Habits Page
 * Daily habit tracking with streaks
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HabitsClient } from "./HabitsClient";

export const metadata: Metadata = {
  title: "Habits",
  description: "Track your daily habits and build streaks.",
};

export default async function HabitsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <HabitsClient />;
}
