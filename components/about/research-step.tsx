interface ResearchStepProps {
  number: number
  title: string
  description: string
}

export function ResearchStep({ number, title, description }: ResearchStepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center border border-primary bg-primary/10">
          <span className="stencil text-sm font-bold text-primary">{number}</span>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="stencil text-lg text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
