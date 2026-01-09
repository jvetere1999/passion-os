import { Metadata } from "next";
import { TemplatesClient } from "./TemplatesClient";

export const metadata: Metadata = {
  title: "Listening Templates",
};

export default function TemplatesPage() {
  // In production, this would check auth and get user email from session
  // For now, we use a placeholder that will be replaced by actual auth
  const userEmail = "admin@ignition.ecent.online";

  return <TemplatesClient userEmail={userEmail} />;
}

