export type ProfileTab = "posts" | "replies" | "saved" | "about"

export type ProfileTheme = {
  name: string
  accent: string
  background: string
}

export type MockProfile = {
  displayName: string
  username: string
  avatarUrl: string
  bannerUrl: string
  bio: string
  pronouns: string
  location: string
  joined: string
  website: string
  socialLinks: string[]
  topics: string[]
  stats: {
    posts: number
    replies: number
    helpful: number
    topics: number
    views: number
  }
  pinnedPost: {
    title: string
    excerpt: string
    date: string
  }
  posts: Array<{ title: string; excerpt: string; date: string; replies: number; topic: string }>
  replies: Array<{ title: string; excerpt: string; date: string; topic: string }>
  badges: Array<{ label: string; detail: string }>
  privacy: {
    hiddenDetails: string[]
    showActivity: boolean
    showLocation: boolean
    showFollowers: boolean
  }
  theme: ProfileTheme
}

export const profileThemes: ProfileTheme[] = [
  { name: "Harbor", accent: "teal", background: "slate" },
  { name: "Copperline", accent: "copper", background: "paper" },
  { name: "Field Notes", accent: "olive", background: "mist" },
]

export const profileTopics = ["Civic life", "Local reporting", "Technology", "Climate", "Culture", "Public records"]

export const mockProfile: MockProfile = {
  displayName: "Mara Vance",
  username: "maravance",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&auto=format",
  bannerUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1600&h=500&fit=crop&auto=format",
  bio: "Following the paper trail, sharing the useful bits, and making room for better questions.",
  pronouns: "she / her",
  location: "Portland, OR",
  joined: "Joined March 2024",
  website: "maravance.notes",
  socialLinks: ["x.com/maravance", "bsky.app/profile/maravance"],
  topics: ["Civic life", "Local reporting", "Public records"],
  stats: { posts: 28, replies: 146, helpful: 312, topics: 9, views: 1840 },
  pinnedPost: {
    title: "How to read a city budget without falling asleep",
    excerpt: "A practical starting point for finding the decisions hidden between the lines.",
    date: "Pinned 12 days ago",
  },
  posts: [
    { title: "The meeting notes are more revealing than the press release", excerpt: "Three small details worth keeping an eye on this week.", date: "2 days ago", replies: 18, topic: "Civic life" },
    { title: "A field guide to public records requests", excerpt: "What to ask for, how to ask clearly, and where the process usually slows down.", date: "May 18", replies: 34, topic: "Public records" },
  ],
  replies: [
    { title: "What counts as a useful source?", excerpt: "Start with the original document, then look for the context around it.", date: "Yesterday", topic: "Local reporting" },
    { title: "The neighborhood archive project", excerpt: "This is exactly the kind of patient collaboration that makes a community useful.", date: "May 20", topic: "Culture" },
  ],
  badges: [
    { label: "Field reporter", detail: "Consistent source-first contributor" },
    { label: "Helpful neighbor", detail: "312 helpful marks received" },
    { label: "Early member", detail: "Joined in the first year" },
  ],
  privacy: { hiddenDetails: ["follower count"], showActivity: true, showLocation: true, showFollowers: false },
  theme: profileThemes[0],
}

export function getProfileForEdit(): MockProfile {
  return structuredClone(mockProfile)
}
