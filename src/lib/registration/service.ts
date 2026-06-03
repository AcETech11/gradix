import { createClient } from "@/lib/supabase/server";

export async function finalizeVerifiedRegistration() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("finalize_school_registration");

  if (error) {
    throw new Error(error.message);
  }

  return data as {
    school_id: string;
    school_code: string;
    created: boolean;
  };
}
