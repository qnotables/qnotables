"use client"

import { Bookmark, Check, Copy, List, Share2 } from "lucide-react"
import { useEffect, useState } from "react"
import { ShareButtons } from "@/components/share-buttons"

export function ArticleReadingTools({ title, url }: { title: string; url: string }) {
  const [progress, setProgress] = useState(0)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollable > 0 ? Math.min(100, Math.round((window.scrollY / scrollable) * 100)) : 0)
    }
    updateProgress()
    window.addEventListener("scroll", updateProgress, { passive: true })
    window.addEventListener("resize", updateProgress)
    return () => {
      window.removeEventListener("scroll", updateProgress)
      window.removeEventListener("resize", updateProgress)
    }
  }, [])

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 h-1 bg-border/30 print:hidden" aria-hidden="true">
        <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setSaved((value) => !value)}
          className="label-mono inline-flex items-center gap-2 border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          aria-pressed={saved}
        >
          <Bookmark className="size-3.5" /> {saved ? "Saved" : "Save"}
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="label-mono inline-flex items-center gap-2 border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy link"}
        </button>
        <a href="#discussion" className="label-mono inline-flex items-center gap-2 border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <List className="size-3.5" /> Discussion
        </a>
        <ShareButtons title={title} url={url} className="border-border" />
      </div>
    </>
  )
}

export function ArticleDiscussionPrompt() {
  return (
    <section id="discussion" className="mt-14 border border-primary/30 bg-primary/5 p-6 md:p-8">
      <a href="#comments" className="group flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background">
        <Share2 className="mt-1 size-5 shrink-0 text-primary" />
        <span>
          <span className="label-mono block text-xs font-semibold text-primary">JOIN THE RECORD</span>
          <span className="stencil mt-2 block text-2xl text-foreground transition-colors group-hover:text-primary">Have context to add?</span>
          <span className="mt-2 block max-w-2xl leading-relaxed text-muted-foreground">Read closely, compare sources, and bring the next useful detail to the discussion below.</span>
        </span>
      </a>
    </section>
  )
}
