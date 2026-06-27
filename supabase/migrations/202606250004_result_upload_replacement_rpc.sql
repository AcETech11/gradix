-- Gradix result upload replacement safety.
-- Archives the previous active upload before inserting its replacement.

create or replace function public.create_result_upload_for_save(
  target_class_id uuid,
  target_term public.school_term,
  target_academic_year text,
  replacement_mode boolean,
  upload_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_school_id uuid;
  actor_role public.app_role;
  existing_upload public.result_uploads%rowtype;
  has_existing_upload boolean := false;
  published_upload public.result_uploads%rowtype;
  has_published_upload boolean := false;
  new_upload_id uuid;
  new_upload_status public.upload_status;
begin
  select u.school_id, u.role
  into actor_school_id, actor_role
  from public.users u
  where u.id = actor_id
    and coalesce(u.is_active, true) = true
  limit 1;

  if actor_id is null or actor_school_id is null or actor_role not in ('admin'::public.app_role, 'headmaster'::public.app_role) then
    raise exception 'Only admins and headmasters can save result uploads.';
  end if;

  if not exists (
    select 1
    from public.classes c
    where c.id = target_class_id
      and c.school_id = actor_school_id
      and coalesce(c.is_active, true) = true
  ) then
    raise exception 'The selected class was not found for your school.';
  end if;

  select *
  into existing_upload
  from public.result_uploads ru
  where ru.school_id = actor_school_id
    and ru.class_id = target_class_id
    and ru.term::text = target_term::text
    and ru.academic_year = target_academic_year
    and ru.status in ('draft'::public.upload_status, 'validating'::public.upload_status, 'validated'::public.upload_status, 'failed'::public.upload_status)
  order by ru.created_at desc
  limit 1
  for update;

  has_existing_upload := existing_upload.id is not null;

  select *
  into published_upload
  from public.result_uploads ru
  where ru.school_id = actor_school_id
    and ru.class_id = target_class_id
    and ru.term::text = target_term::text
    and ru.academic_year = target_academic_year
    and ru.status = 'published'::public.upload_status
  order by ru.published_at desc nulls last, ru.created_at desc
  limit 1;

  has_published_upload := published_upload.id is not null;

  if replacement_mode and has_existing_upload then
    update public.result_uploads
    set
      status = 'archived'::public.upload_status,
      metadata = coalesce(metadata, '{}'::jsonb)
        || jsonb_build_object(
          'replacement_status', 'superseded',
          'replaced_at', now(),
          'replaced_by', actor_id
        ),
      updated_at = now()
    where id = existing_upload.id;

    new_upload_status := coalesce(nullif(upload_payload ->> 'status', '')::public.upload_status, 'validated'::public.upload_status);
  elsif replacement_mode then
    new_upload_status := coalesce(nullif(upload_payload ->> 'status', '')::public.upload_status, 'validated'::public.upload_status);
  elsif has_existing_upload or has_published_upload then
    new_upload_status := 'archived'::public.upload_status;
  else
    new_upload_status := coalesce(nullif(upload_payload ->> 'status', '')::public.upload_status, 'validated'::public.upload_status);
  end if;

  insert into public.result_uploads (
    school_id,
    class_id,
    class_name,
    subject,
    term,
    academic_year,
    status,
    file_name,
    source_filename,
    total_rows,
    valid_rows,
    invalid_rows,
    validation_errors,
    uploaded_by,
    validated_by,
    validated_at,
    metadata
  )
  values (
    actor_school_id,
    target_class_id,
    coalesce(nullif(upload_payload ->> 'class_name', ''), 'Unknown class'),
    coalesce(nullif(upload_payload ->> 'subject', ''), 'Multiple subjects'),
    target_term,
    target_academic_year,
    new_upload_status,
    coalesce(nullif(upload_payload ->> 'file_name', ''), 'result-upload.xlsx'),
    nullif(upload_payload ->> 'source_filename', ''),
    coalesce((upload_payload ->> 'total_rows')::integer, 0),
    coalesce((upload_payload ->> 'valid_rows')::integer, 0),
    coalesce((upload_payload ->> 'invalid_rows')::integer, 0),
    coalesce(upload_payload -> 'validation_errors', '[]'::jsonb),
    actor_id,
    case when new_upload_status = 'validated'::public.upload_status then actor_id else null end,
    case when new_upload_status = 'validated'::public.upload_status then now() else null end,
    coalesce(upload_payload -> 'metadata', '{}'::jsonb)
      || jsonb_build_object(
        'duplicate_strategy', case when replacement_mode then 'replace' else 'skip' end,
        'created_with_active_upload_present', has_existing_upload,
        'replaced_upload_id', case
          when replacement_mode and has_existing_upload then existing_upload.id
          when replacement_mode and has_published_upload then published_upload.id
          else null
        end,
        'replaces_published_upload_id', case when replacement_mode and has_published_upload then published_upload.id else null end
      )
  )
  returning id into new_upload_id;

  if replacement_mode and (has_existing_upload or has_published_upload) then
    insert into public.audit_logs (school_id, actor_id, actor_role, action, table_name, record_id, details)
    values (
      actor_school_id,
      actor_id,
      actor_role,
      'result_upload_replaced'::public.audit_action,
      'result_uploads',
      new_upload_id,
      jsonb_build_object(
        'old_upload_id', coalesce(existing_upload.id, published_upload.id),
        'new_upload_id', new_upload_id,
        'class_id', target_class_id,
        'class_name', coalesce(nullif(upload_payload ->> 'class_name', ''), existing_upload.class_name, published_upload.class_name),
        'term', target_term,
        'academic_year', target_academic_year,
        'replaced_by', actor_id,
        'published_upload_kept_live_until_republish', has_published_upload and not has_existing_upload,
        'timestamp', now()
      )
    );
  end if;

  return jsonb_build_object(
    'new_upload_id', new_upload_id,
    'old_upload_id', coalesce(existing_upload.id, published_upload.id),
    'new_upload_status', new_upload_status,
    'old_upload_archived', replacement_mode and has_existing_upload,
    'active_upload_existed', has_existing_upload,
    'published_upload_existed', has_published_upload
  );
end;
$$;

grant execute on function public.create_result_upload_for_save(uuid, public.school_term, text, boolean, jsonb) to authenticated;
