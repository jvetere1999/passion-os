"use client";

/**
 * Mobile Do Wrapper Component
 *
 * Fetches data from backend API and renders MobileDoClient.
 * All data flows through Rust backend at api.ecent.online.
 */

import { useEffect, useState } from "react";
import { MobileDoClient } from "./MobileDoClient";

interface MobileDoWrapperProps {
  userId: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online';

interface DoData {
  focusActive: boolean;
  hasIncompletePlanItem: boolean;
  nextPlanItem: {
    id: string;
    title: string;
    actionUrl: string;
  } | null;
}

export function MobileDoWrapper({ userId }: MobileDoWrapperProps) {
  const [data, setData] = useState<DoData>({
    focusActive: false,
    hasIncompletePlanItem: false,
    nextPlanItem: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch focus status
        const focusRes = await fetch(`${API_BASE_URL}/focus/active`, {
          credentials: 'include',
        });
        const focusData = focusRes.ok ? await focusRes.json() as { session?: unknown } : null;

        // Fetch daily plan
        const planRes = await fetch(`${API_BASE_URL}/daily-plan`, {
          credentials: 'include',
        });
        const planData = planRes.ok ? await planRes.json() as { items?: { id: string; title?: string; label?: string; completed: boolean; actionUrl?: string }[] } : null;

        // Find next incomplete item
        const incompleteItem = planData?.items?.find(
          (item) => !item.completed
        );

        setData({
          focusActive: !!focusData?.session,
          hasIncompletePlanItem: !!incompleteItem,
          nextPlanItem: incompleteItem
            ? {
                id: incompleteItem.id,
                title: incompleteItem.title || incompleteItem.label || "Untitled",
                actionUrl: incompleteItem.actionUrl || "/focus",
              }
            : null,
        });
      } catch (error) {
        console.error("Failed to fetch Do data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <MobileDoClient
      focusActive={data.focusActive}
      hasIncompletePlanItem={data.hasIncompletePlanItem}
      nextPlanItem={data.nextPlanItem}
    />
  );
}
