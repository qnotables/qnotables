import Link from "next/link"
import { Radio } from "lucide-react"

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="tactical-grid flex min-h-svh w-full flex-col items-center justify-center p-6">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Radio className="h-7 w-7 text-primary" aria-hidden="true" />
        <span className="stencil text-3xl text-foreground">Hot and Fresh</span>
      </Link>
      <div className="w-full max-w-sm border border-border bg-card">
        <div className="border-b border-border bg-secondary px-5 py-4 text-secondary-foreground">
          <h1 className="stencil text-xl">{title}</h1>
          <p className="mt-1 text-sm text-secondary-foreground/80">{subtitle}</p>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
