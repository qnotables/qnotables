"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface TimelineSidebarProps {
  years: number[]
  selectedYear?: number
  monthCounts: Map<string, number>
  onYearSelect: (year: number) => void
}

export function TimelineSidebar({ years, selectedYear, monthCounts, onYearSelect }: TimelineSidebarProps) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const selectedYearMonths = selectedYear
    ? Array.from({ length: 12 }, (_, i) => {
        const key = `${selectedYear}-${String(i + 1).padStart(2, "0")}`
        return { month: i + 1, count: monthCounts.get(key) || 0 }
      }).filter((m) => m.count > 0)
    : []

  return (
    <aside className="hidden lg:block lg:col-span-1">
      <div className="rounded border border-border bg-card/50 p-4 sticky top-20">
        <h3 className="stencil text-lg mb-4 text-foreground">Years</h3>

        <div className="space-y-1 mb-6">
          {years.map((year) => {
            const yearCount = Array.from({ length: 12 }, (_, i) => monthCounts.get(`${year}-${String(i + 1).padStart(2, "0")}`) || 0).reduce((a, b) => a + b, 0)
            return (
              <button
                key={year}
                onClick={() => onYearSelect(year)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                  selectedYear === year
                    ? "bg-primary/10 border border-primary/40 text-primary font-semibold"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{year}</span>
                <span className="label-mono text-xs">{yearCount}</span>
              </button>
            )
          })}
        </div>

        {/* Selected year months */}
        {selectedYear && selectedYearMonths.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="label-mono text-xs text-muted-foreground mb-2 font-semibold">MONTHS IN {selectedYear}</h4>
            <div className="space-y-0.5">
              {selectedYearMonths.map((item) => (
                <div key={item.month} className="flex items-center justify-between text-xs text-muted-foreground hover:text-foreground">
                  <span>{monthNames[item.month - 1]}</span>
                  <span className="label-mono text-xs bg-muted px-1.5 py-0.5 rounded">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
