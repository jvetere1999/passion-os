/**
 * Book Tracker Page
 * Track reading progress and build reading habits
 */

import type { Metadata } from "next";
import { BookTrackerClient } from "./BookTrackerClient";

export const metadata: Metadata = {
  title: "Book Tracker",
  description: "Track your reading progress and build reading habits.",
};

export default function BooksPage() {
  return <BookTrackerClient />;
}

