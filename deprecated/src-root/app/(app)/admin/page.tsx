/**
 * Admin Console Page
 * Only accessible to admin users defined in ADMIN_EMAILS env var
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin Console - Ignition",
  description: "Administrator dashboard for Ignition.",
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Check if user is admin
  if (!isAdminEmail(session.user.email)) {
    redirect("/today");
  }

  return <AdminClient userEmail={session.user.email || ""} />;
}

