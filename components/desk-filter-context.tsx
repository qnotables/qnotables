"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type DeskFilterContextValue = {
  active: string
  setActive: (cat: string) => void
}

const DeskFilterContext = createContext<DeskFilterContextValue | null>(null)

export function DeskFilterProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<string>("ALL")
  return (
    <DeskFilterContext.Provider value={{ active, setActive }}>
      {children}
    </DeskFilterContext.Provider>
  )
}

export function useDeskFilter() {
  const ctx = useContext(DeskFilterContext)
  if (!ctx) {
    throw new Error("useDeskFilter must be used within a DeskFilterProvider")
  }
  return ctx
}
