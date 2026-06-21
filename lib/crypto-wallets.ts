export interface CryptoWallet {
  coin: string
  symbol: string
  address: string
  network?: string
  qrCodeData?: string // Base64 encoded QR code
}

export const CRYPTO_WALLETS: CryptoWallet[] = [
  {
    coin: "Bitcoin",
    symbol: "BTC",
    address: "1A1z7agoat2LWEB5QtzrZyN6P8R38NZVz",
    network: "Mainnet",
  },
  {
    coin: "Ethereum",
    symbol: "ETH",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb1",
    network: "Mainnet",
  },
  {
    coin: "Monero",
    symbol: "XMR",
    address: "83Q6j7S8v5j3K9m2L5n8q9r3s8t2u7v9w1x2y3z4a5b6c7d8e9f0g1h2i3j",
    network: "Mainnet",
  },
  {
    coin: "Dogecoin",
    symbol: "DOGE",
    address: "DH5yaGapZJ4ZagWwcjGrfim8jbQvYsmpk9",
    network: "Mainnet",
  },
]
