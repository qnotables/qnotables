"use client"

import { useActionState } from "react"
import { Check, Mail } from "lucide-react"
import { subscribeToNewsletter } from "@/app/new-to-q/actions"
import { initialNewsletterState } from "@/app/new-to-q/newsletter-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function BriefSignup() {
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletter,
    initialNewsletterState,
  )

  return (
    <section className="border border-border bg-secondary text-secondary-foreground">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <Mail aria-hidden="true" className="size-4" />
          <h2 className="stencil text-lg">Daily Briefing</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-secondary-foreground/80">
          One consolidated dispatch at 0600 local. Top signals, ranked. No noise.
        </p>

        {state.status === "success" ? (
          <div className="mt-4 flex items-center gap-2 border border-primary/50 bg-background px-3 py-3 text-foreground" role="status" aria-live="polite">
            <Check aria-hidden="true" className="size-4 text-primary" />
            <span className="label-mono">YOU ARE ON THE LIST</span>
          </div>
        ) : (
          <form action={formAction} className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input type="hidden" name="source" value="homepage-daily-briefing" />
            <label htmlFor="brief-email" className="sr-only">
              Email address
            </label>
            <Input
              id="brief-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="operator@email.com"
              aria-invalid={state.status === "error" || undefined}
              aria-describedby={state.status === "error" ? "brief-email-error" : undefined}
              disabled={pending}
              className="flex-1"
            />
            <Button type="submit" disabled={pending} className="label-mono">
              {pending && <Spinner data-icon="inline-start" />}
              {pending ? "Enlisting" : "Enlist"}
            </Button>
            {state.status === "error" && (
              <p id="brief-email-error" className="text-sm text-destructive sm:basis-full" role="alert">
                {state.message}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
