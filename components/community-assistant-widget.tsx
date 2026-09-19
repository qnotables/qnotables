"use client"

import { Bot, MessageCircle } from "lucide-react"
import { CommunityAssistantChat } from "@/components/community-assistant-chat"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function CommunityAssistantWidget() {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            size="lg"
            className="fixed right-4 bottom-4 z-40 h-12 rounded-full border border-primary/40 px-4 shadow-[0_10px_32px_rgba(0,0,0,0.28)] sm:right-6 sm:bottom-6"
            aria-label="Open QNotables community assistant"
          />
        }
      >
        <MessageCircle data-icon="inline-start" />
        <span className="hidden sm:inline">ASK THE COMMUNITY</span>
        <span className="sm:hidden">ASK Q</span>
      </DialogTrigger>
      <DialogContent
        showCloseButton
        className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto border-border bg-background p-0 shadow-2xl sm:max-h-[min(760px,calc(100dvh-3rem))]"
      >
        <DialogTitle className="sr-only">QNotables community assistant</DialogTitle>
        <DialogDescription className="sr-only">
          Ask questions about the QNotables community and site.
        </DialogDescription>
        <CommunityAssistantChat />
      </DialogContent>
    </Dialog>
  )
}

export function CommunityAssistantMark() {
  return <Bot aria-hidden="true" />
}
