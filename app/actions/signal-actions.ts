"use server"

import { createClient } from "@/lib/supabase/server"
import {
  SIGNAL_ACTION_TYPES,
  type Signal,
  type SignalActionState,
  type SignalActionType,
  normalizeHttpUrl,
} from "@/lib/signals"

export type SignalActionResult = {
  success: boolean
  active: boolean
  message?: string
}

const MAX_TITLE = 240
const MAX_EXCERPT = 1200

function isActionType(value: string): value is SignalActionType {
  return (SIGNAL_ACTION_TYPES as readonly string[]).includes(value)
}

function clean(value: string | undefined, maxLength: number): string {
  return (value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
}

function validateSignal(signal: Signal): Signal {
  const title = clean(signal.title, MAX_TITLE)
  const url = normalizeHttpUrl(signal.url)
  if (!title || !url || !signal.signalKey.startsWith("sig_")) {
    throw new Error("This signal cannot be saved.")
  }

  return {
    ...signal,
    title,
    excerpt: clean(signal.excerpt, MAX_EXCERPT),
    source: clean(signal.source, 120),
    category: clean(signal.category, 80),
    url,
    imageUrl: normalizeHttpUrl(signal.imageUrl),
    publishedAt: clean(signal.publishedAt, 80) || undefined,
    metadata: signal.metadata ?? {},
  }
}

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Please sign in to save signals.")
  return { supabase, user }
}

export async function getActiveSignalActions(): Promise<SignalActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return {}

  const { data, error } = await supabase
    .from("user_signal_actions")
    .select("signal_key, action_type")
    .eq("user_id", user.id)

  if (error) {
    console.error("[v0] Failed to load signal actions", error)
    return {}
  }

  return (data ?? []).reduce<SignalActionState>((state, row) => {
    if (!isActionType(row.action_type)) return state
    state[row.signal_key] = [...(state[row.signal_key] ?? []), row.action_type]
    return state
  }, {})
}

export async function toggleSignalAction(
  signalInput: Signal,
  actionType: Extract<SignalActionType, "archive" | "dossier">,
): Promise<SignalActionResult> {
  const signal = validateSignal(signalInput)
  const { supabase, user } = await getAuthenticatedClient()

  const { data: existing, error: lookupError } = await supabase
    .from("user_signal_actions")
    .select("id")
    .eq("user_id", user.id)
    .eq("signal_key", signal.signalKey)
    .eq("action_type", actionType)
    .maybeSingle()

  if (lookupError) throw new Error("Unable to check this signal right now.")

  if (existing) {
    const { error } = await supabase.from("user_signal_actions").delete().eq("id", existing.id).eq("user_id", user.id)
    if (error) throw new Error("Unable to remove this signal right now.")
    return { success: true, active: false }
  }

  const { error } = await supabase.from("user_signal_actions").upsert(
    {
      user_id: user.id,
      signal_key: signal.signalKey,
      action_type: actionType,
      title: signal.title,
      url: signal.url,
      excerpt: signal.excerpt,
      source: signal.source,
      category: signal.category,
      image_url: signal.imageUrl ?? null,
      published_at: signal.publishedAt ?? null,
      metadata: signal.metadata,
    },
    { onConflict: "user_id,signal_key,action_type" },
  )

  if (error) throw new Error("Unable to save this signal right now.")
  return { success: true, active: true }
}

export async function saveSignalAction(signalInput: Signal, actionType: Extract<SignalActionType, "research" | "thread_draft">): Promise<SignalActionResult> {
  const signal = validateSignal(signalInput)
  const { supabase, user } = await getAuthenticatedClient()
  const { error } = await supabase.from("user_signal_actions").upsert(
    {
      user_id: user.id,
      signal_key: signal.signalKey,
      action_type: actionType,
      title: signal.title,
      url: signal.url,
      excerpt: signal.excerpt,
      source: signal.source,
      category: signal.category,
      image_url: signal.imageUrl ?? null,
      published_at: signal.publishedAt ?? null,
      metadata: signal.metadata,
    },
    { onConflict: "user_id,signal_key,action_type" },
  )
  if (error) throw new Error("Unable to record this signal right now.")
  return { success: true, active: true }
}

export type SavedSignal = Signal & {
  id: string
  actionType: SignalActionType
  createdAt: string
  updatedAt: string
}

export async function getSavedSignals(): Promise<SavedSignal[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("user_signal_actions")
    .select("id, signal_key, action_type, title, url, excerpt, source, category, image_url, published_at, metadata, created_at, updated_at")
    .eq("user_id", user.id)
    .in("action_type", ["archive", "dossier"])
    .order("updated_at", { ascending: false })

  if (error) throw new Error("Unable to load your saved signals.")

  return (data ?? []).filter((row) => isActionType(row.action_type)).map((row) => ({
    signalKey: row.signal_key,
    sourceKind: typeof row.metadata?.sourceKind === "string" ? row.metadata.sourceKind : "signal",
    title: row.title,
    excerpt: row.excerpt,
    source: row.source,
    category: row.category,
    url: row.url,
    imageUrl: row.image_url ?? undefined,
    publishedAt: row.published_at ?? undefined,
    metadata: row.metadata ?? {},
    id: row.id,
    actionType: row.action_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function deleteSavedSignal(id: string): Promise<SignalActionResult> {
  const { supabase, user } = await getAuthenticatedClient()
  const { error } = await supabase.from("user_signal_actions").delete().eq("id", id).eq("user_id", user.id).in("action_type", ["archive", "dossier"])
  if (error) throw new Error("Unable to remove this saved signal right now.")
  return { success: true, active: false }
}
