-- Gradix Phase 2: production database architecture and RLS.
-- Apply in Supabase SQL editor or with `supabase db push`.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.app_role as enum ('admin', 'headmaster', 'teacher', 'parent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'paused', 'canceled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.school_term as enum ('first', 'second', 'third');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.upload_status as enum ('draft', 'validating', 'validated', 'failed', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.audit_action as enum ('insert', 'update', 'delete', 'publish', 'unpublish', 'validate');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  motto text,
  logo_url text,
  seal_url text,
  headmaster_signature_url text,
  registrar_signature_url text,
  email text,
  phone text,
  website text,
  address_line_1 text,
  address_line_2 text,
  city text,
  state text,
  country text not null default 'Nigeria',
  subscription_status public.subscription_status not null default 'trialing',
  subscription_plan text not null default 'starter',
  subscription_started_at timestamptz,
  subscription_ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schools_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint schools_email_format check (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

alter table public.schools
add column if not exists slug text;

alter table if exists public.schools
add column if not exists subscription_status public.subscription_status not null default 'trialing',
add column if not exists subscription_plan text not null default 'starter',
add column if not exists subscription_started_at timestamptz,
add column if not exists subscription_ends_at timestamptz,
add column if not exists metadata jsonb not null default '{}'::jsonb,
add column if not exists created_at timestamptz not null default now(),
add column if not exists updated_at timestamptz not null default now();

update public.schools
set
  subscription_status = coalesce(subscription_status, 'trialing'::public.subscription_status),
  subscription_plan = coalesce(subscription_plan, 'starter'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, now()),
  updated_at = coalesce(updated_at, now())
where
  subscription_status is null
  or subscription_plan is null
  or metadata is null
  or created_at is null
  or updated_at is null;

alter table public.schools
  alter column subscription_status set not null,
  alter column subscription_plan set not null,
  alter column metadata set not null,
  alter column created_at set not null,
  alter column updated_at set not null;

update public.schools
set slug = coalesce(
  nullif(btrim(slug), ''),
  trim(both '-' from regexp_replace(lower(coalesce(name, 'school')), '[^a-z0-9]+', '-', 'g')) || '-' || left(replace(id::text, '-', ''), 8)
)
where slug is null or btrim(slug) = '';

alter table public.schools
alter column slug set not null;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role public.app_role not null default 'teacher',
  full_name text not null,
  email text,
  phone text,
  avatar_url text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_format check (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  level text not null,
  arm text,
  academic_year text not null,
  teacher_id uuid references public.users(id) on delete set null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_academic_year_format check (academic_year ~ '^[0-9]{4}/[0-9]{4}$')
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  code text not null,
  description text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_code_format check (code ~ '^[A-Z0-9_-]{2,20}$')
);

create table if not exists public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid references public.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  permanent_code text not null,
  admission_number text,
  first_name text not null,
  middle_name text,
  last_name text not null,
  gender text,
  date_of_birth date,
  parent_full_name text,
  parent_email text,
  parent_phone text,
  parent_alt_phone text,
  parent_relationship text,
  address text,
  is_active boolean not null default true,
  enrolled_at date not null default current_date,
  graduated_at date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_gender_check check (gender is null or gender in ('female', 'male', 'other')),
  constraint students_parent_email_format check (parent_email is null or parent_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists public.result_uploads (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  term public.school_term not null,
  academic_year text not null,
  status public.upload_status not null default 'draft',
  source_filename text,
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  validation_errors jsonb not null default '[]'::jsonb,
  uploaded_by uuid references public.users(id) on delete set null,
  validated_by uuid references public.users(id) on delete set null,
  published_by uuid references public.users(id) on delete set null,
  validated_at timestamptz,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint result_uploads_academic_year_format check (academic_year ~ '^[0-9]{4}/[0-9]{4}$'),
  constraint result_uploads_row_counts_check check (total_rows >= 0 and valid_rows >= 0 and invalid_rows >= 0)
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  upload_id uuid references public.result_uploads(id) on delete set null,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  term public.school_term not null,
  academic_year text not null,
  continuous_assessment numeric(5,2) not null default 0,
  exam_score numeric(5,2) not null default 0,
  total_score numeric(5,2) generated always as (continuous_assessment + exam_score) stored,
  grade text not null default 'N/A',
  remark text,
  position_in_subject integer,
  is_published boolean not null default false,
  published_by uuid references public.users(id) on delete set null,
  published_at timestamptz,
  edited_by uuid references public.users(id) on delete set null,
  edited_at timestamptz,
  edit_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint results_scores_check check (
    continuous_assessment between 0 and 40
    and exam_score between 0 and 60
  ),
  constraint results_academic_year_format check (academic_year ~ '^[0-9]{4}/[0-9]{4}$'),
  constraint results_publish_consistency check (
    (is_published = false and published_at is null)
    or (is_published = true and published_at is not null)
  )
);

create table if not exists public.code_term_access (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  result_code text not null,
  term public.school_term not null,
  academic_year text not null,
  is_active boolean not null default true,
  max_uses integer,
  use_count integer not null default 0,
  expires_at timestamptz,
  last_used_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint code_term_access_academic_year_format check (academic_year ~ '^[0-9]{4}/[0-9]{4}$'),
  constraint code_term_access_uses_check check (max_uses is null or max_uses > 0)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  actor_role public.app_role,
  action public.audit_action not null,
  table_name text not null,
  record_id uuid,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create unique index if not exists schools_slug_key on public.schools (slug);
create index if not exists schools_subscription_status_idx on public.schools (subscription_status);

create index if not exists users_school_id_idx on public.users (school_id);
create index if not exists users_role_idx on public.users (role);
create unique index if not exists users_school_email_key on public.users (school_id, lower(email)) where email is not null;

create index if not exists classes_school_id_idx on public.classes (school_id);
create index if not exists classes_teacher_id_idx on public.classes (teacher_id);
create unique index if not exists classes_school_name_year_key on public.classes (school_id, lower(name), academic_year);

create index if not exists subjects_school_id_idx on public.subjects (school_id);
create unique index if not exists subjects_school_code_key on public.subjects (school_id, code);
create unique index if not exists subjects_school_name_key on public.subjects (school_id, lower(name));

create index if not exists class_subjects_school_id_idx on public.class_subjects (school_id);
create index if not exists class_subjects_class_id_idx on public.class_subjects (class_id);
create index if not exists class_subjects_subject_id_idx on public.class_subjects (subject_id);
create unique index if not exists class_subjects_unique_key on public.class_subjects (class_id, subject_id);

create index if not exists students_school_id_idx on public.students (school_id);
create index if not exists students_class_id_idx on public.students (class_id);
create unique index if not exists students_school_code_key on public.students (school_id, permanent_code);
create unique index if not exists students_school_admission_key on public.students (school_id, admission_number) where admission_number is not null;
create index if not exists students_parent_phone_idx on public.students (school_id, parent_phone) where parent_phone is not null;

create index if not exists result_uploads_school_id_idx on public.result_uploads (school_id);
create index if not exists result_uploads_class_term_year_idx on public.result_uploads (class_id, term, academic_year);
create index if not exists result_uploads_status_idx on public.result_uploads (status);

create index if not exists results_school_id_idx on public.results (school_id);
create index if not exists results_student_id_idx on public.results (student_id);
create index if not exists results_class_term_year_idx on public.results (class_id, term, academic_year);
create index if not exists results_subject_id_idx on public.results (subject_id);
create index if not exists results_published_idx on public.results (school_id, is_published);
create unique index if not exists results_unique_subject_result_key on public.results (student_id, subject_id, term, academic_year);

create index if not exists code_term_access_school_id_idx on public.code_term_access (school_id);
create index if not exists code_term_access_student_id_idx on public.code_term_access (student_id);
create unique index if not exists code_term_access_active_key on public.code_term_access (student_id, term, academic_year) where is_active;
create unique index if not exists code_term_access_result_code_key on public.code_term_access (result_code);

create index if not exists audit_logs_school_id_created_at_idx on public.audit_logs (school_id, created_at desc);
create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index if not exists audit_logs_table_record_idx on public.audit_logs (table_name, record_id);

create trigger schools_set_updated_at before update on public.schools for each row execute function public.set_updated_at();
create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();
create trigger classes_set_updated_at before update on public.classes for each row execute function public.set_updated_at();
create trigger subjects_set_updated_at before update on public.subjects for each row execute function public.set_updated_at();
create trigger class_subjects_set_updated_at before update on public.class_subjects for each row execute function public.set_updated_at();
create trigger students_set_updated_at before update on public.students for each row execute function public.set_updated_at();
create trigger result_uploads_set_updated_at before update on public.result_uploads for each row execute function public.set_updated_at();
create trigger results_set_updated_at before update on public.results for each row execute function public.set_updated_at();
create trigger code_term_access_set_updated_at before update on public.code_term_access for each row execute function public.set_updated_at();

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

create or replace function public.generate_student_code(target_school_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  school_slug text;
  candidate text;
begin
  select upper(replace(slug, '-', '')) into school_slug
  from public.schools
  where id = target_school_id;

  if school_slug is null then
    raise exception 'Cannot generate student code for unknown school';
  end if;

  loop
    candidate := left(school_slug, 5) || '-' || upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));
    exit when not exists (
      select 1 from public.students
      where school_id = target_school_id and permanent_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.set_student_permanent_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.permanent_code is null or length(trim(new.permanent_code)) = 0 then
    new.permanent_code := public.generate_student_code(new.school_id);
  end if;

  new.permanent_code := upper(trim(new.permanent_code));
  return new;
end;
$$;

create trigger students_set_permanent_code
before insert on public.students
for each row execute function public.set_student_permanent_code();

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

    if new.teacher_id is not null
      and not exists (select 1 from public.users where id = new.teacher_id and school_id = new.school_id)
    then
      raise exception 'Class subject teacher must belong to the same school';
    end if;
  end if;

  if tg_table_name = 'students' then
    if new.class_id is not null then
      if not exists (select 1 from public.classes where id = new.class_id and school_id = new.school_id) then
        raise exception 'Student class must belong to the same school';
      end if;
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

    if new.upload_id is not null
      and not exists (select 1 from public.result_uploads where id = new.upload_id and school_id = new.school_id)
    then
      raise exception 'Result upload must belong to the same school';
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

create trigger classes_enforce_school_relationships
before insert or update on public.classes
for each row execute function public.enforce_school_relationships();

create trigger class_subjects_enforce_school_relationships
before insert or update on public.class_subjects
for each row execute function public.enforce_school_relationships();

create trigger students_enforce_school_relationships
before insert or update on public.students
for each row execute function public.enforce_school_relationships();

create trigger result_uploads_enforce_school_relationships
before insert or update on public.result_uploads
for each row execute function public.enforce_school_relationships();

create trigger results_enforce_school_relationships
before insert or update on public.results
for each row execute function public.enforce_school_relationships();

create trigger code_term_access_enforce_school_relationships
before insert or update on public.code_term_access
for each row execute function public.enforce_school_relationships();

create or replace function public.calculate_grade(total_score numeric)
returns text
language sql
immutable
as $$
  select case
    when total_score >= 75 then 'A1'
    when total_score >= 70 then 'B2'
    when total_score >= 65 then 'B3'
    when total_score >= 60 then 'C4'
    when total_score >= 55 then 'C5'
    when total_score >= 50 then 'C6'
    when total_score >= 45 then 'D7'
    when total_score >= 40 then 'E8'
    else 'F9'
  end;
$$;

create or replace function public.set_result_grade_and_edit_tracking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.grade := public.calculate_grade(new.continuous_assessment + new.exam_score);

  if tg_op = 'UPDATE'
    and (
      old.continuous_assessment is distinct from new.continuous_assessment
      or old.exam_score is distinct from new.exam_score
      or old.remark is distinct from new.remark
    )
  then
    new.edited_by := auth.uid();
    new.edited_at := now();
    new.edit_count := old.edit_count + 1;
  end if;

  if new.is_published = true and (tg_op = 'INSERT' or old.is_published is distinct from true) then
    if not public.can_publish_results() then
      raise exception 'Only admins and headmasters can publish results';
    end if;

    new.published_by := auth.uid();
    new.published_at := now();
  end if;

  if tg_op = 'UPDATE' and old.is_published = true and new.is_published = false then
    if not public.can_publish_results() then
      raise exception 'Only admins and headmasters can unpublish results';
    end if;

    new.published_by := null;
    new.published_at := null;
  end if;

  return new;
end;
$$;

create trigger results_grade_edit_publish_tracking
before insert or update on public.results
for each row execute function public.set_result_grade_and_edit_tracking();

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
    jsonb_build_object(
      'old', case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
      'new', case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger schools_audit after insert or update or delete on public.schools for each row execute function public.track_audit_log();
create trigger users_audit after insert or update or delete on public.users for each row execute function public.track_audit_log();
create trigger classes_audit after insert or update or delete on public.classes for each row execute function public.track_audit_log();
create trigger subjects_audit after insert or update or delete on public.subjects for each row execute function public.track_audit_log();
create trigger class_subjects_audit after insert or update or delete on public.class_subjects for each row execute function public.track_audit_log();
create trigger students_audit after insert or update or delete on public.students for each row execute function public.track_audit_log();
create trigger result_uploads_audit after insert or update or delete on public.result_uploads for each row execute function public.track_audit_log();
create trigger results_audit after insert or update or delete on public.results for each row execute function public.track_audit_log();
create trigger code_term_access_audit after insert or update or delete on public.code_term_access for each row execute function public.track_audit_log();

create or replace function public.validate_result_upload(target_upload_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  upload_record public.result_uploads%rowtype;
  invalid_count integer;
  valid_count integer;
  errors jsonb := '[]'::jsonb;
begin
  select * into upload_record from public.result_uploads where id = target_upload_id;

  if upload_record.id is null then
    raise exception 'Result upload not found';
  end if;

  if not public.can_manage_school_data(upload_record.school_id) then
    raise exception 'Not allowed to validate this upload';
  end if;

  select count(*) into invalid_count
  from public.results r
  where r.upload_id = target_upload_id
    and (
      r.school_id <> upload_record.school_id
      or r.class_id <> upload_record.class_id
      or r.term <> upload_record.term
      or r.academic_year <> upload_record.academic_year
      or r.continuous_assessment not between 0 and 40
      or r.exam_score not between 0 and 60
    );

  select count(*) into valid_count
  from public.results r
  where r.upload_id = target_upload_id;

  if invalid_count > 0 then
    errors := errors || jsonb_build_array(jsonb_build_object(
      'code', 'invalid_rows',
      'message', 'Upload contains rows outside the upload class, school, term, year, or score bounds.',
      'count', invalid_count
    ));
  end if;

  update public.result_uploads
  set
    status = case when invalid_count = 0 then 'validated'::public.upload_status else 'failed'::public.upload_status end,
    total_rows = valid_count,
    valid_rows = greatest(valid_count - invalid_count, 0),
    invalid_rows = invalid_count,
    validation_errors = errors,
    validated_by = auth.uid(),
    validated_at = now()
  where id = target_upload_id;

  insert into public.audit_logs (school_id, actor_id, actor_role, action, table_name, record_id, details)
  values (
    upload_record.school_id,
    auth.uid(),
    public.current_user_role(),
    'validate',
    'result_uploads',
    target_upload_id,
    jsonb_build_object('valid_rows', greatest(valid_count - invalid_count, 0), 'invalid_rows', invalid_count, 'errors', errors)
  );

  return jsonb_build_object(
    'upload_id', target_upload_id,
    'valid_rows', greatest(valid_count - invalid_count, 0),
    'invalid_rows', invalid_count,
    'errors', errors
  );
end;
$$;

alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.class_subjects enable row level security;
alter table public.students enable row level security;
alter table public.result_uploads enable row level security;
alter table public.results enable row level security;
alter table public.code_term_access enable row level security;
alter table public.audit_logs enable row level security;

alter table public.schools force row level security;
alter table public.users force row level security;
alter table public.classes force row level security;
alter table public.subjects force row level security;
alter table public.class_subjects force row level security;
alter table public.students force row level security;
alter table public.result_uploads force row level security;
alter table public.results force row level security;
alter table public.code_term_access force row level security;
alter table public.audit_logs force row level security;

create policy "school staff can view own school"
on public.schools for select
to authenticated
using (id = public.current_school_id());

create policy "admins can update own school"
on public.schools for update
to authenticated
using (id = public.current_school_id() and public.is_school_admin())
with check (id = public.current_school_id() and public.is_school_admin());

create policy "staff can view users in own school"
on public.users for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "admins can manage users in own school"
on public.users for all
to authenticated
using (school_id = public.current_school_id() and public.is_school_admin())
with check (school_id = public.current_school_id() and public.is_school_admin());

create policy "staff can view classes in own school"
on public.classes for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "admin and headmaster can manage classes"
on public.classes for all
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'))
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'));

create policy "staff can view subjects in own school"
on public.subjects for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "admin and headmaster can manage subjects"
on public.subjects for all
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'))
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'));

create policy "staff can view class subjects in own school"
on public.class_subjects for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "admin and headmaster can manage class subjects"
on public.class_subjects for all
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'))
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'));

create policy "staff can view students in own school"
on public.students for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "admin and headmaster can manage students"
on public.students for all
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'))
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'));

create policy "teachers can insert students in own school"
on public.students for insert
to authenticated
with check (school_id = public.current_school_id() and public.current_user_role() = 'teacher');

create policy "staff can view result uploads in own school"
on public.result_uploads for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "staff can create result uploads in own school"
on public.result_uploads for insert
to authenticated
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "staff can update unpublished result uploads"
on public.result_uploads for update
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_user_role() in ('admin', 'headmaster', 'teacher')
  and status <> 'published'
)
with check (
  school_id = public.current_school_id()
  and public.current_user_role() in ('admin', 'headmaster', 'teacher')
  and (
    public.current_user_role() in ('admin', 'headmaster')
    or status <> 'published'
  )
);

create policy "admins can delete result uploads"
on public.result_uploads for delete
to authenticated
using (school_id = public.current_school_id() and public.is_school_admin());

create policy "staff can view results in own school"
on public.results for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "staff can insert results in own school"
on public.results for insert
to authenticated
with check (
  school_id = public.current_school_id()
  and public.current_user_role() in ('admin', 'headmaster', 'teacher')
  and is_published = false
);

create policy "staff can update unpublished results"
on public.results for update
to authenticated
using (
  school_id = public.current_school_id()
  and public.current_user_role() in ('admin', 'headmaster', 'teacher')
  and (is_published = false or public.can_publish_results())
)
with check (
  school_id = public.current_school_id()
  and (
    public.can_publish_results()
    or (public.current_user_role() = 'teacher' and is_published = false)
  )
);

create policy "admins can delete unpublished results"
on public.results for delete
to authenticated
using (school_id = public.current_school_id() and public.is_school_admin() and is_published = false);

create policy "staff can view code access in own school"
on public.code_term_access for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster', 'teacher'));

create policy "admin and headmaster can manage code access"
on public.code_term_access for all
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'))
with check (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'));

create policy "admin and headmaster can view audit logs"
on public.audit_logs for select
to authenticated
using (school_id = public.current_school_id() and public.current_user_role() in ('admin', 'headmaster'));

create policy "admins can insert audit logs"
on public.audit_logs for insert
to authenticated
with check (school_id = public.current_school_id() and public.is_school_admin());

revoke all on public.schools from anon;
revoke all on public.users from anon;
revoke all on public.classes from anon;
revoke all on public.subjects from anon;
revoke all on public.class_subjects from anon;
revoke all on public.students from anon;
revoke all on public.result_uploads from anon;
revoke all on public.results from anon;
revoke all on public.code_term_access from anon;
revoke all on public.audit_logs from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.validate_result_upload(uuid) to authenticated;
grant execute on function public.calculate_grade(numeric) to authenticated;
grant execute on function public.generate_student_code(uuid) to authenticated;
