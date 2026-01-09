/**
 * Progress Page
 * Stats and analytics dashboard with Persona 5 style skill wheel
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProgressClient } from "./ProgressClient";

export const metadata: Metadata = {
  title: "Progress",
  description: "Track your productivity progress and achievements.",
};

export default async function ProgressPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <ProgressClient />;
}
