import type { Metadata } from "next"

export const SITE_URL = "https://www.qnotables.ai"
export const SITE_NAME = "QNotables"
export const DEFAULT_TITLE = "QNotables — News, Research, and Public Records"
export const DEFAULT_DESCRIPTION =
  "QNotables aggregates important headlines and organizes research, public records, and community discussion in one searchable archive."
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/og-default.png`

export function absoluteUrl(path = "/"): string {
  const cleanPath = path.split(/[?#]/, 1)[0] || "/"
  return new URL(cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`, SITE_URL).toString()
}

export function socialImageUrl(image?: string | null): string {
  if (!image) return DEFAULT_OG_IMAGE
  try {
    const url = new URL(image, SITE_URL)
    return url.protocol === "https:" ? url.toString() : DEFAULT_OG_IMAGE
  } catch {
    return DEFAULT_OG_IMAGE
  }
}

export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  type = "website",
  noIndex = false,
}: {
  title: string
  description?: string
  path: string
  image?: string | null
  type?: "website" | "article"
  noIndex?: boolean
}): Metadata {
  const canonical = absoluteUrl(path)
  const socialImage = socialImageUrl(image)
  return {
    title,
    description,
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type,
      images: [{ url: socialImage, width: 1316, height: 877, alt: `${SITE_NAME} preview` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  }
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: absoluteUrl("/favicon.png") },
}

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function articleSchema(input: {
  title: string
  description: string
  path: string
  image?: string | null
  published?: string | null
  modified?: string | null
  author?: string | null
  type?: "NewsArticle" | "Article" | "DiscussionForumPosting"
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.type ?? "Article",
    headline: input.title,
    description: input.description,
    mainEntityOfPage: absoluteUrl(input.path),
    image: [socialImageUrl(input.image)],
    datePublished: input.published || undefined,
    dateModified: input.modified || input.published || undefined,
    author: input.author ? { "@type": "Person", name: input.author } : organizationSchema,
    publisher: { "@id": `${SITE_URL}/#organization` },
  }
}

export function collectionSchema(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${SITE_URL}/#website` },
  }
}
