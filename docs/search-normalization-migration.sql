-- Search normalization projection and reviewed aliases.
-- Run this migration against the Supabase project before enabling the public search route.

create extension if not exists unaccent;
create extension if not exists pg_trgm;

create table if not exists public.search_alias_groups (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  slug text not null unique,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.search_alias_terms (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.search_alias_groups(id) on delete cascade,
  term text not null,
  normalized_term text not null,
  compact_term text not null,
  created_at timestamptz not null default now(),
  unique (group_id, normalized_term)
);

create table if not exists public.search_documents (
  id uuid primary key default gen_random_uuid(),
  source_kind text not null,
  source_id uuid not null,
  title text not null default '',
  excerpt text not null default '',
  body text not null default '',
  normalized_title text not null default '',
  normalized_search text not null default '',
  compact_search text not null default '',
  href text not null,
  date_value timestamptz,
  source text,
  source_url text,
  author text,
  category text,
  desk text,
  tags text[] not null default '{}',
  content_type text,
  replies integer,
  read_minutes integer,
  image text,
  external boolean not null default false,
  primary_source boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_kind, source_id)
);

alter table public.search_alias_groups enable row level security;
alter table public.search_alias_terms enable row level security;
alter table public.search_documents enable row level security;

create index if not exists search_documents_normalized_search_trgm on public.search_documents using gin (normalized_search gin_trgm_ops);
create index if not exists search_documents_compact_search_trgm on public.search_documents using gin (compact_search gin_trgm_ops);
create index if not exists search_documents_kind_date_idx on public.search_documents (source_kind, date_value desc);
create index if not exists search_alias_terms_normalized_idx on public.search_alias_terms (normalized_term);
create index if not exists search_alias_terms_compact_idx on public.search_alias_terms (compact_term);

revoke all on table public.search_documents, public.search_alias_groups, public.search_alias_terms from anon, authenticated;
grant all on table public.search_documents, public.search_alias_groups, public.search_alias_terms to service_role;

-- Reviewed equivalence sets only. Do not add speculative or AI-generated synonyms.
with groups(label, slug) as (
  values
    ('September 11', 'september-11'),
    ('United States', 'united-states'),
    ('Houthi', 'houthi')
)
insert into public.search_alias_groups (label, slug)
select label, slug from groups
on conflict (slug) do update set label = excluded.label, updated_at = now();

with terms(slug, term) as (
  values
    ('september-11', '9/11'), ('september-11', '9-11'), ('september-11', '9 11'),
    ('september-11', 'September 11'), ('september-11', 'September 11th'), ('september-11', '911'),
    ('united-states', 'US'), ('united-states', 'U.S.'), ('united-states', 'United States'),
    ('united-states', 'USA'), ('united-states', 'U.S.A.'),
    ('houthi', 'Houthi'), ('houthi', 'Houthis'), ('houthi', '#Houthi')
)
insert into public.search_alias_terms (group_id, term, normalized_term, compact_term)
select g.id, t.term,
  trim(regexp_replace(public.unaccent(lower(t.term)), '[^[:alnum:]]+', ' ', 'g')),
  regexp_replace(trim(regexp_replace(public.unaccent(lower(t.term)), '[^[:alnum:]]+', ' ', 'g')), '[^[:alnum:]]', '', 'g')
from terms t join public.search_alias_groups g on g.slug = t.slug
on conflict (group_id, normalized_term) do nothing;

-- The function and source refresh triggers are installed by the approved database setup.
-- Re-run select public.refresh_search_documents(); after source schema changes or manual repairs.
select public.refresh_search_documents();
