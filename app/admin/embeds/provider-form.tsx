"use client"

import { useActionState, useId } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { embedModeLabels, embedModes } from "@/lib/publishing-embed"
import { saveEmbedProvider } from "./actions"

export interface EmbedProvider {
  origin: string; enabled: boolean; allow_frame: boolean; allow_media: boolean; allow_preview: boolean; default_mode: string
}

export function ProviderForm({ provider }: { provider?: EmbedProvider }) {
  const [status, action, pending] = useActionState(saveEmbedProvider, "")
  const id = useId()
  return (
    <form action={action} className="flex min-w-0 flex-col gap-4 border border-border bg-card p-4 sm:p-5">
      <FieldGroup>
        <Field><FieldLabel htmlFor={`${id}-origin`}>HTTPS origin</FieldLabel><Input id={`${id}-origin`} name="origin" placeholder="https://player.example.com" readOnly={Boolean(provider)} defaultValue={provider?.origin} required maxLength={260} /></Field>
        <Field><FieldLabel htmlFor={`${id}-mode`}>Default display</FieldLabel><select id={`${id}-mode`} name="default_mode" defaultValue={provider?.default_mode || "auto"} className="rounded-md border border-input bg-background p-2 text-sm">{embedModes.map((item) => <option key={item} value={item}>{embedModeLabels[item]}</option>)}</select></Field>
      </FieldGroup>
      <fieldset className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
        <legend className="mb-2 text-sm font-medium">Permissions</legend>
        {([
          ["enabled", "Enabled", true], ["allow_frame", "Iframes", false], ["allow_media", "Inline media", false], ["allow_preview", "Rich previews", true],
        ] as const).map(([key, label, initial]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" name={key} defaultChecked={provider?.[key] ?? initial} />{label}</label>)}
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <Button disabled={pending} type="submit" name="operation" value="save" size="sm">{pending ? "Working…" : provider ? "Save changes" : "Add provider"}</Button>
        {provider && <Button disabled={pending} type="submit" name="operation" value="remove" size="sm" variant="outline">Remove</Button>}
        <span role="status" className="text-sm text-muted-foreground">{status}</span>
      </div>
    </form>
  )
}
