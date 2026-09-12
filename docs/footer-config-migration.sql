-- QNotables footer configuration
-- Apply this idempotent migration in the connected Supabase project.
-- The app reads this table through the existing service-role server client;
-- unpublished draft JSON is never exposed to public clients.

CREATE TABLE IF NOT EXISTS public.footer_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  draft_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT footer_config_singleton CHECK (id = 'default'),
  CONSTRAINT footer_config_draft_object CHECK (jsonb_typeof(draft_config) = 'object'),
  CONSTRAINT footer_config_published_object CHECK (jsonb_typeof(published_config) = 'object')
);

INSERT INTO public.footer_config (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.footer_config ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.footer_config FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.footer_config TO service_role;

CREATE INDEX IF NOT EXISTS footer_config_published_at_idx
  ON public.footer_config (published_at DESC NULLS LAST);

COMMENT ON TABLE public.footer_config IS 'Singleton draft and published configuration for the QNotables public footer.';
