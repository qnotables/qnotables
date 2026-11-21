"use client"

import { useState } from "react"
import { Node, NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react"
import { Button } from "@/components/ui/button"
import { PublishingEmbedCard } from "@/components/publishing-embed"
import { PublishingEmbedDialog } from "./publishing-embed-dialog"
import { getEmbedBlock } from "@/lib/publishing-embed"

function EmbedNodeView({ node, updateAttributes, deleteNode, editor, getPos }: ReactNodeViewProps) {
  const [editing, setEditing] = useState(false)
  const block = getEmbedBlock(node.attrs)
  function move(direction: -1 | 1) {
    const position = getPos()
    if (typeof position !== "number") return
    const { doc, tr } = editor.state
    const { nodeBefore, nodeAfter } = doc.resolve(direction < 0 ? position : position + node.nodeSize)
    const sibling = direction < 0 ? nodeBefore : nodeAfter
    if (!sibling) return
    const start = direction < 0 ? position - sibling.nodeSize : position
    editor.view.dispatch(tr.replaceWith(start, start + sibling.nodeSize + node.nodeSize, direction < 0 ? [node, sibling] : [sibling, node]).scrollIntoView())
  }
  const position = getPos()
  const before = typeof position === "number" && Boolean(editor.state.doc.resolve(position).nodeBefore)
  const after = typeof position === "number" && Boolean(editor.state.doc.resolve(position + node.nodeSize).nodeAfter)
  return (
    <NodeViewWrapper contentEditable={false} className="my-3 min-w-0 border border-border bg-card p-2">
      <div className="flex flex-wrap items-center gap-1" data-drag-handle>
        <span className="label-mono mr-auto px-2 text-xs text-muted-foreground">EXTERNAL EMBED</span>
        {block && <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit embed</Button>}
        <Button type="button" size="sm" variant="ghost" disabled={!before} onClick={() => move(-1)}>Move up</Button>
        <Button type="button" size="sm" variant="ghost" disabled={!after} onClick={() => move(1)}>Move down</Button>
        <Button type="button" size="sm" variant="ghost" onClick={deleteNode}>Remove</Button>
      </div>
      {block ? <PublishingEmbedCard key={block.proof} block={block} /> : <p className="p-2 text-sm text-muted-foreground">Invalid embed. Remove it and insert the source again.</p>}
      {block && editing && <PublishingEmbedDialog existing={block} onClose={() => setEditing(false)} onApply={(next) => { updateAttributes(next); setEditing(false); editor.commands.focus() }} />}
    </NodeViewWrapper>
  )
}

export const PublishingEmbedNode = Node.create({
  name: "publishingEmbed",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    const attr = (name: "payload" | "proof") => ({
      default: null,
      parseHTML: (element: HTMLElement) => {
        const value = element.getAttribute(`data-${name}`)
        if (name === "proof") return value
        if (!value || value.length > 10000) return null
        try { return JSON.parse(value) } catch { return null }
      },
      renderHTML: (attributes: Record<string, unknown>) => ({ [`data-${name}`]: name === "payload" ? JSON.stringify(attributes[name]) : attributes[name] }),
    })
    return { payload: attr("payload"), proof: attr("proof") }
  },
  parseHTML() { return [{ tag: "div[data-publishing-embed]" }] },
  renderHTML({ HTMLAttributes }) { return ["div", { ...HTMLAttributes, "data-publishing-embed": "" }] },
  addNodeView() { return ReactNodeViewRenderer(EmbedNodeView) },
})
