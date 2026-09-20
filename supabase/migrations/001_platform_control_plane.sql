-- TATVa platform control plane
-- Run with Supabase migrations before enabling remote tenant mode.

create extension if not exists pgcrypto;

create type public.platform_role as enum ('platform_owner', 'platform_admin', 'support', 'auditor');
create type public.tenant_status as enum ('trial', 'active', 'suspended', 'archived');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'paused');
create type public.payment_status as enum ('created', 'pending', 'succeeded', 'failed', 'refunded', 'disputed');
create type public.job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');

create table if not exists public.platform_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.platform_role not null default 'auditor',
  mfa_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id text primary key,
  slug text not null unique,
  name text not null,
  status public.tenant_status not null default 'trial',
  plan_id text not null default 'starter',
  contact_email text,
  contact_phone text,
  region text not null default 'ap-south-1',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.tenant_memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id text not null references public.tenants(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'accountant', 'cashier', 'auditor', 'support')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, tenant_id)
);

create table if not exists public.tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  hostname text not null unique,
  is_primary boolean not null default false,
  verification_token text,
  verified_at timestamptz,
  ssl_status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  provider text not null,
  provider_customer_id text,
  provider_subscription_id text unique,
  plan_id text not null,
  status public.subscription_status not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete restrict,
  provider text not null,
  provider_payment_id text,
  idempotency_key text not null unique,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'INR',
  status public.payment_status not null default 'created',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id text references public.tenants(id) on delete cascade,
  provider text not null,
  name text not null,
  language text not null default 'en',
  body text not null,
  provider_template_id text,
  approval_status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.message_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  template_id uuid references public.message_templates(id),
  provider text not null,
  recipient text not null,
  provider_message_id text,
  status text not null default 'queued',
  error_message text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create table if not exists public.object_files (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(id) on delete cascade,
  bucket text not null,
  object_path text not null,
  content_type text,
  size_bytes bigint,
  checksum text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (bucket, object_path)
);

create table if not exists public.backup_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text references public.tenants(id) on delete cascade,
  storage_bucket text not null default 'platform-backups',
  object_path text,
  status public.job_status not null default 'queued',
  checksum text,
  error_message text,
  requested_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.health_checks (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  target text not null,
  status text not null,
  latency_ms integer,
  details jsonb not null default '{}',
  checked_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id),
  tenant_id text references public.tenants(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  before_data jsonb,
  after_data jsonb,
  reason text,
  request_id text,
  ip_address inet,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_daily (
  day date not null,
  tenant_id text references public.tenants(id) on delete cascade,
  metric text not null,
  value numeric not null default 0,
  created_at timestamptz not null default now(),
  primary key (day, tenant_id, metric)
);

create table if not exists public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text references public.tenants(id) on delete cascade,
  job_type text not null,
  payload jsonb not null default '{}',
  status public.job_status not null default 'queued',
  run_after timestamptz not null default now(),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create or replace function public.is_platform_role(required_role public.platform_role default 'auditor')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.platform_profiles p
    where p.user_id = auth.uid()
      and p.is_active
      and case required_role
        when 'auditor' then p.role in ('auditor', 'support', 'platform_admin', 'platform_owner')
        when 'support' then p.role in ('support', 'platform_admin', 'platform_owner')
        when 'platform_admin' then p.role in ('platform_admin', 'platform_owner')
        when 'platform_owner' then p.role = 'platform_owner'
      end
  );
$$;

create or replace function public.is_tenant_member(target_tenant text, minimum_role text default 'auditor')
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.tenant_memberships m
    where m.user_id = auth.uid() and m.tenant_id = target_tenant and m.is_active
      and case minimum_role
        when 'auditor' then m.role in ('auditor', 'cashier', 'accountant', 'admin', 'owner', 'support')
        when 'accountant' then m.role in ('accountant', 'admin', 'owner', 'support')
        when 'admin' then m.role in ('admin', 'owner', 'support')
        when 'owner' then m.role = 'owner'
      end
  );
$$;

alter table public.platform_profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.tenant_domains enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.webhook_events enable row level security;
alter table public.message_templates enable row level security;
alter table public.message_deliveries enable row level security;
alter table public.object_files enable row level security;
alter table public.backup_jobs enable row level security;
alter table public.health_checks enable row level security;
alter table public.audit_events enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.automation_jobs enable row level security;

create policy platform_profiles_self on public.platform_profiles for select to authenticated using (user_id = auth.uid() or public.is_platform_role('platform_admin'));
create policy platform_admin_tenants on public.tenants for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy tenant_member_read on public.tenants for select to authenticated using (public.is_tenant_member(id));
create policy platform_admin_memberships on public.tenant_memberships for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy tenant_self_membership_read on public.tenant_memberships for select to authenticated using (user_id = auth.uid());
create policy platform_admin_domains on public.tenant_domains for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy tenant_domain_read on public.tenant_domains for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_subscription_read on public.subscriptions for select to authenticated using (public.is_tenant_member(tenant_id) or public.is_platform_role('auditor'));
create policy platform_subscription_write on public.subscriptions for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy tenant_payment_read on public.payment_transactions for select to authenticated using (public.is_tenant_member(tenant_id) or public.is_platform_role('auditor'));
create policy platform_payment_write on public.payment_transactions for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy platform_webhooks on public.webhook_events for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy tenant_templates on public.message_templates for select to authenticated using (tenant_id is null or public.is_tenant_member(tenant_id));
create policy platform_template_write on public.message_templates for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy tenant_deliveries on public.message_deliveries for select to authenticated using (public.is_tenant_member(tenant_id) or public.is_platform_role('auditor'));
create policy platform_delivery_write on public.message_deliveries for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy tenant_files on public.object_files for select to authenticated using (public.is_tenant_member(tenant_id));
create policy platform_file_write on public.object_files for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy platform_backups on public.backup_jobs for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy platform_health on public.health_checks for select to authenticated using (public.is_platform_role('auditor'));
create policy platform_health_write on public.health_checks for insert to authenticated with check (public.is_platform_role('platform_admin'));
create policy audit_read on public.audit_events for select to authenticated using (public.is_platform_role('auditor') or (tenant_id is not null and public.is_tenant_member(tenant_id)));
create policy audit_insert on public.audit_events for insert to authenticated with check (actor_user_id = auth.uid() or public.is_platform_role('platform_admin'));
create policy analytics_read on public.analytics_daily for select to authenticated using (tenant_id is null and public.is_platform_role('auditor') or (tenant_id is not null and public.is_tenant_member(tenant_id)));
create policy analytics_write on public.analytics_daily for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));
create policy automation_read on public.automation_jobs for select to authenticated using (tenant_id is null and public.is_platform_role('auditor') or (tenant_id is not null and public.is_tenant_member(tenant_id)));
create policy automation_write on public.automation_jobs for all to authenticated using (public.is_platform_role('platform_admin')) with check (public.is_platform_role('platform_admin'));

create index if not exists tenant_memberships_tenant_idx on public.tenant_memberships(tenant_id);
create index if not exists audit_events_tenant_created_idx on public.audit_events(tenant_id, created_at desc);
create index if not exists automation_jobs_due_idx on public.automation_jobs(status, run_after);
