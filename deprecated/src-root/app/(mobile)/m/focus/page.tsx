/**
 * Mobile Focus Page
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileFocus } from "@/components/mobile/screens/MobileFocus";

export default async function MobileFocusPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/m/auth/signin");
  }

  return <MobileFocus userId={session.user.id || ""} />;
}

