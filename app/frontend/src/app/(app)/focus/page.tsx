/**
 * Focus Page
 * Focus timer and session management
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FocusClient } from "./FocusClient";

export const metadata: Metadata = {
  title: "Focus",
  description: "Focus timer for deep work sessions.",
};

export default async function FocusPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <FocusClient />;
}

