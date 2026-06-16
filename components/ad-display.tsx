import { AdBanner } from "@/components/ad-banner"
import { AdCarousel } from "@/components/ad-carousel"
import { SignalToolsCard } from "@/components/signal-tools-card"
import { getAdsByPlacement } from "@/lib/ads"

interface Ad {
  id: string
  title: string
  description: string
  image_url: string | null
  button_text: string
  button_link: string
  type: "internal" | "sponsor" | "partner"
  placement: "top" | "sidebar" | "in-feed" | "bottom"
}

export async function TopAd() {
  const ads = await getAdsByPlacement("top")

  if (ads.length === 0) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
        {/* Top Ad Carousel - larger left column */}
        <div className="md:col-span-2">
          <div className="w-fit">
            <AdCarousel
              ads={ads.map((ad) => ({
                ...ad,
                imageUrl: ad.image_url,
                buttonText: ad.button_text,
                buttonLink: ad.button_link,
              }))}
              interval={10000}
            />
          </div>
        </div>

        {/* Signal Tools - narrower right column */}
        <div className="md:col-span-1">
          <SignalToolsCard />
        </div>
      </div>
    </div>
  )
}

export async function SidebarAd() {
  const ads = await getAdsByPlacement("sidebar")

  if (ads.length === 0) return null

  return (
    <AdCarousel
      ads={ads.map((ad) => ({
        ...ad,
        imageUrl: ad.image_url,
        buttonText: ad.button_text,
        buttonLink: ad.button_link,
      }))}
      className="sticky top-6 w-full max-w-xs"
      interval={10000}
    />
  )
}

export async function BottomAd() {
  const ads = await getAdsByPlacement("bottom")

  if (ads.length === 0) return null

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
      <AdCarousel
        ads={ads.map((ad) => ({
          ...ad,
          imageUrl: ad.image_url,
          buttonText: ad.button_text,
          buttonLink: ad.button_link,
        }))}
        interval={10000}
      />
    </div>
  )
}

export async function InFeedAd({ index }: { index: number }) {
  const ads = await getAdsByPlacement("in-feed")

  if (ads.length === 0 || index % 5 !== 4) return null

  const ad = ads[Math.floor(index / 5) % ads.length]

  return (
    <div className="my-6">
      <AdBanner
        ad={{
          ...ad,
          imageUrl: ad.image_url,
          buttonText: ad.button_text,
          buttonLink: ad.button_link,
        }}
      />
    </div>
  )
}
