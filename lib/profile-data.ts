import { createClient } from "@/lib/supabase/server"
import { mockProfile, type MockProfile } from "@/lib/mock-profile"

type ProfileRow = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  location: string | null
  website_url: string | null
  social_links: Record<string, string> | string[] | null
  privacy: Record<string, boolean> | null
  created_at: string
  karma: number | null
}

type FeaturedRow = { id: string; source_type: "thread" | "media" | "asset"; source_id: string; position: number }
type ThreadRow = { id: string; slug: string | null; title: string; body: string | null; created_at: string }
type ReplyRow = { id: string; body: string; created_at: string; thread_id: string; forum_threads: { title: string } | null }
type MediaRow = { id: string; image_url: string; title: string | null; alt_text: string | null; file_type: string | null; created_at: string }

function socialLinks(value: ProfileRow["social_links"]): string[] {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? Object.values(value).filter(Boolean) : []
}

export function toProfileView(row: ProfileRow, activity?: Partial<MockProfile>): MockProfile {
  const privacy = row.privacy ?? {}
  return {
    ...mockProfile,
    ...activity,
    displayName: row.display_name || "Community member",
    username: row.username || row.id.slice(0, 8),
    avatarUrl: row.avatar_url || mockProfile.avatarUrl,
    bannerUrl: row.banner_url || mockProfile.bannerUrl,
    bio: row.bio || "Sharing useful notes with the community.",
    location: row.location || "",
    joined: `Joined ${new Date(row.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    website: row.website_url || "",
    socialLinks: socialLinks(row.social_links),
    privacy: {
      ...mockProfile.privacy,
      ...privacy,
      showLocation: privacy.show_location ?? privacy.showLocation ?? true,
      showFollowers: privacy.show_followers ?? privacy.showFollowers ?? false,
      showActivity: privacy.show_activity ?? privacy.showActivity ?? true,
    },
  }
}

export async function getProfileHub(profileId: string) {
  const supabase = await createClient()
  const [{ data: profile }, { data: threads }, { data: replies }, { data: media }, { data: featured }] = await Promise.all([
    supabase.from("profiles").select("id, display_name, username, avatar_url, banner_url, bio, location, website_url, social_links, privacy, created_at, karma").eq("id", profileId).maybeSingle(),
    supabase.from("forum_threads").select("id, slug, title, body, created_at").eq("author_id", profileId).eq("is_soft_deleted", false).order("created_at", { ascending: false }).limit(24),
    supabase.from("forum_replies").select("id, body, created_at, thread_id, forum_threads(title)").eq("author_id", profileId).order("created_at", { ascending: false }).limit(24),
    supabase.from("gallery_images").select("id, image_url, title, alt_text, file_type, created_at").eq("user_id", profileId).eq("approved", true).order("created_at", { ascending: false }).limit(24),
    supabase.from("profile_featured_items").select("id, source_type, source_id, position").eq("profile_id", profileId).order("position", { ascending: true }),
  ])
  if (!profile) return null

  const threadRows = (threads ?? []) as ThreadRow[]
  const replyRows = (replies ?? []) as unknown as ReplyRow[]
  const mediaRows = (media ?? []) as MediaRow[]
  const view = toProfileView(profile as ProfileRow, {
    stats: { ...mockProfile.stats, posts: threadRows.length, replies: replyRows.length, views: 0 },
    posts: threadRows.map((thread) => ({ id: thread.id, title: thread.title, excerpt: thread.body?.slice(0, 180) ?? "", date: new Date(thread.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), replies: 0, topic: "Community" })),
    replies: replyRows.map((reply) => ({ id: reply.id, title: reply.forum_threads?.title ?? "Community discussion", excerpt: reply.body.slice(0, 180), date: new Date(reply.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), topic: "Reply" })),
    media: mediaRows.map((item) => ({ id: item.id, title: item.title || "Untitled upload", altText: item.alt_text || item.title || "Community upload", imageUrl: item.image_url, date: item.created_at, href: `/u/${profileId}`, isVideo: item.file_type?.startsWith("video/") })),
    featured: [],
  })

  const featuredItems = (featured ?? []) as FeaturedRow[]
  const featuredThreads = featuredItems.filter((item) => item.source_type === "thread").map((item) => threadRows.find((thread) => thread.id === item.source_id)).filter(Boolean)
  view.featured = featuredThreads.map((thread) => ({ id: thread!.id, type: "thread", title: thread!.title, excerpt: thread!.body?.slice(0, 180) ?? "", date: thread!.created_at, href: `/forum/${thread!.slug || thread!.id}` }))
  return view
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return getProfileHub(user.id)
}
