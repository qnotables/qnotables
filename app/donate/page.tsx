import type { Metadata } from "next"
import Link from "next/link"
import { Heart, AlertCircle, Shield } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TopAd, BottomAd } from "@/components/ad-display"
import { CryptoWalletCard } from "@/components/crypto-wallet-card"
import { CRYPTO_WALLETS } from "@/lib/crypto-wallets"

export const metadata: Metadata = {
  title: "Support Us with Crypto — HOT AND FRESH",
  description: "Help keep HOT AND FRESH independent. Support the platform through Bitcoin, Ethereum, Monero, and other cryptocurrencies.",
  openGraph: {
    title: "Support HOT AND FRESH with Cryptocurrency",
    description: "Donate via Bitcoin, Ethereum, Monero, and other cryptocurrencies to support independent research and news.",
    type: "website",
  },
}

export default function DonatePage() {
  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />
      <TopAd />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 lg:py-16">
        {/* hero */}
        <div className="mb-12 flex flex-col gap-6 border border-border bg-card p-6 md:p-8">
          <div className="flex items-start gap-4">
            <Heart className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <div className="flex-1">
              <h1 className="text-3xl font-bold leading-tight text-foreground md:text-4xl">
                Support Independent Research
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                HOT AND FRESH is an independent research platform. Help us maintain editorial independence and continue building the permanent record.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2 border-l-2 border-primary pl-4">
              <h3 className="label-mono font-semibold text-primary">Editorial Independence</h3>
              <p className="text-sm text-muted-foreground">
                Free from corporate influence. Supported directly by people like you.
              </p>
            </div>
            <div className="flex flex-col gap-2 border-l-2 border-primary pl-4">
              <h3 className="label-mono font-semibold text-primary">Privacy First</h3>
              <p className="text-sm text-muted-foreground">
                Cryptocurrency donations offer privacy and reduce intermediaries.
              </p>
            </div>
            <div className="flex flex-col gap-2 border-l-2 border-primary pl-4">
              <h3 className="label-mono font-semibold text-primary">Transparent Use</h3>
              <p className="text-sm text-muted-foreground">
                All support goes directly to research, infrastructure, and operations.
              </p>
            </div>
          </div>
        </div>

        {/* crypto wallets section */}
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="label-mono text-xl font-bold text-foreground">Send Cryptocurrency</h2>
          </div>

          <div className="mb-6 flex gap-2 rounded border border-amber-900/30 bg-amber-950/10 px-4 py-3 text-sm text-amber-100">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Security Notice</p>
              <p className="mt-1">
                Always verify wallet addresses through multiple trusted sources before sending funds. Never share your private keys.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {CRYPTO_WALLETS.map((wallet) => (
              <CryptoWalletCard key={wallet.symbol} wallet={wallet} />
            ))}
          </div>
        </div>

        {/* fiat section */}
        <div className="mb-12 border border-border bg-card p-6 md:p-8">
          <h2 className="mb-4 label-mono text-xl font-bold text-foreground">Other Ways to Support</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="shrink-0 text-primary">•</span>
              <span>
                <strong>Shop:</strong> Purchase gear and memberships at{" "}
                <Link href="https://shop.qnotables.ai" className="text-primary hover:underline">
                  shop.qnotables.ai
                </Link>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-primary">•</span>
              <span>
                <strong>Subscribe:</strong> Join as a member for exclusive analysis and ad-free reading.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-primary">•</span>
              <span>
                <strong>Contribute:</strong> Submit stories, documents, and research to the archive.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-primary">•</span>
              <span>
                <strong>Spread the word:</strong> Share HOT AND FRESH with others who value independent research.
              </span>
            </li>
          </ul>
        </div>

        {/* mission section */}
        <div className="border border-border bg-card p-6 md:p-8">
          <h2 className="mb-4 label-mono text-xl font-bold text-foreground">Our Mission</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            HOT AND FRESH exists to preserve public information, organize developing stories, and build a permanent searchable record. We believe in:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="shrink-0 text-primary">✓</span>
              <span>Archiving source links, documents, and public records for future reference</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-primary">✓</span>
              <span>Organizing information across multiple categories, sources, and timelines</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-primary">✓</span>
              <span>Encouraging verification and disciplined review before amplification</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-primary">✓</span>
              <span>Building public memory independent of corporate or government control</span>
            </li>
          </ul>
        </div>
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
  )
}
