/**
 * Recipe Generator Page
 * Generate synthesis recipes/blueprints
 */

import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecipeClient } from "./RecipeClient";

export const metadata: Metadata = {
  title: "Recipe Generator",
  description: "Generate synthesis recipes and patch blueprints.",
};

export default async function RecipesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/learn/recipes");
  }

  return <RecipeClient userId={session.user.id || ""} />;
}

