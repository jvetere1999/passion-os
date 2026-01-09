/**
 * Arrange Page
 * Lane-based music arrangement/sequencer view
 */

import type { Metadata } from "next";
import ArrangeClient from "./ArrangeClient";

export const metadata: Metadata = {
  title: "Arrange",
  description: "Lane-based arrangement view for music production.",
};

export default function ArrangePage() {
  return <ArrangeClient />;
}

