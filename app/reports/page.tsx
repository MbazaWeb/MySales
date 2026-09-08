import { redirect }  from "next/navigation";
import ReportsClient from "./client";
import AppShell      from "../components/AppShell";
import { getActiveBranch, getProducts, getReportSales } from "@/lib/supabase/actions";
import { todayInBizTz } from "@/lib/supabase/tz";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const ctx = await getActiveBranch();
  if (!ctx) redirect("/auth");

  // Default: today in the business timezone (not the server's UTC clock)
  const today = todayInBizTz();

  const [sales, products] = await Promise.all([
    getReportSales(ctx.branch.id, today, today),
    getProducts(ctx.branch.id),
  ]);

  return (
    <AppShell
      title="Reports"
      subtitle="Sales and stock summaries"
      branchId={ctx.branch.id}
      bizName={ctx.biz.name}
      userName={ctx.user.user_metadata?.full_name ?? ctx.user.email}
    >
      <ReportsClient
        initialSales={sales}
        products={products}
        branchId={ctx.branch.id}
        today={today}
      />
    </AppShell>
  );
}
