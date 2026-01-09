/**
 * Mobile Do Page
 *
 * Execution surfaces only - no planning, just action.
 * Shows Focus, active plan item, and quests.
 *
 * Architecture (backend-first):
 * - Session from backend via auth()
 * - MobileDoClient will fetch real data from backend API
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileDoClient } from "@/components/mobile/screens/MobileDoClient";

export default async function MobileDoPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/m/auth/signin");
  }

  // Default data for SSR - MobileDoClient will fetch real data
  return (
    <MobileDoClient
      focusActive={false}
      hasIncompletePlanItem={false}
      nextPlanItem={null}
    />
  );
}

