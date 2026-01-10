/**
 * Admin Console Page
 * Only accessible to admin users with is_admin flag
 *
 * Auth handled via AdminGuard component
 */

import type { Metadata } from "next";
import { AdminClient } from "./AdminClient";
import { AdminGuard } from "@/components/AdminGuard";

export const metadata: Metadata = {
  title: "Admin Console - Ignition",
  description: "Administrator dashboard for Ignition.",
};

export default async function AdminPage() {
  return (
    <AdminGuard>
      <AdminClient />
    </AdminGuard>
  );
}

