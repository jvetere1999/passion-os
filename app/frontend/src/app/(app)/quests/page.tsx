/**
 * Quests Page
 * Daily and weekly quests for XP and coins
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QuestsClient } from "./QuestsClient";

export const metadata: Metadata = {
  title: "Quests",
  description: "Complete quests to earn XP and coins.",
};

export default async function QuestsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <QuestsClient />;
}

