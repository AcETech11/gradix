import { createClient } from "@/lib/supabase/server";
import { assertResourceBelongsToSchool, requireSchoolContext } from "@/lib/auth/authorization";
import type { PublicTableName, TableRow } from "@/types/database";

export async function createTenantClient() {
  const [{ profile, schoolId }, supabase] = await Promise.all([requireSchoolContext(), createClient()]);

  return {
    profile,
    schoolId,
    supabase,
  };
}

type SchoolScopedTableName = {
  [TTable in PublicTableName]: "school_id" extends keyof TableRow<TTable> ? TTable : never;
}[PublicTableName];

export async function requireTenantResource(table: SchoolScopedTableName, id: string) {
  const { schoolId } = await requireSchoolContext();

  return assertResourceBelongsToSchool(table, id, schoolId);
}
