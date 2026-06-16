## HOT AND FRESH Blog Publishing Workflow

This guide documents the end-to-end blog post creation, publication, and display workflow.

### Workflow Overview

```
1. Create Draft
   └─> Visit /dashboard/blog/new
   └─> Fill form (autosaves to localStorage every 5 seconds)
   └─> Click "Save Draft" → Post saved as draft in database

2. Publish Post
   └─> Fill form completely
   └─> Click "Publish" → Post saved as published in database
   └─> published_at timestamp set to now()

3. Display Published Posts
   └─> /archives → Lists all published posts
   └─> /blog/[slug] → Individual post pages
   └─> /feed.xml → RSS feed includes published posts
   └─> Front page → Featured posts
```

### Form Components

**Pages:**
- `/dashboard/blog/new` - Create new post (DashboardBlogForm component)
- `/dashboard/blog` - Blog management dashboard
- `/blog/admin/new` - Alt blog admin interface
- `/blog/admin/[id]` - Edit existing post
- `/archives` - Public post archive
- `/blog/[slug]` - Individual post view
- `/feed.xml` - RSS feed

**Components:**
- `DashboardBlogForm` - Full tabbed editor with:
  - Write tab (title, excerpt, body)
  - Preview tab (markdown preview)
  - Details tab (slug, subtitle, cover image, featured, priority)
  - Sources tab (author, source name/url)
  - SEO tab (meta tags, OG image)
  - Settings tab (category, post type, tag, status)

### Data Flow

1. **Form Submission** (`DashboardBlogForm`)
   - User fills form across multiple tabs
   - State maintained in React with `formData` and `handleFieldChange`
   - localStorage autosave (only for new posts)
   - Validation on submit

2. **Server Action** (`blog-form-actions.ts`)
   - `createPostDashboard()` - Creates new post
   - `updatePostDashboard()` - Updates existing post
   - Validates required fields:
     - Always: title (3+ chars), body (10+ chars), slug
     - Publish only: category, post_type
   - Slugifies slug from title if not provided
   - Sets `published_at` to NOW() if status='published'
   - Inserts into `blog_posts` table

3. **Database** (Supabase)
   - Table: `blog_posts`
   - Filters: `status = 'published'` for public display
   - Sorts: `published_at DESC` (newest first)

4. **Public Display** (`lib/blog-posts.ts`)
   - `getDbPosts()` - Fetches published posts from database
   - `getMdxPosts()` - Fallback MDX content (static files)
   - `getAllPosts()` - Merges both sources (DB overrides MDX)
   - `getPost(slug)` - Fetch single post by slug

5. **Routes** (Page Components)
   - `/archives` - Displays all published posts
   - `/blog/[slug]` - Individual post pages
   - `/feed.xml` - RSS feed generation

### Required Setup

1. **Database Schema**
   - Run the SQL in `docs/blog-schema.sql` in your Supabase project
   - Creates `blog_posts` and `blog_post_tags` tables
   - Sets up indexes and RLS policies

2. **Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role
   DASHBOARD_SECRET_KEY=your-secret-key
   ```

3. **Image Upload**
   - Covers images upload to Vercel Blob via `/api/dashboard/upload`
   - API supports folders: `blog`, `og`

### Form State Management

**State Preservation:**
- `formData` React state stores all field values
- `handleFieldChange()` updates individual fields
- Tab switching doesn't clear state
- localStorage saves full formData every 5 seconds (new posts only)
- On page reload: loads from localStorage → preserves draft

**Auto-slug Generation:**
```typescript
useEffect(() => {
  if (!isEdit && formData.slug === "" && formData.title.length > 0) {
    const newSlug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80)
    setFormData((prev) => ({ ...prev, slug: newSlug }))
  }
}, [formData.title, isEdit])
```

### Publishing Logic

**Save as Draft:**
1. Validates: title, slug, body (all required)
2. Sets: `status = 'draft'`, `published_at = null`
3. Stores in database

**Publish:**
1. Validates: title, slug, body, category, post_type (all required)
2. Sets: `status = 'published'`, `published_at = NOW()`
3. Stores in database
4. Post appears on `/archives` and `/blog/[slug]`

**Republishing Draft:**
- Change status to 'published' and publish
- New `published_at` timestamp

### Display Logic

**Database Query (published posts):**
```typescript
const { data, error } = await admin
  .from("blog_posts")
  .select("*")
  .eq("status", "published")
  .order("published_at", { ascending: false, nullsFirst: false })
```

**Merge with Static Content:**
- MDX posts from `content/blog/` directory
- DB posts override if slug matches
- Sorted by date descending

### Common Issues & Fixes

**Issue: Form loses data when switching tabs**
- Status: FIXED - Form state maintained in React state
- Solution: Use `formData` state with `handleFieldChange` callback

**Issue: Slug not auto-generating**
- Status: FIXED - useEffect watches title and generates slug
- Solution: useEffect dependency array includes formData.title

**Issue: Publish button errors**
- Status: FIXED - Validation checks category and post_type
- Solution: User must fill required fields on Settings tab

**Issue: Published posts not appearing on /archives**
- Possible causes:
  1. Status not set to 'published'
  2. Database query filtering wrong status
  3. published_at is null (check if set in action)
- Solution: Check database directly, verify published_at timestamp

**Issue: Draft saves failing**
- Possible causes:
  1. Supabase credentials not set
  2. Slug already exists (unique constraint)
  3. Validation errors (title too short, slug invalid)
- Solution: Check browser console and server logs for errors

### Testing Checklist

- [ ] Create post with title, excerpt, body
- [ ] Switch between tabs without losing data
- [ ] See autosave status indicator
- [ ] Click "Save Draft" - post appears as draft
- [ ] Edit draft - form pre-fills with existing data
- [ ] Add category and post type on Settings tab
- [ ] Click "Publish" - post appears on /archives
- [ ] Visit /archives - published post appears
- [ ] Click post title - view at /blog/[slug]
- [ ] Reload page - form state restored from localStorage
- [ ] Clear draft - localStorage cleared
- [ ] Check /feed.xml - published post in RSS

### Files Modified

Dashboard Publishing:
- `app/dashboard/blog/new/page.tsx` - Added `export const dynamic = "force-dynamic"`
- `app/dashboard/blog/page.tsx` - Added `export const dynamic = "force-dynamic"`
- `components/dashboard/dashboard-blog-form.tsx` - Core form component

Blog Management:
- `app/blog/admin/page.tsx` - Added `export const dynamic = "force-dynamic"`
- `app/blog/admin/new/page.tsx` - Added `export const dynamic = "force-dynamic"`
- `app/blog/admin/[id]/page.tsx` - Added `export const dynamic = "force-dynamic"`

Public Displays:
- `app/archives/page.tsx` - Uses getAllPosts() with published filter
- `app/blog/[slug]/page.tsx` - Uses getPost(slug) for individual posts
- `app/feed.xml/route.ts` - RSS generation from published posts
- `lib/blog-posts.ts` - Database and MDX integration

Server Actions:
- `app/dashboard/blog/blog-form-actions.ts` - createPostDashboard, updatePostDashboard

### Next Steps

1. Run SQL schema in Supabase console
2. Test form UI in `/dashboard/blog/new`
3. Create and save draft post
4. Publish post
5. Verify appearance on `/archives`
6. Check `/feed.xml` for post inclusion
