"use client"

import Script from "next/script"

export function TradingViewTicker() {
  return (
    <div className="tradingview-widget-container w-full">
      <div className="tradingview-widget-container__widget" />
      <Script
        src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
        strategy="afterInteractive"
        id="tradingview-ticker"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            symbols: [
              { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
              { proName: "BITSTAMP:BTCUSD", title: "BTC" },
              { proName: "BITSTAMP:ETHUSD", title: "ETH" },
              { proName: "TVC:GOLD", title: "GOLD" },
              { proName: "TVC:SILVER", title: "SILVER" },
              { proName: "NASDAQ:DJT", title: "DJT" },
              { proName: "RAYDIUM:8CHANSOL_9GQUWT.USD", title: "8CHAN" },
              { proName: "COINBASE:XRPUSD", title: "XRP" },
              { proName: "COINBASE:ADAV2025", title: "ADA" },
              { proName: "COINBASE:SOLV2025", title: "SOL" },
              { proName: "NYSE:ANGX", title: "ANGEL" },
            ],
            colorTheme: "dark",
            locale: "en",
            largeChartUrl: "",
            isTransparent: true,
            showSymbolLogo: true,
            displayMode: "adaptive",
          }),
        }}
      />
    </div>
  )
}
