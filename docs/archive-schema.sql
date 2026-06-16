"""
Extended Archive Schema for HOT AND FRESH
Adds comprehensive media, embed, and archive support to blog_posts table
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

-- Create indexes for archive queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_media_type ON blog_posts(media_type);
CREATE INDEX IF NOT EXISTS idx_blog_posts_timeline_date ON blog_posts(timeline_date);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_scheduled_at ON blog_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_archive_media_media_type ON archive_media(media_type);

-- Create view for published archive items
CREATE OR REPLACE VIEW published_archives AS
SELECT 
  id,
  slug,
  title,
  subtitle,
  excerpt,
  category,
  tags,
  post_type,
  featured,
  source_name,
  source_url,
  source_author,
  original_publish_date,
  published_at,
  cover_image_url,
  og_image_url,
  media_type,
  video_url,
  embed_url,
  iframe_url,
  document_url,
  status,
  priority,
  show_title,
  episode_date,
  timeline_date,
  include_in_rss,
  public_archive
FROM blog_posts
WHERE status = 'published' AND public_archive = true
ORDER BY published_at DESC;

-- Create view for scheduled posts
CREATE OR REPLACE VIEW scheduled_archives AS
SELECT *
FROM blog_posts
WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW();
