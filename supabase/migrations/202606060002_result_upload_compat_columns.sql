-- Gradix repair: keep result_uploads compatible across early and current schemas.
-- Phase 8/9 use class_id + source_filename, while some remote databases also require
-- class_name, subject, and file_name.

alter table if exists public.result_uploads
  add column if not exists class_name text,
  add column if not exists subject text,
  add column if not exists file_name text;

update public.result_uploads ru
set class_name = coalesce(
  nullif(btrim(ru.class_name), ''),
  c.name,
  'Unknown class'
)
from public.classes c
where ru.class_id = c.id
  and (ru.class_name is null or btrim(ru.class_name) = '');

update public.result_uploads
set
  class_name = coalesce(nullif(btrim(class_name), ''), 'Unknown class'),
  subject = coalesce(nullif(btrim(subject), ''), 'Multiple subjects'),
  file_name = coalesce(nullif(btrim(file_name), ''), nullif(btrim(source_filename), ''), 'result-upload.xlsx')
where class_name is null
  or btrim(class_name) = ''
  or subject is null
  or btrim(subject) = ''
  or file_name is null
  or btrim(file_name) = '';

alter table if exists public.result_uploads
  alter column class_name set not null,
  alter column subject set not null,
  alter column file_name set not null;
