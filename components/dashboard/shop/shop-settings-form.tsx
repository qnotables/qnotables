"use client"

import { useState } from "react"
import { Save, AlertCircle, CheckCircle } from "lucide-react"

export function ShopSettingsForm() {
  const [settings, setSettings] = useState({
    storefront_preview_mode: true,
    checkout_active: false,
    default_shipping_note: "Ships in 3-5 business days",
    default_product_image: "",
    default_product_status: "draft",
    default_fulfillment_method: "manual",
  })

  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/shop/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setStatus({ type: "success", message: "Settings saved successfully" })
      } else {
        setStatus({ type: "error", message: "Failed to save settings" })
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to save settings" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-8 px-6 py-8">
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

      <div className="border border-border bg-background p-6 space-y-6">
        <div>
          <h2 className="label-mono mb-4 text-sm font-semibold text-foreground">STOREFRONT</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.storefront_preview_mode}
                onChange={(e) => handleChange("storefront_preview_mode", e.target.checked)}
                className="h-4 w-4 border border-border bg-background"
              />
              <div>
                <p className="font-semibold text-foreground">Preview Mode</p>
                <p className="label-mono text-xs text-muted-foreground">
                  Show shop as "Coming Soon" to customers
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.checkout_active}
                onChange={(e) => handleChange("checkout_active", e.target.checked)}
                className="h-4 w-4 border border-border bg-background"
              />
              <div>
                <p className="font-semibold text-foreground">Checkout Active</p>
                <p className="label-mono text-xs text-muted-foreground">
                  Enable customer purchases (requires payment processor)
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="border-t border-border pt-6 space-y-4">
          <h2 className="label-mono text-sm font-semibold text-foreground">DEFAULTS</h2>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">
              Default Product Status
            </label>
            <select
              value={settings.default_product_status}
              onChange={(e) => handleChange("default_product_status", e.target.value)}
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
            <p className="label-mono mt-2 text-xs text-muted-foreground">
              New products will start with this status
            </p>
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">
              Default Fulfillment Method
            </label>
            <select
              value={settings.default_fulfillment_method}
              onChange={(e) => handleChange("default_fulfillment_method", e.target.value)}
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            >
              <option value="manual">Manual Fulfillment</option>
              <option value="printify">Printify</option>
              <option value="digital">Digital Delivery</option>
            </select>
            <p className="label-mono mt-2 text-xs text-muted-foreground">
              How new products are fulfilled by default
            </p>
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">
              Default Shipping Note
            </label>
            <textarea
              value={settings.default_shipping_note}
              onChange={(e) => handleChange("default_shipping_note", e.target.value)}
              placeholder="e.g., Ships in 3-5 business days"
              rows={3}
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
            <p className="label-mono mt-2 text-xs text-muted-foreground">
              Shown to customers during checkout
            </p>
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">
              Default Product Image URL
            </label>
            <input
              type="url"
              value={settings.default_product_image}
              onChange={(e) => handleChange("default_product_image", e.target.value)}
              placeholder="https://..."
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
            <p className="label-mono mt-2 text-xs text-muted-foreground">
              Used when products don&apos;t have their own image
            </p>
          </div>
        </div>
      </div>

      <div className="border border-border bg-background p-6">
        <h2 className="label-mono mb-4 text-sm font-semibold text-foreground">INTEGRATIONS STATUS</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between border border-border/50 bg-muted/30 p-4">
            <div>
              <p className="font-semibold text-foreground">Stripe</p>
              <p className="label-mono text-xs text-muted-foreground">Payment processing</p>
            </div>
            <span className="label-mono inline-block bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-700">
              NOT CONNECTED
            </span>
          </div>

          <div className="flex items-center justify-between border border-border/50 bg-muted/30 p-4">
            <div>
              <p className="font-semibold text-foreground">Printify</p>
              <p className="label-mono text-xs text-muted-foreground">Print-on-demand fulfillment</p>
            </div>
            <span className="label-mono inline-block bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-700">
              NOT CONNECTED
            </span>
          </div>

          <div className="flex items-center justify-between border border-border/50 bg-muted/30 p-4">
            <div>
              <p className="font-semibold text-foreground">Email</p>
              <p className="label-mono text-xs text-muted-foreground">Order notifications</p>
            </div>
            <span className="label-mono inline-block bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-700">
              NOT CONFIGURED
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        SAVE SETTINGS
      </button>
    </div>
  )
}
