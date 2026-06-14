import { AuthShell } from "@/components/auth-shell"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <AuthShell title="Check Your Email" subtitle="One more step to activate your account.">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {
          "We've sent a confirmation link to your inbox. Confirm your email to activate your account, then sign in to start posting."
        }
      </p>
      <Link
        href="/auth/login"
        className="label-mono mt-5 block bg-primary py-2.5 text-center font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Go to Sign In
      </Link>
    </AuthShell>
  )
}
