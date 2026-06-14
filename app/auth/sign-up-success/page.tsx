import { AuthShell } from "@/components/auth-shell"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <AuthShell title="Account Created" subtitle="Welcome to the discussion.">
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {"Your account is ready. You can now sign in and start posting."}
        </p>
        <p className="text-xs italic text-muted-foreground">
          {
            "Note: Email verification will be required in production to prevent spam. For now, development mode allows immediate access."
          }
        </p>
      </div>
      <Link
        href="/auth/login"
        className="label-mono mt-5 block bg-primary py-2.5 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Go to Sign In
      </Link>
    </AuthShell>
  )
}
