/**
 * Market Page
 * Spend coins on personal rewards
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MarketClient } from "./MarketClient";

export const metadata: Metadata = {
  title: "Market",
  description: "Spend your coins on rewards.",
};

export default async function MarketPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <MarketClient />;
}

