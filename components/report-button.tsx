"use client"

import { useState } from "react"
import { Flag, X, Check } from "lucide-react"
import { reportContent } from "@/app/forum/actions"

interface ReportButtonProps {
  contentType: "forum_thread" | "forum_reply"
  contentId: string
  isSignedIn: boolean
  /** Compact icon-only trigger (for reply rows). */
  compact?: boolean
}

const REASONS = [
  "Spam or advertising",
  "Harassment or abuse",
  "Off-topic",
  "Misinformation",
  "Other",
]

export function ReportButton({ contentType, contentId, isSignedIn, compact = false }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [details, setDetails] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [message, setMessage] = useState("")

  if (!isSignedIn) return null

  async function submit() {
    setStatus("submitting")
    setMessage("")
    const composed = reason === "Other" ? details : `${reason}${details ? ` — ${details}` : ""}`
    const res = await reportContent(contentType, contentId, composed)
    if (res.error) {
      setStatus("error")
      setMessage(res.error)
      return
    }
    setStatus("done")
    setMessage(res.alreadyReported ? "You already reported this." : "Report submitted. Thank you.")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="label-mono inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
        aria-label="Report this content"
        title="Report"
      >
        <Flag className="h-3.5 w-3.5" />
        {!compact && <span className="text-[10px]">REPORT</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Report content"
          onClick={() => status !== "submitting" && setOpen(false)}
        >
          <div
            className="corner-frame w-full max-w-md border border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="stencil flex items-center gap-2 text-lg text-foreground">
                <Flag className="h-4 w-4 text-primary" /> Report
              </h2>
              <button
                onClick={() => setOpen(false)}
                disabled={status === "submitting"}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {status === "done" ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <Check className="h-8 w-8 text-primary" />
                <p className="text-sm text-foreground">{message}</p>
                <button
                  onClick={() => setOpen(false)}
                  className="label-mono mt-2 border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="label-mono mb-1.5 block text-xs text-muted-foreground">Reason</label>
                  <div className="relative">
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="label-mono w-full appearance-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
                    >
                      {REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-mono mb-1.5 block text-xs text-muted-foreground">
                    Details {reason === "Other" && <span className="text-primary">(required)</span>}
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Add context for the moderators…"
                    className="w-full resize-none border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground/60"
                  />
                </div>

                {status === "error" && <p className="text-sm text-destructive">{message}</p>}

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    disabled={status === "submitting"}
                    className="label-mono border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={status === "submitting" || (reason === "Other" && details.trim().length < 4)}
                    className="label-mono bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {status === "submitting" ? "Submitting…" : "Submit report"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
