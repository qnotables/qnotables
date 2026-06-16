# HOT AND FRESH Archives System - Implementation & Setup Guide

## Overview

The complete archive system for HOT AND FRESH is now fully implemented with media uploads, batch imports, scheduled publishing, and comprehensive admin dashboard.

## Quick Setup

### 1. Run Database Schema Migrations

Execute all SQL from `docs/SCHEMA_MIGRATION.sql` in your Supabase console:

```bash
# Copy the SQL from docs/SCHEMA_MIGRATION.sql and paste into Supabase SQL Editor
# This adds:
# - 24 new archive-specific fields to blog_posts table
# - archive_media table for file uploads (Vercel Blob)
# - archive_embeds table for media provider tracking
# - Indexes for performance optimization
# - RLS policies for security
# - published_archives view for queries
```

### 2. Configure Environment Variables

Add to your `.env.local`:

```env
# Cron job secret for scheduled publishing (use a strong random string)
CRON_SECRET=your_secure_random_string_here

# Optional: For manual scheduled publishing
VERCEL_CRON_SECRET=your_secure_random_string_here
```

### 3. Set Up Scheduled Publishing (Optional)

To enable automatic publishing of scheduled posts, set up a cron job that calls `/api/scheduled-publish` every minute:

**Option A: Using Vercel Cron**

Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/scheduled-publish",
    "schedule": "* * * * *"
  }]
}
```

**Option B: Using External Service (EasyCron, AWS EventBridge, etc.)**

```bash
curl -X POST https://your-site.com/api/scheduled-publish \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Features & Usage

### Media Upload System

**Location:** `/dashboard/media`

- Upload images, documents, videos, and audio files to Vercel Blob
- Automatic file type validation (10MB images, 50MB docs, 500MB videos, 100MB audio)
- Stores metadata in `archive_media` table
- Files automatically organized by type in storage

**Server Action:** `app/actions/media-upload.ts`
- `uploadMediaToBlob(file, altText)` - Upload to Blob and save metadata
- `deleteMediaFile(storagePath)` - Delete file and metadata
- `getMediaLibrary()` - Fetch all uploaded media
- `updateMediaAltText(id, altText)` - Update accessibility text

### Batch Import System

**Location:** `/dashboard/import`

Supports 4 import formats:

#### CSV Import
```
title,slug,excerpt,body,category,tags,post_type,status,published_at
"My Post","my-post","Brief..","Full content","News","tag1,tag2","News Brief","draft","2024-01-15"
```

#### JSON Import
```json
[
  {
    "title": "Post Title",
    "body": "Content...",
    "category": "News",
    "tags": ["tag1", "tag2"],
    "status": "draft",
    "published_at": "2024-01-15"
  }
]
```

#### Markdown Import
```markdown
---
title: Post Title
category: News
tags: tag1, tag2
status: draft
published_at: 2024-01-15
---

Post content in markdown format...
```

#### RSS Import
Paste entire RSS XML feed - automatically extracts:
- `title` → title
- `description` → excerpt
- `link` → source_url
- `pubDate` → published_at
- Feed title → source_name

**Features:**
- Field mapping and validation
- Automatic slug generation and deduplication
- Date parsing (ISO, MM/DD/YYYY, YYYY-MM-DD formats)
- Preview table before import
- Batch error reporting
- Success/failure counts

**Server Actions:** `app/actions/import-posts.ts`
- `batchImportPosts(posts)` - Import validated posts with deduplication
- `checkDuplicateSlugs(slugs)` - Check for existing slugs
- `deduplicateSlugs(slugs)` - Deduplicate by appending -2, -3, etc.
- `getImportStats()` - Get import statistics

**Parser Utils:** `lib/import-parsers.ts`
- `parseCSV(text)` - Parse CSV data
- `parseJSON(text)` - Parse JSON data
- `parseMarkdown(text)` - Parse markdown with frontmatter
- `parseRSSFeed(xml)` - Parse RSS/XML feeds
- `validatePosts(posts)` - Validate required fields
- `generateSlug(title)` - Generate URL-safe slugs
- `parseDate(dateString)` - Parse multiple date formats

### Scheduled Publishing

**Route:** `/api/scheduled-publish`

**Setup:**
1. Set `status = 'scheduled'` and `scheduled_at = future_date` on a post
2. Run cron job to call `/api/scheduled-publish` every minute
3. Posts with `scheduled_at <= now()` are automatically published

**How it works:**
- Queries for all posts with `status = 'scheduled'` and `scheduled_at` in the past
- Updates them to `status = 'published'` and sets `published_at = now()`
- Returns list of published posts
- Requires `CRON_SECRET` authentication header

**Example Response:**
```json
{
  "success": true,
  "publishedCount": 3,
  "posts": [
    { "id": "...", "title": "Post 1", "slug": "post-1" },
    { "id": "...", "title": "Post 2", "slug": "post-2" },
    { "id": "...", "title": "Post 3", "slug": "post-3" }
  ],
  "revalidatePaths": ["/archives", "/archives/post-1", "/archives/post-2", "/archives/post-3"]
}
```

### Archive Management Dashboard

**Location:** `/dashboard/archives`

**Features:**
- View all archive posts in table format
- Stats: total items, published, drafts, scheduled
- Search, filter, and sort
- Inline editing (category, tags, status, featured toggle)
- Bulk actions: publish, draft, delete
- Date picker for backdating posts
- Slug regeneration tool

### Public Archive Views

#### Home Archive
**Route:** `/archives`

Main archive page with:
- Search and filtering (category, tag, source, post type)
- Featured posts section
- Timeline grouping
- Grid/list view toggle
- RSS feed link

#### Individual Post
**Route:** `/archives/[slug]`

Full post view with:
- Rich media embeds (YouTube, Rumble, Vimeo, Odysee, Archive.org, Google Docs)
- Related posts
- Source attribution
- Social sharing
- Navigation (prev/next)

#### Specialized Views

**Videos:** `/archives/videos` - Grid of video archives

**Documents:** `/archives/documents` - List of document archives

**Timeline:** `/archives/timeline` - Chronological timeline view by year/month

**Year/Month:** `/archives/[year]/[month]` - Posts from specific month

**Category:** `/archives/category/[category]` - Posts by category

**Tag:** `/archives/tag/[tag]` - Posts by tag

**Source:** `/archives/source/[source]` - Posts from specific source

### RSS Feed

**Route:** `/api/rss`

Dynamic RSS feed with:
- 50 latest published posts
- Media enclosures for cover images
- Respects `include_in_rss` flag per post
- 1-hour cache control
- Optimized for feed readers and podcasting

## Schema Reference

### Blog Posts Table - New Fields

```sql
-- Media & Embeds
media_type          TEXT -- 'none', 'image', 'video', 'iframe', 'document', 'audio', 'external_link'
video_url           TEXT
embed_url           TEXT
iframe_url          TEXT
document_url        TEXT
og_image_url        TEXT

-- Source Tracking
source_author       TEXT
original_publish_date TIMESTAMP
original_source_url TEXT
original_created_at TIMESTAMP

-- Archive Features
imported_at         TIMESTAMP
related_links       JSONB
timeline_date       DATE
show_title          TEXT
episode_date        TIMESTAMP

-- Publishing Control
include_in_rss      BOOLEAN DEFAULT true
public_archive      BOOLEAN DEFAULT true
scheduled_at        TIMESTAMP
```

### Archive Media Table

```sql
CREATE TABLE archive_media (
  id                UUID PRIMARY KEY
  filename          TEXT NOT NULL
  original_name     TEXT
  media_type        TEXT -- 'image', 'document', 'video', 'audio'
  file_size         INTEGER
  mime_type         TEXT
  storage_path      TEXT NOT NULL UNIQUE
  alt_text          TEXT
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
)
```

### Archive Embeds Table

```sql
CREATE TABLE archive_embeds (
  id                UUID PRIMARY KEY
  post_id           UUID REFERENCES blog_posts(id)
  provider          TEXT -- 'youtube', 'rumble', 'vimeo', 'odysee', 'archive_org', 'google_docs'
  embed_url         TEXT NOT NULL
  embed_code        TEXT
  title             TEXT
  thumbnail_url     TEXT
  created_at        TIMESTAMP
)
```

## File Structure

```
Core System:
  lib/archive.ts                          # Archive types & queries
  lib/slug-utils.ts                       # Slug generation & validation
  lib/import-parsers.ts                   # Format parsers (CSV, JSON, MD, RSS)

Server Actions:
  app/actions/media-upload.ts             # Media upload to Blob
  app/actions/import-posts.ts             # Batch import with deduplication
  app/actions/schedule-actions.ts         # Scheduled publishing

API Routes:
  app/api/scheduled-publish/route.ts      # Cron-triggered publishing
  app/api/rss/route.ts                    # Dynamic RSS feed

Dashboard Pages:
  app/dashboard/archives/page.tsx         # Management dashboard
  app/dashboard/archives/new/page.tsx     # Create archive
  app/dashboard/archives/[id]/edit/page.tsx # Edit archive
  app/dashboard/import/page.tsx           # Batch import
  app/dashboard/media/page.tsx            # Media library

Public Pages:
  app/archives/page.tsx                   # Archive home
  app/archives/[slug]/page.tsx            # Single post
  app/archives/videos/page.tsx            # Video archive
  app/archives/documents/page.tsx         # Document archive
  app/archives/timeline/page.tsx          # Timeline view
  app/archives/[year]/[month]/page.tsx    # Month archive
  app/archives/category/[category]/page.tsx
  app/archives/tag/[tag]/page.tsx
  app/archives/source/[source]/page.tsx

Documentation:
  docs/SCHEMA_MIGRATION.sql               # Database schema
  docs/ARCHIVES_IMPLEMENTATION.md         # Detailed implementation
  docs/ARCHIVE_SETUP.md                   # This file
```

## Troubleshooting

### Posts Not Publishing on Schedule
- Check `CRON_SECRET` is set and matches in cron request header
- Verify cron job is being called (check logs)
- Confirm posts have `status = 'scheduled'` and `scheduled_at` in past

### Import Fails with Slug Duplicates
- System automatically appends -2, -3, etc. to duplicate slugs
- Verify slugs aren't too long (max 100 chars)
- Check database permissions for admin user

### Media Upload Fails
- Verify file size is under type limit (10MB images, 50MB docs, etc.)
- Check MIME type is supported
- Confirm BLOB_READ_WRITE_TOKEN is set

### Archive Pages Not Showing
- Ensure posts have `status = 'published'` and `public_archive = true`
- Check `published_at` is set and in the past
- Verify category/tag spellings match exactly

## Performance Tips

1. Use indexes on common queries - all included in schema migration
2. Set `include_in_rss = false` for posts you don't want in feeds
3. Set `public_archive = false` for internal archives
4. Use `scheduled_at` for time-release content (replaces manual publishing)
5. Batch imports are optimized for large datasets (100s-1000s at once)

## Security Notes

- All media uploads validated by file type and size
- Archive_media and archive_embeds tables have RLS policies
- Scheduled publishing requires CRON_SECRET authentication
- All database queries use parameterized statements (Supabase client handles)
- Admin-only routes protected by validateDashboardAccess middleware

## Next Steps

1. Run `docs/SCHEMA_MIGRATION.sql` in Supabase console
2. Set `CRON_SECRET` environment variable
3. (Optional) Configure scheduled publishing cron job
4. Visit `/dashboard/import` to start importing archives
5. Visit `/dashboard/media` to upload media files
6. Visit `/archives` to see published archives

The archives system is production-ready and fully integrated with HOT AND FRESH branding!
