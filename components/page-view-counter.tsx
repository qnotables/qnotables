"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { incrementNewToQView } from "@/app/new-to-q/actions"

interface PageViewCounterProps {
  initialCount: number
}

export function PageViewCounter({ initialCount }: PageViewCounterProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    let active = true

    incrementNewToQView().then((total) => {
      if (active && total > 0) setCount(total)
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <span className="label-mono inline-flex items-center gap-2 text-xs text-muted-foreground" aria-label={`${count.toLocaleString()} page views`}>
      <Eye className="size-4 text-primary" aria-hidden="true" />
      <span>{count.toLocaleString()} {count === 1 ? "VIEW" : "VIEWS"}</span>
    </span>
  )
}
