-- Sprint 2: histórico individual de comparações

create table if not exists public.comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  supplier_count integer not null default 0 check (supplier_count >= 0),
  item_count integer not null default 0 check (item_count >= 0),
  max_savings numeric(14, 2) not null default 0 check (max_savings >= 0),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comparisons_user_created_idx
  on public.comparisons (user_id, created_at desc);

alter table public.comparisons enable row level security;

revoke all on table public.comparisons from anon;
grant select, insert, update, delete on table public.comparisons to authenticated;

drop policy if exists "Users can view own comparisons" on public.comparisons;
create policy "Users can view own comparisons"
  on public.comparisons
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own comparisons" on public.comparisons;
create policy "Users can create own comparisons"
  on public.comparisons
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own comparisons" on public.comparisons;
create policy "Users can update own comparisons"
  on public.comparisons
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own comparisons" on public.comparisons;
create policy "Users can delete own comparisons"
  on public.comparisons
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
