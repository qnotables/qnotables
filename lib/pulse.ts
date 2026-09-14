import { createAdminClient } from "@/lib/supabase/admin"
import { buildExcerpt, getDeskLabel, normalizeCategoryName } from "@/lib/forum-utils"

export const PULSE_DEFAULTS = {
  kicker: "COMMUNITY SIGNAL",
  title: "THE TOWN HALL",
  description: "Follow the signal. Examine the evidence. Add to the record.",
  enterLabel: "ENTER THE TOWN HALL",
  startLabel: "START A THREAD",
  activeMaxAgeDays: 14,
  backchannelMaxAgeDays: 14,
}

export type PulseSlot = "active" | "backchannel" | "editor"

export interface PulseCard {
  slot: PulseSlot
  eyebrow: string
  title: string
  excerpt: string
  category: string
  replyCount: number
  activityAt: string
  sourceStatus: "PRIMARY SOURCE" | "COMMUNITY THREAD"
  href: string
  threadId: string
  isOpenDiscussion: boolean
}

export interface PulseSettings {
  enabled: boolean
  editorThreadId: string | null
  excludedThreadIds: string[]
  activeMaxAgeDays: number
  backchannelMaxAgeDays: number
  kicker: string
  title: string
  description: string
  enterLabel: string
  startLabel: string
  updatedBy: string | null
}

export interface TownHallPulse {
  settings: PulseSettings
  cards: PulseCard[]
}

interface PulseThread {
  id: string
  slug: string | null
  title: string
  body: string
  excerpt: string | null
  category: string | null
  desk: string | null
  source_url: string | null
  created_at: string
  last_activity_at: string | null
  reply_count: number | null
  is_pinned: boolean | null
  is_featured: boolean | null
  is_soft_deleted: boolean | null
  is_pending: boolean | null
  status: string | null
}

interface PulseReply {
  thread_id: string
  body: string
  created_at: string
  is_pending: boolean | null
  is_hidden: boolean | null
  status: string | null
}

function deploymentPulseDefault(): boolean {
  return process.env.VERCEL_ENV !== "production" && process.env.NODE_ENV !== "production"
}

function parseExcludedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 100)
}

function daysAgo(days: number): number {
  return Date.now() - Math.max(1, days) * 86_400_000
}

function activityAt(thread: PulseThread, latestReply?: PulseReply): string {
  return latestReply?.created_at || thread.last_activity_at || thread.created_at
}

function isEligible(thread: PulseThread, excludedIds: Set<string>): boolean {
  return Boolean(
    thread.id &&
      !excludedIds.has(thread.id) &&
      thread.title?.trim() &&
      !thread.is_soft_deleted &&
      !thread.is_pending &&
      thread.status === "published",
  )
}

function makeCard(thread: PulseThread, slot: PulseSlot, latestReply: PulseReply | undefined, isOpenDiscussion = false): PulseCard {
  const category = normalizeCategoryName(thread.category || thread.desk)
  const slug = thread.slug || thread.id
  return {
    slot,
    eyebrow: isOpenDiscussion ? "OPEN DISCUSSION" : slot === "active" ? "ACTIVE DISCUSSION" : slot === "backchannel" ? "NEW FROM THE BACKCHANNEL" : "EDITOR'S NOTABLE",
    title: thread.title.trim(),
    excerpt: buildExcerpt(latestReply?.body || thread.excerpt || thread.body || "", 190) || "Open the thread to examine the record.",
    category: category === "Other" && thread.desk ? getDeskLabel(thread.desk) : category,
    replyCount: Math.max(0, Number(thread.reply_count ?? 0)),
    activityAt: activityAt(thread, latestReply),
    sourceStatus: thread.source_url ? "PRIMARY SOURCE" : "COMMUNITY THREAD",
    href: `/forum/${encodeURIComponent(slug)}`,
    threadId: thread.id,
    isOpenDiscussion,
  }
}

function firstAvailable(
  candidates: PulseThread[],
  used: Set<string>,
  predicate: (thread: PulseThread) => boolean,
): PulseThread | null {
  return candidates.find((thread) => !used.has(thread.id) && predicate(thread)) ?? null
}

export async function getTownHallPulse(includeDisabled = false): Promise<TownHallPulse> {
  const admin = createAdminClient()
  const [{ data: settingsRow }, { data: threadRows, error: threadError }] = await Promise.all([
    admin
      .from("site_settings")
      .select("pulse_enabled, pulse_editor_thread_id, pulse_excluded_thread_ids, pulse_active_max_age_days, pulse_backchannel_max_age_days, pulse_kicker, pulse_title, pulse_description, pulse_enter_label, pulse_start_label, pulse_updated_by")
      .eq("id", 1)
      .maybeSingle(),
    admin
      .from("forum_threads")
      .select("id, slug, title, body, excerpt, category, desk, source_url, created_at, last_activity_at, reply_count, is_pinned, is_featured, is_soft_deleted, is_pending, status")
      .eq("is_soft_deleted", false)
      .eq("is_pending", false)
      .eq("status", "published")
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .limit(100),
  ])

  const settings: PulseSettings = {
    enabled: settingsRow?.pulse_enabled ?? deploymentPulseDefault(),
    editorThreadId: settingsRow?.pulse_editor_thread_id ?? null,
    excludedThreadIds: parseExcludedIds(settingsRow?.pulse_excluded_thread_ids),
    activeMaxAgeDays: Math.max(1, Math.min(90, Number(settingsRow?.pulse_active_max_age_days ?? PULSE_DEFAULTS.activeMaxAgeDays))),
    backchannelMaxAgeDays: Math.max(1, Math.min(90, Number(settingsRow?.pulse_backchannel_max_age_days ?? PULSE_DEFAULTS.backchannelMaxAgeDays))),
    kicker: settingsRow?.pulse_kicker?.trim() || PULSE_DEFAULTS.kicker,
    title: settingsRow?.pulse_title?.trim() || PULSE_DEFAULTS.title,
    description: settingsRow?.pulse_description?.trim() || PULSE_DEFAULTS.description,
    enterLabel: settingsRow?.pulse_enter_label?.trim() || PULSE_DEFAULTS.enterLabel,
    startLabel: settingsRow?.pulse_start_label?.trim() || PULSE_DEFAULTS.startLabel,
    updatedBy: settingsRow?.pulse_updated_by ?? null,
  }

  if (threadError || (!settings.enabled && !includeDisabled) || !threadRows?.length) return { settings, cards: [] }

  const threads = threadRows as PulseThread[]
  const candidates = threads.filter((thread) => isEligible(thread, new Set(settings.excludedThreadIds)))
  if (!candidates.length) return { settings, cards: [] }

  const { data: replies } = await admin
    .from("forum_replies")
    .select("thread_id, body, created_at, is_pending, is_hidden, status")
    .in("thread_id", candidates.map((thread) => thread.id))
    .eq("is_pending", false)
    .eq("is_hidden", false)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(500)

  const latestReplies = new Map<string, PulseReply>()
  for (const reply of (replies ?? []) as PulseReply[]) {
    if (!latestReplies.has(reply.thread_id) && buildExcerpt(reply.body || "", 20)) latestReplies.set(reply.thread_id, reply)
  }

  const ranked = [...candidates].sort((a, b) => Date.parse(activityAt(b, latestReplies.get(b.id))) - Date.parse(activityAt(a, latestReplies.get(a.id))))
  const used = new Set<string>()
  const cards: PulseCard[] = []

  const activeWindow = daysAgo(settings.activeMaxAgeDays)
  const active = firstAvailable(ranked, used, (thread) => {
    const reply = latestReplies.get(thread.id)
    return Boolean(reply && Date.parse(activityAt(thread, reply)) >= activeWindow)
  })
  if (active) {
    used.add(active.id)
    cards.push(makeCard(active, "active", latestReplies.get(active.id)))
  } else {
    const open = firstAvailable(ranked, used, (thread) => !latestReplies.has(thread.id))
    if (open) {
      used.add(open.id)
      cards.push(makeCard(open, "active", latestReplies.get(open.id), true))
    }
  }

  const backchannelWindow = daysAgo(settings.backchannelMaxAgeDays)
  const backchannel = firstAvailable(ranked, used, (thread) => Boolean(thread.source_url && Date.parse(thread.created_at) >= backchannelWindow))
    || firstAvailable(ranked, used, (thread) => Boolean(thread.source_url))
  if (backchannel) {
    used.add(backchannel.id)
    cards.push(makeCard(backchannel, "backchannel", latestReplies.get(backchannel.id)))
  }

  const configuredEditor = settings.editorThreadId ? firstAvailable(ranked, used, (thread) => thread.id === settings.editorThreadId) : null
  const fallbackEditor = firstAvailable(ranked, used, (thread) => Boolean(thread.is_featured || thread.is_pinned))
  const editor = configuredEditor || fallbackEditor
  if (editor) {
    used.add(editor.id)
    cards.push(makeCard(editor, "editor", latestReplies.get(editor.id)))
  }

  return { settings, cards }
}

export async function searchPulseThreads(query: string, limit = 8): Promise<Array<Pick<PulseCard, "threadId" | "title" | "category" | "href" | "sourceStatus">>> {
  const admin = createAdminClient()
  const term = query.trim().replace(/[%,()\\]/g, " ").slice(0, 80)
  let request = admin
    .from("forum_threads")
    .select("id, slug, title, category, desk, source_url")
    .eq("is_soft_deleted", false)
    .eq("is_pending", false)
    .eq("status", "published")
    .order("last_activity_at", { ascending: false, nullsFirst: false })
    .limit(Math.max(1, Math.min(limit, 12)))
  if (term) request = request.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%,category.ilike.%${term}%`)
  const { data } = await request
  return (data ?? []).map((thread: any) => ({
    threadId: thread.id,
    title: thread.title,
    category: normalizeCategoryName(thread.category || thread.desk),
    href: `/forum/${encodeURIComponent(thread.slug || thread.id)}`,
    sourceStatus: thread.source_url ? "PRIMARY SOURCE" : "COMMUNITY THREAD",
  }))
}
