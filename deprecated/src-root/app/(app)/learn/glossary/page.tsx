/**
 * Glossary Page
 * Searchable synthesis concept glossary
 */

import type { Metadata } from "next";
import { GlossaryClient } from "./GlossaryClient";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Synthesis terminology and concept definitions.",
};

export default function GlossaryPage() {
  return <GlossaryClient />;
}

