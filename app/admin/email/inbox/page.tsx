import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getAdminUser } from "@/lib/admin"
import { EmailInbox } from "@/components/admin/email-inbox"

export const metadata = { title: "Email Inbox | qnotables.ai" }

export default async function AdminEmailInboxPage() {
  if (!(await getAdminUser())) redirect("/")
  return (
    <div className="min-h-screen tactical-grid bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div><h1 className="stencil text-3xl text-foreground">Email Inbox</h1><p className="label-mono mt-1 text-muted-foreground">// RECEIVED + SENT</p></div>
            <Link href="/admin/email" className="label-mono flex items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"><ArrowLeft className="h-4 w-4" /> Send Email</Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6"><EmailInbox /></main>
    </div>
  )
}
