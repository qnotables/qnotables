"use client"

import { useEffect, useRef } from "react"

const TICKER_CONFIG = {
  symbols: [
    { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
    { proName: "BITSTAMP:BTCUSD", title: "BTC" },
    { proName: "BITSTAMP:ETHUSD", title: "ETH" },
    { proName: "TVC:GOLD", title: "GOLD" },
    { proName: "TVC:SILVER", title: "SILVER" },
    { proName: "NASDAQ:DJT", title: "DJT" },
    { proName: "RAYDIUM:8CHANSOL_9GQUWT.USD", title: "8CHAN" },
    { proName: "COINBASE:XRPUSD", title: "XRP" },
    { proName: "COINBASE:ADAUSD", title: "ADA" },
    { proName: "COINBASE:SOLUSD", title: "SOL" },
    { proName: "NYSE:ANGX", title: "ANGEL" },
  ],
  colorTheme: "dark",
  locale: "en",
  largeChartUrl: "",
  isTransparent: false,
  showSymbolLogo: true,
  displayMode: "adaptive",
}

export function TradingViewTicker() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear any previous render
    container.innerHTML = ""

    const widgetDiv = document.createElement("div")
    widgetDiv.className = "tradingview-widget-container__widget"
    container.appendChild(widgetDiv)

    const script = document.createElement("script")
    script.type = "text/javascript"
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
    script.async = true
    script.innerHTML = JSON.stringify(TICKER_CONFIG)
    container.appendChild(script)

    return () => {
      container.innerHTML = ""
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full"
      style={{ backgroundColor: "#eef2ff" }}
    />
  )
}
