-- Town Hall Phase 2: rich content, drafts, revisions, media, previews, and audit
-- Additive and idempotent. Existing markdown/plain content and URLs remain valid.

alter table public.forum_threads
  add column if not exists content_json jsonb,
  add column if not exists content_version integer not null default 1,
  add column if not exists draft_version integer not null default 0;

alter table public.forum_replies
  add column if not exists content_json jsonb,
  add column if not exists content_version integer not null default 1,
  add column if not exists draft_version integer not null default 0;

alter table public.forum_threads drop constraint if exists chk_forum_threads_content_format;
alter table public.forum_threads add constraint chk_forum_threads_content_format
  check (content_format in ('markdown','html','plain','tiptap'));
alter table public.forum_replies drop constraint if exists chk_forum_replies_content_format;
alter table public.forum_replies add constraint chk_forum_replies_content_format
  check (content_format in ('markdown','html','plain','tiptap'));

create table if not exists public.forum_revisions (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('thread','reply')),
  content_id uuid not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  content_json jsonb,
  content_format text not null default 'markdown' check (content_format in ('markdown','html','plain','tiptap')),
  content_version integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_attachments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.forum_threads(id) on delete cascade,
  reply_id uuid references public.forum_replies(id) on delete cascade,
  storage_provider text not null default 'vercel_blob' check (storage_provider in ('vercel_blob')),
  storage_key text not null unique,
  url text not null,
  original_name text not null,
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  width integer,
  height integer,
  duration_seconds numeric,
  alt_text text,
  caption text,
  status text not null default 'orphaned' check (status in ('orphaned','active','hidden','deleted')),
  created_at timestamptz not null default now(),
  attached_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint forum_attachment_single_parent check (num_nonnulls(thread_id, reply_id) <= 1)
);

create table if not exists public.forum_link_previews (
  id uuid primary key default gen_random_uuid(),
  url_hash text not null unique,
  url text not null,
  title text,
  description text,
  image_url text,
  site_name text,
  status text not null default 'ready' check (status in ('ready','failed','blocked')),
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days')
);

create table if not exists public.forum_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_forum_revisions_content on public.forum_revisions(content_type, content_id, created_at desc);
create index if not exists idx_forum_revisions_author on public.forum_revisions(author_id, created_at desc);
create index if not exists idx_forum_attachments_owner_status on public.forum_attachments(owner_id, status, created_at desc);
create index if not exists idx_forum_attachments_thread on public.forum_attachments(thread_id) where thread_id is not null;
create index if not exists idx_forum_attachments_reply on public.forum_attachments(reply_id) where reply_id is not null;
create index if not exists idx_forum_attachments_orphans on public.forum_attachments(created_at) where status = 'orphaned';
create index if not exists idx_forum_link_previews_expiry on public.forum_link_previews(expires_at);
create index if not exists idx_forum_audit_target on public.forum_audit_logs(target_type, target_id, created_at desc);
create index if not exists idx_forum_threads_public_feed on public.forum_threads(last_activity_at desc) where status = 'published' and is_soft_deleted = false and is_pending = false;
create index if not exists idx_forum_replies_public_thread on public.forum_replies(thread_id, created_at) where status = 'published' and is_hidden = false and is_pending = false;

alter table public.forum_revisions enable row level security;
alter table public.forum_attachments enable row level security;
alter table public.forum_link_previews enable row level security;
alter table public.forum_audit_logs enable row level security;

-- Existing broad policies are replaced so drafts and hidden content are not public.
drop policy if exists threads_select_all on public.forum_threads;
drop policy if exists threads_insert_own on public.forum_threads;
drop policy if exists threads_update_own on public.forum_threads;
drop policy if exists threads_delete_own on public.forum_threads;
create policy threads_select_visible on public.forum_threads for select
  using (
    (status = 'published' and is_soft_deleted = false and is_pending = false)
    or (auth.uid() = author_id)
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator'))
  );
create policy threads_insert_own on public.forum_threads for insert to authenticated
  with check (auth.uid() = author_id);
create policy threads_update_own on public.forum_threads for update to authenticated
  using (auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')))
  with check (auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')));
create policy threads_delete_own on public.forum_threads for delete to authenticated
  using (auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')));

drop policy if exists replies_select_all on public.forum_replies;
drop policy if exists replies_insert_own on public.forum_replies;
drop policy if exists replies_update_own on public.forum_replies;
drop policy if exists replies_delete_own on public.forum_replies;
create policy replies_select_visible on public.forum_replies for select
  using (
    ((status = 'published' and is_hidden = false and is_pending = false) and exists (
      select 1 from public.forum_threads t where t.id = thread_id and t.status = 'published' and t.is_soft_deleted = false and t.is_pending = false
    ))
    or auth.uid() = author_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator'))
  );
create policy replies_insert_own on public.forum_replies for insert to authenticated
  with check (
    auth.uid() = author_id and exists (
      select 1 from public.forum_threads t where t.id = thread_id and t.status = 'published' and t.is_locked = false and t.is_soft_deleted = false
    )
  );
create policy replies_update_own on public.forum_replies for update to authenticated
  using (auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')))
  with check (auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')));
create policy replies_delete_own on public.forum_replies for delete to authenticated
  using (auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')));

create policy revisions_select_owner_or_mod on public.forum_revisions for select to authenticated
  using (auth.uid() = author_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')));
create policy revisions_insert_owner on public.forum_revisions for insert to authenticated
  with check (auth.uid() = author_id);

create policy attachments_select_visible on public.forum_attachments for select
  using (
    status = 'active'
    or auth.uid() = owner_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator'))
  );
create policy attachments_insert_owner on public.forum_attachments for insert to authenticated
  with check (auth.uid() = owner_id);
create policy attachments_update_owner_or_mod on public.forum_attachments for update to authenticated
  using (auth.uid() = owner_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')))
  with check (auth.uid() = owner_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')));
create policy attachments_delete_owner_or_mod on public.forum_attachments for delete to authenticated
  using (auth.uid() = owner_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')));

create policy link_previews_read on public.forum_link_previews for select using (status = 'ready');
create policy audit_logs_mod_read on public.forum_audit_logs for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','moderator')));

-- Explicit Data API grants: new tables are not auto-exposed on newer Supabase projects.
grant select on public.forum_link_previews to anon, authenticated;
grant select, insert on public.forum_revisions to authenticated;
grant select, insert, update, delete on public.forum_attachments to authenticated;
grant select on public.forum_audit_logs to authenticated;
grant usage, select on sequence public.forum_audit_logs_id_seq to authenticated;
