-- Additive Town Hall Pulse settings migration.
-- The live schema change is applied through the connected Supabase workflow.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS pulse_enabled boolean,
  ADD COLUMN IF NOT EXISTS pulse_editor_thread_id uuid,
  ADD COLUMN IF NOT EXISTS pulse_excluded_thread_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS pulse_active_max_age_days integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS pulse_backchannel_max_age_days integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS pulse_kicker text NOT NULL DEFAULT 'COMMUNITY SIGNAL',
  ADD COLUMN IF NOT EXISTS pulse_title text NOT NULL DEFAULT 'THE TOWN HALL',
  ADD COLUMN IF NOT EXISTS pulse_description text NOT NULL DEFAULT 'Follow the signal. Examine the evidence. Add to the record.',
  ADD COLUMN IF NOT EXISTS pulse_enter_label text NOT NULL DEFAULT 'ENTER THE TOWN HALL',
  ADD COLUMN IF NOT EXISTS pulse_start_label text NOT NULL DEFAULT 'START A THREAD',
  ADD COLUMN IF NOT EXISTS pulse_updated_by text;

CREATE INDEX IF NOT EXISTS site_settings_pulse_editor_thread_idx
  ON public.site_settings (pulse_editor_thread_id);
