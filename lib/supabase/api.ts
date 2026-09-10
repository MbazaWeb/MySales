/**
 * All data operations — same logic as web server-actions.ts
 * but calling Supabase directly (no Next.js server actions in RN).
 */
import { supabase }       from "./client";
import { todayInBizTz, bizDayRange } from "../supabase/tz";
import type { Product, Sale, StockLog } from "./types";

export function money(n: number) {
  return `TZS ${n.toLocaleString("en-TZ")}`;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signInWithOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw new Error(error.message);
}

export async function verifyOtp(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw new Error(error.message);
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ── Active context ────────────────────────────────────────────────────────────

export async function getActiveBranch() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name, type, trial_ends_at")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .single();
  if (!biz) {
    // Check if staff
    const { data: staff } = await supabase
      .from("staff")
      .select("branch_id, role, business_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();
    if (staff?.branch_id) {
      const { data: branch } = await supabase
        .from("branches")
        .select("id, name, location, business_id")
        .eq("id", staff.branch_id)
        .single();
      const { data: staffBiz } = await supabase
        .from("businesses")
        .select("id, name, type, trial_ends_at")
        .eq("id", staff.business_id)
        .single();
      if (branch && staffBiz) return { user, biz: staffBiz, branch, role: staff.role };
    }
    return null;
  }

  const { data: branch } = await supabase
    .from("branches")
    .select("id, name, location, business_id")
    .eq("business_id", biz.id)
    .order("created_at")
    .limit(1)
    .single();
  if (!branch) return null;

  return { user, biz, branch, role: "Owner" };
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(branchId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("branch_id", branchId)
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addStock(productId: string, qty: number, note?: string) {
  const { data, error } = await supabase.rpc("add_stock", {
    p_product_id: productId,
    p_quantity:   qty,
    p_note:       note ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export async function getSales(branchId: string, limit = 50): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function recordSale(args: {
  productId:     string;
  qty:           number;
  payment:       string;
  status:        "Paid" | "Not paid";
  customerName?: string;
  customerPhone?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("record_sale", {
    p_product_id:     args.productId,
    p_qty:            args.qty,
    p_payment:        args.payment,
    p_status:         args.status,
    p_customer_name:  args.customerName ?? null,
    p_customer_phone: args.customerPhone ?? null,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function markSalePaid(saleId: string) {
  const { error } = await supabase.rpc("mark_sale_paid", { p_sale_id: saleId });
  if (error) throw new Error(error.message);
}

// ── Dashboard summary ─────────────────────────────────────────────────────────

export async function getDashboardData(branchId: string) {
  const today = todayInBizTz();
  const { gte, lte } = bizDayRange(today, today);

  const [salesRes, productsRes] = await Promise.all([
    supabase.from("sales").select("*").eq("branch_id", branchId).gte("created_at", gte).lte("created_at", lte),
    supabase.from("products").select("*").eq("branch_id", branchId).eq("is_active", true),
  ]);

  const todaySales    = salesRes.data    ?? [];
  const products      = productsRes.data ?? [];

  const revenue   = todaySales.reduce((a, s) => a + s.total, 0);
  const profit    = todaySales.reduce((a, s) => a + (s.profit ?? 0), 0);
  const lowStock  = products.filter(p => p.stock <= p.reorder);
  const totalUnits = products.reduce((a, p) => a + p.stock, 0);

  const sellerMap: Record<string, number> = {};
  todaySales.forEach(s => {
    sellerMap[s.product_name] = (sellerMap[s.product_name] ?? 0) + s.qty;
  });
  const topSellers = Object.entries(sellerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return { todaySales, products, revenue, profit, lowStock, totalUnits, topSellers };
}

// ── Stock logs ────────────────────────────────────────────────────────────────

export async function getStockLogs(branchId: string, limit = 50): Promise<StockLog[]> {
  const { data, error } = await supabase
    .from("stock_logs")
    .select("*")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getReportData(branchId: string, from: string, to: string) {
  const { gte, lte } = bizDayRange(from, to);
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("branch_id", branchId)
    .gte("created_at", gte)
    .lte("created_at", lte)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Profile ───────────────────────────────────────────────────────────────────

export async function getBranches(businessId: string) {
  const { data } = await supabase
    .from("branches")
    .select("id, name, location, business_id, is_active")
    .eq("business_id", businessId)
    .order("created_at");
  return data ?? [];
}
