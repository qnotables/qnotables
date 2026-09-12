import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TopAd, BottomAd } from "@/components/ad-display"
import { SearchWorkspace } from "@/components/search-workspace"
import { pageMetadata } from "@/lib/seo"

export const dynamic = "force-dynamic"

export const metadata: Metadata = pageMetadata({
  title: "Research Search",
  description: "Search QNotables archives, Town Hall threads, public records, and media from one research workspace.",
  path: "/search",
})

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />
      <TopAd />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-12">
        <SearchWorkspace
          initialQuery={firstParam(params.q)}
          initialTab={firstParam(params.tab)}
          initialSort={firstParam(params.sort)}
          initialDesk={firstParam(params.desk)}
          initialCategory={firstParam(params.category)}
          initialType={firstParam(params.type)}
          initialSource={firstParam(params.source)}
          initialAuthor={firstParam(params.author)}
          initialTag={firstParam(params.tag)}
          initialFrom={firstParam(params.from)}
          initialTo={firstParam(params.to)}
          initialPrimary={firstParam(params.primary) === "true"}
        />
      </main>
      <BottomAd />
      <SiteFooter />
    </div>
  )
}
