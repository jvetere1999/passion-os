/**
 * Mobile Sign In Page
 */

import type { Metadata } from "next";
import { MobileSignIn } from "@/components/mobile/screens/MobileSignIn";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Ignition",
};

export default function MobileSignInPage() {
  return <MobileSignIn />;
}

