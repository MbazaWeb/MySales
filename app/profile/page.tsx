import { redirect }   from "next/navigation";
import ProfileClient  from "./client";
import AppShell       from "../components/AppShell";
import { getActiveBranch, getBusinessData } from "@/lib/supabase/actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await getActiveBranch();
  if (!ctx) redirect("/auth");

  const bizData = await getBusinessData(ctx.user.id);

  return (
    <AppShell
      title="Business profile"
      subtitle="Account, branches, staff and subscription"
      branchId={ctx.branch.id}
      bizName={ctx.biz.name}
      userName={ctx.user.user_metadata?.full_name ?? ctx.user.email}
    >
      <ProfileClient
        user={ctx.user}
        businesses={bizData.businesses}
        branches={bizData.branches}
        staff={bizData.staff}
      />
    </AppShell>
  );
}
