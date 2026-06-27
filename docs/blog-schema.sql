-- Blog Publishing Workflow - Database Schema
-- This schema should be created in your Supabase project

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT NOT NULL,
  body TEXT NOT NULL,
  author_name TEXT,
  tag TEXT,
  category TEXT,
  post_type TEXT,
  priority TEXT DEFAULT 'medium',
  featured BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled', 'archived')),
  cover_image TEXT,
  og_image_url TEXT,
  seo_image_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  source_name TEXT,
  source_url TEXT,
  show_title BOOLEAN DEFAULT TRUE,
  episode_date DATE,
  read_minutes INTEGER DEFAULT 5,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT status_or_published CHECK (
    status = 'published' OR published = true OR (status != 'published' AND published = false)
  )
);

CREATE TABLE IF NOT EXISTS blog_post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(post_id, tag)
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured) WHERE featured = TRUE;
CREATE INDEX idx_blog_post_tags_post_id ON blog_post_tags(post_id);

-- Enable RLS (optional - for fine-grained access control)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Public policy: anyone can read published posts
CREATE POLICY blog_posts_public_read ON blog_posts
  FOR SELECT USING (status = 'published');

-- Admin policy: admins can do everything (needs authentication)
CREATE POLICY blog_posts_admin_all ON blog_posts
  FOR ALL USING (true);
