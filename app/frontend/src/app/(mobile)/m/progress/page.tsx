/**
 * Mobile Progress Page
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileProgress } from "@/components/mobile/screens/MobileProgress";

export default async function MobileProgressPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/m/auth/signin");
  }

  return <MobileProgress userId={session.user.id || ""} />;
}

