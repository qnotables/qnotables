import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeExternalLinks from "rehype-external-links"
import type { Components } from "react-markdown"

// Allow img src + standard attrs in the sanitised output, plus iframe for embeds
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "iframe"],
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title", "width", "height"],
    code: ["className"],
    iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "title", "allow"],
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
  a: ({ href, children }) => (
    <a
      href={href}
      className="break-all text-primary underline-offset-4 hover:underline"
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      {children}
    </a>
  ),
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
  // inline code
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
    // Media inserted via ![name](url) may point at a video file. Detect by
    // extension (ignoring any query string) and render a <video> player.
    const isVideo = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)
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
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url || "/placeholder.svg"}
        alt={alt ?? ""}
        className="my-2 max-w-full rounded border border-border object-contain"
        loading="lazy"
      />
    )
  },
  hr: () => <hr className="border-border" />,
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-4 leading-relaxed text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, sanitizeSchema],
          [rehypeExternalLinks, {
            target: "_blank",
            rel: ["noopener", "noreferrer", "nofollow"],
          }],
        ]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
