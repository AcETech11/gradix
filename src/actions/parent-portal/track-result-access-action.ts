"use server";

// Access tracking is intentionally performed inside public.get_public_student_result().
// Keeping this action as a named boundary documents Phase 10 behavior without exposing
// table-level writes to the public portal.
export async function trackResultAccessAction() {
  return {
    ok: true,
    message: "Access tracking is handled during secure result lookup.",
  };
}
