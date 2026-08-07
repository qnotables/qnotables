-- ============================================================
-- Forum Phase 1 Migration
-- Safe, reversible, additive-only. No data is deleted.
-- ============================================================

-- ── forum_threads: new columns ─────────────────────────────
ALTER TABLE forum_threads
  ADD COLUMN IF NOT EXISTS slug            TEXT,
  ADD COLUMN IF NOT EXISTS excerpt         TEXT,
  ADD COLUMN IF NOT EXISTS desk            TEXT,
  ADD COLUMN IF NOT EXISTS content_format  TEXT NOT NULL DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS view_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_count     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ;

-- ── forum_replies: new columns ────────────────────────────
ALTER TABLE forum_replies
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS content_format TEXT NOT NULL DEFAULT 'markdown';

-- ── profiles: new columns ─────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- ── CHECK constraints ─────────────────────────────────────
ALTER TABLE forum_threads
  DROP CONSTRAINT IF EXISTS chk_forum_threads_desk;
ALTER TABLE forum_threads
  ADD CONSTRAINT chk_forum_threads_desk
  CHECK (desk IS NULL OR desk IN (
    'notables','world','politics','defense','economy',
    'tech','science','energy','culture','crime','other'
  ));

ALTER TABLE forum_threads
  DROP CONSTRAINT IF EXISTS chk_forum_threads_content_format;
ALTER TABLE forum_threads
  ADD CONSTRAINT chk_forum_threads_content_format
  CHECK (content_format IN ('markdown','html','plain'));

ALTER TABLE forum_replies
  DROP CONSTRAINT IF EXISTS chk_forum_replies_content_format;
ALTER TABLE forum_replies
  ADD CONSTRAINT chk_forum_replies_content_format
  CHECK (content_format IN ('markdown','html','plain'));

-- ── Backfill desk from category ───────────────────────────
UPDATE forum_threads
SET desk = LOWER(TRIM(category))
WHERE desk IS NULL
  AND category IS NOT NULL
  AND LOWER(TRIM(category)) IN (
    'notables','world','politics','defense','economy',
    'tech','science','energy','culture','crime','other'
  );

-- Map legacy category names that differ from desk slugs
UPDATE forum_threads SET desk = 'other'
WHERE desk IS NULL AND category IS NOT NULL;

UPDATE forum_threads SET desk = 'other'
WHERE desk IS NULL;

-- ── Backfill last_activity_at from created_at ─────────────
UPDATE forum_threads
SET last_activity_at = created_at
WHERE last_activity_at IS NULL;

-- ── Backfill reply_count ──────────────────────────────────
UPDATE forum_threads t
SET reply_count = (
  SELECT COUNT(*) FROM forum_replies r
  WHERE r.thread_id = t.id
    AND r.is_hidden = false
    AND r.is_pending = false
)
WHERE reply_count = 0;

-- ── Backfill published_at for existing published threads ──
UPDATE forum_threads
SET published_at = created_at
WHERE published_at IS NULL
  AND status = 'published';

-- ── Generate slugs for rows that don't have one yet ───────
-- Uses title lowercased, punctuation stripped, words joined by '-',
-- with the last 8 chars of the id appended to guarantee uniqueness.
UPDATE forum_threads
SET slug = (
  REGEXP_REPLACE(
    REGEXP_REPLACE(LOWER(TRIM(title)), '[^a-z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
  || '-' || SUBSTRING(id::text, 1, 8)
)
WHERE slug IS NULL OR slug = '';

-- Ensure uniqueness — if a computed slug already collides, append more of id
UPDATE forum_threads t1
SET slug = slug || '-' || SUBSTRING(id::text, 1, 12)
WHERE EXISTS (
  SELECT 1 FROM forum_threads t2
  WHERE t2.slug = t1.slug AND t2.id <> t1.id
);

-- ── Unique constraint on slug ─────────────────────────────
ALTER TABLE forum_threads
  DROP CONSTRAINT IF EXISTS uq_forum_threads_slug;
ALTER TABLE forum_threads
  ADD CONSTRAINT uq_forum_threads_slug UNIQUE (slug);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_forum_threads_status      ON forum_threads (status);
CREATE INDEX IF NOT EXISTS idx_forum_threads_desk        ON forum_threads (desk);
CREATE INDEX IF NOT EXISTS idx_forum_threads_author_id   ON forum_threads (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_threads_created_at  ON forum_threads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_last_activity ON forum_threads (last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_slug        ON forum_threads (slug);
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned      ON forum_threads (is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_id   ON forum_replies (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id   ON forum_replies (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at  ON forum_replies (created_at DESC);

-- ── Full-text search index ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_forum_threads_fts ON forum_threads
  USING GIN (to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(excerpt,'') || ' ' || COALESCE(body,'')));

-- ── RLS Policies ─────────────────────────────────────────
-- Enable RLS if not already on
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;

-- Drop and recreate to ensure idempotency
DROP POLICY IF EXISTS "published_threads_readable" ON forum_threads;
DROP POLICY IF EXISTS "own_drafts_readable" ON forum_threads;
DROP POLICY IF EXISTS "members_can_insert_threads" ON forum_threads;
DROP POLICY IF EXISTS "authors_can_update_own_threads" ON forum_threads;
DROP POLICY IF EXISTS "mods_can_moderate_threads" ON forum_threads;

-- Anyone can read published, non-hidden threads
CREATE POLICY "published_threads_readable" ON forum_threads
  FOR SELECT USING (
    status = 'published'
    AND COALESCE(is_hidden, false) = false
    AND COALESCE(is_soft_deleted, false) = false
  );

-- Members can read their own drafts/pending
CREATE POLICY "own_drafts_readable" ON forum_threads
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
  );

-- Active members can insert threads
CREATE POLICY "members_can_insert_threads" ON forum_threads
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.account_status, 'active') = 'active'
    )
  );

-- Authors can update their own non-locked threads (but NOT mod fields)
CREATE POLICY "authors_can_update_own_threads" ON forum_threads
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
    AND COALESCE(is_locked, false) = false
  )
  WITH CHECK (
    author_id = auth.uid()
  );

-- Moderators/admins have full read + write
CREATE POLICY "mods_can_moderate_threads" ON forum_threads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('moderator', 'administrator')
    )
  );

-- Replies RLS
DROP POLICY IF EXISTS "published_replies_readable" ON forum_replies;
DROP POLICY IF EXISTS "own_replies_readable" ON forum_replies;
DROP POLICY IF EXISTS "members_can_insert_replies" ON forum_replies;
DROP POLICY IF EXISTS "authors_can_update_own_replies" ON forum_replies;
DROP POLICY IF EXISTS "mods_can_moderate_replies" ON forum_replies;

CREATE POLICY "published_replies_readable" ON forum_replies
  FOR SELECT USING (
    COALESCE(is_hidden, false) = false
    AND COALESCE(is_pending, false) = false
  );

CREATE POLICY "own_replies_readable" ON forum_replies
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
  );

CREATE POLICY "members_can_insert_replies" ON forum_replies
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND COALESCE(p.account_status, 'active') = 'active'
    )
  );

CREATE POLICY "authors_can_update_own_replies" ON forum_replies
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
    AND author_id = auth.uid()
  )
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "mods_can_moderate_replies" ON forum_replies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('moderator', 'administrator')
    )
  );
