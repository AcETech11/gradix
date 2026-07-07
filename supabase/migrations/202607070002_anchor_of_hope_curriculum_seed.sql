do $$
declare
  target_school_id uuid;
  target_academic_year text;
begin
  update public.schools
  set name = 'ANCHOR OF HOPE SCHOOLS',
      school_code = 'AOH-SCH',
      slug = 'anchor-of-hope',
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('school_code', 'AOH-SCH'),
      updated_at = now()
  where slug = 'anchor-of-hope'
     or (upper(name) = 'ANCHOR OF HOPE SCHOOLS' and school_code in ('GDX-DEMO', 'AOH-SCH'));

  select id
  into target_school_id
  from public.schools
  where slug = 'anchor-of-hope'
    and school_code = 'AOH-SCH'
  limit 1;

  if target_school_id is null then
    raise notice 'Anchor of Hope school not found; curriculum seed skipped.';
    return;
  end if;

  target_academic_year := case
    when extract(month from current_date)::int >= 8 then extract(year from current_date)::int::text || '/' || (extract(year from current_date)::int + 1)::text
    else (extract(year from current_date)::int - 1)::text || '/' || extract(year from current_date)::int::text
  end;

  insert into public.classes (school_id, name, level, academic_year, is_active)
  select target_school_id, class_name, class_name, target_academic_year, true
  from unnest(array[
    'PRIMARY 4',
    'PRIMARY 5',
    'JSS 1',
    'JSS 2',
    'JSS 3',
    'SSS 1',
    'SSS 2',
    'SSS 3'
  ]) as class_name
  on conflict (school_id, (lower(name)), academic_year)
  do update set is_active = true, level = excluded.level, updated_at = now();

  with desired_subjects(name, code) as (
    values
      ('Mathematics', 'MAT'),
      ('English Language', 'ENG'),
      ('Quantitative Reasoning', 'QR'),
      ('Verbal Reasoning', 'VR'),
      ('Pre-Vocational Studies', 'PVS'),
      ('National Values Education', 'NVE'),
      ('Christian Religious Knowledge', 'CRK'),
      ('History', 'HIS'),
      ('Basic Science', 'BSC'),
      ('Basic Digital Technology', 'BDT'),
      ('Yoruba', 'YOR'),
      ('Cultural and Creative Art', 'CCA'),
      ('Agricultural Science', 'AGR'),
      ('Home Economics', 'HEC'),
      ('Social and Citizenship Studies', 'SCS'),
      ('Physical and Health Education', 'PHE'),
      ('Basic Technology', 'BTE'),
      ('Business Studies', 'BUS'),
      ('Biology', 'BIO'),
      ('Geography', 'GEO'),
      ('Further Mathematics', 'FMA'),
      ('Physics', 'PHY'),
      ('Commerce', 'COM'),
      ('Financial Accounting', 'FAC'),
      ('Chemistry', 'CHM'),
      ('Government', 'GOV'),
      ('Citizenship and Heritage Studies', 'CHS'),
      ('Literature in English', 'LIT'),
      ('Economics', 'ECO'),
      ('Data Processing', 'DPT')
  )
  update public.subjects s
  set name = d.name,
      code = d.code,
      is_active = true,
      updated_at = now()
  from desired_subjects d
  where s.school_id = target_school_id
    and (lower(s.name) = lower(d.name) or s.code = d.code)
    and not exists (
      select 1
      from public.subjects other
      where other.school_id = target_school_id
        and other.id <> s.id
        and (lower(other.name) = lower(d.name) or other.code = d.code)
    );

  with desired_subjects(name, code) as (
    values
      ('Mathematics', 'MAT'),
      ('English Language', 'ENG'),
      ('Quantitative Reasoning', 'QR'),
      ('Verbal Reasoning', 'VR'),
      ('Pre-Vocational Studies', 'PVS'),
      ('National Values Education', 'NVE'),
      ('Christian Religious Knowledge', 'CRK'),
      ('History', 'HIS'),
      ('Basic Science', 'BSC'),
      ('Basic Digital Technology', 'BDT'),
      ('Yoruba', 'YOR'),
      ('Cultural and Creative Art', 'CCA'),
      ('Agricultural Science', 'AGR'),
      ('Home Economics', 'HEC'),
      ('Social and Citizenship Studies', 'SCS'),
      ('Physical and Health Education', 'PHE'),
      ('Basic Technology', 'BTE'),
      ('Business Studies', 'BUS'),
      ('Biology', 'BIO'),
      ('Geography', 'GEO'),
      ('Further Mathematics', 'FMA'),
      ('Physics', 'PHY'),
      ('Commerce', 'COM'),
      ('Financial Accounting', 'FAC'),
      ('Chemistry', 'CHM'),
      ('Government', 'GOV'),
      ('Citizenship and Heritage Studies', 'CHS'),
      ('Literature in English', 'LIT'),
      ('Economics', 'ECO'),
      ('Data Processing', 'DPT')
  )
  insert into public.subjects (school_id, name, code, is_active)
  select target_school_id, d.name, d.code, true
  from desired_subjects d
  where not exists (
    select 1
    from public.subjects s
    where s.school_id = target_school_id
      and (lower(s.name) = lower(d.name) or s.code = d.code)
  );

  with curriculum(class_name, subject_code) as (
    values
      ('PRIMARY 4', 'MAT'), ('PRIMARY 4', 'ENG'), ('PRIMARY 4', 'QR'), ('PRIMARY 4', 'VR'), ('PRIMARY 4', 'PVS'), ('PRIMARY 4', 'NVE'), ('PRIMARY 4', 'CRK'), ('PRIMARY 4', 'HIS'), ('PRIMARY 4', 'BSC'), ('PRIMARY 4', 'BDT'), ('PRIMARY 4', 'YOR'), ('PRIMARY 4', 'CCA'),
      ('PRIMARY 5', 'MAT'), ('PRIMARY 5', 'ENG'), ('PRIMARY 5', 'QR'), ('PRIMARY 5', 'VR'), ('PRIMARY 5', 'PVS'), ('PRIMARY 5', 'NVE'), ('PRIMARY 5', 'CRK'), ('PRIMARY 5', 'HIS'), ('PRIMARY 5', 'BSC'), ('PRIMARY 5', 'BDT'), ('PRIMARY 5', 'YOR'), ('PRIMARY 5', 'CCA'),
      ('JSS 1', 'MAT'), ('JSS 1', 'ENG'), ('JSS 1', 'AGR'), ('JSS 1', 'HEC'), ('JSS 1', 'SCS'), ('JSS 1', 'CRK'), ('JSS 1', 'HIS'), ('JSS 1', 'BSC'), ('JSS 1', 'PHE'), ('JSS 1', 'BTE'), ('JSS 1', 'YOR'), ('JSS 1', 'CCA'), ('JSS 1', 'BUS'),
      ('JSS 2', 'MAT'), ('JSS 2', 'ENG'), ('JSS 2', 'AGR'), ('JSS 2', 'HEC'), ('JSS 2', 'SCS'), ('JSS 2', 'CRK'), ('JSS 2', 'HIS'), ('JSS 2', 'BSC'), ('JSS 2', 'PHE'), ('JSS 2', 'BTE'), ('JSS 2', 'YOR'), ('JSS 2', 'CCA'), ('JSS 2', 'BUS'),
      ('JSS 3', 'MAT'), ('JSS 3', 'ENG'), ('JSS 3', 'AGR'), ('JSS 3', 'HEC'), ('JSS 3', 'SCS'), ('JSS 3', 'CRK'), ('JSS 3', 'HIS'), ('JSS 3', 'BSC'), ('JSS 3', 'PHE'), ('JSS 3', 'BTE'), ('JSS 3', 'YOR'), ('JSS 3', 'CCA'), ('JSS 3', 'BUS'),
      ('SSS 1', 'MAT'), ('SSS 1', 'ENG'), ('SSS 1', 'AGR'), ('SSS 1', 'BIO'), ('SSS 1', 'GEO'), ('SSS 1', 'FMA'), ('SSS 1', 'PHY'), ('SSS 1', 'COM'), ('SSS 1', 'FAC'), ('SSS 1', 'CHM'), ('SSS 1', 'GOV'), ('SSS 1', 'CHS'), ('SSS 1', 'LIT'), ('SSS 1', 'CRK'), ('SSS 1', 'ECO'), ('SSS 1', 'DPT'),
      ('SSS 2', 'MAT'), ('SSS 2', 'ENG'), ('SSS 2', 'AGR'), ('SSS 2', 'BIO'), ('SSS 2', 'GEO'), ('SSS 2', 'FMA'), ('SSS 2', 'PHY'), ('SSS 2', 'COM'), ('SSS 2', 'FAC'), ('SSS 2', 'CHM'), ('SSS 2', 'GOV'), ('SSS 2', 'CHS'), ('SSS 2', 'LIT'), ('SSS 2', 'CRK'), ('SSS 2', 'ECO'), ('SSS 2', 'DPT'),
      ('SSS 3', 'MAT'), ('SSS 3', 'ENG'), ('SSS 3', 'AGR'), ('SSS 3', 'BIO'), ('SSS 3', 'GEO'), ('SSS 3', 'FMA'), ('SSS 3', 'PHY'), ('SSS 3', 'COM'), ('SSS 3', 'FAC'), ('SSS 3', 'CHM'), ('SSS 3', 'GOV'), ('SSS 3', 'CHS'), ('SSS 3', 'LIT'), ('SSS 3', 'CRK'), ('SSS 3', 'ECO'), ('SSS 3', 'DPT')
  ),
  resolved as (
    select c.id as class_id, s.id as subject_id
    from curriculum cur
    join public.classes c
      on c.school_id = target_school_id
      and c.name = cur.class_name
      and c.academic_year = target_academic_year
    join public.subjects s
      on s.school_id = target_school_id
      and s.code = cur.subject_code
  )
  insert into public.class_subjects (school_id, class_id, subject_id, is_active)
  select target_school_id, class_id, subject_id, true
  from resolved
  on conflict (class_id, subject_id)
  do update set is_active = true, school_id = excluded.school_id, updated_at = now();
end;
$$;
