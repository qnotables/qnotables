"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/dashboard/ui"

export type SubscriberRow = {
  id: string
  email: string
  source: string
  createdAt: string
}

const sourceLabels: Record<string, string> = {
  "homepage-daily-briefing": "Daily Briefing",
  "new-to-q": "New to Q",
}

function sourceLabel(source: string) {
  return sourceLabels[source] ?? source.replaceAll("-", " ")
}

export function SubscribersTable({ subscribers }: { subscribers: SubscriberRow[] }) {
  const [query, setQuery] = useState("")
  const [source, setSource] = useState("all")

  const sources = useMemo(
    () => Array.from(new Set(subscribers.map((subscriber) => subscriber.source))).sort(),
    [subscribers],
  )

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return subscribers.filter((subscriber) => {
      const matchesSource = source === "all" || subscriber.source === source
      const matchesQuery = !normalizedQuery || subscriber.email.toLowerCase().includes(normalizedQuery)
      return matchesSource && matchesQuery
    })
  }, [query, source, subscribers])

  return (
    <section className="border border-border bg-card" aria-labelledby="subscriber-list-title">
      <div className="flex flex-col gap-4 border-b border-border p-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 id="subscriber-list-title" className="stencil text-lg text-foreground">Subscriber List</h2>
          <p className="label-mono mt-1 text-xs text-muted-foreground" aria-live="polite">
            Showing {filtered.length} of {subscribers.length} subscribers
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 sm:w-72">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="subscriber-search" className="sr-only">Search subscriber emails</label>
            <Input
              id="subscriber-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search email addresses"
              className="pl-9"
            />
          </div>
          <Select value={source} onValueChange={(value) => setSource(value ?? "all")}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by signup source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="all">All sources</SelectItem>
                {sources.map((item) => (
                  <SelectItem key={item} value={item}>{sourceLabel(item)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-4">
          <EmptyState
            title={subscribers.length === 0 ? "No subscribers yet" : "No matching subscribers"}
            description={subscribers.length === 0 ? "New signups will appear here." : "Try another email or signup source."}
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Subscribed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell className="font-medium text-foreground">{subscriber.email}</TableCell>
                <TableCell><Badge variant="outline">{sourceLabel(subscriber.source)}</Badge></TableCell>
                <TableCell className="text-muted-foreground">
                  {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(subscriber.createdAt))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
