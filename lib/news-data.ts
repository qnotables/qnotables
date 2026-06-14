export type Category =
  | "WORLD"
  | "POLITICS"
  | "DEFENSE"
  | "ECONOMY"
  | "TECH"
  | "SCIENCE"
  | "ENERGY"
  | "OTHER"

export type Story = {
  id: string
  headline: string
  summary: string
  source: string
  category: Category
  minutesAgo: number
  readMinutes: number
  reports: number
  image?: string
  url?: string
  priority?: "ROUTINE" | "PRIORITY" | "FLASH"
}

export const categories: Category[] = [
  "WORLD",
  "POLITICS",
  "DEFENSE",
  "ECONOMY",
  "TECH",
  "SCIENCE",
  "ENERGY",
  "OTHER",
]

export const featured: Story = {
  id: "ftr-001",
  headline: "Allied Coalition Opens Coordinated Talks On Maritime Security Corridor",
  summary:
    "Delegations from twelve nations convened to draft a shared framework for protecting commercial shipping lanes, with monitoring stations and a joint reporting protocol expected within the quarter.",
  source: "Reuters Wire",
  category: "WORLD",
  minutesAgo: 14,
  readMinutes: 6,
  reports: 138,
  image: "/images/featured-world.png",
  priority: "FLASH",
}

export const topStories: Story[] = [
  {
    id: "st-002",
    headline: "Ground Station Network Expansion Clears Final Regulatory Review",
    summary:
      "A continent-wide array of tracking antennas received approval, promising lower-latency relays for civilian weather and navigation satellites.",
    source: "Associated Press",
    category: "TECH",
    minutesAgo: 41,
    readMinutes: 4,
    reports: 62,
    image: "/images/story-satellite.png",
    priority: "PRIORITY",
  },
  {
    id: "st-003",
    headline: "Container Throughput At Major Port Hits Record As Backlogs Ease",
    summary:
      "Logistics operators report the steepest month-over-month gain in two years, signaling renewed momentum across regional supply chains.",
    source: "Bloomberg",
    category: "ECONOMY",
    minutesAgo: 58,
    readMinutes: 5,
    reports: 47,
    image: "/images/story-port.png",
    priority: "ROUTINE",
  },
]

export const feed: Story[] = [
  {
    id: "fd-101",
    headline: "Central Banks Signal Caution As Inflation Readings Diverge",
    summary:
      "Policymakers across three continents struck a measured tone, holding rates steady while watching wage data closely.",
    source: "Financial Times",
    category: "ECONOMY",
    minutesAgo: 22,
    readMinutes: 4,
    reports: 31,
    priority: "PRIORITY",
  },
  {
    id: "fd-102",
    headline: "Research Team Publishes Open Dataset On Coastal Erosion Patterns",
    summary:
      "The multi-year survey maps shoreline change across forty sites, offering planners a public baseline for resilience work.",
    source: "Nature Briefing",
    category: "SCIENCE",
    minutesAgo: 73,
    readMinutes: 7,
    reports: 18,
  },
  {
    id: "fd-103",
    headline: "Grid Operators Trial Long-Duration Storage To Smooth Peak Demand",
    summary:
      "Pilot installations aim to bank surplus generation for evening loads, a step toward steadier baseload coverage.",
    source: "Associated Press",
    category: "ENERGY",
    minutesAgo: 96,
    readMinutes: 5,
    reports: 24,
  },
  {
    id: "fd-104",
    headline: "Parliament Advances Procurement Transparency Measure",
    summary:
      "The bill would require public disclosure of large contract awards, drawing rare cross-party support in committee.",
    source: "Reuters Wire",
    category: "POLITICS",
    minutesAgo: 120,
    readMinutes: 3,
    reports: 40,
  },
  {
    id: "fd-105",
    headline: "Defense Ministry Outlines Decade-Long Logistics Modernization",
    summary:
      "Officials detailed a phased plan to upgrade transport fleets and depots, emphasizing maintenance readiness over new acquisitions.",
    source: "Jane's Brief",
    category: "DEFENSE",
    minutesAgo: 145,
    readMinutes: 6,
    reports: 53,
    priority: "PRIORITY",
  },
  {
    id: "fd-106",
    headline: "Open-Source Mapping Project Crosses One Billion Edits",
    summary:
      "Volunteer contributors marked the milestone as the dataset becomes a backbone for humanitarian response tools.",
    source: "The Verge",
    category: "TECH",
    minutesAgo: 168,
    readMinutes: 4,
    reports: 12,
  },
  {
    id: "fd-107",
    headline: "Drought Monitor Upgrades Forecast Resolution For Farm Belt",
    summary:
      "A finer-grained model will let agricultural agencies issue district-level advisories weeks earlier than before.",
    source: "Bloomberg",
    category: "SCIENCE",
    minutesAgo: 201,
    readMinutes: 5,
    reports: 9,
  },
  {
    id: "fd-108",
    headline: "Trade Bloc Finalizes Tariff Schedule For Critical Minerals",
    summary:
      "Negotiators reached agreement on staged reductions intended to stabilize prices for battery and electronics manufacturers.",
    source: "Financial Times",
    category: "ECONOMY",
    minutesAgo: 233,
    readMinutes: 6,
    reports: 27,
  },
]

export const trending: { rank: number; headline: string; reports: number }[] = [
  { rank: 1, headline: "Maritime security corridor framework drafted", reports: 138 },
  { rank: 2, headline: "Ground station network expansion approved", reports: 62 },
  { rank: 3, headline: "Defense logistics modernization plan", reports: 53 },
  { rank: 4, headline: "Port container throughput record", reports: 47 },
  { rank: 5, headline: "Procurement transparency measure advances", reports: 40 },
]

export function formatAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}M AGO`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}H AGO`
  const days = Math.floor(hours / 24)
  return `${days}D AGO`
}
