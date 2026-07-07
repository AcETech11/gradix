do $$
begin
  if exists (
    select 1
    from public.subjects
    group by school_id, code
    having count(*) > 1
  ) then
    raise exception 'Cannot create tenant-scoped subject code uniqueness: duplicate (school_id, code) records exist in public.subjects.';
  end if;
end;
$$;

drop index if exists public.subjects_school_code_key;

create unique index if not exists subjects_school_id_code_key
on public.subjects (school_id, code);

create unique index if not exists subjects_school_name_key
on public.subjects (school_id, lower(name));

do $$
begin
  if exists (
    select 1
    from public.schools
    where id <> coalesce(
      (
        select id
        from public.schools
        where upper(name) = 'ANCHOR OF HOPE SCHOOLS'
          and school_code = 'GDX-DEMO'
        limit 1
      ),
      '00000000-0000-0000-0000-000000000000'::uuid
    )
      and (school_code = 'AOH-SCH' or slug = 'anchor-of-hope')
  ) then
    raise exception 'Cannot repair Anchor of Hope onboarding data: AOH-SCH or anchor-of-hope is already used by another school.';
  end if;

  update public.schools
  set school_code = 'AOH-SCH',
      slug = 'anchor-of-hope',
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('school_code', 'AOH-SCH'),
      updated_at = now()
  where upper(name) = 'ANCHOR OF HOPE SCHOOLS'
    and school_code = 'GDX-DEMO';
end;
$$;
