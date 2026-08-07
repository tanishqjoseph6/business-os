-- Provider-neutral billing records. Provider payloads remain opaque JSON so
-- changing gateways does not require a schema migration.
create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_subscription_id text,
  plan_id text not null,
  interval text not null check (interval in ('monthly', 'yearly')),
  status text not null default 'pending',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.organizations(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_event_id text,
  provider_order_id text,
  provider_subscription_id text,
  kind text not null check (kind in ('payment', 'subscription', 'refund', 'invoice')),
  status text not null,
  amount numeric(12, 2),
  currency text,
  invoice_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

alter table public.billing_subscriptions enable row level security;
alter table public.billing_transactions enable row level security;

create policy "billing subscriptions own workspace"
  on public.billing_subscriptions for select
  using (user_id = auth.uid());

create policy "billing transactions own records"
  on public.billing_transactions for select
  using (user_id = auth.uid());

create index if not exists billing_transactions_user_created_idx
  on public.billing_transactions(user_id, created_at desc);
