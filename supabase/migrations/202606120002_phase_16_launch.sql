-- Gradix Phase 16: marketing lead capture, manual billing, and staff invitations.

alter table if exists public.schools
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists student_limit integer;

alter table if exists public.schools
  alter column subscription_plan set default 'starter';

update public.schools
set
  subscription_plan = coalesce(nullif(subscription_plan, ''), 'starter'),
  student_limit = coalesce(student_limit, case
    when subscription_plan = 'premium' then 1500
    when subscription_plan = 'standard' then 700
    else 300
  end)
where subscription_plan is null
  or subscription_plan = ''
  or student_limit is null;

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  school_name text not null,
  role text,
  phone text not null,
  email text,
  student_count integer,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint demo_requests_status_check check (status in ('new', 'contacted', 'closed'))
);

create index if not exists demo_requests_status_created_at_idx
on public.demo_requests (status, created_at desc);

alter table public.demo_requests enable row level security;
alter table public.demo_requests force row level security;

drop policy if exists "public can create demo requests" on public.demo_requests;
drop policy if exists "authenticated admins can view demo requests" on public.demo_requests;

create policy "public can create demo requests"
on public.demo_requests for insert
to anon, authenticated
with check (true);

create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null,
  token text unique not null,
  status text not null default 'pending',
  invited_by uuid references public.users(id) on delete set null,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_invitations_role_check check (role in ('admin', 'headmaster', 'teacher')),
  constraint staff_invitations_status_check check (status in ('pending', 'accepted', 'expired', 'revoked'))
);

create index if not exists staff_invitations_school_status_idx
on public.staff_invitations (school_id, status, created_at desc);

create unique index if not exists staff_invitations_pending_email_key
on public.staff_invitations (school_id, lower(email))
where status = 'pending';

drop trigger if exists staff_invitations_set_updated_at on public.staff_invitations;
create trigger staff_invitations_set_updated_at
before update on public.staff_invitations
for each row execute function public.set_updated_at();

alter table public.staff_invitations enable row level security;
alter table public.staff_invitations force row level security;

drop policy if exists "admin can manage own school invitations" on public.staff_invitations;
drop policy if exists "headmaster can view own school invitations" on public.staff_invitations;

create policy "admin can manage own school invitations"
on public.staff_invitations for all
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_user_role() = 'admin'::public.app_role
)
with check (
  school_id = public.current_school_id()
  and public.current_user_role() = 'admin'::public.app_role
);

create policy "headmaster can view own school invitations"
on public.staff_invitations for select
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_user_role() = 'headmaster'::public.app_role
);

revoke all on public.staff_invitations from anon;
