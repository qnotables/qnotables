"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"

interface TextStatsProps {
  text?: string
  showTime?: boolean
}

export function TextStats({ text = "", showTime = false }: TextStatsProps) {
  const [stats, setStats] = useState({ words: 0, characters: 0, readingTime: 0 })

  useEffect(() => {
    const trimmed = text.trim()
    const characters = trimmed.length
    const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
    const readingTime = Math.max(1, Math.round(words / 180))
    setStats({ characters, words, readingTime })
  }, [text])

  return (
    <div className="label-mono flex items-center gap-3 text-xs text-muted-foreground">
      <span title="Word count">{stats.words} words</span>
      <span title="Character count">{stats.characters} chars</span>
      {showTime && (
        <span className="flex items-center gap-1" title="Estimated reading time">
          <Clock className="h-3 w-3" /> {stats.readingTime} min
        </span>
      )}
    </div>
  )
}
