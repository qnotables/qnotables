"use client"

import { useEffect, useState } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BookmarkForm } from "@/components/bookmark-form"
import { BookmarksGrid } from "@/components/bookmarks-grid"
import { getApprovedBookmarks, getUserBookmarks } from "@/app/actions/bookmark-actions"
import { createClient } from "@/lib/supabase/client"
import type { Bookmark } from "@/app/actions/bookmark-actions"

export default function BookmarksPage() {
  const [approvedBookmarks, setApprovedBookmarks] = useState<Bookmark[]>([])
  const [userBookmarks, setUserBookmarks] = useState<string[]>([])
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initialize = async () => {
      try {
        // Check auth status
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        setIsSignedIn(!!user)
        if (user?.user_metadata?.role === "admin") {
          setIsAdmin(true)
        }

        // Fetch approved bookmarks
        const approved = await getApprovedBookmarks()
        setApprovedBookmarks(approved)

        // Fetch user's bookmarks if signed in
        if (user) {
          const userBMs = await getUserBookmarks()
          setUserBookmarks(userBMs.map((b) => b.id))
        }
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  const handleBookmarkSubmitted = async () => {
    // Refresh the list
    const approved = await getApprovedBookmarks()
    setApprovedBookmarks(approved)

    if (isSignedIn) {
      const userBMs = await getUserBookmarks()
      setUserBookmarks(userBMs.map((b) => b.id))
    }
  }

  const handleBookmarkDeleted = (id: string) => {
    setApprovedBookmarks((prev) => prev.filter((b) => b.id !== id))
    setUserBookmarks((prev) => prev.filter((uid) => uid !== id))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen tactical-grid">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-12">
          <p className="label-mono text-muted-foreground">Loading...</p>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 md:py-16">
        {/* Page header */}
        <div className="mb-12">
          <div className="mb-4">
            <span className="label-mono text-xs font-bold text-primary">BOOKMARKS</span>
          </div>
          <h1 className="stencil text-4xl md:text-5xl font-bold text-foreground mb-4">
            Helpful Resources & Businesses
          </h1>
          <p className="text-lg text-muted-foreground">
            Discover and share useful links, tools, and businesses curated by our community.
          </p>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar with form */}
          {isSignedIn && (
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <BookmarkForm onSuccess={handleBookmarkSubmitted} />
              </div>
            </div>
          )}

          {/* Main content */}
          <div className={isSignedIn ? "lg:col-span-2" : "lg:col-span-3"}>
            {!isSignedIn && (
              <div className="mb-8 p-4 md:p-6 border border-border bg-background/50">
                <p className="label-mono text-sm text-muted-foreground">
                  <a href="/auth/login" className="text-primary hover:underline">
                    Log in
                  </a>
                  {" to submit bookmarks or "}
                  <a href="/auth/signup" className="text-primary hover:underline">
                    create an account
                  </a>
                </p>
              </div>
            )}

            {/* Bookmarks grid */}
            <div>
              <div className="mb-6">
                <h2 className="stencil text-xl font-bold text-foreground">
                  Approved Bookmarks
                </h2>
              </div>
              <BookmarksGrid
                bookmarks={approvedBookmarks}
                userBookmarks={userBookmarks}
                isAdmin={isAdmin}
                onBookmarkDeleted={handleBookmarkDeleted}
              />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
