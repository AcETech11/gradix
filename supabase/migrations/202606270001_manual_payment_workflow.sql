do $$
begin
  alter type public.audit_action add value if not exists 'payment_submission_created';
exception
  when undefined_object then
    null;
end;
$$;

create table if not exists public.manual_payment_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  subscription_plan text not null default 'starter',
  billing_period text not null,
  payment_reference text not null unique,
  amount_expected numeric(12,2) not null,
  currency text not null default 'NGN',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manual_payment_requests_status_check check (status in ('open', 'submitted', 'approved', 'closed')),
  constraint manual_payment_requests_amount_check check (amount_expected >= 0)
);

create table if not exists public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  payment_request_id uuid not null references public.manual_payment_requests(id) on delete restrict,
  subscription_id uuid null,
  payment_reference text not null unique,
  billing_period text not null,
  subscription_plan text not null default 'starter',
  amount_expected numeric(12,2),
  amount_paid numeric(12,2) not null,
  currency text not null default 'NGN',
  payer_name text not null,
  payer_bank text not null,
  bank_transfer_reference text,
  paid_at date not null,
  proof_path text not null,
  proof_mime_type text not null,
  note text,
  status text not null default 'pending_verification',
  reviewed_by uuid null references public.platform_admins(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_submissions_status_check check (status in ('pending_verification', 'approved', 'rejected', 'cancelled')),
  constraint payment_submissions_amount_paid_check check (amount_paid > 0),
  constraint payment_submissions_proof_type_check check (proof_mime_type in ('image/jpeg', 'image/png', 'application/pdf'))
);

create unique index if not exists payment_submissions_one_pending_per_request_idx
on public.payment_submissions (payment_request_id)
where status = 'pending_verification';

create index if not exists manual_payment_requests_school_status_idx
on public.manual_payment_requests (school_id, status, created_at desc);

create index if not exists payment_submissions_school_status_idx
on public.payment_submissions (school_id, status, created_at desc);

create index if not exists payment_submissions_reference_idx
on public.payment_submissions (payment_reference);

alter table public.manual_payment_requests enable row level security;
alter table public.manual_payment_requests force row level security;
alter table public.payment_submissions enable row level security;
alter table public.payment_submissions force row level security;

drop policy if exists "school users read own payment requests" on public.manual_payment_requests;
create policy "school users read own payment requests"
on public.manual_payment_requests for select
using (school_id = public.current_school_id());

drop policy if exists "school admins create own payment requests" on public.manual_payment_requests;
create policy "school admins create own payment requests"
on public.manual_payment_requests for insert
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role));

drop policy if exists "platform admins read payment requests" on public.manual_payment_requests;
create policy "platform admins read payment requests"
on public.manual_payment_requests for select
using (exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid() and pa.is_active = true));

drop policy if exists "school users read own payment submissions" on public.payment_submissions;
create policy "school users read own payment submissions"
on public.payment_submissions for select
using (school_id = public.current_school_id());

drop policy if exists "school admins create own payment submissions" on public.payment_submissions;
create policy "school admins create own payment submissions"
on public.payment_submissions for insert
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role));

drop policy if exists "platform admins read payment submissions" on public.payment_submissions;
create policy "platform admins read payment submissions"
on public.payment_submissions for select
using (exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid() and pa.is_active = true));

drop policy if exists "platform admins update payment submissions" on public.payment_submissions;
create policy "platform admins update payment submissions"
on public.payment_submissions for update
using (exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid() and pa.is_active = true))
with check (exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid() and pa.is_active = true));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf'];

drop policy if exists "school admins upload own payment proofs" on storage.objects;
create policy "school admins upload own payment proofs"
on storage.objects for insert
with check (
  bucket_id = 'payment-proofs'
  and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role)
  and (storage.foldername(name))[1] = public.current_school_id()::text
);

drop policy if exists "school users read own payment proofs" on storage.objects;
create policy "school users read own payment proofs"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = public.current_school_id()::text
);

drop policy if exists "platform admins read payment proofs" on storage.objects;
create policy "platform admins read payment proofs"
on storage.objects for select
using (
  bucket_id = 'payment-proofs'
  and exists (select 1 from public.platform_admins pa where pa.user_id = auth.uid() and pa.is_active = true)
);
