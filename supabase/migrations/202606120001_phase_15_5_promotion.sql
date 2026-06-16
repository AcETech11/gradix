-- Gradix Phase 15.5: academic year rollover and student enrollment history.

alter table if exists public.students
  drop constraint if exists students_status_check;

alter table if exists public.students
  add constraint students_status_check
  check (status in ('active', 'inactive', 'repeated', 'graduated', 'transferred', 'withdrawn', 'archived'));

create table if not exists public.student_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  academic_year text not null,
  status text not null default 'active',
  promoted_from_class_id uuid references public.classes(id) on delete set null,
  promoted_to_class_id uuid references public.classes(id) on delete set null,
  promoted_at timestamptz,
  promoted_by uuid references public.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_class_enrollments_academic_year_format check (academic_year ~ '^[0-9]{4}/[0-9]{4}$'),
  constraint student_class_enrollments_status_check check (status in ('active', 'promoted', 'repeated', 'graduated', 'transferred', 'withdrawn', 'archived'))
);

alter table if exists public.student_class_enrollments
  add column if not exists school_id uuid,
  add column if not exists student_id uuid,
  add column if not exists class_id uuid,
  add column if not exists academic_year text,
  add column if not exists status text,
  add column if not exists promoted_from_class_id uuid,
  add column if not exists promoted_to_class_id uuid,
  add column if not exists promoted_at timestamptz,
  add column if not exists promoted_by uuid,
  add column if not exists metadata jsonb,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table if exists public.student_class_enrollments
  alter column status set default 'active',
  alter column metadata set default '{}'::jsonb,
  alter column created_at set default now(),
  alter column updated_at set default now();

create index if not exists student_class_enrollments_school_year_idx
on public.student_class_enrollments (school_id, academic_year);

create index if not exists student_class_enrollments_class_year_idx
on public.student_class_enrollments (school_id, class_id, academic_year);

create index if not exists student_class_enrollments_student_idx
on public.student_class_enrollments (school_id, student_id);

create unique index if not exists student_class_enrollments_active_year_key
on public.student_class_enrollments (student_id, academic_year)
where status in ('active', 'repeated');

create or replace function public.enforce_school_relationships()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'classes' then
    if new.teacher_id is not null then
      if not exists (select 1 from public.users where id = new.teacher_id and school_id = new.school_id) then
        raise exception 'Class teacher must belong to the same school';
      end if;
    end if;
  end if;

  if tg_table_name = 'class_subjects' then
    if not exists (select 1 from public.classes where id = new.class_id and school_id = new.school_id) then
      raise exception 'Class subject class must belong to the same school';
    end if;

    if not exists (select 1 from public.subjects where id = new.subject_id and school_id = new.school_id) then
      raise exception 'Class subject subject must belong to the same school';
    end if;

    if new.teacher_id is not null then
      if not exists (select 1 from public.users where id = new.teacher_id and school_id = new.school_id) then
        raise exception 'Class subject teacher must belong to the same school';
      end if;
    end if;
  end if;

  if tg_table_name = 'students' then
    if new.class_id is not null then
      if not exists (select 1 from public.classes where id = new.class_id and school_id = new.school_id) then
        raise exception 'Student class must belong to the same school';
      end if;
    end if;
  end if;

  if tg_table_name = 'student_class_enrollments' then
    if not exists (select 1 from public.students where id = new.student_id and school_id = new.school_id) then
      raise exception 'Enrollment student must belong to the same school';
    end if;

    if not exists (select 1 from public.classes where id = new.class_id and school_id = new.school_id) then
      raise exception 'Enrollment class must belong to the same school';
    end if;

    if new.promoted_from_class_id is not null
      and not exists (select 1 from public.classes where id = new.promoted_from_class_id and school_id = new.school_id)
    then
      raise exception 'Promotion source class must belong to the same school';
    end if;

    if new.promoted_to_class_id is not null
      and not exists (select 1 from public.classes where id = new.promoted_to_class_id and school_id = new.school_id)
    then
      raise exception 'Promotion target class must belong to the same school';
    end if;

    if new.promoted_by is not null
      and not exists (select 1 from public.users where id = new.promoted_by and school_id = new.school_id)
    then
      raise exception 'Promotion actor must belong to the same school';
    end if;
  end if;

  if tg_table_name = 'result_uploads' then
    if not exists (select 1 from public.classes where id = new.class_id and school_id = new.school_id) then
      raise exception 'Result upload class must belong to the same school';
    end if;
  end if;

  if tg_table_name = 'results' then
    if not exists (select 1 from public.students where id = new.student_id and school_id = new.school_id) then
      raise exception 'Result student must belong to the same school';
    end if;

    if not exists (select 1 from public.classes where id = new.class_id and school_id = new.school_id) then
      raise exception 'Result class must belong to the same school';
    end if;

    if not exists (select 1 from public.subjects where id = new.subject_id and school_id = new.school_id) then
      raise exception 'Result subject must belong to the same school';
    end if;

    if new.upload_id is not null then
      if not exists (select 1 from public.result_uploads where id = new.upload_id and school_id = new.school_id) then
        raise exception 'Result upload must belong to the same school';
      end if;
    end if;
  end if;

  if tg_table_name = 'code_term_access' then
    if not exists (select 1 from public.students where id = new.student_id and school_id = new.school_id) then
      raise exception 'Access code student must belong to the same school';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists student_class_enrollments_set_updated_at on public.student_class_enrollments;
create trigger student_class_enrollments_set_updated_at
before update on public.student_class_enrollments
for each row execute function public.set_updated_at();

drop trigger if exists student_class_enrollments_enforce_school_relationships on public.student_class_enrollments;
create trigger student_class_enrollments_enforce_school_relationships
before insert or update on public.student_class_enrollments
for each row execute function public.enforce_school_relationships();

drop trigger if exists student_class_enrollments_audit on public.student_class_enrollments;
create trigger student_class_enrollments_audit
after insert or update or delete on public.student_class_enrollments
for each row execute function public.track_audit_log();

alter table public.student_class_enrollments enable row level security;
alter table public.student_class_enrollments force row level security;

drop policy if exists "school staff can view enrollments" on public.student_class_enrollments;
drop policy if exists "admin and headmaster can manage enrollments" on public.student_class_enrollments;

create policy "school staff can view enrollments"
on public.student_class_enrollments for select
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role, 'teacher'::public.app_role)
);

create policy "admin and headmaster can manage enrollments"
on public.student_class_enrollments for all
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role)
)
with check (
  school_id = public.current_school_id()
  and public.current_user_role() in ('admin'::public.app_role, 'headmaster'::public.app_role)
);

revoke all on public.student_class_enrollments from anon;
