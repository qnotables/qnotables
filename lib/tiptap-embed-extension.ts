/**
 * Tiptap EmbedBlock Node Extension
 * A custom node that renders an approved-domain iframe embed inside the editor.
 * Content is stored as structured JSON (no raw HTML emitted).
 */

import { Node, mergeAttributes } from "@tiptap/react"
import type { NodeViewProps } from "@tiptap/react"

// Re-export type so the editor file can import it here
export type { NodeViewProps }

export interface EmbedBlockAttrs {
  provider: string
  originalUrl: string
  embedUrl: string
  title: string
}

/** Tiptap Node config object – imported and registered in the editor. */
export const EmbedBlockConfig = {
  name: "embedBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      provider: { default: "" },
      originalUrl: { default: "" },
      embedUrl: { default: "" },
      title: { default: "" },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="embed-block"]' }]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "embed-block" }),
    ]
  },
}
