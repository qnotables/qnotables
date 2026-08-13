-- taxonomy-migration.sql
-- Adds the three-axis taxonomy columns to blog_posts.
-- All columns are nullable on addition so no existing row is disrupted.
-- Run once; each statement is idempotent via IF NOT EXISTS / IF NOT EXISTS.
--
-- Columns added:
--   desk               TEXT  — primary subject desk (validated by CHECK)
--   content_type       TEXT  — format of the record (validated by CHECK)
--   tags               TEXT[] — normalized topic slugs
--   legacy_category    TEXT  — copy of the original category value for rollback
--   taxonomy_reviewed  BOOLEAN — true once an admin has approved the mapping
--   taxonomy_updated_at TIMESTAMPTZ — when taxonomy fields were last changed
--   taxonomy_updated_by TEXT  — who made the last change (email or "system")

-- -------------------------------------------------------------------------
-- 1. Add new columns (all nullable, no data disruption)
-- -------------------------------------------------------------------------

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS desk TEXT,
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS legacy_category TEXT,
  ADD COLUMN IF NOT EXISTS taxonomy_reviewed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS taxonomy_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS taxonomy_updated_by TEXT;

-- -------------------------------------------------------------------------
-- 2. CHECK constraints (only enforced on INSERT/UPDATE, not on existing rows)
-- -------------------------------------------------------------------------

ALTER TABLE blog_posts
  DROP CONSTRAINT IF EXISTS chk_blog_posts_desk;

ALTER TABLE blog_posts
  ADD CONSTRAINT chk_blog_posts_desk
  CHECK (
    desk IS NULL OR desk IN (
      'notables','world','politics','defense','economy',
      'tech','science','energy','culture','crime','other'
    )
  );

ALTER TABLE blog_posts
  DROP CONSTRAINT IF EXISTS chk_blog_posts_content_type;

ALTER TABLE blog_posts
  ADD CONSTRAINT chk_blog_posts_content_type
  CHECK (
    content_type IS NULL OR content_type IN (
      'news-brief','field-note','research-thread','investigation',
      'explainer','source-archive','document-drop','video',
      'show-notes','live-stream','opinion','site-update','other'
    )
  );

-- -------------------------------------------------------------------------
-- 3. Indexes for filtered archive queries
-- -------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_blog_posts_desk
  ON blog_posts (desk)
  WHERE desk IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_posts_content_type
  ON blog_posts (content_type)
  WHERE content_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_posts_taxonomy_reviewed
  ON blog_posts (taxonomy_reviewed)
  WHERE taxonomy_reviewed IS NOT NULL;

-- GIN index for tag array containment queries  (@>)
CREATE INDEX IF NOT EXISTS idx_blog_posts_tags_gin
  ON blog_posts USING GIN (tags);

-- -------------------------------------------------------------------------
-- 4. Populate legacy_category from existing category column
--    Only copies when legacy_category is not yet set, so re-runs are safe.
-- -------------------------------------------------------------------------

UPDATE blog_posts
SET legacy_category = category
WHERE legacy_category IS NULL
  AND category IS NOT NULL
  AND category <> '';

-- -------------------------------------------------------------------------
-- 5. Update published_archives view to include new columns
-- -------------------------------------------------------------------------

CREATE OR REPLACE VIEW published_archives AS
SELECT
  id,
  slug,
  title,
  subtitle,
  excerpt,
  category,
  desk,
  content_type,
  tags,
  legacy_category,
  taxonomy_reviewed,
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
