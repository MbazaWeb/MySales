import { redirect }      from "next/navigation";
import { getAdminData, requireAdmin } from "@/lib/supabase/admin-guard";
import AdminShell        from "./components/AdminShell";
import AdminDashClient   from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await requireAdmin();
  const data = await getAdminData();

  return (
    <AdminShell adminEmail={user.email ?? ""}>
      <AdminDashClient data={data} />
    </AdminShell>
  );
}
