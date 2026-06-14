type Level = "ROUTINE" | "PRIORITY" | "FLASH" | undefined

export function PriorityTag({ level }: { level?: Level }) {
  if (!level) return null

  const styles: Record<string, string> = {
    FLASH: "bg-primary text-primary-foreground",
    PRIORITY: "bg-secondary text-secondary-foreground",
    ROUTINE: "bg-muted text-muted-foreground border border-border",
  }

  return (
    <span className={`label-mono px-2 py-1 font-semibold ${styles[level]}`}>
      {level}
    </span>
  )
}
