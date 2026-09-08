import { getAdminData, requireAdmin } from "@/lib/supabase/admin-guard";
import AdminShell     from "../components/AdminShell";
import ReportsClient  from "./client";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const { user } = await requireAdmin();
  const data = await getAdminData();
  return (
    <AdminShell adminEmail={user.email ?? ""}>
      <ReportsClient data={data} />
    </AdminShell>
  );
}
