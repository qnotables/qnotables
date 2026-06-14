"use server"

import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { createAd } from "@/lib/ads"
import { revalidatePath } from "next/cache"

async function handleCreateAd(formData: FormData) {
  "use server"

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/")
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const imageUrl = formData.get("image_url") as string
  const buttonText = formData.get("button_text") as string
  const buttonLink = formData.get("button_link") as string
  const placement = formData.get("placement") as "top" | "sidebar" | "in-feed" | "bottom"
  const type = formData.get("type") as "internal" | "sponsor" | "partner"
  const priority = parseInt(formData.get("priority") as string) || 0

  if (!title || !description || !buttonText || !buttonLink || !placement || !type) {
    return
  }

  await createAd({
    title,
    description,
    image_url: imageUrl || null,
    button_text: buttonText,
    button_link: buttonLink,
    placement,
    type,
    priority,
  })

  revalidatePath("/admin/ads")
  redirect("/admin/ads")
}

export default async function NewAdPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/")
  }

  return (
    <div className="min-h-screen tactical-grid">
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
        <Link
          href="/admin/ads"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Ads
        </Link>

        <h1 className="stencil text-3xl text-foreground">Create New Ad</h1>

        <form action={handleCreateAd} className="mt-8 flex flex-col gap-6 border border-border bg-card p-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="label-mono font-semibold text-foreground">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-primary"
              placeholder="e.g., Join The Town Hall"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="description" className="label-mono font-semibold text-foreground">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              className="border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-primary"
              placeholder="Short description of the ad..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="image_url" className="label-mono font-semibold text-foreground">
              Image URL
            </label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              className="border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-primary"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="button_text" className="label-mono font-semibold text-foreground">
                Button Text *
              </label>
              <input
                type="text"
                id="button_text"
                name="button_text"
                required
                className="border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-primary"
                placeholder="e.g., Learn More"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="button_link" className="label-mono font-semibold text-foreground">
                Button Link *
              </label>
              <input
                type="text"
                id="button_link"
                name="button_link"
                required
                className="border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-primary"
                placeholder="/forum"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="placement" className="label-mono font-semibold text-foreground">
                Placement *
              </label>
              <select
                id="placement"
                name="placement"
                defaultValue="top"
                required
                className="border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-primary"
              >
                <option value="top">Top Banner</option>
                <option value="sidebar">Sidebar</option>
                <option value="in-feed">In-Feed</option>
                <option value="bottom">Bottom Banner</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="type" className="label-mono font-semibold text-foreground">
                Type *
              </label>
              <select
                id="type"
                name="type"
                defaultValue="internal"
                required
                className="border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-primary"
              >
                <option value="internal">Internal</option>
                <option value="sponsor">Sponsor</option>
                <option value="partner">Partner</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="priority" className="label-mono text-sm font-semibold text-foreground">
              Priority (higher = shown first)
            </label>
            <input
              type="number"
              id="priority"
              name="priority"
              defaultValue={0}
              className="border border-border bg-background px-4 py-2 text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="label-mono bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Create Ad
            </button>
            <Link
              href="/admin/ads"
              className="label-mono border border-border px-6 py-2.5 transition-colors hover:border-primary"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
