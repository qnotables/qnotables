import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Oswald, IBM_Plex_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { CartProvider } from '@/lib/shop/cart-context'
import { MusicPlayerProvider } from '@/lib/music-player-context'
import './globals.css'

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const DEFAULT_OG_IMAGE = '/images/og-default.png'

export const metadata: Metadata = {
  title: 'Hot and Fresh — Global News Aggregator',
  description:
    'Hot and Fresh aggregates and ranks the most important headlines from trusted sources around the world, updated around the clock.',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Hot and Fresh',
    title: 'Hot and Fresh — Global News Aggregator',
    description:
      'Hot and Fresh aggregates and ranks the most important headlines from trusted sources around the world, updated around the clock.',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1316,
        height: 877,
        alt: 'Q Research — For God and Country',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hot and Fresh — Global News Aggregator',
    description:
      'Hot and Fresh aggregates and ranks the most important headlines from trusted sources around the world, updated around the clock.',
    images: [DEFAULT_OG_IMAGE],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e9e6da' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1d16' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${oswald.variable} ${plexMono.variable} bg-background`}
    >
      <body className="font-mono antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="theme"
        >
          <MusicPlayerProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </MusicPlayerProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
