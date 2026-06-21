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
    address: "bc1qwymtyd2zyhf2ps2f3ryhs3qjhajezy7d7c9s7u",
    network: "Mainnet",
  },
  {
    coin: "Ethereum",
    symbol: "ETH",
    address: "0x56b0ad40741510ad036B2f74ede304581096609D",
    network: "Mainnet",
  },
  {
    coin: "Cardano",
    symbol: "ADA",
    address: "addr1qy5zkfnlt38a9qch4us96a9d6wja2cqtmcyru9lp6yj0x3eg9vn87hz062p30teqt462m5a964sqhhsg8ct7r5fy7drs99fqwq",
    network: "Mainnet",
  },
  {
    coin: "Ripple",
    symbol: "XRP",
    address: "rpCiZ6WGrBZHx63TcPyYheEBKaK2Jh5tRc",
    network: "Mainnet",
  },
   {
    coin: "Solana",
    symbol: "SOL",
    address: "6DBVamu7ffkJ2YU1iVg1CbJLUdPvLrpy3iYEjy4FkVW9",
    network: "Mainnet",
  },
]
