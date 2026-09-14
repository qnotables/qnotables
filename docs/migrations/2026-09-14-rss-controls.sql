-- RSS controls migration for the public wire and dashboard.
-- Applied to the connected Supabase project through the Supabase workflow.

CREATE TABLE IF NOT EXISTS public.rss_sources (
  source_key text PRIMARY KEY,
  name text NOT NULL,
  feed_url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  last_fetched_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  item_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rss_sources_feed_url_check CHECK (feed_url ~* '^https?://'),
  CONSTRAINT rss_sources_item_count_check CHECK (item_count >= 0)
);

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS rss_excluded_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rss_excluded_terms jsonb NOT NULL DEFAULT '["sports", "celebrity"]'::jsonb,
  ADD COLUMN IF NOT EXISTS rss_retention_days integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS rss_policy_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS rss_policy_updated_by text;

ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_rss_retention_days_check;
ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_rss_retention_days_check CHECK (rss_retention_days BETWEEN 1 AND 90);

ALTER TABLE public.rss_items
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS primary_category text,
  ADD COLUMN IF NOT EXISTS secondary_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'moderation',
  ADD COLUMN IF NOT EXISTS manual_lock boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manually_classified_at timestamptz;

CREATE INDEX IF NOT EXISTS rss_sources_enabled_idx ON public.rss_sources (enabled, name);
CREATE INDEX IF NOT EXISTS rss_items_source_date_idx ON public.rss_items (source_id, published_at DESC);
CREATE INDEX IF NOT EXISTS rss_items_review_status_idx ON public.rss_items (review_status, manual_lock, published_at DESC);

ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read enabled RSS sources" ON public.rss_sources;
CREATE POLICY "Public can read enabled RSS sources"
  ON public.rss_sources FOR SELECT
  USING (enabled = true);

-- Server actions use the service role after dashboard authorization for writes.
-- Keep writes out of the public client role.

INSERT INTO public.rss_sources (source_key, name, feed_url, enabled)
VALUES
  ('fox', 'FOX Politics', 'https://feeds.foxnews.com/foxnews/politics', true),
  ('foxn', 'FOX National', 'https://feeds.foxnews.com/foxnews/national', true),
  ('NY Post', 'NY Post', 'https://nypost.com/feed/', true),
  ('Daily Signal', 'The Daily Signal', 'https://www.dailysignal.com/feed/', true),
  ('Fox Latest', 'Fox News Latest', 'https://moxie.foxnews.com/google-publisher/latest.xml', true),
  ('Fox Politics', 'Fox News Politics', 'https://moxie.foxnews.com/google-publisher/politics.xml', true),
  ('Fox World', 'Fox News World', 'https://moxie.foxnews.com/google-publisher/world.xml', true),
  ('Fox US', 'Fox News U.S.', 'https://moxie.foxnews.com/google-publisher/us.xml', true),
  ('Fox Tech', 'Fox News Technology', 'https://moxie.foxnews.com/google-publisher/tech.xml', true),
  ('Fox Science', 'Fox News Science', 'https://moxie.foxnews.com/google-publisher/science.xml', true),
  ('DOJ News', 'U.S. Department of Justice', 'https://www.justice.gov/news/rss?m=1', true),
  ('FBI Press', 'FBI National Press Releases', 'https://www.fbi.gov/feeds/national-press-releases/rss.xml', true),
  ('Defense News', 'Defense News', 'https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml', true),
  ('EIA Energy', 'EIA Today in Energy', 'https://www.eia.gov/rss/todayinenergy.xml', true),
  ('Federal Reserve', 'Federal Reserve Press Releases', 'https://www.federalreserve.gov/feeds/press_all.xml', true),
  ('NASA Releases', 'NASA News Releases', 'https://www.nasa.gov/news-release/feed/', true),
  ('Federalist', 'The Federalist', 'https://thefederalist.com/feed/', true),
  ('The Christian Post', 'The Christian Post', 'https://www.christianpost.com/rss', true),
  ('Fox Business', 'Fox Business', 'https://moxie.foxbusiness.com/google-publisher/latest.xml', true)
ON CONFLICT (source_key) DO NOTHING;

INSERT INTO public.rss_sources (source_key, name, feed_url, enabled)
VALUES
  ('/qr/', '/qresearch/', 'https://8kun.top/qresearch/tripcode.xml', false),
  ('qnotables', '/qnotables/', 'https://sys.8ch.net/qnotables/tripcode.xml', false)
ON CONFLICT (source_key) DO NOTHING;
