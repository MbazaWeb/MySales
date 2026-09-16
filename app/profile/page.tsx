import { redirect }                   from "next/navigation";
import ProfileClient                  from "./client";
import AppShell                       from "../components/AppShell";
import {
  getActiveBranch,
  getBusinessDataWithStaff,
  getActiveSubscription,
} from "@/lib/supabase/server-actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const ctx = await getActiveBranch();
  if (!ctx) redirect("/auth");

  const [bizData, subscription] = await Promise.all([
    getBusinessDataWithStaff(ctx.user.id),
    getActiveSubscription(ctx.biz.id),
  ]);

  return (
    <AppShell
      title="Business profile"
      subtitle="Branches, staff accounts and subscription"
      branchId={ctx.branch.id}
      bizName={ctx.biz.name}
      trialEndsAt={ctx.biz.trial_ends_at ?? null}
      userName={ctx.user.user_metadata?.full_name ?? ctx.user.email}
    >
      <ProfileClient
        user={ctx.user}
        businesses={bizData.businesses}
        branches={bizData.branches}
        staff={bizData.staff}
        trialEndsAt={ctx.biz.trial_ends_at ?? null}
        subscription={subscription}
      />
    </AppShell>
  );
}
