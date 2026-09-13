"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Archive, Check, FolderKanban, LoaderCircle, MessageSquarePlus, MoreHorizontal, Search } from "lucide-react"
import { saveSignalAction, toggleSignalAction } from "@/app/actions/signal-actions"
import { buildResearchHref, buildThreadDraftHref, type Signal, type SignalActionType } from "@/lib/signals"

const ACTIONS: Array<{ type: SignalActionType; label: string; icon: typeof Archive }> = [
  { type: "archive", label: "Save to archive", icon: Archive },
  { type: "research", label: "Research signal", icon: Search },
  { type: "thread_draft", label: "Draft Town Hall thread", icon: MessageSquarePlus },
  { type: "dossier", label: "Add to dossier", icon: FolderKanban },
]

type Props = {
  signal: Signal
  isLoggedIn?: boolean
  activeActions?: SignalActionType[]
}

export function SignalActionMenu({ signal, isLoggedIn = false, activeActions = [] }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<SignalActionType[]>(activeActions)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open])

  function redirectToLogin() {
    const next = `${window.location.pathname}${window.location.search}${window.location.hash}`
    window.location.assign(`/auth/login?next=${encodeURIComponent(next)}`)
  }

  function handleAction(type: SignalActionType) {
    setError(null)
    if (!isLoggedIn) {
      redirectToLogin()
      return
    }

    startTransition(async () => {
      try {
        if (type === "archive" || type === "dossier") {
          const result = await toggleSignalAction(signal, type)
          setActive((current) => result.active ? [...new Set([...current, type])] : current.filter((item) => item !== type))
        } else {
          await saveSignalAction(signal, type)
          window.location.assign(type === "research" ? buildResearchHref(signal) : buildThreadDraftHref(signal))
        }
        setOpen(false)
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Unable to complete this action.")
      }
    })
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Signal actions for ${signal.title}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="flex h-7 w-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {pending ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>

      {open && (
        <div role="menu" aria-label="Signal actions" className="absolute right-0 top-full z-30 mt-2 w-56 border border-border bg-popover p-1 text-popover-foreground shadow-xl">
          {ACTIONS.map(({ type, label, icon: Icon }) => {
            const isActive = active.includes(type)
            return (
              <button
                key={type}
                type="button"
                role="menuitem"
                disabled={pending}
                onClick={() => handleAction(type)}
                className="flex min-h-10 w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:bg-muted focus-visible:outline-none disabled:opacity-60"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-primary" aria-label="Saved" />}
              </button>
            )
          })}
          {error && <p role="status" className="border-t border-border px-3 py-2 text-[11px] leading-relaxed text-destructive">{error}</p>}
        </div>
      )}
    </div>
  )
}
