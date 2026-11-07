"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => undefined,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    let nextTheme: Theme = "dark"
    try {
      nextTheme = window.localStorage.getItem("theme") === "light" ? "light" : "dark"
    } catch {
      // Storage can be blocked in embedded previews or privacy-restricted browsers.
    }
    setThemeState(nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
    document.documentElement.classList.toggle("light", nextTheme === "light")
  }, [])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
    document.documentElement.classList.toggle("light", nextTheme === "light")
    try {
      window.localStorage.setItem("theme", nextTheme)
    } catch {
      // Apply the selection even when it cannot be persisted.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
