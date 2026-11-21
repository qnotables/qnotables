begin;

create table public.embed_providers (
  origin text primary key check (char_length(origin) <= 260 and origin ~ '^https://[a-z0-9.-]+$'),
  enabled boolean not null default true,
  allow_frame boolean not null default false,
  allow_media boolean not null default false,
  allow_preview boolean not null default true,
  default_mode text not null default 'auto' check (default_mode in ('auto', 'website', 'card', 'media', 'full', 'citation'))
);

create table public.embed_resolutions (
  cache_key text primary key check (char_length(cache_key) = 64),
  origin text not null check (char_length(origin) <= 260),
  metadata jsonb not null default '{}'::jsonb check (octet_length(metadata::text) <= 8192),
  status text not null check (status in ('compatible', 'restricted', 'unavailable', 'preview')),
  expires_at timestamptz not null
);
create index embed_resolutions_expiry_idx on public.embed_resolutions (expires_at);

create table public.embed_rate_limits (
  actor_id uuid primary key,
  window_start timestamptz not null,
  attempts integer not null
);

alter table public.embed_providers enable row level security;
alter table public.embed_resolutions enable row level security;
alter table public.embed_rate_limits enable row level security;
revoke all on public.embed_providers, public.embed_resolutions, public.embed_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.embed_providers, public.embed_resolutions, public.embed_rate_limits to service_role;

create function public.consume_embed_preview(p_actor uuid) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare
  allowed boolean;
begin
  insert into public.embed_rate_limits as limits (actor_id, window_start, attempts)
  values (p_actor, now(), 1)
  on conflict (actor_id) do update set
    window_start = case when limits.window_start <= now() - interval '1 minute' then now() else limits.window_start end,
    attempts = case when limits.window_start <= now() - interval '1 minute' then 1 else limits.attempts + 1 end
  where limits.window_start <= now() - interval '1 minute' or limits.attempts < 10
  returning true into allowed;
  if allowed and random() < 0.02 then
    delete from public.embed_rate_limits where window_start < now() - interval '1 day';
    delete from public.embed_resolutions where expires_at < now() - interval '1 day';
  end if;
  return coalesce(allowed, false);
end;
$$;
revoke all on function public.consume_embed_preview(uuid) from public, anon, authenticated;
grant execute on function public.consume_embed_preview(uuid) to service_role;

insert into public.embed_providers (origin, allow_frame, allow_media)
values ('https://www.youtube-nocookie.com', true, true),
       ('https://player.vimeo.com', true, true),
       ('https://rumble.com', true, true),
       ('https://www.redditmedia.com', true, true),
       ('https://archive.org', true, true);

commit;
