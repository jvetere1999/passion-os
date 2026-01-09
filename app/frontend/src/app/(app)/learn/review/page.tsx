/**
 * Review Page
 * Spaced repetition flashcard review
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReviewClient } from "./ReviewClient";

export const metadata: Metadata = {
  title: "Review",
  description: "Review your learning with spaced repetition flashcards.",
};

export default async function ReviewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/learn/review");
  }

  return <ReviewClient userId={session.user.id || ""} />;
}

