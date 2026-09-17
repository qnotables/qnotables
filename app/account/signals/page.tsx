import { redirect } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SavedSignalsList } from "@/components/saved-signals-list"
import { getSavedSignals } from "@/app/actions/signal-actions"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "My Signals",
  description: "Private saved signals for your QNotables account.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.qnotables.ai/account/signals" },
}

export default async function SavedSignalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/account/signals")
  const signals = await getSavedSignals()

  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <header className="mb-8 border-b border-border pb-6">
          <p className="label-mono text-xs font-bold text-primary">ACCOUNT / SIGNALS</p>
          <h1 className="stencil mt-3 text-3xl text-foreground md:text-4xl">My Saved Signals</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Private archive and dossier records collected from the wire, notables, and other eligible feeds.</p>
        </header>
        <SavedSignalsList initialSignals={signals} />
      </main>
      <SiteFooter />
    </div>
  )
}
