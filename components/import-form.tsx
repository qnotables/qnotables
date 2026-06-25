"use client"

import { useState } from "react"
import { Upload, AlertCircle, CheckCircle, Loader } from "lucide-react"
import {
  parseCSV,
  parseJSON,
  parseRSSItems,
  extractFrontmatter,
  extractTitle,
  extractExcerpt,
  parseDate,
} from "@/lib/import-utils"
import type { ImportPostInput, ImportResult } from "@/app/actions/import-posts"
import { importPosts } from "@/app/actions/import-posts"

export function ImportForm() {
  const [format, setFormat] = useState<"csv" | "json" | "markdown" | "rss">("csv")
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState("")
  const [parsed, setParsed] = useState<ImportPostInput[]>([])
  const [error, setError] = useState("")
  const [results, setResults] = useState<ImportResult[]>([])

  const handleParse = () => {
    setError("")
    setParsed([])

    if (!content.trim()) {
      setError("Please enter or upload content")
      return
    }

    try {
      let posts: ImportPostInput[] = []

      if (format === "csv") {
        const rows = parseCSV(content)
        posts = rows.map((row) => ({
          title: row.title || "",
          excerpt: row.excerpt || "",
          author: row.author || "HOT AND FRESH",
          content: row.content || row.body || "",
          tag: row.tag || "News",
          category: row.category || "General",
          publishedAt: row.published_at ? parseDate(row.published_at)?.split("T")[0] : undefined,
          sourceUrl: row.source_url,
          sourceName: row.source_name,
          coverImage: row.cover_image,
        }))
      } else if (format === "json") {
        const parsed = parseJSON(content)
        posts = parsed.map((p) => ({
          title: p.title || "",
          excerpt: p.excerpt || "",
          author: p.author || "HOT AND FRESH",
          content: p.content || "",
          tag: p.tag || "News",
          category: p.category,
          publishedAt: p.publishedAt,
          sourceUrl: p.sourceUrl,
          sourceName: p.sourceName,
          coverImage: p.coverImage,
        }))
      } else if (format === "markdown") {
        const mdPosts = content.split(/\n---\n/).filter((m) => m.trim())
        posts = mdPosts.map((md) => {
          const { frontmatter, content: body } = extractFrontmatter(md)
          return {
            title: extractTitle(md) || frontmatter.title || "Untitled",
            excerpt: extractExcerpt(md) || frontmatter.excerpt || "",
            author: frontmatter.author || "HOT AND FRESH",
            content: body || md,
            tag: frontmatter.tag || "News",
            category: frontmatter.category,
            publishedAt: frontmatter.published_at || frontmatter.date,
            sourceUrl: frontmatter.source_url,
            sourceName: frontmatter.source_name,
            coverImage: frontmatter.cover_image,
          }
        })
      } else if (format === "rss") {
        posts = parseRSSItems(content).map((p) => ({
          title: p.title || "",
          excerpt: p.excerpt || "",
          author: p.author || "HOT AND FRESH",
          content: p.content || "",
          tag: p.tag || "News",
          category: p.category,
          publishedAt: p.publishedAt,
          sourceUrl: p.sourceUrl,
          sourceName: p.sourceName,
          coverImage: p.coverImage,
        }))
      }

      if (posts.length === 0) {
        setError("No posts found in the content")
        return
      }

      setParsed(posts)
    } catch (err) {
      setError(`Parse error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleImport = async () => {
    if (parsed.length === 0) {
      setError("No posts to import")
      return
    }

    setLoading(true)
    setError("")
    setResults([])

    // Server Actions have a ~1MB request body limit. Large feeds (e.g. 100 posts
    // with full bodies) exceed it, so import in chunks and aggregate the results.
    const CHUNK_SIZE = 20
    const allResults: ImportResult[] = []

    try {
      for (let i = 0; i < parsed.length; i += CHUNK_SIZE) {
        const chunk = parsed.slice(i, i + CHUNK_SIZE)
        const res = await importPosts(chunk)
        allResults.push(...res)
        // Show progress as each chunk completes
        setResults([...allResults])
      }

      const failCount = allResults.filter((r) => !r.success).length
      if (failCount === 0) {
        setContent("")
        setParsed([])
      }
    } catch (err) {
      setError(`Import error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === "string") {
        setContent(text)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {/* Format Selector */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="label-mono mb-3 text-sm font-medium">Import Format</h3>
        <div className="flex flex-wrap gap-2">
          {(["csv", "json", "markdown", "rss"] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              className={`rounded border px-3 py-1 text-sm transition-colors ${
                format === fmt
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary"
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* File Upload or Text Input */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="label-mono mb-3 text-sm font-medium">Content</h3>

        <div className="mb-3 flex gap-2">
          <label className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm hover:bg-muted cursor-pointer">
            <Upload className="h-4 w-4" />
            Upload File
            <input
              type="file"
              accept=".csv,.json,.md,.mdx,.xml,.rss"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Paste ${format.toUpperCase()} content here...`}
          className="w-full h-48 rounded border border-border bg-background p-3 font-mono text-sm"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 flex gap-2">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Parse Button */}
      <button
        onClick={handleParse}
        disabled={!content.trim()}
        className="w-full rounded bg-primary py-2 text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
      >
        Parse {format.toUpperCase()}
      </button>

      {/* Preview */}
      {parsed.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="label-mono mb-3 text-sm font-medium">Preview ({parsed.length} posts)</h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {parsed.map((post, idx) => (
              <div key={idx} className="text-sm border-l-2 border-primary pl-3 py-2">
                <p className="font-medium text-foreground line-clamp-1">{post.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Button */}
      {parsed.length > 0 && (
        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full rounded bg-green-600 py-2 text-white font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader className="h-4 w-4 animate-spin" />}
          Import {parsed.length} Posts
        </button>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="label-mono mb-3 text-sm font-medium">Import Results</h3>
          <div className="space-y-1 text-sm max-h-48 overflow-y-auto">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 py-1"
              >
                {result.success ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">
                      <span className="text-foreground font-medium">{result.slug}</span>
                      {" "}imported
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-destructive">{result.error}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
