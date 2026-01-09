import { NextRequest, NextResponse } from "next/server";
import type { D1Database } from "@cloudflare/workers-types";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface CloudflareEnv {
  DB?: D1Database;
}

function getDB(): D1Database | null {
  try {
    const env = (globalThis as unknown as { env?: CloudflareEnv }).env;
    return env?.DB ?? null;
  } catch {
    return null;
  }
}

// Check if user is admin
function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

// POST /api/exercise/seed - Seed built-in exercises (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const db = getDB();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = await request.json();
    const { exercises } = body;

    if (!Array.isArray(exercises)) {
      return NextResponse.json({ error: "exercises must be an array" }, { status: 400 });
    }

    const now = new Date().toISOString();
    let imported = 0;
    let skipped = 0;

    for (const ex of exercises) {
      const id = ex.id || ex.name.replace(/[^a-zA-Z0-9]/g, "_");

      // Check if exists
      const existing = await db
        .prepare(`SELECT id FROM exercises WHERE id = ?`)
        .bind(id)
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      // Map category
      let category = "strength";
      if (ex.category) {
        if (ex.category === "stretching") category = "flexibility";
        else if (["cardio", "plyometrics"].includes(ex.category)) category = "cardio";
        else category = ex.category;
      }

      // Build muscle groups
      const muscles = [];
      if (ex.primaryMuscles) muscles.push(...ex.primaryMuscles);
      if (ex.secondaryMuscles) muscles.push(...ex.secondaryMuscles);

      // Build equipment
      const equipment = ex.equipment ? [ex.equipment] : [];

      // Build instructions
      const instructions = Array.isArray(ex.instructions)
        ? ex.instructions.join("\n")
        : ex.instructions || null;

      try {
        await db
          .prepare(`
            INSERT INTO exercises (id, user_id, name, description, category, muscle_groups, equipment, instructions, is_builtin, created_at, updated_at)
            VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 1, ?, ?)
          `)
          .bind(
            id,
            ex.name,
            ex.force ? `${ex.level || ""} ${ex.mechanic || ""} exercise`.trim() : null,
            category,
            muscles.length > 0 ? JSON.stringify(muscles) : null,
            equipment.length > 0 ? JSON.stringify(equipment) : null,
            instructions,
            now,
            now
          )
          .run();
        imported++;
      } catch (e) {
        console.error(`Failed to import ${ex.name}:`, e);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: exercises.length
    });
  } catch (error) {
    console.error("POST /api/exercise/seed error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

