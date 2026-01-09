/**
 * Mobile Quests Page
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileQuests } from "@/components/mobile/screens/MobileQuests";

export default async function MobileQuestsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/m/auth/signin");
  }

  return <MobileQuests userId={session.user.id || ""} />;
}

