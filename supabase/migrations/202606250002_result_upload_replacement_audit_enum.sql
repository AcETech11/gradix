-- Gradix result upload replacement audit event.
-- Kept separate from functions that use the value so transactional migration
-- runners can commit the enum addition before later references.

do $$
begin
  alter type public.audit_action add value if not exists 'result_upload_replaced';
exception
  when duplicate_object then null;
end;
$$;
