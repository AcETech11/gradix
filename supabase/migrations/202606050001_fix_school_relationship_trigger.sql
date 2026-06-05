-- Fix relationship trigger field access on tables that do not have class_id.

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
