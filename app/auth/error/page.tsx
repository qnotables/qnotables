import { AuthShell } from "@/components/auth-shell"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <AuthShell title="Authentication Error" subtitle="Something went wrong.">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {"We couldn't complete that request. The link may have expired or already been used."}
      </p>
      <Link
        href="/auth/login"
        className="label-mono mt-5 block bg-primary py-2.5 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Back to Sign In
      </Link>
    </AuthShell>
  )
}
