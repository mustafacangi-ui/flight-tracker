-- RouteWings / FiyatRotasi — push notifications phase 1
-- Run in Supabase SQL Editor or via supabase db push

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now()
);

create unique index if not exists push_subscriptions_user_endpoint
  on public.push_subscriptions (user_id, endpoint);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  flight_delays boolean default true,
  gate_changes boolean default true,
  boarding_reminders boolean default true,
  departures boolean default true,
  arrivals boolean default true,
  cancellations boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists notification_preferences_user_id_key
  on public.notification_preferences (user_id);

create table if not exists public.tracked_flights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  flight_number text not null,
  departure_airport text,
  arrival_airport text,
  departure_time timestamptz,
  arrival_time timestamptz,
  last_status text,
  created_at timestamptz default now()
);

create unique index if not exists tracked_flights_user_flight_upper
  on public.tracked_flights (user_id, lower(flight_number));

-- RLS
alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.tracked_flights enable row level security;

create policy "push_subscriptions_own"
  on public.push_subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notification_preferences_own"
  on public.notification_preferences
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tracked_flights_own"
  on public.tracked_flights
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
