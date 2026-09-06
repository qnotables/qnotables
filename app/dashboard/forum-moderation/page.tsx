import Link from "next/link"
import { ArrowLeft, CheckCircle2, ClipboardList, Flag, ShieldAlert } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAdminUser } from "@/lib/admin"
import { createAdminClient } from "@/lib/supabase/admin"
import { pageMetadata } from "@/lib/seo"

export const dynamic = "force-dynamic"
export const metadata = pageMetadata({ title: "Forum Moderation", description: "Town Hall moderation queue and transparent moderation log.", path: "/dashboard/forum-moderation" })

export default async function ForumModerationPage() {
  const admin = await getAdminUser()
  if (!admin) return <div className="min-h-screen tactical-grid"><SiteHeader /><main className="mx-auto max-w-3xl px-4 py-20 text-center"><ShieldAlert className="mx-auto size-10 text-muted-foreground" /><h1 className="stencil mt-5 text-3xl text-foreground">Admin access required</h1><p className="mt-2 text-sm text-muted-foreground">This moderation workspace is limited to Town Hall administrators.</p><Link href="/forum" className="label-mono mt-6 inline-block text-primary hover:underline">Return to Town Hall</Link></main><SiteFooter /></div>

  const supabase = createAdminClient()
  const { data: flags } = await supabase.from("moderation_flags").select("id, content_type, content_id, reason, status, created_at").order("created_at", { ascending: false }).limit(50)
  const openFlags = (flags ?? []).filter((flag) => flag.status === "open")
  return <div className="min-h-screen tactical-grid"><SiteHeader /><main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:px-6"><div><Link href="/forum" className="label-mono inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="size-3" /> Town Hall</Link><div className="label-mono mt-8 text-xs text-primary">ADMIN / MODERATION DESK</div><h1 className="stencil mt-2 text-4xl text-foreground">Keep the record usable.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Review reports consistently, record why an action was taken, and leave a clear trail for appeals.</p></div><div className="grid gap-4 md:grid-cols-3"><StatCard icon={<Flag className="size-5" />} label="Open reports" value={openFlags.length} /><StatCard icon={<ClipboardList className="size-5" />} label="All reports" value={flags?.length ?? 0} /><StatCard icon={<CheckCircle2 className="size-5" />} label="Resolved" value={(flags ?? []).filter((flag) => flag.status === "resolved").length} /></div><Card><CardHeader><CardTitle>Reported posts</CardTitle></CardHeader><CardContent>{flags && flags.length > 0 ? <div className="flex flex-col gap-3">{flags.map((flag) => <div key={flag.id} className="flex flex-col gap-3 border border-border p-4 md:flex-row md:items-center md:justify-between"><div><div className="label-mono text-[10px] text-muted-foreground">{flag.content_type} · {new Date(flag.created_at).toLocaleDateString()}</div><p className="mt-1 text-sm font-medium text-foreground">{flag.reason || "No reason supplied"}</p><p className="mt-1 text-xs text-muted-foreground">Content ID: {flag.content_id}</p></div><Badge variant={flag.status === "open" ? "destructive" : "secondary"}>{flag.status}</Badge></div>)}</div> : <div className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No reports are waiting for review.</div>}</CardContent></Card><Card><CardHeader><CardTitle>Moderation log</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Every report should end with a reasoned action: resolved, dismissed, escalated, or appealed. When action metadata is available, it will appear here alongside the original report.</p></CardContent></Card></main><SiteFooter /></div>
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <Card><CardContent className="flex items-center justify-between p-5"><div className="text-primary">{icon}<p className="label-mono mt-3 text-[10px] text-muted-foreground">{label}</p></div><span className="stencil text-3xl text-foreground">{value}</span></CardContent></Card> }
