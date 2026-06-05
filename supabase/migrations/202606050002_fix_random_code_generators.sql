-- Ensure random code generators can find pgcrypto functions in Supabase.

create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema extensions;

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
      select 1
      from public.students
      where school_id = target_school_id
        and permanent_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.generate_school_code()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  candidate text;
begin
  loop
    candidate := 'GDX-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 4));
    exit when not exists (
      select 1
      from public.schools
      where school_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

grant execute on function public.generate_student_code(uuid) to authenticated;
grant execute on function public.generate_school_code() to authenticated;
