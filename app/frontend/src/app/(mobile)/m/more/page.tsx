/**
 * Mobile More Page
 * Navigation to additional features
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileMore } from "@/components/mobile/screens/MobileMore";

export default async function MobileMorePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/m/auth/signin");
  }

  return <MobileMore user={session.user} />;
}

