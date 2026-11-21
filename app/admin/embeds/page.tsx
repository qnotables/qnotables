import Link from "next/link"
import { redirect } from "next/navigation"
import { isAdminEmail } from "@/lib/admin"
import { providerColumns } from "@/lib/embed-policy"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { ProviderForm } from "./provider-form"

export const metadata = { title: "Embed providers | Editorial Dashboard" }

export default async function EmbedProvidersPage() {
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect("/")
  const db = createAdminClient()
  const [providers, diagnostics] = await Promise.all([
    db.from("embed_providers").select(providerColumns).order("origin").limit(200),
    db.from("embed_resolutions").select("origin,status").in("status", ["restricted", "unavailable"]).order("expires_at", { ascending: false }).limit(100),
  ])
  const failures = new Map<string, { origin: string; status: string; count: number }>()
  for (const { origin, status } of diagnostics.data ?? []) {
    const key = `${origin} ${status}`
    const entry = failures.get(key) ?? { origin, status, count: 0 }
    entry.count++
    failures.set(key, entry)
  }
  return (
    <main className="tactical-grid min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
        <header className="flex flex-col items-start gap-3 border-b border-border pb-6">
          <Link href="/admin" className="label-mono text-sm text-primary hover:underline">Editorial dashboard</Link>
          <h1 className="stencil text-3xl text-foreground">Embed providers</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">Choose which HTTPS origins can display inline content in Town Hall and Blog. Unapproved websites use source cards. Disable access immediately without republishing or deploying.</p>
        </header>
        {providers.error ? <p role="alert" className="border border-border bg-card p-4">Provider storage is unavailable.</p> : <>
          <section className="flex flex-col gap-3" aria-labelledby="add-provider"><h2 id="add-provider" className="stencil text-lg">Add a provider</h2><ProviderForm /></section>
          <section className="flex flex-col gap-3" aria-labelledby="provider-list"><h2 id="provider-list" className="stencil text-lg">Configured origins</h2><div className="grid gap-3 md:grid-cols-2">{providers.data.map((provider) => <ProviderForm key={JSON.stringify(provider)} provider={provider} />)}</div>{providers.data.length === 0 && <p className="text-sm text-muted-foreground">No providers are configured.</p>}</section>
        </>}
        <section className="flex flex-col gap-3" aria-labelledby="embed-diagnostics">
          <h2 id="embed-diagnostics" className="stencil text-lg">Recent compatibility issues</h2>
          <p className="text-sm text-muted-foreground">Latest cached failures, grouped by origin. Individual URLs and author information are not shown.</p>
          {diagnostics.error ? <p role="alert">Diagnostics are unavailable.</p> : failures.size === 0 ? <p className="text-sm text-muted-foreground">No recent issues recorded.</p> : <ul className="divide-y divide-border border border-border bg-card">{Array.from(failures.entries()).map(([key, { origin, count, status }]) => <li className="flex flex-wrap justify-between gap-2 p-3 text-sm" key={key}><span className="break-all">{origin}</span><span className="text-muted-foreground">{status === "restricted" ? "Framing restricted" : "Source unavailable"} · {count}</span></li>)}</ul>}
        </section>
      </div>
    </main>
  )
}
