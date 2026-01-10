"use client";

// Re-export useAuth from AuthProvider for convenience
// This allows importing from @/lib/hooks/useAuth
export { useAuth, useRequireAuth } from "@/lib/auth/AuthProvider.tsx";
