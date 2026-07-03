do $$
begin
  alter type public.audit_action add value if not exists 'export';
exception
  when undefined_object then
    null;
end;
$$;

update public.code_term_access
set max_uses = greatest(coalesce(max_uses, 0), 100),
    updated_at = now()
where result_code = 'GDXDE-4DBBC1FBB8';
