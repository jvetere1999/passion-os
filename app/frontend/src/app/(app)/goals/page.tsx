/**
 * Goals Page
 * Long-term goals and milestones
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GoalsClient } from "./GoalsClient";

export const metadata: Metadata = {
  title: "Goals",
  description: "Set and track your long-term goals.",
};

export default async function GoalsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <GoalsClient />;
}

