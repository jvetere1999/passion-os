/**
 * Mobile Do Page
 *
 * Execution surfaces only - no planning, just action.
 * Shows Focus, active plan item, and quests.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileDoClient } from "@/components/mobile/screens/MobileDoClient";
import { getDB } from "@/lib/db";
import { hasFocusActive, getDailyPlanSummary } from "@/lib/db/repositories/dailyPlans";

export default async function MobileDoPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/m/auth/signin");
  }

  const db = await getDB();
  const userId = session.user.id;

  // Fetch execution-relevant data
  const [focusActive, planSummary] = await Promise.all([
    hasFocusActive(db, userId),
    getDailyPlanSummary(db, userId),
  ]);

  return (
    <MobileDoClient
      focusActive={focusActive}
      hasIncompletePlanItem={planSummary.hasIncompletePlanItems}
      nextPlanItem={planSummary.nextIncompleteItem}
    />
  );
}

