/**
 * DAW Shortcuts Detail Page
 * Shows all shortcuts for a specific DAW
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDAWById, getDAWs } from "@/lib/data";
import { ShortcutsClient } from "./ShortcutsClient";

interface PageProps {
  params: Promise<{ dawId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dawId } = await params;
  const daw = getDAWById(dawId);

  if (!daw) {
    return { title: "DAW Not Found" };
  }

  return {
    title: `${daw.name} Shortcuts`,
    description: `Keyboard shortcuts for ${daw.name} ${daw.version}. Browse, search, and filter shortcuts with Mac and Windows key mappings.`,
  };
}

export function generateStaticParams() {
  return getDAWs().map((daw) => ({ dawId: daw.id }));
}

export default async function DAWShortcutsPage({ params }: PageProps) {
  const { dawId } = await params;
  const daw = getDAWById(dawId);

  if (!daw) {
    notFound();
  }

  return <ShortcutsClient daw={daw} />;
}

