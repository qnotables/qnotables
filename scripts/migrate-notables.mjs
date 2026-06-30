/**
 * Run once to create the notables table in Supabase.
 *
 * Usage (from project root):
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/migrate-notables.mjs
 */

import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, key)

const SQL = `
-- Notables scraped from 8kun/QResearch public pages
CREATE TABLE IF NOT EXISTS notables (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source          text        NOT NULL,          -- 'rss' | 'html'
  board           text        NOT NULL,          -- 'qresearch' | 'qnotables' etc.
  thread_url      text        NOT NULL,
  post_number     text,
  title           text        NOT NULL,
  body            text,
  links           jsonb       NOT NULL DEFAULT '[]'::jsonb,
  media           jsonb       NOT NULL DEFAULT '[]'::jsonb,
  raw_text        text,
  created_at_source timestamptz,
  scraped_at      timestamptz NOT NULL DEFAULT now(),
  hash_unique     text        NOT NULL UNIQUE     -- prevents duplicates
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS notables_board_idx        ON notables (board);
CREATE INDEX IF NOT EXISTS notables_scraped_at_idx   ON notables (scraped_at DESC);
CREATE INDEX IF NOT EXISTS notables_created_at_source_idx ON notables (created_at_source DESC);
CREATE INDEX IF NOT EXISTS notables_title_search_idx ON notables USING gin(to_tsvector('english', title));

-- Enable Row Level Security (read-only to anon)
ALTER TABLE notables ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notables' AND policyname = 'notables_public_read'
  ) THEN
    CREATE POLICY notables_public_read ON notables FOR SELECT USING (true);
  END IF;
END $$;
`

try {
  const { error } = await supabase.rpc("exec_sql", { sql: SQL }).single()

  if (error) {
    // rpc might not exist — fall back to direct query via REST
    console.warn("rpc exec_sql unavailable, trying direct SQL via Supabase pg extension...")
    // The migration DDL can also be run via the Supabase SQL Editor in the dashboard.
    console.log("\nPlease run the following SQL in your Supabase SQL Editor:\n")
    console.log(SQL)
  } else {
    console.log("Migration complete — notables table created.")
  }
} catch {
  console.log("Could not run migration automatically via RPC.")
  console.log("Please run the following SQL in your Supabase SQL Editor:\n")
  console.log(SQL)
}
