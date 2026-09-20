import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const ROOM_SLUG = "town-hall-live"
const MAX_MESSAGES = 50
const MAX_BODY_LENGTH = 2000
const WINDOW_MS = 10_000
const MAX_MESSAGES_PER_WINDOW = 5
const recentPosts = new Map<string, number[]>()

type MessageRow = {
  id: string
  room_slug: string
  user_id: string
  body: string
  created_at: string
  deleted_at: string | null
  profiles?: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }[] | {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

function publicMessage(row: MessageRow) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  return {
    id: row.id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
    author: profile
      ? {
          id: profile.id,
          displayName: profile.display_name || profile.username || "Community member",
          username: profile.username,
          avatarUrl: profile.avatar_url,
        }
      : {
          id: row.user_id,
          displayName: "Community member",
          username: null,
          avatarUrl: null,
        },
  }
}

export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "Sign in to view the live chat." }, { status: 401 })

  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || MAX_MESSAGES, 1), MAX_MESSAGES)
  const before = url.searchParams.get("before")

  let query = supabase
    .from("chat_messages")
    .select("id, room_slug, user_id, body, created_at, deleted_at, profiles!chat_messages_user_id_fkey(id, display_name, username, avatar_url)")
    .eq("room_slug", ROOM_SLUG)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (before) query = query.lt("created_at", before)

  const { data, error } = await query
  if (error) {
    console.error("[v0] Chat history failed:", error)
    return NextResponse.json({ error: "Chat history is temporarily unavailable." }, { status: 500 })
  }

  const messages = ((data || []) as unknown as MessageRow[]).reverse().map(publicMessage)
  return NextResponse.json({ messages, hasMore: messages.length === limit })
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 })

  const now = Date.now()
  const timestamps = (recentPosts.get(user.id) || []).filter((timestamp) => now - timestamp < WINDOW_MS)
  if (timestamps.length >= MAX_MESSAGES_PER_WINDOW) {
    return NextResponse.json({ error: "You are sending messages too quickly." }, { status: 429 })
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, status")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError || !profile || profile.status !== "active") {
    return NextResponse.json({ error: "Your account cannot send chat messages." }, { status: 403 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Enter a message to send." }, { status: 400 })
  }

  const body = typeof payload === "object" && payload !== null && "body" in payload && typeof payload.body === "string" ? payload.body.trim() : ""
  if (!body || body.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: "Messages must be between 1 and 2,000 characters." }, { status: 400 })
  }

  const { data: duplicate } = await supabase
    .from("chat_messages")
    .select("id")
    .eq("room_slug", ROOM_SLUG)
    .eq("user_id", user.id)
    .eq("body", body)
    .is("deleted_at", null)
    .gte("created_at", new Date(now - WINDOW_MS).toISOString())
    .limit(1)
    .maybeSingle()

  if (duplicate) return NextResponse.json({ error: "That message was already sent." }, { status: 409 })

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ room_slug: ROOM_SLUG, user_id: user.id, body })
    .select("id, room_slug, user_id, body, created_at, deleted_at, profiles!chat_messages_user_id_fkey(id, display_name, username, avatar_url)")
    .single()

  if (error) {
    console.error("[v0] Chat message creation failed:", error)
    return NextResponse.json({ error: "Unable to send that message." }, { status: 500 })
  }

  recentPosts.set(user.id, [...timestamps, now])
  return NextResponse.json({ message: publicMessage(data as unknown as MessageRow) }, { status: 201 })
}

export function __resetChatRateLimitForTests() {
  recentPosts.clear()
}

export { ROOM_SLUG }
