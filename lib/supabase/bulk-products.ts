"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { validateImportProducts, type ImportIssue } from "../product-import";
import type { Product } from "./types";

type Result = { success: true; products: Product[] } | { success: false; error: string; issues?: ImportIssue[] };

export async function importProducts(branchId: string, input: unknown): Promise<Result> {
  const checked = validateImportProducts(input);
  if (checked.issues.length) return { success: false, error: "Fix the highlighted rows before importing.", issues: checked.issues };
  if (typeof branchId !== "string" || !/^[0-9a-f-]{36}$/i.test(branchId)) return { success: false, error: "Branch not found or access denied." };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Authentication required." };
  const { data: branch, error: branchError } = await supabase.from("branches").select("id, business_id").eq("id", branchId).eq("is_active", true).maybeSingle();
  if (branchError || !branch) return { success: false, error: "Branch not found or access denied." };
  const { data: business } = await supabase.from("businesses").select("owner_id").eq("id", branch.business_id).maybeSingle();
  if (business?.owner_id !== user.id) {
    const { data: membership } = await supabase.from("staff").select("role, branch_id").eq("business_id", branch.business_id).eq("user_id", user.id).eq("is_active", true).maybeSingle();
    const canManage = membership && ["Owner", "Admin", "Manager", "Stock keeper"].includes(membership.role)
      && (membership.branch_id === branchId || (membership.branch_id === null && ["Owner", "Admin"].includes(membership.role)));
    if (!canManage) return { success: false, error: "You do not have permission to import products in this branch." };
  }

  // Paginate because Supabase normally returns at most 1,000 records per request.
  const names: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("products").select("name").eq("branch_id", branchId).order("id").range(offset, offset + 999);
    if (error) return { success: false, error: "Could not check existing products. Please try again." };
    names.push(...(data ?? []).map(product => product.name));
    if (!data || data.length < 1000) break;
  }
  const validated = validateImportProducts(checked.products, names);
  if (validated.issues.length) return { success: false, error: "Fix the highlighted rows before importing.", issues: validated.issues };
  const rows = validated.products.map(({ row, ...product }) => ({ ...product, branch_id: branchId, price: product.selling_price }));
  // A single insert is atomic. Existing RLS and opening-stock triggers also apply.
  const { data, error } = await supabase.from("products").insert(rows).select();
  if (error) return { success: false, error: error.code === "23505" ? "A product already exists. Refresh Inventory and check your file." : "Import failed. No products were added. Check your permissions and try again." };
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: true, products: data ?? [] };
}
