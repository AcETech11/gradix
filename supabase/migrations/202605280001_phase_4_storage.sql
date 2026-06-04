-- Gradix Phase 4: onboarding storage buckets and policies.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('school-logos', 'school-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('signatures', 'signatures', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role::text::public.app_role
  from public.users
  where id = auth.uid() and is_active = true;
$$;

create or replace function public.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.users where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_school_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'::public.app_role;
$$;

create or replace function public.is_headmaster()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'headmaster'::public.app_role;
$$;

create or replace function public.can_publish_results()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role);
$$;

create or replace function public.can_manage_school_data(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_school_id() = target_school_id
    and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role, 'teacher'::public.app_role);
$$;

drop policy if exists "school staff can view onboarding assets" on storage.objects;
drop policy if exists "admin and headmaster can upload onboarding assets" on storage.objects;
drop policy if exists "admin and headmaster can replace onboarding assets" on storage.objects;
drop policy if exists "admin and headmaster can delete onboarding assets" on storage.objects;

create policy "school staff can view onboarding assets"
on storage.objects for select
to authenticated
using (
  bucket_id in ('school-logos', 'signatures')
  and public.current_school_id()::text = (storage.foldername(name))[1]
);

create policy "admin and headmaster can upload onboarding assets"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('school-logos', 'signatures')
  and public.current_school_id()::text = (storage.foldername(name))[1]
  and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role)
);

create policy "admin and headmaster can replace onboarding assets"
on storage.objects for update
to authenticated
using (
  bucket_id in ('school-logos', 'signatures')
  and public.current_school_id()::text = (storage.foldername(name))[1]
  and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role)
)
with check (
  bucket_id in ('school-logos', 'signatures')
  and public.current_school_id()::text = (storage.foldername(name))[1]
  and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role)
);

create policy "admin and headmaster can delete onboarding assets"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('school-logos', 'signatures')
  and public.current_school_id()::text = (storage.foldername(name))[1]
  and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role)
);
