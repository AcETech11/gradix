create or replace function public.get_staff_invitation(invite_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  invitation record;
begin
  select si.id, si.email, si.full_name, si.role, si.status, si.expires_at, s.name as school_name
  into invitation
  from public.staff_invitations si
  join public.schools s on s.id = si.school_id
  where si.token = invite_token
  limit 1;

  if invitation.id is null then
    return jsonb_build_object('ok', false, 'message', 'This invitation was not found.');
  end if;

  if invitation.status <> 'pending' or invitation.expires_at < now() then
    return jsonb_build_object('ok', false, 'message', 'This invitation has expired or is no longer available.');
  end if;

  return jsonb_build_object(
    'ok', true,
    'email', invitation.email,
    'full_name', invitation.full_name,
    'role', invitation.role,
    'school_name', invitation.school_name,
    'expires_at', invitation.expires_at
  );
end;
$$;

create or replace function public.accept_staff_invitation(invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation record;
  user_email text;
  user_name text;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'message', 'Sign in before accepting this invitation.');
  end if;

  user_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  user_name := coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', '');

  select *
  into invitation
  from public.staff_invitations
  where token = invite_token
  for update;

  if invitation.id is null then
    return jsonb_build_object('ok', false, 'message', 'This invitation was not found.');
  end if;

  if invitation.status <> 'pending' or invitation.expires_at < now() then
    return jsonb_build_object('ok', false, 'message', 'This invitation has expired or is no longer available.');
  end if;

  if lower(invitation.email) <> user_email then
    return jsonb_build_object('ok', false, 'message', 'This invitation must be accepted with the invited email address.');
  end if;

  insert into public.users (id, school_id, full_name, email, role, is_active, metadata)
  values (
    auth.uid(),
    invitation.school_id,
    coalesce(nullif(invitation.full_name, ''), nullif(user_name, ''), invitation.email),
    invitation.email,
    invitation.role::public.app_role,
    true,
    jsonb_build_object('accepted_invitation_id', invitation.id)
  )
  on conflict (id) do update
  set school_id = excluded.school_id,
      full_name = coalesce(public.users.full_name, excluded.full_name),
      email = excluded.email,
      role = excluded.role,
      is_active = true,
      updated_at = now(),
      metadata = coalesce(public.users.metadata, '{}'::jsonb) || excluded.metadata;

  update public.staff_invitations
  set status = 'accepted',
      accepted_at = now(),
      updated_at = now()
  where id = invitation.id;

  insert into public.audit_logs (school_id, actor_id, actor_role, action, table_name, record_id, details)
  values (
    invitation.school_id,
    auth.uid(),
    invitation.role,
    'update',
    'staff_invitations',
    invitation.id,
    jsonb_build_object('security_event', 'staff_invite_accepted', 'email', invitation.email, 'role', invitation.role)
  );

  return jsonb_build_object('ok', true, 'message', 'Invitation accepted.');
end;
$$;
