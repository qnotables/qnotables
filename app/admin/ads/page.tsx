import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Edit2, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { getAllAds, deleteAd } from "@/lib/ads"
import { revalidatePath } from "next/cache"

export const metadata = {
  title: "Ads Management — Admin",
  description: "Manage ad banners across the site",
}

export default async function AdsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/")
  }

  const ads = await getAllAds()

  async function handleDeleteAd(adId: string) {
    "use server"
    await deleteAd(adId)
    revalidatePath("/admin/ads")
  }

  return (
    <div className="min-h-screen tactical-grid">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <Link
          href="/admin"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="stencil text-3xl text-foreground">Ad Management</h1>
            <p className="label-mono mt-1 text-muted-foreground">Create and manage promotional banners</p>
          </div>
          <Link
            href="/admin/ads/new"
            className="label-mono flex items-center gap-2 bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Create Ad
          </Link>
        </div>

        <div className="border border-border bg-card">
          {ads.length === 0 ? (
            <div className="p-8 text-center">
              <p className="label-mono text-muted-foreground">No ads yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ads.map((ad) => (
                <div key={ad.id} className="flex items-start justify-between gap-4 p-5 hover:bg-muted/20">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="stencil text-lg text-foreground">{ad.title}</h3>
                      <span
                        className={`label-mono text-xs px-2 py-1 rounded ${
                          ad.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ad.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                      <span className="label-mono text-xs text-muted-foreground">
                        {ad.placement.toUpperCase()} • {ad.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {ad.description}
                    </p>
                  </div>

                  <div className="ml-4 flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/ads/${ad.id}`}
                      className="flex items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                      title="Edit ad"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Link>
                    <form
                      action={async () => {
                        "use server"
                        await handleDeleteAd(ad.id)
                      }}
                      className="contents"
                    >
                      <button
                        type="submit"
                        className="flex items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        title="Delete ad"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
