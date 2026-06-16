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
      avg(total_score) as average_score
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
