import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeExternalLinks from "rehype-external-links"
import type { Components } from "react-markdown"
import { isDirectImageUrl, isSocialMediaUrl } from "@/lib/forum-utils"
import { ForumImage } from "@/components/forum-image"
import { VideoEmbedBlock } from "@/components/video-embed-block"
import { parseVideoEmbed } from "@/lib/video-embed-utils"
import { SafeEmbed } from "@/components/safe-embed"
import { parseIframeEmbed } from "@/lib/iframe-embed-utils"

/**
 * Process embeds from HTML comments and render them as components
 * Returns both the cleaned content and an array of embed components
 */
function processEmbeds(content: string): { cleanContent: string; embeds: React.ReactNode[] } {
  const videoPattern = /<!-- VIDEO_EMBED: ({.*?}) -->/g
  const iframePattern = /<!-- IFRAME_EMBED: ({.*?}) -->/g
  const embeds: React.ReactNode[] = []
  
  // First pass: collect all embeds with their positions
  const allMatches: Array<{ index: number; endIndex: number; node: React.ReactNode }> = []
  
  // Collect video embeds
  let match
  while ((match = videoPattern.exec(content)) !== null) {
    const embedJson = match[1]
    const embed = parseVideoEmbed(embedJson)
    if (embed) {
      allMatches.push({
        index: match.index,
        endIndex: videoPattern.lastIndex,
        node: <VideoEmbedBlock key={`embed-${allMatches.length}`} embed={embed} />,
      })
    }
  }
  
  // Collect iframe embeds
  while ((match = iframePattern.exec(content)) !== null) {
    const embedJson = match[1]
    const embed = parseIframeEmbed(embedJson)
    if (embed) {
      allMatches.push({
        index: match.index,
        endIndex: iframePattern.lastIndex,
        node: (
          <SafeEmbed
            key={`iframe-${allMatches.length}`}
            url={embed.url}
            title={embed.title}
            type="iframe"
            aspectRatio={embed.aspectRatio}
            maxWidth={embed.maxWidth}
          />
        ),
      })
    }
  }
  
  // Sort by position
  allMatches.sort((a, b) => a.index - b.index)
  
  // Build clean content and collect embed nodes
  let cleanContent = ""
  let lastIndex = 0
  
  for (const match of allMatches) {
    cleanContent += content.slice(lastIndex, match.index)
    embeds.push(match.node)
    cleanContent += "\n"
    lastIndex = match.endIndex
  }
  
  // Add remaining content
  cleanContent += content.slice(lastIndex)
  
  return { cleanContent, embeds }
}

// Tightened sanitize schema:
// - No iframes (user-authored content must not embed arbitrary iframes)
// - No javascript:/data: in hrefs
// - Images allowed with src/alt/title only
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []).filter((t: string) => t !== "iframe"),
    "video",
    "source",
  ],
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title"],
    code: ["className"],
    a: ["href", "title", "target", "rel"],
    video: ["src", "controls", "width", "height", "playsInline", "preload", "poster", "autoPlay", "muted", "loop"],
    source: ["src", "type"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="stencil mt-5 text-3xl text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="stencil mt-4 text-2xl text-foreground">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="stencil mt-3 text-xl text-foreground">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-pretty leading-relaxed">{children}</p>
  ),
  a: ({ href, children }) => {
    // Block unsafe protocols that slipped past rehype-sanitize
    const safe = href && /^https?:\/\//i.test(href)
    if (!safe) return <span className="text-muted-foreground">{children}</span>
    return (
      <a
        href={href}
        className="break-all text-primary underline-offset-4 hover:underline"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >
        {children}
      </a>
    )
  },
  ul: ({ children }) => (
    <ul className="flex list-disc flex-col gap-2 pl-6 marker:text-primary">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex list-decimal flex-col gap-2 pl-6 marker:text-primary">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-primary bg-card py-2 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  code: ({ className, children }) => {
    const isBlock = Boolean(className)
    if (isBlock) {
      return (
        <code className="block w-full overflow-x-auto whitespace-pre bg-muted p-4 font-mono text-sm leading-relaxed text-foreground">
          {children}
        </code>
      )
    }
    return (
      <code className="label-mono bg-card px-1.5 py-0.5 text-primary">{children}</code>
    )
  },
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded border border-border bg-muted">{children}</pre>
  ),
  img: ({ src, alt }) => {
    const url = typeof src === "string" ? src : ""

    // Block images that point at social media pages (not direct image files)
    if (!url || (!isDirectImageUrl(url) && isSocialMediaUrl(url))) {
      return null
    }

    // Block non-http/https src values (data: URIs, javascript:, etc.)
    if (!/^https?:\/\//i.test(url)) {
      return null
    }

    // Video files embedded via img syntax
    const isVideo = /\.(mp4|webm|ogg|mov|m4v)(\?[^\s]*)?$/i.test(url)
    if (isVideo) {
      return (
        <video
          src={url}
          controls
          playsInline
          preload="metadata"
          className="my-2 max-w-full rounded border border-border"
        >
          {alt ?? "Your browser does not support the video tag."}
        </video>
      )
    }

    return <ForumImage src={url} alt={alt ?? ""} />
  },
  hr: () => <hr className="border-border" />,
}

export function Markdown({ content }: { content: string }) {
  // Extract and render embeds (both video and iframe) before markdown processing
  const { cleanContent, embeds } = processEmbeds(content)
  
  return (
    <div className="flex flex-col gap-4 leading-relaxed text-foreground/90">
      {embeds.length > 0 && <div className="space-y-6">{embeds}</div>}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          [
            rehypeExternalLinks,
            {
              target: "_blank",
              rel: ["noopener", "noreferrer", "nofollow"],
            },
          ],
        ]}
        components={components}
      >
        {cleanContent}
      </ReactMarkdown>
    </div>
  )
}
