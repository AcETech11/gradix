-- Migration to implement non-destructive mixed-subject placeholder filtering
-- This modifies recalculate_result_positions and get_public_student_result functions to exclude placeholder rows (continuous_assessment = 0 and exam_score = 0).

create or replace function public.recalculate_result_positions(
  target_school_id uuid,
  target_class_id uuid,
  target_term public.school_term,
  target_academic_year text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with subject_rankings as (
    select
      id,
      rank() over (partition by subject_id order by total_score desc) as subject_position
    from public.results
    where school_id = target_school_id
      and class_id = target_class_id
      and term = target_term
      and academic_year = target_academic_year
      and not (continuous_assessment = 0 and exam_score = 0) -- exclude placeholders
  )
  update public.results r
  set position_in_subject = subject_rankings.subject_position
  from subject_rankings
  where r.id = subject_rankings.id
    and r.school_id = target_school_id;

  with student_scores as (
    select
      student_id,
      sum(total_score) as total_score,
      avg(total_score) filter (where not (continuous_assessment = 0 and exam_score = 0)) as average_score
    from public.results
    where school_id = target_school_id
      and class_id = target_class_id
      and term = target_term
      and academic_year = target_academic_year
    group by student_id
  ),
  overall_rankings as (
    select
      student_id,
      rank() over (order by average_score desc, total_score desc) as overall_position
    from student_scores
  )
  update public.results r
  set metadata = coalesce(r.metadata, '{}'::jsonb) || jsonb_build_object('overall_position', overall_rankings.overall_position)
  from overall_rankings
  where r.student_id = overall_rankings.student_id
    and r.school_id = target_school_id
    and r.class_id = target_class_id
    and r.term = target_term
    and r.academic_year = target_academic_year;
end;
$$;

grant execute on function public.recalculate_result_positions(uuid, uuid, public.school_term, text) to authenticated;

create or replace function public.get_public_student_result(
  input_code text,
  requested_term public.school_term default null,
  requested_academic_year text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_code text;
  student_record public.students%rowtype;
  school_record public.schools%rowtype;
  class_record public.classes%rowtype;
  staff_teacher_record public.school_staff%rowtype;
  term_report_record public.student_term_reports%rowtype;
  class_term_record public.class_term_report_settings%rowtype;
  selected_upload public.result_uploads%rowtype;
  access_record public.code_term_access%rowtype;
  max_allowed integer;
  next_use_count integer;
  result_rows jsonb;
  term_options jsonb;
  teacher_comment text;
  overall_position integer;
  class_student_count integer;
begin
  normalized_code := upper(regexp_replace(coalesce(input_code, ''), '\s+', '', 'g'));

  if normalized_code = '' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code', 'message', 'This result code is not valid. Please check the code and try again.');
  end if;

  select * into student_record
  from public.students
  where upper(permanent_code) = normalized_code
    and coalesce(is_active, true) = true
  limit 1;

  if student_record.id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code', 'message', 'This result code is not valid. Please check the code and try again.');
  end if;

  select * into school_record from public.schools where id = student_record.school_id limit 1;

  if school_record.id is null then
    return jsonb_build_object('ok', false, 'reason', 'school_unavailable', 'message', 'This school workspace is currently unavailable.');
  end if;

  select ru.* into selected_upload
  from public.result_uploads ru
  join public.results r on r.upload_id = ru.id
  where r.student_id = student_record.id
    and ru.school_id = student_record.school_id
    and ru.status = 'published'::public.upload_status
    and r.is_published = true
    and (requested_term is null or ru.term::text = requested_term::text)
    and (requested_academic_year is null or ru.academic_year = requested_academic_year)
  order by ru.published_at desc nulls last, ru.created_at desc
  limit 1;

  if selected_upload.id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_published_result', 'message', 'No published result is available for this student yet. Please contact the school.');
  end if;

  select jsonb_agg(jsonb_build_object(
    'term', grouped.term,
    'academicYear', grouped.academic_year,
    'classId', grouped.class_id,
    'publishedAt', grouped.published_at,
    'label', initcap(grouped.term::text) || ' Term, ' || grouped.academic_year
  ) order by grouped.published_at desc nulls last, grouped.created_at desc)
  into term_options
  from (
    select distinct on (ru.term::text, ru.academic_year, ru.class_id)
      ru.term,
      ru.academic_year,
      ru.class_id,
      ru.published_at,
      ru.created_at
    from public.result_uploads ru
    join public.results r on r.upload_id = ru.id
    where r.student_id = student_record.id
      and ru.school_id = student_record.school_id
      and ru.status = 'published'::public.upload_status
      and r.is_published = true
    order by ru.term::text, ru.academic_year, ru.class_id, ru.published_at desc nulls last, ru.created_at desc
  ) grouped;

  select * into class_record
  from public.classes
  where id = selected_upload.class_id
    and school_id = student_record.school_id
  limit 1;

  if class_record.teacher_id is not null then
    select * into staff_teacher_record
    from public.school_staff
    where id = class_record.teacher_id
      and school_id = student_record.school_id
      and role in ('teacher', 'headmaster')
    limit 1;
  end if;

  select * into term_report_record
  from public.student_term_reports
  where student_id = student_record.id
    and school_id = student_record.school_id
    and class_id = selected_upload.class_id
    and term::text = selected_upload.term::text
    and academic_year = selected_upload.academic_year
    and upload_id = selected_upload.id
  limit 1;

  select * into class_term_record
  from public.class_term_report_settings
  where school_id = student_record.school_id
    and class_id = selected_upload.class_id
    and term::text = selected_upload.term::text
    and academic_year = selected_upload.academic_year
  limit 1;

  teacher_comment := nullif(term_report_record.class_teacher_comment, '');

  if teacher_comment is null then
    select nullif(r.metadata->>'class_teacher_comment', '')
    into teacher_comment
    from public.results r
    where r.student_id = student_record.id
      and r.school_id = student_record.school_id
      and r.upload_id = selected_upload.id
      and r.is_published = true
      and r.metadata ? 'class_teacher_comment'
    order by r.updated_at desc
    limit 1;
  end if;

  select * into access_record
  from public.code_term_access
  where student_id = student_record.id
    and school_id = student_record.school_id
    and term::text = selected_upload.term::text
    and academic_year = selected_upload.academic_year
    and is_active = true
  limit 1;

  if access_record.id is null then
    insert into public.code_term_access (school_id, student_id, result_code, term, academic_year, is_active, max_uses, use_count, last_used_at)
    values (student_record.school_id, student_record.id, student_record.permanent_code, selected_upload.term, selected_upload.academic_year, true, 10, 1, now())
    returning * into access_record;
  else
    max_allowed := coalesce(access_record.max_uses, 10);
    if access_record.expires_at is not null and access_record.expires_at < now() then
      return jsonb_build_object('ok', false, 'reason', 'access_limit', 'message', 'You have reached the result viewing limit for this term. Please contact the school.');
    end if;
    if access_record.use_count >= max_allowed then
      return jsonb_build_object('ok', false, 'reason', 'access_limit', 'message', 'You have reached the result viewing limit for this term. Please contact the school.');
    end if;
    update public.code_term_access set use_count = use_count + 1, last_used_at = now() where id = access_record.id returning * into access_record;
  end if;

  max_allowed := coalesce(access_record.max_uses, 10);
  next_use_count := access_record.use_count;

  with selected_results as (
    select r.*, s.name as subject_name
    from public.results r
    join public.subjects s on s.id = r.subject_id and s.school_id = r.school_id
    where r.school_id = student_record.school_id
      and r.upload_id = selected_upload.id
      and r.is_published = true
      and not (r.continuous_assessment = 0 and r.exam_score = 0) -- exclude placeholders from visibility
  ),
  subject_ranked as (
    select
      sr.*,
      rank() over (partition by sr.subject_id order by sr.total_score desc) as calculated_subject_position
    from selected_results sr
  )
  select jsonb_agg(jsonb_build_object(
    'subject', subject_name,
    'ca', continuous_assessment,
    'exam', exam_score,
    'total', total_score,
    'grade', grade,
    'remark', remark,
    'position', coalesce(position_in_subject, calculated_subject_position)
  ) order by subject_name)
  into result_rows
  from subject_ranked
  where student_id = student_record.id;

  with student_scores as (
    select
      r.student_id,
      sum(r.total_score) as total_score,
      avg(r.total_score) filter (where not (r.continuous_assessment = 0 and r.exam_score = 0)) as average_score
    from public.results r
    where r.school_id = student_record.school_id
      and r.upload_id = selected_upload.id
      and r.is_published = true
    group by r.student_id
  ),
  ranked_students as (
    select
      student_id,
      rank() over (order by average_score desc, total_score desc) as calculated_overall_position,
      count(*) over () as class_count
    from student_scores
  )
  select calculated_overall_position, class_count
  into overall_position, class_student_count
  from ranked_students
  where student_id = student_record.id;

  return jsonb_build_object(
    'ok', true,
    'school', jsonb_build_object(
      'name', school_record.name,
      'logoUrl', coalesce(nullif(school_record.logo_url, ''), nullif(school_record.metadata->>'logo_url', ''), nullif(school_record.metadata->>'school_logo_url', '')),
      'address', school_record.address_line_1,
      'phone', school_record.phone,
      'email', school_record.email,
      'motto', school_record.motto,
      'principalName', coalesce(nullif(school_record.metadata->>'principal_name', ''), nullif(school_record.metadata->>'headmaster_name', ''), 'Principal / Head Teacher'),
      'principalSignatureUrl', coalesce(nullif(school_record.metadata->>'principal_signature_url', ''), nullif(school_record.metadata->>'headmaster_signature_url', ''), nullif(school_record.metadata->>'signature_url', ''), nullif(school_record.headmaster_signature_url, '')),
      'sealUrl', coalesce(nullif(school_record.metadata->>'crest_url', ''), nullif(school_record.metadata->>'school_crest_url', ''), nullif(school_record.metadata->>'seal_url', ''), nullif(school_record.metadata->>'school_seal_url', ''), nullif(school_record.metadata->>'stamp_url', ''), nullif(school_record.metadata->>'school_stamp_url', ''), nullif(school_record.seal_url, '')),
      'reportSettings', coalesce(school_record.metadata->'report_settings', '{}'::jsonb),
      'gradingScale', coalesce(school_record.metadata->'grading_scale', '[]'::jsonb)
    ),
    'student', jsonb_build_object(
      'name', trim(concat_ws(' ', student_record.first_name, student_record.middle_name, student_record.last_name)),
      'code', student_record.permanent_code,
      'admissionNumber', student_record.admission_number
    ),
    'result', jsonb_build_object(
      'term', selected_upload.term,
      'academicYear', selected_upload.academic_year,
      'className', coalesce(class_record.name, 'Class'),
      'classTeacherName', staff_teacher_record.full_name,
      'classTeacherSignatureUrl', coalesce(nullif(staff_teacher_record.signature_url, ''), nullif(staff_teacher_record.metadata->>'signature_url', '')),
      'classTeacherComment', teacher_comment,
      'publishedAt', selected_upload.published_at,
      'overallPosition', overall_position,
      'classStudentCount', class_student_count,
      'attendance', jsonb_build_object(
        'schoolOpenDays', class_term_record.school_open_days,
        'daysPresent', term_report_record.attendance_present,
        'daysAbsent', term_report_record.attendance_absent,
        'termEndsOn', class_term_record.term_ends_on,
        'nextTermBeginsOn', class_term_record.next_term_begins_on
      ),
      'affectiveDomain', coalesce(term_report_record.affective_domain, '{}'::jsonb),
      'psychomotorDomain', coalesce(term_report_record.psychomotor_domain, '{}'::jsonb),
      'rows', coalesce(result_rows, '[]'::jsonb)
    ),
    'termOptions', coalesce(term_options, '[]'::jsonb),
    'access', jsonb_build_object('useCount', next_use_count, 'maxUses', max_allowed, 'remaining', greatest(max_allowed - next_use_count, 0))
  );
end;
$$;

revoke all on function public.get_public_student_result(text, public.school_term, text) from public;
grant execute on function public.get_public_student_result(text, public.school_term, text) to anon, authenticated;

-- Automatic recalculation of positions for SSS classes in Anchor of Hope Schools
do $$
declare
  school_rec record;
  class_rec record;
  upload_rec record;
begin
  select id into school_rec from public.schools where slug = 'anchor-of-hope' limit 1;
  if school_rec.id is not null then
    for class_rec in
      select id, name, academic_year from public.classes
      where school_id = school_rec.id and (name ilike 'SSS%' or name ilike 'SS%')
    loop
      for upload_rec in
        select distinct term from public.result_uploads
        where school_id = school_rec.id and class_id = class_rec.id and academic_year = class_rec.academic_year
      loop
        perform public.recalculate_result_positions(school_rec.id, class_rec.id, upload_rec.term, class_rec.academic_year);
      end loop;
    end loop;
  end if;
end;
$$;
