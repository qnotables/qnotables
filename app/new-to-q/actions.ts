"use server"

import { createClient } from "@/lib/supabase/server"

export type NewsletterState = {
  status: "idle" | "success" | "error"
  message: string
}

export const initialNewsletterState: NewsletterState = {
  status: "idle",
  message: "",
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function subscribeToNewsletter(
  _previousState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const emailValue = formData.get("email")
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : ""

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return {
      status: "error",
      message: "Enter a valid email address.",
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("subscribe_to_newsletter", {
    subscriber_email: email,
    subscriber_source: "new-to-q",
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
