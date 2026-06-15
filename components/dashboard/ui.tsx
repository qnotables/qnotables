import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface Breadcrumb {
  label: string
  href?: string
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  breadcrumbs?: Breadcrumb[]
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="label-mono flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <li>
                <Link href="/dashboard" className="transition-colors hover:text-foreground">
                  Dashboard
                </Link>
              </li>
              {breadcrumbs.map((crumb, i) => (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                  <span aria-hidden className="text-muted-foreground/50">/</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-foreground">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-2xl text-foreground md:text-3xl">{title}</h1>
        </div>
        {description ? (
          <p className="label-mono text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string
  value: number | string
  icon?: LucideIcon
  href?: string
}) {
  const inner = (
    <div className="corner-frame flex items-center justify-between border border-border bg-card p-4 transition-colors hover:border-primary">
      <div>
        <p className="label-mono text-[11px] uppercase text-muted-foreground">{label}</p>
        <p className="stencil mt-2 text-2xl text-foreground">{value}</p>
      </div>
      {Icon ? <Icon className="h-5 w-5 text-primary" /> : null}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-primary/15 text-primary border-primary/30",
  active: "bg-primary/15 text-primary border-primary/30",
  open: "bg-primary/15 text-primary border-primary/30",
  draft: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-muted text-muted-foreground border-border",
  hidden: "bg-muted text-muted-foreground border-border",
  inactive: "bg-muted text-muted-foreground border-border",
  reviewed: "bg-muted text-muted-foreground border-border",
  dismissed: "bg-muted text-muted-foreground border-border",
  archived: "bg-foreground/10 text-foreground border-border",
  suspended: "bg-foreground/10 text-foreground border-border",
  banned: "bg-destructive/15 text-destructive border-destructive/30",
  actioned: "bg-destructive/15 text-destructive border-destructive/30",
}

export function StatusBadge({ status }: { status: string }) {
  const key = (status || "").toLowerCase()
  return (
    <span
      className={cn(
        "label-mono inline-block border px-2 py-0.5 text-[10px] uppercase",
        STATUS_STYLES[key] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status || "—"}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <h2 className="stencil mb-2 text-lg text-foreground">{title}</h2>
      {description ? (
        <p className="label-mono mb-4 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-destructive/40 bg-destructive/10 px-4 py-3">
      <p className="label-mono text-sm text-destructive">{message}</p>
    </div>
  )
}

export function PrimaryButton({
  href,
  onClick,
  children,
  type = "button",
}: {
  href?: string
  onClick?: () => void
  children: React.ReactNode
  type?: "button" | "submit"
}) {
  const cls =
    "label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  )
}
