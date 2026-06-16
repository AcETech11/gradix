alter table public.demo_requests
  add column if not exists preferred_plan text,
  add column if not exists student_count_range text;
