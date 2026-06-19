-- Bookmarks Database Schema
-- This schema should be created in your Supabase project

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Resource',
  submitted_by_id UUID NOT NULL,
  submitted_by_name TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bookmarks_approved ON bookmarks(is_approved);
CREATE INDEX idx_bookmarks_category ON bookmarks(category) WHERE is_approved = TRUE;
CREATE INDEX idx_bookmarks_submitted_by_id ON bookmarks(submitted_by_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);

-- Enable RLS for security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Public policy: anyone can read approved bookmarks
CREATE POLICY bookmarks_public_read ON bookmarks
  FOR SELECT USING (is_approved = TRUE);

-- Users can read their own bookmarks (approved and pending)
CREATE POLICY bookmarks_user_read ON bookmarks
  FOR SELECT USING (
    is_approved = TRUE OR 
    (auth.uid() = submitted_by_id)
  );

-- Users can insert (submit) bookmarks
CREATE POLICY bookmarks_user_insert ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = submitted_by_id);

-- Users can update/delete only their own bookmarks
CREATE POLICY bookmarks_user_update ON bookmarks
  FOR UPDATE USING (auth.uid() = submitted_by_id);

CREATE POLICY bookmarks_user_delete ON bookmarks
  FOR DELETE USING (auth.uid() = submitted_by_id);
