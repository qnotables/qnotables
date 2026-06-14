"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type DeskFilterContextValue = {
  active: string
  setActive: (cat: string) => void
}

const DeskFilterContext = createContext<DeskFilterContextValue | null>(null)

export function DeskFilterProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string>("NOTABLES")
  return (
    <DeskFilterContext.Provider value={{ active, setActive }}>
      {children}
    </DeskFilterContext.Provider>
  )
}

// Returns a no-op fallback when used outside a provider (e.g. on the blog/forum
// pages) so the shared SiteHeader can render on every route without crashing.
export function useDeskFilter() {
  const ctx = useContext(DeskFilterContext)
  if (!ctx) {
    return { active: "NOTABLES", setActive: () => {} }
  }
  return ctx
}
