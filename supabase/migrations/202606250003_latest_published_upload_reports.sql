-- Gradix urgent report-source fix.
-- Results are versioned by upload. Public reports must read the latest published
-- upload, not every published row ever created for the same class/term/year.

do $$
declare
  target_table text;
  term_udt text;
begin
  foreach target_table in array array[
    'result_uploads',
    'results',
    'code_term_access',
    'student_term_reports',
    'class_term_report_settings'
  ]
  loop
    select c.udt_name
    into term_udt
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = target_table
      and c.column_name = 'term';

    if term_udt in ('text', 'varchar', 'bpchar') then
      execute format('alter table public.%I alter column term drop default', target_table);
      execute format(
        $sql$
        alter table public.%I
        alter column term type public.school_term
        using case lower(regexp_replace(coalesce(term::text, ''), '\s+', ' ', 'g'))
          when 'first' then 'first'::public.school_term
          when 'first term' then 'first'::public.school_term
          when 'second' then 'second'::public.school_term
          when 'second term' then 'second'::public.school_term
          when 'third' then 'third'::public.school_term
          when 'third term' then 'third'::public.school_term
          else null
        end
        $sql$,
        target_table
      );
    end if;
  end loop;
end;
$$;

drop index if exists public.results_unique_subject_result_key;
drop index if exists public.idx_unique_active_upload;

with ranked_active_uploads as (
  select
    id,
    row_number() over (
      partition by school_id, class_id, term, academic_year
      order by created_at desc, id desc
    ) as active_rank
  from public.result_uploads
  where status in ('draft'::public.upload_status, 'validating'::public.upload_status, 'validated'::public.upload_status, 'failed'::public.upload_status)
)
update public.result_uploads ru
set
  status = 'archived'::public.upload_status,
  metadata = coalesce(ru.metadata, '{}'::jsonb) || jsonb_build_object('archived_by_migration', '202606250003_latest_published_upload_reports')
from ranked_active_uploads rau
where ru.id = rau.id
  and rau.active_rank > 1;

create unique index if not exists idx_unique_active_upload
on public.result_uploads (school_id, class_id, term, academic_year)
where status in ('draft'::public.upload_status, 'validating'::public.upload_status, 'validated'::public.upload_status, 'failed'::public.upload_status);

create unique index if not exists results_upload_subject_student_key
on public.results (upload_id, student_id, subject_id)
where upload_id is not null;

create index if not exists result_uploads_latest_published_idx
on public.result_uploads (school_id, class_id, term, academic_year, published_at desc, created_at desc)
where status = 'published';

create index if not exists results_upload_published_idx
on public.results (school_id, upload_id, is_published);

with uploads_with_published_rows as (
  select
    ru.id,
    max(r.published_at) as latest_result_published_at
  from public.result_uploads ru
  join public.results r on r.upload_id = ru.id and r.school_id = ru.school_id
  where ru.status = 'archived'::public.upload_status
    and r.is_published = true
  group by ru.id
)
update public.result_uploads ru
set
  status = 'published'::public.upload_status,
  published_at = coalesce(ru.published_at, uwpr.latest_result_published_at, now()),
  metadata = coalesce(ru.metadata, '{}'::jsonb)
    || jsonb_build_object('restored_published_state_by_migration', '202606250003_latest_published_upload_reports')
from uploads_with_published_rows uwpr
where ru.id = uwpr.id;

alter table if exists public.student_term_reports
  drop constraint if exists student_term_reports_unique;

with ranked_report_rows as (
  select
    ctid,
    row_number() over (
      partition by school_id, student_id, class_id, academic_year, term, upload_id
      order by updated_at desc nulls last, published_at desc nulls last, ctid desc
    ) as report_rank
  from public.student_term_reports
)
delete from public.student_term_reports str
using ranked_report_rows rrr
where str.ctid = rrr.ctid
  and rrr.report_rank > 1;

create unique index if not exists student_term_reports_upload_unique_key
on public.student_term_reports (school_id, student_id, class_id, academic_year, term, upload_id);

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

  select jsonb_agg(jsonb_build_object(
    'term', grouped.term,
    'academicYear', grouped.academic_year,
    'classId', grouped.class_id,
    'publishedAt', grouped.published_at,
    'label', initcap(grouped.term::text) || ' Term, ' || grouped.academic_year
  ) order by grouped.published_at desc nulls last, grouped.created_at desc)
  into term_options
  from (
    select distinct on (ru.term, ru.academic_year, ru.class_id)
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
    order by ru.term, ru.academic_year, ru.class_id, ru.published_at desc nulls last, ru.created_at desc
  ) grouped;

  if term_options is null then
    return jsonb_build_object('ok', false, 'reason', 'no_published_result', 'message', 'No published result is available for this student yet. Please contact the school.');
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
    values (student_record.school_id, student_record.id, student_record.permanent_code, selected_upload.term::public.school_term, selected_upload.academic_year, true, 10, 1, now())
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
      avg(r.total_score) as average_score
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
