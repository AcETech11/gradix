do $$
begin
  alter type public.audit_action add value if not exists 'parent_result_viewed';
exception
  when undefined_object then
    null;
end;
$$;

drop trigger if exists code_term_access_audit on public.code_term_access;

create or replace function public.track_parent_result_view()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' and coalesce(new.use_count, 0) <= 0 then
    return new;
  end if;

  if tg_op = 'UPDATE' and coalesce(new.use_count, 0) <= coalesce(old.use_count, 0) then
    return new;
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
    new.school_id,
    null,
    null,
    'parent_result_viewed'::public.audit_action,
    'code_term_access',
    new.id,
    jsonb_build_object(
      'actor_type', 'public',
      'student_id', new.student_id,
      'code_term_access_id', new.id,
      'term', new.term,
      'academic_year', new.academic_year,
      'old_use_count', case when tg_op = 'UPDATE' then old.use_count else 0 end,
      'new_use_count', new.use_count
    )
  );

  return new;
end;
$$;

create trigger code_term_access_parent_result_view_audit
after insert or update of use_count on public.code_term_access
for each row
execute function public.track_parent_result_view();

create or replace function public.get_public_school_portal(input_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'ok', true,
    'school', jsonb_build_object(
      'slug', s.slug,
      'name', s.name,
      'logoUrl', coalesce(nullif(s.logo_url, ''), nullif(s.metadata->>'logo_url', ''), nullif(s.metadata->>'school_logo_url', '')),
      'address', s.address_line_1,
      'phone', s.phone,
      'email', s.email,
      'motto', s.motto,
      'primaryColor', coalesce(nullif(s.metadata->>'primary_color', ''), '#0f172a'),
      'secondaryColor', coalesce(nullif(s.metadata->>'secondary_color', ''), '#f97316')
    )
  )
  from public.schools s
  where s.slug = lower(coalesce(input_slug, ''))
  limit 1;
$$;

create or replace function public.get_public_student_result_for_school(
  input_code text,
  input_school_slug text,
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
  target_school_id uuid;
  matched_student_id uuid;
begin
  normalized_code := upper(regexp_replace(coalesce(input_code, ''), '\s+', '', 'g'));

  if normalized_code = '' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code', 'message', 'No result found.');
  end if;

  select s.id
  into target_school_id
  from public.schools s
  where s.slug = lower(coalesce(input_school_slug, ''))
  limit 1;

  if target_school_id is null then
    return jsonb_build_object('ok', false, 'reason', 'school_unavailable', 'message', 'No result found.');
  end if;

  select st.id
  into matched_student_id
  from public.students st
  where st.school_id = target_school_id
    and upper(st.permanent_code) = normalized_code
    and coalesce(st.is_active, true) = true
  limit 1;

  if matched_student_id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_published_result', 'message', 'No result found.');
  end if;

  return public.get_public_student_result(normalized_code, requested_term, requested_academic_year);
end;
$$;

revoke all on function public.get_public_school_portal(text) from public;
grant execute on function public.get_public_school_portal(text) to anon, authenticated;

revoke all on function public.get_public_student_result_for_school(text, text, public.school_term, text) from public;
grant execute on function public.get_public_student_result_for_school(text, text, public.school_term, text) to anon, authenticated;

update public.code_term_access
set max_uses = greatest(coalesce(max_uses, 0), 100),
    updated_at = now()
where result_code = 'GDXDE-4DBBC1FBB8';
