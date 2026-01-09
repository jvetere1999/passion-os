/**
 * Learn Layout
 * Wraps learning pages with the LearningShell navigation
 */

import { LearningShell } from "@/components/learn";

interface LearnLayoutProps {
  children: React.ReactNode;
}

export default function LearnLayout({ children }: LearnLayoutProps) {
  return <LearningShell>{children}</LearningShell>;
}

