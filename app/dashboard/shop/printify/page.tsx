"use client"

import { useState } from "react"
import { AlertCircle, CheckCircle, RefreshCw, Trash2 } from "lucide-react"

export default function PrintifySettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [shopId, setShopId] = useState("")
  const [autoSync, setAutoSync] = useState(false)
  const [syncInterval, setSyncInterval] = useState(24)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)

  const handleTestConnection = async () => {
    if (!apiKey || !shopId) {
      setStatus({ type: "error", message: "Please enter both API Key and Shop ID" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/shop/printify/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, shopId }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({ type: "success", message: "Connection successful! ✓" })
        setIsConfigured(true)
      } else {
        setStatus({ type: "error", message: data.error || "Connection failed" })
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to test connection" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/shop/printify/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printify_api_key: apiKey,
          printify_shop_id: shopId,
          auto_sync_enabled: autoSync,
          sync_interval_hours: syncInterval,
        }),
      })

      if (response.ok) {
        setStatus({ type: "success", message: "Settings saved successfully" })
      } else {
        setStatus({ type: "error", message: "Failed to save settings" })
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to save settings" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSyncNow = async () => {
    if (!isConfigured) {
      setStatus({ type: "error", message: "Please configure Printify first" })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/shop/printify/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, shopId }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus({
          type: "success",
          message: `Sync complete: ${data.products_synced} products processed`,
        })
      } else {
        setStatus({ type: "error", message: data.error || "Sync failed" })
      }
    } catch (error) {
      setStatus({ type: "error", message: "Sync failed" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure? This will disconnect all Printify products.")) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/shop/printify/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        setApiKey("")
        setShopId("")
        setAutoSync(false)
        setIsConfigured(false)
        setStatus({ type: "success", message: "Printify disconnected" })
      } else {
        setStatus({ type: "error", message: "Failed to disconnect" })
      }
    } catch (error) {
      setStatus({ type: "error", message: "Disconnect failed" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground">PRINTIFY INTEGRATION</h1>
        <p className="label-mono mt-1 text-sm text-muted-foreground">
          Connect your Printify account for print-on-demand fulfillment
        </p>
      </div>

      <div className="space-y-8 px-6 py-8">
        {/* Status Message */}
        {status && (
          <div
            className={`flex gap-3 border p-4 ${
              status.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p>{status.message}</p>
          </div>
        )}

        {/* Configuration Card */}
        <div className="border border-border bg-background p-6 space-y-6">
          <div>
            <h2 className="label-mono mb-4 text-sm font-semibold text-foreground">AUTHENTICATION</h2>

            <div className="space-y-4">
              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Printify API key"
                  className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                />
                <p className="label-mono mt-2 text-xs text-muted-foreground">
                  Found in your Printify account settings &gt; API
                </p>
              </div>

              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">Shop ID</label>
                <input
                  type="text"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  placeholder="Enter your Printify Shop ID"
                  className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                />
                <p className="label-mono mt-2 text-xs text-muted-foreground">
                  Available in Printify dashboard under Account &gt; Shops
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={handleTestConnection}
                disabled={isLoading || !apiKey || !shopId}
                className="border border-border px-4 py-2.5 font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                TEST CONNECTION
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={isLoading || !apiKey || !shopId}
                className="bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                SAVE CREDENTIALS
              </button>
            </div>
          </div>

          {/* Auto-Sync Settings */}
          {isConfigured && (
            <div className="border-t border-border pt-6 space-y-4">
              <h2 className="label-mono text-sm font-semibold text-foreground">AUTO-SYNC SETTINGS</h2>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-foreground">Enable automatic sync</span>
              </label>

              {autoSync && (
                <div>
                  <label className="label-mono block text-sm font-semibold text-foreground">Sync Interval (hours)</label>
                  <select
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                    className="mt-2 border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                  >
                    <option value={1}>Every hour</option>
                    <option value={6}>Every 6 hours</option>
                    <option value={12}>Every 12 hours</option>
                    <option value={24}>Every 24 hours</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleSyncNow}
                disabled={isLoading}
                className="mt-4 inline-flex items-center gap-2 border border-border px-4 py-2.5 font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                SYNC NOW
              </button>
            </div>
          )}
        </div>

        {/* Documentation Card */}
        <div className="border border-border bg-background p-6">
          <h2 className="label-mono mb-4 text-sm font-semibold text-foreground">GETTING STARTED</h2>
          <div className="label-mono space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">1. Create a Printify Account</strong>
              <br />
              Visit{" "}
              <a href="https://printify.com" target="_blank" rel="noopener" className="text-primary hover:underline">
                printify.com
              </a>{" "}
              and sign up for an account.
            </p>
            <p>
              <strong className="text-foreground">2. Get Your API Key</strong>
              <br />
              In Account Settings &gt; API, create a new API token and copy it.
            </p>
            <p>
              <strong className="text-foreground">3. Find Your Shop ID</strong>
              <br />
              In Account &gt; Shops, note your Shop ID number.
            </p>
            <p>
              <strong className="text-foreground">4. Connect Here</strong>
              <br />
              Paste your credentials above and test the connection.
            </p>
            <p>
              <strong className="text-foreground">5. Sync Products</strong>
              <br />
              Click &quot;Sync Now&quot; to import your Printify products or enable auto-sync.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        {isConfigured && (
          <div className="border border-red-300 bg-red-50 p-6">
            <h2 className="label-mono mb-4 text-sm font-semibold text-red-900">DANGER ZONE</h2>
            <p className="label-mono mb-4 text-sm text-red-800">
              Disconnecting Printify will remove all API credentials and product mappings.
            </p>
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="inline-flex items-center gap-2 border border-red-300 px-4 py-2.5 font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              DISCONNECT PRINTIFY
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
