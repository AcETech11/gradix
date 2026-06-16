create table if not exists public.platform_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint platform_admins_role_check check (role in ('owner', 'support', 'finance')),
  constraint platform_admins_user_id_key unique (user_id)
);

create index if not exists platform_admins_user_active_idx
on public.platform_admins (user_id, is_active);

create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  platform_admin_id uuid null references public.platform_admins(id) on delete set null,
  actor_user_id uuid null references auth.users(id) on delete set null,
  action text not null,
  entity_type text null,
  entity_id uuid null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists platform_audit_logs_created_at_idx
on public.platform_audit_logs (created_at desc);

create index if not exists platform_audit_logs_entity_idx
on public.platform_audit_logs (entity_type, entity_id);

alter table public.platform_admins enable row level security;
alter table public.platform_admins force row level security;
alter table public.platform_audit_logs enable row level security;
alter table public.platform_audit_logs force row level security;

drop policy if exists "platform admins can view own membership" on public.platform_admins;
create policy "platform admins can view own membership"
on public.platform_admins for select
to authenticated
using (user_id = auth.uid() and is_active = true);

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'demo_requests'
      and constraint_name = 'demo_requests_status_check'
  ) then
    alter table public.demo_requests drop constraint demo_requests_status_check;
  end if;
end;
$$;

alter table public.demo_requests
add constraint demo_requests_status_check
check (status in ('new', 'contacted', 'demo_booked', 'converted', 'not_interested', 'closed'));
