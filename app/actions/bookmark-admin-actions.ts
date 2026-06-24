"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { redirect } from "next/navigation"

export async function approveBookmarkAdmin(bookmarkId: string): Promise<{ success: boolean; error?: string }> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { error } = await admin
    .from("bookmarks")
    .update({ is_approved: true, updated_at: new Date().toISOString() })
    .eq("id", bookmarkId)

  if (error) {
    console.error("[v0] approveBookmarkAdmin error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function rejectBookmarkAdmin(bookmarkId: string): Promise<{ success: boolean; error?: string }> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { error } = await admin
    .from("bookmarks")
    .delete()
    .eq("id", bookmarkId)

  if (error) {
    console.error("[v0] rejectBookmarkAdmin error:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
