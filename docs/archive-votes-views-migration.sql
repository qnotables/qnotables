-- Migration: Add view_count to blog_posts and create archive_votes table
-- Run this in your Supabase SQL editor

-- 1. Add view_count column to blog_posts
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- 2. Create archive_votes table (thumbs up / thumbs down per post per user)
CREATE TABLE IF NOT EXISTS archive_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_archive_votes_post_id ON archive_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_archive_votes_user_id ON archive_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_view_count ON blog_posts(view_count DESC);

-- 4. RLS for archive_votes
ALTER TABLE archive_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read vote counts (for aggregate display)
CREATE POLICY archive_votes_public_read ON archive_votes
  FOR SELECT USING (true);

-- Authenticated users can insert their own vote
CREATE POLICY archive_votes_insert ON archive_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update only their own vote
CREATE POLICY archive_votes_update ON archive_votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete (retract) only their own vote
CREATE POLICY archive_votes_delete ON archive_votes
  FOR DELETE USING (auth.uid() = user_id);
