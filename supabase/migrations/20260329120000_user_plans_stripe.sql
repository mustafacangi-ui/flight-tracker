-- RouteWings — user subscription / Stripe linkage (updated by service role + webhooks)

create table if not exists public.user_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  user_email text,
  plan_type text not null default 'free',
  subscription_status text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists user_plans_stripe_customer_id_idx
  on public.user_plans (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists user_plans_stripe_subscription_id_idx
  on public.user_plans (stripe_subscription_id)
  where stripe_subscription_id is not null;

alter table public.user_plans enable row level security;

create policy "user_plans_select_own"
  on public.user_plans
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Inserts/updates are performed with the service role (webhooks) and bypass RLS.
