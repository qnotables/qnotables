"use client"

import { useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { incrementPostView } from "@/app/actions/blog-view-actions"

interface ViewCounterProps {
  postId: string
  initialCount: number
}

export function ViewCounter({ postId, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    // Increment on mount, update local count with returned total
    incrementPostView(postId).then((total) => {
      if (total > 0) setCount(total)
    })
  }, [postId])

  return (
    <span className="flex items-center gap-1">
      <Eye className="h-3.5 w-3.5" />
      {count.toLocaleString()} {count === 1 ? "VIEW" : "VIEWS"}
    </span>
  )
}
