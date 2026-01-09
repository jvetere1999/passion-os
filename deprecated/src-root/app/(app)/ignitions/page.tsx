/**
 * Ignitions Page
 *
 * A curated list of ways to begin.
 * Not tasks. Not plans. Just ways to start.
 *
 * This is used as a resolver fallback before Focus.
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IgnitionsClient } from "./IgnitionsClient";

export const metadata: Metadata = {
  title: "Ignitions - Ignition",
  description: "Ways to begin. Pick one.",
};

export default async function IgnitionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <IgnitionsClient />;
}

