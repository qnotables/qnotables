import Link from "next/link"
import { ExternalLink, Radio } from "lucide-react"
import type { NotablesPost } from "@/app/actions/notables-actions"

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function NotablesImportsTable({
  items,
  total,
  error,
}: {
  items: NotablesPost[]
  total: number
  error?: string
}) {
  if (error) {
    return (
      <div className="border border-destructive/40 bg-destructive/10 px-4 py-4">
        <p className="label-mono text-xs text-destructive">{error}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
        <Radio className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <p className="label-mono mt-2 text-sm text-muted-foreground">No notables imported yet.</p>
        <p className="label-mono mt-1 text-xs text-muted-foreground">
          Use Refresh Notables above to run the dedicated notables importer.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="label-mono px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
              Title
            </th>
            <th className="label-mono px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
              Board
            </th>
            <th className="label-mono px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
              Source
            </th>
            <th className="label-mono px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
              Imported
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const sourceUrl = item.source_url ?? item.thread_url
            return (
              <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                <td className="max-w-md px-4 py-3">
                  {sourceUrl ? (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-start gap-1 font-medium text-foreground hover:text-primary hover:underline"
                    >
                      <span className="line-clamp-2">{item.title}</span>
                      <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{item.title}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="label-mono border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                    {item.board ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="label-mono text-xs text-muted-foreground">{item.source ?? "—"}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="label-mono text-xs text-muted-foreground">{formatDate(item.scraped_at)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {total > items.length && (
        <div className="border-t border-border px-4 py-3">
          <Link href="/notables" className="label-mono text-xs text-primary hover:underline">
            View all {total.toLocaleString()} imported notables
          </Link>
        </div>
      )}
    </div>
  )
}
