/**
 * Age Verification API
 * Updates user record to mark age as verified
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/env";

export async function POST() {
  const session = await auth();

  // If not authenticated, just return success (cookie was set client-side)
  if (!session?.user?.id) {
    return NextResponse.json({ success: true, message: "Age verified (pre-auth)" });
  }

  try {
    const ctx = await getCloudflareContext();
    const db = (ctx.env as unknown as CloudflareEnv).DB;

    if (!db) {
      return NextResponse.json({ success: true, message: "Age verified (no DB)" });
    }

    // Update user record
    await db
      .prepare(`UPDATE users SET age_verified = 1, updated_at = ? WHERE id = ?`)
      .bind(new Date().toISOString(), session.user.id)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update age verification:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

