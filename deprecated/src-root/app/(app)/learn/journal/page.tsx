/**
 * Patch Journal Page
 * Log and track synthesis experiments
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JournalClient } from "./JournalClient";

export const metadata: Metadata = {
  title: "Patch Journal",
  description: "Log and track your synthesis experiments and learnings.",
};

export default async function JournalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/learn/journal");
  }

  return <JournalClient userId={session.user.id || ""} />;
}

