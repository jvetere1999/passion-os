"use client";

/**
 * Mobile Do Wrapper Component
 *
 * Fetches data from backend API and renders MobileDoClient.
 * All data flows through Rust backend at api.ecent.online.
 */

import { useEffect, useState } from "react";
import { safeFetch } from "@/lib/api";
import { MobileDoClient } from "./MobileDoClient";
import type { PollResponse } from "@/lib/api/sync";

interface MobileDoWrapperProps {
  userId?: string; // Optional - will use useAuth() if not provided
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.ecent.online';

interface PlanItem {
  id: string;
  title?: string;
  label?: string;
  completed: boolean;
  actionUrl?: string;
}

interface PlanDataResponse {
  items?: PlanItem[];
}

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
        // Use consolidated sync endpoint instead of 2 parallel calls
        const syncRes = await fetch(`${API_BASE_URL}/api/sync/poll`, {
          credentials: 'include',
        });
        
        if (syncRes.ok) {
          const syncData = await syncRes.json() as PollResponse;
          
          // Extract focus status from sync response
          const focusActive = !!syncData.focus.active_session;
          
          // Fetch daily plan data separately from sync
          let planData: PlanDataResponse | null = null;
          try {
            const planRes = await fetch(`${API_BASE_URL}/api/daily-plan`, {
              credentials: 'include',
            });
            planData = planRes.ok ? await planRes.json() as PlanDataResponse : null;
          } catch (e) {
            planData = null;
          }
          
          // Find next incomplete item
          const incompleteItem = planData?.items?.find(
            (item: { completed?: boolean }) => !item.completed
          );
          
          setData({
            focusActive,
            hasIncompletePlanItem: !!incompleteItem,
            nextPlanItem: incompleteItem
              ? {
                  id: incompleteItem.id,
                  title: incompleteItem.title || incompleteItem.label || "Untitled",
                  actionUrl: incompleteItem.actionUrl || "/focus",
                }
              : null,
          });
        }
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
