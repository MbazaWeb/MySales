import { redirect }  from "next/navigation";
import SalesClient   from "./client";
import AppShell      from "../components/AppShell";
import { getActiveBranch, getSales, getProducts } from "@/lib/supabase/actions";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const ctx = await getActiveBranch();
  if (!ctx) redirect("/auth");

  const [sales, products] = await Promise.all([
    getSales(ctx.branch.id),
    getProducts(ctx.branch.id),
  ]);

  return (
    <AppShell
      title="Sales"
      subtitle="Record and review every transaction"
      branchId={ctx.branch.id}
      bizName={ctx.biz.name}
      userName={ctx.user.user_metadata?.full_name ?? ctx.user.email}
    >
      <SalesClient
        initialSales={sales}
        products={products}
        branchId={ctx.branch.id}
      />
    </AppShell>
  );
}
