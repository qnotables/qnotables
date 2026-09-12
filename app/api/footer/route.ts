import { NextResponse } from "next/server"
import { getPublishedFooterConfig } from "@/lib/footer-config"

export const dynamic = "force-dynamic"

export async function GET() {
  const config = await getPublishedFooterConfig()
  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  })
}
