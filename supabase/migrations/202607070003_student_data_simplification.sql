-- Gradix student-data simplification.
-- Keep historical columns, but make legacy personal/parent fields optional for production onboarding.

update public.students
set admission_number = null
where admission_number is not null
  and btrim(admission_number) = '';

alter table public.students
  alter column admission_number drop not null,
  alter column date_of_birth drop not null,
  alter column gender drop not null,
  alter column parent_full_name drop not null,
  alter column parent_relationship drop not null,
  alter column parent_phone drop not null,
  alter column parent_email drop not null,
  alter column address drop not null,
  alter column passport_url drop not null;

drop index if exists public.students_school_admission_key;

create unique index if not exists students_school_admission_key
on public.students (school_id, admission_number)
where admission_number is not null and btrim(admission_number) <> '';
