/**
 * Wins Page
 * Auto-logged proof that you started
 *
 * No streaks. No comparisons. Just proof that you started.
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WinsClient } from "./WinsClient";

export const metadata: Metadata = {
  title: "Wins - Ignition",
  description: "Your wins. Proof that you started.",
};

export default async function WinsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <WinsClient userId={session.user.id || ""} />;
}

