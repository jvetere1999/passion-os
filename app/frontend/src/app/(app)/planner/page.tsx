/**
 * Planner Page
 * Calendar for time-targeted events (meetings, appointments, workouts)
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlannerClient } from "./PlannerClient";

export const metadata: Metadata = {
  title: "Planner",
  description: "Your calendar for meetings, appointments, and scheduled events.",
};

export default async function PlannerPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // TODO: Fetch events from database
  // const events = await getCalendarEvents(session.user.id);

  return <PlannerClient initialEvents={[]} />;
}

