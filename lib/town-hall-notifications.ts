import { SITE_URL } from "@/lib/seo"

type TownHallNotification = {
  kind: "thread" | "reply"
  threadId: string
  threadSlug?: string | null
  threadTitle?: string | null
  pending: boolean
}

export async function notifyTownHallActivity(notification: TownHallNotification) {
  const webhookUrl = process.env.SLACK_TOWN_HALL_WEBHOOK_URL
  if (!webhookUrl) return

  const threadPath = notification.threadSlug
    ? `/forum/${notification.threadSlug}`
    : `/forum/${notification.threadId}`
  const state = notification.pending ? "pending moderation" : "published"
  const kind = notification.kind === "thread" ? "New Town Hall thread" : "New Town Hall reply"
  const title = notification.threadTitle ? `: ${notification.threadTitle}` : ""

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${kind}${title} (${state})\n${new URL(threadPath, SITE_URL).toString()}`,
      }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (error) {
    console.error("Town Hall Slack notification failed", error)
  }
}
