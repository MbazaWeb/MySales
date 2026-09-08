import { getAdminData, requireAdmin } from "@/lib/supabase/admin-guard";
import AdminShell from "../components/AdminShell";
import UsersClient from "./client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { user } = await requireAdmin();
  const data = await getAdminData();
  return (
    <AdminShell adminEmail={user.email ?? ""}>
      <UsersClient users={data.users} businesses={data.businesses} />
    </AdminShell>
  );
}