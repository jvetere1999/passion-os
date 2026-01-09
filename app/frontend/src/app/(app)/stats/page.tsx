/**
 * Stats Page
 * Read-only statistics
 *
 * No goals. No targets. No charts that scream at you.
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatsClient } from "./StatsClient";

export const metadata: Metadata = {
  title: "Stats - Ignition",
  description: "Your activity statistics. Read-only, no pressure.",
};

export default async function StatsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <StatsClient userId={session.user.id || ""} />;
}

