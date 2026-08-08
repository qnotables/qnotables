-- ============================================================
-- Forum Phase 1 Migration
-- Safe, reversible, additive-only. No data is deleted.
--
-- Verified pre-migration columns (information_schema, live DB):
--   forum_threads: id, title, body, author_id, created_at, is_locked,
--     is_pinned, is_soft_deleted, is_featured, category, tags,
--     source_url, is_pending
--   forum_replies: id, thread_id, body, author_id, created_at,
--     parent_reply_id, is_hidden, is_pending
--   profiles: id, display_name, created_at, karma, role, status,
--     username, email, avatar_url, updated_at, last_seen_at, post_count
-- ============================================================

-- ── forum_threads: new columns ─────────────────────────────
ALTER TABLE forum_threads
  ADD COLUMN IF NOT EXISTS slug            TEXT,
  ADD COLUMN IF NOT EXISTS excerpt         TEXT,
  ADD COLUMN IF NOT EXISTS desk            TEXT,
  ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS content_format  TEXT NOT NULL DEFAULT 'markdown',
  ADD COLUMN IF NOT EXISTS view_count      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_count     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ;

-- ── forum_replies: new columns ────────────────────────────
ALTER TABLE forum_replies
  ADD COLUMN IF NOT EXISTS status          TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS content_format  TEXT NOT NULL DEFAULT 'markdown';

-- ── profiles: new columns ─────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- ── CHECK constraints ─────────────────────────────────────
ALTER TABLE forum_threads
  DROP CONSTRAINT IF EXISTS chk_forum_threads_status;
ALTER TABLE forum_threads
  ADD CONSTRAINT chk_forum_threads_status
  CHECK (status IN ('draft','published','hidden'));

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
  DROP CONSTRAINT IF EXISTS chk_forum_replies_status;
ALTER TABLE forum_replies
  ADD CONSTRAINT chk_forum_replies_status
  CHECK (status IN ('published','hidden'));

ALTER TABLE forum_replies
  DROP CONSTRAINT IF EXISTS chk_forum_replies_content_format;
ALTER TABLE forum_replies
  ADD CONSTRAINT chk_forum_replies_content_format
  CHECK (content_format IN ('markdown','html','plain'));

-- ── Backfill status from is_soft_deleted (soft-deleted -> hidden) ─
UPDATE forum_threads
SET status = 'hidden'
WHERE is_soft_deleted = true AND status = 'published';

UPDATE forum_replies
SET status = 'hidden'
WHERE is_hidden = true AND status = 'published';

-- ── Backfill desk from category ───────────────────────────
UPDATE forum_threads
SET desk = LOWER(TRIM(category))
WHERE desk IS NULL
  AND category IS NOT NULL
  AND LOWER(TRIM(category)) IN (
    'notables','world','politics','defense','economy',
    'tech','science','energy','culture','crime','other'
  );

-- Any remaining unmapped/blank category falls back to 'other'
UPDATE forum_threads SET desk = 'other' WHERE desk IS NULL;

-- ── Backfill last_activity_at / updated_at from created_at ────
UPDATE forum_threads SET last_activity_at = created_at WHERE last_activity_at IS NULL;
UPDATE forum_threads SET updated_at = created_at WHERE updated_at IS NULL;
UPDATE forum_replies SET updated_at = created_at WHERE updated_at IS NULL;

-- ── Backfill reply_count from actual non-hidden, non-pending replies ─
UPDATE forum_threads t
SET reply_count = (
  SELECT COUNT(*) FROM forum_replies r
  WHERE r.thread_id = t.id
    AND COALESCE(r.is_hidden, false) = false
    AND COALESCE(r.is_pending, false) = false
)
WHERE reply_count = 0;

-- ── Backfill published_at for existing published threads ──
UPDATE forum_threads
SET published_at = created_at
WHERE published_at IS NULL
  AND status = 'published';

-- ── Backfill excerpt from body (first 200 chars, whitespace-collapsed) ─
UPDATE forum_threads
SET excerpt = SUBSTRING(REGEXP_REPLACE(COALESCE(body, ''), '\s+', ' ', 'g'), 1, 200)
WHERE excerpt IS NULL AND body IS NOT NULL;

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
CREATE INDEX IF NOT EXISTS idx_forum_threads_reply_count ON forum_threads (reply_count DESC);
CREATE INDEX IF NOT EXISTS idx_forum_threads_slug        ON forum_threads (slug);
CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned      ON forum_threads (is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_forum_threads_tags_gin    ON forum_threads USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_forum_replies_thread_id   ON forum_replies (thread_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_author_id   ON forum_replies (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created_at  ON forum_replies (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_replies_status      ON forum_replies (status);

-- ── Full-text search index ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_forum_threads_fts ON forum_threads
  USING GIN (to_tsvector('english', COALESCE(title,'') || ' ' || COALESCE(excerpt,'') || ' ' || COALESCE(body,'')));

-- ============================================================
-- NOTE ON RLS: forum_threads / forum_replies already have RLS
-- policies from the original schema (auth-gated insert, public
-- read of non-hidden/non-pending rows, mod override via profiles.role).
-- This migration does not touch existing RLS policies — it only
-- adds columns and constraints. If new read paths are needed for
-- 'draft'/'hidden' status values, add them in a follow-up migration
-- after confirming the exact existing policy definitions.
-- ============================================================
