/**
 * Mobile Me Page
 *
 * User/state/admin controls.
 * Settings, account, export/delete, privacy/terms.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileMeClient } from "@/components/mobile/screens/MobileMeClient";

export default async function MobileMePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/m/auth/signin");
  }

  // Check if user is admin
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  const isAdmin = Boolean(session.user.email && adminEmails.includes(session.user.email));

  return (
    <MobileMeClient
      user={{
        name: session.user.name || "User",
        email: session.user.email || "",
        image: session.user.image || null,
      }}
      isAdmin={isAdmin}
    />
  );
}

