"use client"

import { useEffect, useId, useState } from "react"
import { previewPublishingEmbed } from "@/app/actions/publishing-embed-actions"
import { PublishingEmbedCard } from "@/components/publishing-embed"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { embedModeLabels, embedModes, type PublishingEmbed } from "@/lib/publishing-embed"

type Mode = PublishingEmbed["payload"]["mode"]

export function PublishingEmbedDialog({ existing, initialInput = "", onClose, onApply }: {
  existing?: PublishingEmbed; initialInput?: string; onClose: () => void; onApply: (block: PublishingEmbed) => void
}) {
  const saved = existing?.payload
  const [url, setUrl] = useState(initialInput.startsWith("<") ? "" : initialInput || saved?.url || "")
  const [code, setCode] = useState(initialInput.startsWith("<") ? initialInput : saved?.html || "")
  const [mode, setMode] = useState<Mode>(saved?.mode ?? "auto")
  const [width, setWidth] = useState(saved?.width ?? 720)
  const [height, setHeight] = useState(saved?.height ?? 405)
  const [preview, setPreview] = useState<PublishingEmbed | null>(existing ?? null)
  const [status, setStatus] = useState("")
  const [failure, setFailure] = useState("")
  const [pending, setPending] = useState(false)
  const id = useId()

  useEffect(() => {
    if (!url.trim() && !code.trim()) return
    let stale = false
    const timer = setTimeout(async () => {
      setPending(true)
      try {
        const result = await previewPublishingEmbed({ url, code, mode, width, height, existing })
        if (stale) return
        if (result.error !== null) {
          setFailure(result.error || "Embed preview failed.")
          return
        }
        setPreview(result.block)
        setStatus(result.status === "compatible" ? "Inline content is available when the provider permits it." : result.status === "unavailable" ? "Metadata unavailable. The original source link will still be shown." : "This source will display as a link preview or citation.")
      } catch {
        if (!stale) setFailure("Embed preview failed. Try again.")
      } finally {
        if (!stale) setPending(false)
      }
    }, 650)
    return () => { stale = true; clearTimeout(timer) }
  }, [url, code, mode, width, height, existing])

  function change(update: () => void) {
    setPreview(null)
    setFailure("")
    setStatus("")
    setPending(false)
    update()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl" finalFocus={false}>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit embed" : "Insert embed"}</DialogTitle>
          <DialogDescription>Paste a public URL or one iframe snippet. Restricted sites fall back to an attributed link. Only administrators can use static custom HTML.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field><FieldLabel htmlFor={`${id}-url`}>Website or media URL</FieldLabel><Input id={`${id}-url`} inputMode="url" placeholder="https://example.com/article" maxLength={2048} value={url} onChange={(event) => change(() => setUrl(event.target.value))} /></Field>
          <Field><FieldLabel htmlFor={`${id}-code`}>Embed HTML (optional)</FieldLabel><textarea id={`${id}-code`} maxLength={4000} rows={3} spellCheck={false} className="w-full rounded-md border border-input bg-background p-2 font-mono text-sm" value={code} onChange={(event) => change(() => setCode(event.target.value))} /></Field>
          <Field><FieldLabel htmlFor={`${id}-mode`}>Display mode</FieldLabel><select id={`${id}-mode`} className="w-full rounded-md border border-input bg-background p-2" value={mode} onChange={(event) => change(() => setMode(event.target.value as Mode))}>{embedModes.map((item) => <option key={item} value={item}>{embedModeLabels[item]}</option>)}</select></Field>
          <FieldGroup className="grid grid-cols-2 gap-3">
            <Field><FieldLabel htmlFor={`${id}-width`}>Width (px)</FieldLabel><Input id={`${id}-width`} type="number" min={240} max={1600} value={width || ""} onChange={(event) => change(() => setWidth(Number(event.target.value)))} /></Field>
            <Field><FieldLabel htmlFor={`${id}-height`}>Height (px)</FieldLabel><Input id={`${id}-height`} type="number" min={135} max={1200} value={height || ""} onChange={(event) => change(() => setHeight(Number(event.target.value)))} /></Field>
          </FieldGroup>
        </FieldGroup>
        <div aria-live="polite" className="text-sm text-muted-foreground">{pending ? "Checking the source…" : status}</div>
        {failure && <p role="alert" className="text-sm text-destructive">{failure}</p>}
        {preview && <PublishingEmbedCard key={preview.proof} block={preview} />}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" disabled={!preview || pending} onClick={() => { if (preview) onApply(preview) }}>{existing ? "Save embed" : "Insert embed"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
