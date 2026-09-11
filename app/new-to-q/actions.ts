"use server"

import { createClient } from "@/lib/supabase/server"
import type { NewsletterState } from "./newsletter-state"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NEW_TO_Q_PATH = "/new-to-q"

export async function getNewToQViewCount(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("page_view_counts")
    .select("view_count")
    .eq("path", NEW_TO_Q_PATH)
    .maybeSingle()

  if (error) {
    console.error("[v0] New to Q view count read failed:", error.code)
    return 0
  }

  return Number(data?.view_count ?? 0)
}

export async function incrementNewToQView(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("increment_page_view", {
    p_path: NEW_TO_Q_PATH,
  })

  if (error) {
    console.error("[v0] New to Q view increment failed:", error.code)
    return 0
  }

  return Number(data ?? 0)
}

export async function subscribeToNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const emailValue = formData.get("email")
  const sourceValue = formData.get("source")
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : ""
  const source = sourceValue === "homepage-daily-briefing" ? sourceValue : "new-to-q"

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("subscribe_to_newsletter", {
    subscriber_email: email,
    subscriber_source: source,
  })

  if (error) {
    console.error("Newsletter subscription failed:", error.code)
    return {
      status: "error",
      message: "We could not save your email right now. Please try again.",
    }
  }

  return {
    status: "success",
    message: "You are on the list. Watch your inbox for future updates.",
  }
}
