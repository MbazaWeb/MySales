import { redirect }    from "next/navigation";
import InventoryClient from "./client";
import { getActiveBranch, getProducts } from "@/lib/supabase/actions";
import AppShell        from "../components/AppShell";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const ctx = await getActiveBranch();
  if (!ctx) redirect("/auth");

  const products = await getProducts(ctx.branch.id);

  return (
    <AppShell
      title="Inventory"
      subtitle="Stock levels and movement"
      branchId={ctx.branch.id}
      bizName={ctx.biz.name}
      userName={ctx.user.user_metadata?.full_name ?? ctx.user.email}
    >
      <InventoryClient
        initialProducts={products}
        branchId={ctx.branch.id}
      />
    </AppShell>
  );
}
