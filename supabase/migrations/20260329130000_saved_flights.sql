-- User-scoped saved flights (cloud sync). Unique per user + flight + departure instant.

create table if not exists public.saved_flights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  flight_number text not null,
  departure_airport text not null,
  arrival_airport text not null,
  departure_time timestamptz not null,
  airline text not null default '—',
  status text not null default 'Scheduled',
  searched_airport_code text not null default '—',
  arrival_time text,
  family_shared boolean not null default false,
  client_timestamp bigint,
  created_at timestamptz not null default now()
);

create unique index if not exists saved_flights_user_flight_departure
  on public.saved_flights (
    user_id,
    lower(btrim(flight_number)),
    departure_time
  );

create index if not exists saved_flights_user_id_idx
  on public.saved_flights (user_id);

alter table public.saved_flights enable row level security;

create policy "saved_flights_own"
  on public.saved_flights
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
