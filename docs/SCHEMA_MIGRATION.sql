"""
Schema migration setup for HOT AND FRESH archive system
Run this SQL in your Supabase console to add archive fields to blog_posts
"""

-- Add archive-specific columns to blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video', 'iframe', 'document', 'audio', 'external_link'));
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS embed_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS iframe_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS og_image_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS source_author TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS original_publish_date TIMESTAMP;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS imported_at TIMESTAMP;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS related_links JSONB;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS timeline_date DATE;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS show_title TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS episode_date TIMESTAMP;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS include_in_rss BOOLEAN DEFAULT true;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS public_archive BOOLEAN DEFAULT true;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS original_source_url TEXT;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS original_created_at TIMESTAMP;

-- Create archive_media table for file uploads
CREATE TABLE IF NOT EXISTS archive_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_name TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'document', 'video', 'audio')),
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT NOT NULL UNIQUE,
  alt_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create archive_embeds table for embed metadata
CREATE TABLE IF NOT EXISTS archive_embeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'rumble', 'vimeo', 'odysee', 'archive_org', 'google_docs')),
  embed_url TEXT NOT NULL,
  embed_code TEXT,
  title TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_at ON blog_posts(scheduled_at) WHERE scheduled_at IS NOT NULL AND status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_blog_posts_media_type ON blog_posts(media_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_published ON blog_posts(category, published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_archive_media_storage_path ON archive_media(storage_path);
CREATE INDEX IF NOT EXISTS idx_archive_embeds_post_id ON archive_embeds(post_id);

-- Create view for published archives
CREATE OR REPLACE VIEW published_archives AS
SELECT * FROM blog_posts
WHERE status = 'published' AND public_archive = true
ORDER BY published_at DESC NULLS LAST;

-- Enable RLS on new tables
ALTER TABLE archive_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_embeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for archive_media
CREATE POLICY "Anyone can view archive media" ON archive_media
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert archive media" ON archive_media
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );

-- RLS Policies for archive_embeds
CREATE POLICY "Anyone can view archive embeds" ON archive_embeds
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage archive embeds" ON archive_embeds
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );
