/**
 * Infobase Page
 * Knowledge base and notes
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InfobaseClient } from "./InfobaseClient";

export const metadata: Metadata = {
  title: "Infobase",
  description: "Your personal knowledge base for music production.",
};

export default async function InfobasePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return <InfobaseClient />;
}

