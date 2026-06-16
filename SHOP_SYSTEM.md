# HOT AND FRESH Shop System

## Overview

Complete e-commerce platform for the HOT AND FRESH news site with product management, Printify integration preparation, and customer-facing shop interface.

## Architecture

### Database Schema

**Products** (`products` table)
- Full product lifecycle management (draft/active/hidden/sold_out/archived)
- Pricing with compare-at pricing support
- Product types: manual, printify, digital, membership
- Printify integration fields (product_id, blueprint_id, print_provider_id)
- Stripe integration fields (product_id, price_id)
- SEO fields (title, description, OG image)

**Product Variants** (`product_variants` table)
- Support for product options and variations
- Per-variant pricing and costs
- Printify variant mapping
- Stock status tracking

**Orders** (`orders` table)
- Order tracking with complete lifecycle
- Statuses: pending, paid, in_production, fulfilled, cancelled, refunded, failed
- Fulfillment method tracking (manual/printify/digital)
- Stripe payment intent ID storage
- Printify order ID mapping

**Order Items** (`order_items` table)
- Line items with product/variant references
- Selected options stored as JSON
- Per-item pricing snapshot

**Shop Settings** (`shop_settings` table)
- Storefront configuration (preview mode, checkout active)
- Default product settings
- Fulfillment defaults
- Printify configuration

**Printify Sync Log** (`printify_sync_log` table)
- Audit trail for all sync operations
- Tracks sync status and errors
- Detailed sync result details

## Admin Dashboard

### Dashboard Structure

**Base Path**: `/dashboard/shop`

#### Shop Control Center (`/dashboard/shop`)
- Real-time stats cards (products, orders, revenue, featured)
- Products organized by status
- Recent orders list
- Quick navigation sidebar

#### Products Management (`/dashboard/shop/products`)
- Product listing with images, SKUs, prices
- Status badges and featured indicators
- Quick edit links
- Search and filter placeholders

#### Product Editor (`/dashboard/shop/products/new`)
- Complete product form with sections:
  - Basic Info (name, slug, category, descriptions)
  - Pricing (price, compare-at, cost)
  - Inventory (SKU, product type)
  - Media & SEO (image with preview, meta tags with counters)
  - Status & Features (status selector, featured toggle)
  - Tags (comma-separated)
- Auto-slug generation from product name
- Save as Draft or Publish
- Delete with confirmation
- Form validation with error messages

#### Orders Management (`/dashboard/shop/orders`)
- Order table with customer, total, status, date
- Status filter tabs (All/Pending/Paid/In Production/Fulfilled)
- Color-coded status badges
- View details links for each order

#### Printify Integration (`/dashboard/shop/printify`)
- API key and Shop ID configuration
- Test Connection functionality
- Save Credentials
- Auto-sync configuration (1/6/12/24 hour intervals)
- Manual Sync Now button
- Getting Started documentation
- Danger Zone with Disconnect button
- Real-time status messages

#### Settings (`/dashboard/shop/settings`)
- Storefront settings (preview mode, checkout active)
- Default product status selector
- Default fulfillment method
- Default shipping note template
- Default product image URL
- Integration status dashboard
- Settings persistence via API

## Public Shop

### Routes

**Product Catalog** (`/shop/products`)
- Grid view of all active products
- Product images with hover zoom
- Price with compare-at display
- Links to product details

**Product Detail** (`/shop/products/[slug]`)
- Dynamic product pages by URL slug
- Product images and gallery
- Variant selection
- Quantity adjustment
- Add to cart functionality
- Full product description
- SEO metadata generation

**Shopping Cart** (`/shop/cart`)
- Full cart view with product images
- Per-item quantity adjustment
- Individual item removal
- Clear entire cart
- Order summary sidebar
- Shipping note placeholder
- Checkout button (ready for payment integration)
- Empty state messaging

## API Routes

### Shop Management

**Products**
- `POST /api/shop/products/create` - Create product
- `POST /api/shop/products/[id]/update` - Update product
- `DELETE /api/shop/products/[id]` - Delete product

**Settings**
- `POST /api/shop/settings` - Save shop configuration

### Printify Integration

**Configuration**
- `POST /api/shop/printify/test` - Test API connection
- `POST /api/shop/printify/settings` - Save Printify credentials
- `POST /api/shop/printify/sync` - Trigger product sync
- `POST /api/shop/printify/disconnect` - Clear all connections

## Client-Side Systems

### Cart Context (`lib/shop/cart-context.tsx`)
- React Context for global cart state
- localStorage persistence
- Cart operations: add, remove, update quantity, clear
- Calculated totals and item counts

### Product Utilities (`lib/shop/products.ts`)
- Query functions: getAllProducts, getByStatus, getFeatured, getBySlug
- Variant queries and order queries
- Statistics: getShopStats
- Utility functions: generateSlug, formatPrice

### Printify Utilities (`lib/shop/printify.ts`)
- Settings management
- Connection testing
- Product syncing (placeholder for real API)
- Sync logging
- Product disconnect

## Features

### Current Features
- ✅ Complete product management
- ✅ Multi-status product lifecycle
- ✅ Product variants/options
- ✅ Variant-specific pricing
- ✅ SEO fields for each product
- ✅ Printify integration scaffolding
- ✅ Order tracking system
- ✅ Shop settings/configuration
- ✅ Public product catalog
- ✅ Shopping cart with persistence
- ✅ Product detail pages with metadata
- ✅ Sync audit logging

### Ready for Integration
- 🔵 Stripe checkout integration
- 🔵 Real Printify API sync
- 🔵 Email order notifications
- 🔵 Customer accounts & order history
- 🔵 Inventory management
- 🔵 Discount codes/coupons
- 🔵 Shipping calculator
- 🔵 Search and filtering

## Authentication

**Admin Dashboard**: Uses existing dashboard authentication (`validateDashboardAccess`)

**Public Shop**: Open access (ready for customer accounts)

**API**: Secret key authentication via `DASHBOARD_SECRET_KEY` for admin operations

## Styling

All components use the tactical grid theme with:
- Semantic design tokens (background, foreground, primary, muted-foreground)
- Tailwind CSS utility classes
- Consistent border and spacing
- Label-mono typography for secondary text
- Status badge color coding

## Environment Variables

Required for production:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key
- `DASHBOARD_SECRET_KEY` - Secret for admin API calls (optional, auto-generated)

Optional for features:
- Stripe keys (for checkout)
- Printify API key (user-provided via dashboard)
- Email service keys (for notifications)

## Next Steps

1. **Stripe Integration**: Connect payment processing
2. **Product Sync**: Implement real Printify API calls
3. **Email Notifications**: Set up order confirmation emails
4. **Customer Accounts**: Add user authentication to shop
5. **Inventory**: Add stock tracking
6. **Analytics**: Track sales and customer behavior
7. **Discounts**: Implement coupon/discount system
8. **Shipping**: Integrate shipping calculator

## Development Notes

- All database queries use Supabase client
- Admin operations require secret key validation
- Cart data persists in browser localStorage
- Product slugs auto-generated from names
- Prices stored in cents (multiply by 100 for API)
- All dates stored as ISO strings in UTC
- Suspense boundaries used for server component loading
