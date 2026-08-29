"use client"

import { useActionState, useState } from "react"
import { MailIcon } from "lucide-react"
import { subscribeToNewsletter } from "@/app/new-to-q/actions"
import { initialNewsletterState } from "@/app/new-to-q/newsletter-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function NewsletterSignupDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletter,
    initialNewsletterState,
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" />}>
        <MailIcon data-icon="inline-start" />
        Subscribe for Updates
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="label-mono text-primary">Stay informed</p>
          <DialogTitle className="stencil text-2xl">Subscribe for Updates</DialogTitle>
          <DialogDescription className="leading-relaxed">
            Receive occasional updates about this website and future projects.
          </DialogDescription>
        </DialogHeader>

        {state.status === "success" ? (
          <div className="flex flex-col gap-4 py-2" role="status" aria-live="polite">
            <p className="text-pretty leading-relaxed text-foreground">{state.message}</p>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form action={formAction}>
            <FieldGroup>
              <Field data-invalid={state.status === "error" || undefined}>
                <FieldLabel htmlFor="newsletter-email">Email address</FieldLabel>
                <Input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  maxLength={254}
                  aria-invalid={state.status === "error" || undefined}
                  aria-describedby="newsletter-email-description newsletter-email-error"
                  disabled={pending}
                />
                <FieldDescription id="newsletter-email-description">
                  No spam. Unsubscribe whenever you like.
                </FieldDescription>
                {state.status === "error" && (
                  <FieldError id="newsletter-email-error" role="alert">
                    {state.message}
                  </FieldError>
                )}
              </Field>
              <Button type="submit" size="lg" disabled={pending}>
                {pending && <Spinner data-icon="inline-start" />}
                {pending ? "Subscribing..." : "Join the Mailing List"}
              </Button>
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
