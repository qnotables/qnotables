import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client. Bypasses RLS, so it MUST only be used in
 * server-side code AFTER verifying the caller is an authorized admin
 * (see lib/admin.ts). Never import this into a client component.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase configuration missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required",
    )
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
