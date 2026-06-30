import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase not configured")
  return createClient(url, key)
}

/**
 * Generates a stable SHA-256 hash used as the uniqueness key.
 * Combines board + post_number (if present) + normalised title.
 */
export function buildHash(board: string, postNumber: string | null, title: string): string {
  const raw = [board, postNumber ?? "", title.trim().toLowerCase()].join("|")
  return createHash("sha256").update(raw).digest("hex")
}

/**
 * Returns the set of hash_unique values that are already in the notables table.
 */
export async function getExistingHashes(hashes: string[]): Promise<Set<string>> {
  if (hashes.length === 0) return new Set()
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("notables")
    .select("hash_unique")
    .in("hash_unique", hashes)
  if (error) throw new Error(`Notables dedup check failed: ${error.message}`)
  return new Set((data ?? []).map((r: { hash_unique: string }) => r.hash_unique))
}
