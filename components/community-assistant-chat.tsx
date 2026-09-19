"use client"

import { FormEvent, useState } from "react"
import { ArrowUp, Bot, RotateCcw } from "lucide-react"
import { useEveAgent } from "eve/react"
import ReactMarkdown from "react-markdown"
import rehypeExternalLinks from "rehype-external-links"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

const assistantMarkdownSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: ["href", "title", "target", "rel"],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
  },
}

function linkifyResearchUrls(content: string) {
  const markdownLinks: string[] = []
  const protectedContent = content.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match) => {
    markdownLinks.push(match)
    return `\u0000${markdownLinks.length - 1}\u0000`
  })
  const withExternalLinks = protectedContent.replace(/(?<![\]([\("'=])https?:\/\/[^\s<>)]+/g, (url) => {
    const cleanUrl = url.replace(/[.,;:!?]+$/, "")
    return `[${cleanUrl}](${cleanUrl})${url.slice(cleanUrl.length)}`
  })
  const withInternalLinks = withExternalLinks.replace(/(\/(?:archives?|forum|documents?|videos?|sources|news)(?:\/[A-Za-z0-9._~:/?#@!$&'()*+,;=%-]+)?)/g, (url) => `[${url}](${url})`)
  return withInternalLinks.replace(/\u0000(\d+)\u0000/g, (_, index) => markdownLinks[Number(index)])
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-inherit prose-a:text-primary prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-primary/80 prose-p:my-0 prose-ul:my-2 prose-ol:my-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, assistantMarkdownSchema],
          [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
        ]}
      >
        {linkifyResearchUrls(content)}
      </ReactMarkdown>
    </div>
  )
}

const suggestions = [
  "Search the archive",
  "Find primary sources",
  "Build a timeline",
  "Search Town Hall",
  "Compare records",
]

function messageText(message: { parts: ReadonlyArray<{ type: string; text?: string }> }) {
  return message.parts
    .filter((part) => part.type === "text" && part.text)
    .map((part) => part.text)
    .join("")
}

export function CommunityAssistantChat() {
  const [input, setInput] = useState("")
  const agent = useEveAgent()
  const isBusy = agent.status === "submitted" || agent.status === "streaming"
  const isResuming = agent.status === "resuming"

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = input.trim()
    if (!message || isResuming) return
    setInput("")
    void agent.send(message, isBusy ? { turnPolicy: "steer" } : undefined)
  }

  const askSuggestion = (suggestion: string) => {
    if (isBusy || isResuming) return
    setInput("")
    void agent.send(suggestion)
  }

  return (
    <section className="overflow-hidden border border-border bg-card/70 shadow-[0_18px_60px_rgba(0,0,0,0.18)]" aria-label="QNotables Research Agent">
      <div className="border-b border-border bg-muted/40 px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-primary/50 bg-primary/10 text-primary">
            <Bot className="size-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold tracking-[0.18em] text-primary">QNOTABLES / RESEARCH AGENT</p>
            <h1 className="stencil mt-1 text-2xl text-foreground sm:text-3xl">QNotables Research Agent</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Ask the archive. Follow the source. Examine the record.
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-[360px] space-y-4 p-4 sm:p-6">
        {agent.data.messages.length === 0 ? (
          <div className="flex min-h-[270px] flex-col items-center justify-center text-center">
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Search public QNotables records, documents, The Wire, and Town Hall. Answers include traceable citations when evidence is available.
            </p>
            <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => askSuggestion(suggestion)}
                  disabled={isBusy || isResuming}
                  className="border border-border bg-background px-3 py-2 text-left font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          agent.data.messages.map((message) => {
            const text = messageText(message)
            if (!text) return null
            const isUser = message.role === "user"
            return (
              <article key={message.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[88%] border px-4 py-3 text-sm leading-relaxed", isUser ? "border-primary/50 bg-primary/10 text-foreground" : "border-border bg-background text-foreground")}>
                  <p className="mb-2 font-mono text-[9px] font-semibold tracking-[0.16em] text-primary">{isUser ? "YOU" : "RESEARCH AGENT"}</p>
                  {isUser ? <div className="whitespace-pre-wrap">{text}</div> : <AssistantMessage content={text} />}
                </div>
              </article>
            )
          })
        )}
        {isBusy && <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">ASSISTANT IS THINKING…</p>}
        {agent.error && <p role="alert" className="border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">The assistant could not respond. Please try again.</p>}
      </div>

      <div className="border-t border-border bg-muted/20 p-4 sm:p-6">
        <form onSubmit={submit} className="flex items-end gap-2">
          <label className="sr-only" htmlFor="community-assistant-message">QNotables Research Agent</label>
          <textarea
            id="community-assistant-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder="Search the QNotables record…"
            rows={2}
            disabled={isResuming}
            className="min-h-12 flex-1 resize-none border border-border bg-background px-3 py-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary disabled:opacity-50"
          />
          <button type="submit" disabled={!input.trim() || isBusy || isResuming} className="flex size-12 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">
            <ArrowUp className="size-5" aria-hidden="true" />
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">AI-generated research. Follow every citation back to the public record.</p>
          {agent.data.messages.length > 0 && (
            <button type="button" onClick={agent.reset} className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[10px] tracking-[0.12em] text-muted-foreground hover:text-foreground" aria-label="Start a new conversation">
              <RotateCcw className="size-3" aria-hidden="true" /> NEW CHAT
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
