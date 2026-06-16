import Link from "next/link"
import { ReactNode } from "react"

interface DeskCardProps {
  title: string
  href: string
  icon: ReactNode
  description?: string
}

export function DeskCard({ title, href, icon, description }: DeskCardProps) {
  return (
    <Link
      href={href}
      className="border border-border bg-card p-6 hover:border-primary transition-colors group"
    >
      <div className="mb-3 text-primary group-hover:text-primary/80 transition-colors">{icon}</div>
      <h3 className="stencil text-lg text-foreground">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
    </Link>
  )
}
