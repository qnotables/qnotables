import { unified } from "unified"
import rehypeParse from "rehype-parse"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeStringify from "rehype-stringify"

type SanitizeHtmlOptions = {
  allowedTags: readonly string[]
  allowedAttrs: readonly string[]
}

/**
 * Sanitize HTML in Node.js without jsdom. Keeping this server-safe avoids
 * bundling a browser DOM implementation into route handlers and server actions.
 */
export function sanitizeServerHtml(html: string, options: SanitizeHtmlOptions): string {
  if (!html) return ""

  const allowedTags = [...options.allowedTags]
  const allowedAttrs = [...options.allowedAttrs]
  const attributes = Object.fromEntries(
    allowedTags.map((tagName) => [tagName, allowedAttrs]),
  )

  const schema = {
    ...defaultSchema,
    tagNames: allowedTags,
    attributes,
  }

  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)

  const tree = processor.parse(html)
  const sanitizedTree = processor.runSync(tree)
  return String(processor.stringify(sanitizedTree))
}
