"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent server-side rendering of next-themes to avoid script tag issues
  if (!mounted) {
    return <>{children}</>
  }

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <NextThemesProvider {...(props as any)}>
      {children}
    </NextThemesProvider>
  )
}
