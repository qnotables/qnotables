"use client"

import { Cake } from "lucide-react"

const BAKER_TOOLS_URL = "https://fullchan.net/?69f76167b0e9db85#2KQQMHeffEYVfu8gqZsdRHD9QkVSsoYd1a7sK5ZqM8fQ"

export function BakerToolsButton() {
  function openBakerTools() {
    window.open(
      BAKER_TOOLS_URL,
      "baker-tools",
      "popup=yes,width=720,height=560,resizable=yes,scrollbars=yes"
    )
  }

  return (
    <button
      type="button"
      onClick={openBakerTools}
      title="baker tools"
      aria-label="baker tools"
      className="flex-shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
    >
      <Cake className="h-6 w-6" aria-hidden="true" />
    </button>
  )
}
