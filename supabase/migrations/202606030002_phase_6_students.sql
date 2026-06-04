-- Gradix Phase 6: student management, passport storage, and access rules.

alter table public.students
  add column if not exists passport_url text,
  add column if not exists status text not null default 'active';

do $$ begin
  alter table public.students
    add constraint students_status_check check (status in ('active', 'inactive', 'graduated', 'archived'));
exception when duplicate_object then null;
end $$;

create index if not exists students_school_status_idx on public.students (school_id, status);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('student-passports', 'student-passports', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "school staff can view student passports" on storage.objects;
drop policy if exists "teachers and admins can upload student passports" on storage.objects;
drop policy if exists "teachers and admins can replace student passports" on storage.objects;
drop policy if exists "teachers and admins can delete student passports" on storage.objects;

drop policy if exists "staff can view students in own school" on public.students;
drop policy if exists "admin and headmaster can manage students" on public.students;
drop policy if exists "teachers can insert students in own school" on public.students;

create policy "staff can view students in own school"
on public.students for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "teachers can create students in own school"
on public.students for insert
to authenticated
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'teacher'));

create policy "teachers can update students in own school"
on public.students for update
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'teacher'))
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'teacher'));

create policy "admins can delete students in own school"
on public.students for delete
to authenticated
using (school_id = public.current_school_id() and public.is_school_admin());

create policy "school staff can view student passports"
on storage.objects for select
to authenticated
using (
  bucket_id = 'student-passports'
  and public.current_school_id()::text = (storage.foldername(name))[1]
);

create policy "teachers and admins can upload student passports"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'student-passports'
  and public.current_school_id()::text = (storage.foldername(name))[1]
  and public.current_user_role() in ('admin'::public.app_role, 'teacher'::public.app_role)
);

create policy "teachers and admins can replace student passports"
on storage.objects for update
to authenticated
using (
  bucket_id = 'student-passports'
  and public.current_school_id()::text = (storage.foldername(name))[1]
  and public.current_user_role() in ('admin'::public.app_role, 'teacher'::public.app_role)
)
with check (
  bucket_id = 'student-passports'
  and public.current_school_id()::text = (storage.foldername(name))[1]
  and public.current_user_role() in ('admin'::public.app_role, 'teacher'::public.app_role)
);

create policy "teachers and admins can delete student passports"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'student-passports'
  and public.current_school_id()::text = (storage.foldername(name))[1]
  and public.current_user_role() in ('admin'::public.app_role, 'teacher'::public.app_role)
);

create or replace function public.track_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_school_id uuid;
  row_record_id uuid;
  action_name public.audit_action;
  audit_details jsonb;
begin
  if tg_table_name = 'audit_logs' then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  action_name := lower(tg_op)::public.audit_action;

  if tg_table_name = 'schools' then
    if tg_op = 'DELETE' then
      row_school_id := old.id;
      row_record_id := old.id;
    else
      row_school_id := new.id;
      row_record_id := new.id;
    end if;
  elsif tg_op = 'DELETE' then
    row_school_id := old.school_id;
    row_record_id := old.id;
  else
    row_school_id := new.school_id;
    row_record_id := new.id;
  end if;

  if tg_table_name = 'results' and tg_op = 'UPDATE' and old.is_published is distinct from new.is_published then
    action_name := case when new.is_published then 'publish'::public.audit_action else 'unpublish'::public.audit_action end;
  end if;

  audit_details := jsonb_build_object(
    'old', case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    'new', case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_table_name = 'students' and tg_op = 'UPDATE' and old.status is distinct from new.status then
    audit_details := audit_details || jsonb_build_object(
      'event', case
        when new.status = 'archived' then 'archived'
        when old.status = 'archived' and new.status <> 'archived' then 'restored'
        else 'updated'
      end
    );
  end if;

  insert into public.audit_logs (
    school_id,
    actor_id,
    actor_role,
    action,
    table_name,
    record_id,
    details
  )
  values (
    row_school_id,
    auth.uid(),
    public.current_user_role(),
    action_name,
    tg_table_name,
    row_record_id,
    audit_details
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;
