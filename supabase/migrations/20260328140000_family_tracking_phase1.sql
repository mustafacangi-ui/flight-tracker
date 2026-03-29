-- RouteWings — family tracking links (Phase 1)

create table if not exists public.family_tracking_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  flight_number text not null,
  share_token text unique not null,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists family_tracking_links_user_id_idx
  on public.family_tracking_links (user_id);

alter table public.family_tracking_links enable row level security;

create policy "family_tracking_links_owner"
  on public.family_tracking_links
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public read by token only (no direct table SELECT for anon)
create or replace function public.get_family_link_by_token(p_token text)
returns setof public.family_tracking_links
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.family_tracking_links f
  where f.share_token = p_token
    and (f.expires_at is null or f.expires_at > now())
  limit 1;
$$;

revoke all on function public.get_family_link_by_token(text) from public;
grant execute on function public.get_family_link_by_token(text) to anon;
grant execute on function public.get_family_link_by_token(text) to authenticated;
