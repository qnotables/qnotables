"use client"

import { NotebookPen } from "lucide-react"

const FULLCHAN_URL = "https://fullchan.net"

export function FullchanButton() {
  function openFullchan() {
    window.open(
      FULLCHAN_URL,
      "fullchan",
      "popup=yes,width=720,height=560,resizable=yes,scrollbars=yes"
    )
  }

  return (
    <button
      type="button"
      onClick={openFullchan}
      title="Fullchan"
      aria-label="Fullchan"
      className="flex-shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
    >
      <NotebookPen className="h-6 w-6" aria-hidden="true" />
    </button>
  )
}
