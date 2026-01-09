/**
 * Admin Console Page
 * Only accessible to admin users defined in ADMIN_EMAILS env var
 *
 * NOTE: This is a standalone admin app. Auth will integrate with
 * the backend at api.ecent.online once deployed.
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin";
import { AdminClient } from "./AdminClient";

// Main app URL for redirects
const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://ignition.ecent.online";

export const metadata: Metadata = {
  title: "Admin Console - Ignition",
  description: "Administrator dashboard for Ignition.",
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    // Redirect to main app signin
    redirect(`${MAIN_APP_URL}/auth/signin`);
  }

  // Check if user is admin
  if (!isAdminEmail(session.user.email)) {
    // Redirect non-admins to main app
    redirect(`${MAIN_APP_URL}/today`);
  }

  return <AdminClient userEmail={session.user.email || ""} />;
}

