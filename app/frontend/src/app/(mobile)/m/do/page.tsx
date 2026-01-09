/**
 * Mobile Do Page
 *
 * Execution surfaces only - no planning, just action.
 * Shows Focus, active plan item, and quests.
 *
 * Architecture:
 * - Frontend performs 0% data logic
 * - All data flows through Rust backend at api.ecent.online
 */

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { MobileDoWrapper } from "@/components/mobile/screens/MobileDoWrapper";

export default async function MobileDoPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/m/auth/signin");
  }

  return <MobileDoWrapper userId={session.user.id} />;
}
