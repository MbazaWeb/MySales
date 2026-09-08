import { redirect } from "next/navigation";
import ReportsClient from "./client";
import AppShell from "../components/AppShell";
import { getActiveBranch, getProducts, getReportSales, getStockLogs } from "@/lib/supabase/server-actions";
import { todayInBizTz, BIZ_TZ } from "@/lib/supabase/tz";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const ctx = await getActiveBranch();
  if (!ctx) redirect("/auth");

  const today = todayInBizTz();

  const [sales, products, stockLogs] = await Promise.all([
    getReportSales(ctx.branch.id, today, today),
    getProducts(ctx.branch.id),
    getStockLogs(ctx.branch.id),
  ]);

  const currentTime = new Date().toISOString();

  return (
    <AppShell
      title="Reports"
      subtitle="Sales, stock and movement summaries"
      time={currentTime}
      branchId={ctx.branch.id}
      bizName={ctx.biz.name}
      userName={ctx.user.user_metadata?.full_name ?? ctx.user.email}
    >
      <ReportsClient
        initialSales={sales}
        products={products}
        stockLogs={stockLogs}
        branchId={ctx.branch.id}
        today={today}
      />
    </AppShell>
  );
}