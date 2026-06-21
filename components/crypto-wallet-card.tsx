"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import type { CryptoWallet } from "@/lib/crypto-wallets"

export function CryptoWalletCard({ wallet }: { wallet: CryptoWallet }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4 border border-border bg-card p-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="label-mono text-lg font-semibold text-primary">{wallet.symbol}</h3>
          <p className="text-sm text-muted-foreground">{wallet.coin}</p>
        </div>
        {wallet.network && (
          <span className="label-mono rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
            {wallet.network}
          </span>
        )}
      </div>

      {/* address display */}
      <div className="flex flex-col gap-2">
        <label className="label-mono text-xs font-semibold text-muted-foreground">Address</label>
        <div className="flex gap-2">
          <code className="flex-1 overflow-hidden text-ellipsis break-all rounded bg-background px-3 py-2 font-mono text-xs text-foreground">
            {wallet.address}
          </code>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label={`Copy ${wallet.symbol} address`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* warning */}
      <div className="rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        <p className="font-semibold">Verify Address</p>
        <p className="mt-1">Always double-check wallet addresses before sending funds. Ensure you&apos;re sending to the correct blockchain network.</p>
      </div>
    </div>
  )
}
