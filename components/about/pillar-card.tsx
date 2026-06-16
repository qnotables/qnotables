import { ReactNode } from "react"

interface PillarCardProps {
  title: string
  description: string
  icon: ReactNode
}

export function PillarCard({ title, description, icon }: PillarCardProps) {
  return (
    <div className="border border-border bg-card p-6 hover:border-primary transition-colors">
      <div className="mb-3 text-primary">{icon}</div>
      <h3 className="stencil text-lg text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
