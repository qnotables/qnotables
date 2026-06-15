"use client"

import { useMemo, useState, useTransition } from "react"
import { Search, Loader2 } from "lucide-react"
import { setUserRole, setUserStatus } from "@/app/dashboard/actions"
import { EmptyState } from "@/components/dashboard/ui"

export interface UserRow {
  id: string
  name: string
  email: string | null
  role: string
  status: string
  karma: number
  createdAt: string
}

const ROLES = ["user", "researcher", "moderator", "admin"]
const STATUSES = ["active", "suspended", "banned"]

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return "—"
  }
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState(users)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (u) => u.name.toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q) || u.role.includes(q),
    )
  }, [rows, query])

  function changeRole(id: string, role: string) {
    setBusyId(id)
    startTransition(async () => {
      const res = await setUserRole(id, role)
      if (res.success) setRows((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
      setBusyId(null)
    })
  }

  function changeStatus(id: string, status: string) {
    setBusyId(id)
    startTransition(async () => {
      const res = await setUserStatus(id, status)
      if (res.success) setRows((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
      setBusyId(null)
    })
  }

  if (rows.length === 0) {
    return <EmptyState title="No users yet" description="Registered users will appear here." />
  }

  const selectClass = "label-mono border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="label-mono w-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Karma</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border hover:bg-muted/20">
                <td className="px-4 py-3">
                  <p className="font-semibold text-foreground">{u.name}</p>
                  {u.email ? <p className="label-mono text-xs text-muted-foreground">{u.email}</p> : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.karma}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmt(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      disabled={busyId === u.id && pending}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className={selectClass}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {busyId === u.id && pending ? <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" /> : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.status}
                    disabled={busyId === u.id && pending}
                    onChange={(e) => changeStatus(u.id, e.target.value)}
                    className={selectClass}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
