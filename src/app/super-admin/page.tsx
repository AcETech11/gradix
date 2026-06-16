import { getSuperAdminData } from "@/actions/super-admin/actions";
import { SuperAdminConsole } from "@/components/super-admin/SuperAdminConsole";

export default async function SuperAdminPage() {
  const data = await getSuperAdminData();

  return <SuperAdminConsole data={data} />;
}
