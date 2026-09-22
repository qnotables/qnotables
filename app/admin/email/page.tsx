import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Inbox } from "lucide-react"
import { getAdminUser } from "@/lib/admin"
import { isResendConfigured } from "@/lib/resend"
import { EmailSenderForm } from "@/components/admin/email-sender-form"

export const metadata = {
  title: "Send Email | qnotables.ai",
}

export default async function AdminEmailPage() {
  const admin = await getAdminUser()
  if (!admin) {
    redirect("/")
  }

  const configured = isResendConfigured()

  return (
    <div className="min-h-screen tactical-grid bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="stencil text-3xl text-foreground">Send Email</h1>
              <p className="label-mono mt-1 text-muted-foreground">// TRANSACTIONAL DISPATCH</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/email/inbox" className="label-mono flex items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <Inbox className="h-4 w-4" /> Read Email
              </Link>
              <Link
                href="/admin"
                className="label-mono flex items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        {!configured && (
          <div className="mb-6 border border-primary/40 bg-primary/5 p-4">
            <p className="label-mono text-foreground">Email sending is not configured</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add the <span className="text-foreground">RESEND_API_KEY</span> environment variable to enable
              outbound email.
            </p>
          </div>
        )}

        <p className="mb-6 text-sm text-muted-foreground">
          Send a single email to one recipient from the QNotables sender. Every send is logged to the
          activity log. This is for occasional one-off messages, not bulk campaigns.
        </p>

        <EmailSenderForm />
      </main>
    </div>
  )
}
