"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme")
    const nextTheme: Theme = storedTheme === "light" ? "light" : "dark"
    setThemeState(nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
  }, [])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
    window.localStorage.setItem("theme", nextTheme)
    document.documentElement.classList.toggle("dark", nextTheme === "dark")
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}
