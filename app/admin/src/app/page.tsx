/**
 * Admin Console Page
 * Only accessible to admin users defined in ADMIN_EMAILS env var
 *
 * Auth handled via backend API session validation.
 * AdminClient component handles auth check and admin verification client-side.
 */

import type { Metadata } from "next";
import { AdminClient } from "./AdminClient";

export const metadata: Metadata = {
  title: "Admin Console - Ignition",
  description: "Administrator dashboard for Ignition.",
};

export default async function AdminPage() {
  // Auth and admin verification handled client-side in AdminClient
  // Uses same backend session API as main frontend
  return <AdminClient />;
}

