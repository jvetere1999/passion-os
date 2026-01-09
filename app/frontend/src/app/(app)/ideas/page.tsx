/**
 * Ideas Page
 * Quick capture for music ideas
 *
 * ADHD-friendly design:
 * - One dominant action (capture idea)
 * - Minimal choices
 * - Quick entry, no friction
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IdeasClient } from "./IdeasClient";

export const metadata: Metadata = {
  title: "Ideas - Ignition",
  description: "Capture your music ideas quickly.",
};

export default async function IdeasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <IdeasClient userId={session.user.id || ""} />;
}

