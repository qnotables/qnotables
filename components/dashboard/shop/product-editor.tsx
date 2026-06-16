"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Save, X, AlertCircle } from "lucide-react"
import { generateSlug } from "@/lib/shop/products"
import type { Product } from "@/lib/shop/products"

const PRODUCT_TYPES = ["manual", "printify", "digital", "membership"]
const STATUSES = ["draft", "active", "hidden", "sold_out", "archived"]

interface ProductEditorProps {
  product?: Product
  isNew?: boolean
}

export function ProductEditor({ product, isNew = true }: ProductEditorProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    product_type: product?.product_type || "manual",
    category: product?.category || "",
    short_description: product?.short_description || "",
    description: product?.description || "",
    price: product?.price ? (product.price / 100).toString() : "",
    compare_at_price: product?.compare_at_price ? (product.compare_at_price / 100).toString() : "",
    cost: product?.cost ? (product.cost / 100).toString() : "",
    sku: product?.sku || "",
    status: product?.status || "draft",
    featured: product?.featured || false,
    image_url: product?.image_url || "",
    tags: product?.tags?.join(", ") || "",
    seo_title: product?.seo_title || "",
    seo_description: product?.seo_description || "",
    // Shopify integration
    shopify_product_id: product?.shopify_product_id || "",
    shopify_variant_id: product?.shopify_variant_id || "",
    shopify_product_url: product?.shopify_product_url || "",
    external_checkout_url: product?.external_checkout_url || "",
    purchase_button_label: product?.purchase_button_label || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "name" && !product?.slug) {
        updated.slug = generateSlug(value)
      }
      return updated
    })
  }

  const handleSubmit = async (mode: "draft" | "publish") => {
    setError(null)
    setIsSubmitting(true)

    try {
      if (!formData.name.trim()) {
        throw new Error("Product name is required")
      }
      if (!formData.slug.trim()) {
        throw new Error("Product slug is required")
      }

      const formDataObj = new FormData()
      formDataObj.append("name", formData.name)
      formDataObj.append("slug", formData.slug)
      formDataObj.append("product_type", formData.product_type)
      formDataObj.append("category", formData.category)
      formDataObj.append("short_description", formData.short_description)
      formDataObj.append("description", formData.description)
      if (formData.price) formDataObj.append("price", formData.price)
      if (formData.compare_at_price) formDataObj.append("compare_at_price", formData.compare_at_price)
      if (formData.cost) formDataObj.append("cost", formData.cost)
      formDataObj.append("sku", formData.sku)
      formDataObj.append("status", mode === "publish" ? "active" : formData.status)
      formDataObj.append("featured", formData.featured.toString())
      formDataObj.append("image_url", formData.image_url)
      formDataObj.append("tags", formData.tags)
      formDataObj.append("seo_title", formData.seo_title)
      formDataObj.append("seo_description", formData.seo_description)
      if (formData.shopify_product_id) formDataObj.append("shopify_product_id", formData.shopify_product_id)
      if (formData.shopify_variant_id) formDataObj.append("shopify_variant_id", formData.shopify_variant_id)
      if (formData.shopify_product_url) formDataObj.append("shopify_product_url", formData.shopify_product_url)
      if (formData.external_checkout_url) formDataObj.append("external_checkout_url", formData.external_checkout_url)
      if (formData.purchase_button_label) formDataObj.append("purchase_button_label", formData.purchase_button_label)

      const endpoint = isNew ? "/api/shop/products/create" : `/api/shop/products/${product?.id}/update`
      const response = await fetch(endpoint, {
        method: "POST",
        body: formDataObj,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save product")
      }

      router.push("/dashboard/shop/products")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product")
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!product?.id) return
    if (!confirm("Are you sure? This cannot be undone.")) return

    try {
      const response = await fetch(`/api/shop/products/${product.id}/delete`, {
        method: "POST",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete product")
      }

      router.push("/dashboard/shop/products")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product")
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex gap-3 border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form ref={formRef} className="space-y-6 border border-border bg-background p-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="label-mono font-semibold text-foreground">BASIC INFO</h2>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Enter product name"
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleFieldChange("slug", e.target.value)}
                placeholder="product-slug"
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleFieldChange("category", e.target.value)}
                placeholder="e.g., Apparel"
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">Short Description</label>
            <textarea
              value={formData.short_description}
              onChange={(e) => handleFieldChange("short_description", e.target.value)}
              placeholder="Brief product summary"
              rows={2}
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Full product description"
              rows={4}
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="label-mono font-semibold text-foreground">PRICING</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleFieldChange("price", e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Compare at Price</label>
              <input
                type="number"
                value={formData.compare_at_price}
                onChange={(e) => handleFieldChange("compare_at_price", e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Cost</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => handleFieldChange("cost", e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Inventory & Fulfillment */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="label-mono font-semibold text-foreground">INVENTORY</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleFieldChange("sku", e.target.value)}
                placeholder="Stock keeping unit"
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Product Type</label>
              <select
                value={formData.product_type}
                onChange={(e) => handleFieldChange("product_type", e.target.value)}
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              >
                {PRODUCT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Media & SEO */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="label-mono font-semibold text-foreground">MEDIA & SEO</h2>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => handleFieldChange("image_url", e.target.value)}
              placeholder="https://..."
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" className="mt-3 max-h-48 rounded" />
            )}
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">SEO Title</label>
            <input
              type="text"
              value={formData.seo_title}
              onChange={(e) => handleFieldChange("seo_title", e.target.value)}
              placeholder="SEO optimized title"
              maxLength={60}
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
            <p className="label-mono mt-1 text-xs text-muted-foreground">{formData.seo_title.length}/60</p>
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">SEO Description</label>
            <textarea
              value={formData.seo_description}
              onChange={(e) => handleFieldChange("seo_description", e.target.value)}
              placeholder="Meta description for search results"
              maxLength={160}
              rows={2}
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
            <p className="label-mono mt-1 text-xs text-muted-foreground">{formData.seo_description.length}/160</p>
          </div>
        </div>

        {/* Status & Features */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="label-mono font-semibold text-foreground">STATUS & FEATURES</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange("status", e.target.value)}
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleFieldChange("featured", e.target.checked)}
                  className="h-4 w-4 border border-border bg-background"
                />
                <span>Featured Product</span>
              </label>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4 border-t border-border pt-6">
          <label className="label-mono block text-sm font-semibold text-foreground">Tags</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => handleFieldChange("tags", e.target.value)}
            placeholder="Separate with commas"
            className="w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
          />
        </div>

        {/* Shopify Integration */}
        <div className="space-y-4 border-t border-border pt-6">
          <h2 className="label-mono font-semibold text-foreground">SHOPIFY INTEGRATION</h2>
          <p className="text-xs text-muted-foreground">
            Link this product to your external Shopify store. When a Shopify URL is set, the storefront shows a
            &quot;Buy on Shopify&quot; button instead of the local cart.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Shopify Product ID</label>
              <input
                type="text"
                value={formData.shopify_product_id}
                onChange={(e) => handleFieldChange("shopify_product_id", e.target.value)}
                placeholder="gid://shopify/Product/..."
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Default Variant ID</label>
              <input
                type="text"
                value={formData.shopify_variant_id}
                onChange={(e) => handleFieldChange("shopify_variant_id", e.target.value)}
                placeholder="gid://shopify/ProductVariant/..."
                className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">
              Shopify Product URL
              <span className="ml-2 font-normal text-muted-foreground">(handle, path, or full URL)</span>
            </label>
            <input
              type="text"
              value={formData.shopify_product_url}
              onChange={(e) => handleFieldChange("shopify_product_url", e.target.value)}
              placeholder="field-tee  OR  /products/field-tee  OR  https://..."
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">
              Override Checkout URL
              <span className="ml-2 font-normal text-muted-foreground">(leave blank to use Shopify product URL)</span>
            </label>
            <input
              type="url"
              value={formData.external_checkout_url}
              onChange={(e) => handleFieldChange("external_checkout_url", e.target.value)}
              placeholder="https://shop.qnotables.ai/cart/..."
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="label-mono block text-sm font-semibold text-foreground">
              Button Label Override
              <span className="ml-2 font-normal text-muted-foreground">(defaults to &quot;Buy on Shopify&quot;)</span>
            </label>
            <input
              type="text"
              value={formData.purchase_button_label}
              onChange={(e) => handleFieldChange("purchase_button_label", e.target.value)}
              placeholder="Buy on Shopify"
              maxLength={80}
              className="mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      </form>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 border border-border px-6 py-2.5 font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            SAVE DRAFT
          </button>
          <button
            onClick={() => handleSubmit("publish")}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            PUBLISH
          </button>
        </div>

        {!isNew && (
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 border border-red-300 px-6 py-2.5 font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            DELETE
          </button>
        )}
      </div>
    </div>
  )
}
