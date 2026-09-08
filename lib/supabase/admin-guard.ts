/**
 * Admin access guard — server-side only.
 * Uses the service role client to bypass RLS entirely.
 * Only the listed UIDs have admin access.
 */
import { createAdminClient } from "./admin";
import { createClient }      from "./server";
import { redirect }          from "next/navigation";

const ADMIN_UIDS = new Set([
  "94350837-85e5-4cf0-a07c-adc701857552", // mbazzacodes@gmail.com
]);

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !ADMIN_UIDS.has(user.id)) {
    redirect("/auth?error=Not+authorised");
  }

  const admin = createAdminClient();
  return { user, admin };
}

/** Pull all data the admin console needs in one pass */
export async function getAdminData() {
  const { admin } = await requireAdmin();

  // All auth users (service role only)
  const { data: { users: authUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });

  // All businesses
  const { data: businesses } = await admin
    .from("businesses")
    .select("id, owner_id, name, type, trial_ends_at, created_at")
    .order("created_at", { ascending: false });

  // All subscriptions
  const { data: subscriptions } = await admin
    .from("subscriptions")
    .select("id, business_id, billing_interval, status, amount_tzs, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false });

  // All profiles
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, phone, created_at");

  // All branches (count per business)
  const { data: branches } = await admin
    .from("branches")
    .select("id, business_id, name, location, is_active");

  // All sales (for revenue calc)
  const { data: sales } = await admin
    .from("sales")
    .select("id, branch_id, total, profit, created_at, status");

  // All products (low stock count)
  const { data: products } = await admin
    .from("products")
    .select("id, branch_id, stock, reorder, is_active");

  const bizArr     = businesses     ?? [];
  const subArr     = subscriptions  ?? [];
  const profArr    = profiles       ?? [];
  const branchArr  = branches       ?? [];
  const salesArr   = sales          ?? [];
  const prodArr    = products       ?? [];

  // Build user summary rows
  const now = new Date();
  const users = authUsers.map(u => {
    const profile   = profArr.find(p => p.id === u.id);
    const biz       = bizArr.find(b => b.owner_id === u.id);
    const sub       = biz ? subArr.filter(s => s.business_id === biz.id) : [];
    const activeSub = sub.find(s => s.status === "Active" && new Date(s.ends_at) > now);
    const onTrial   = biz && !activeSub && new Date(biz.trial_ends_at) > now;
    const expired   = biz && !activeSub && !onTrial;

    const bizBranches = biz ? branchArr.filter(b => b.business_id === biz.id) : [];
    const bizSales    = biz
      ? salesArr.filter(s => bizBranches.some(b => b.id === s.branch_id))
      : [];
    const totalRevenue = bizSales.reduce((a, s) => a + s.total, 0);
    const totalProfit  = bizSales.reduce((a, s) => a + (s.profit ?? 0), 0);

    return {
      uid:           u.id,
      email:         u.email ?? "—",
      full_name:     profile?.full_name ?? (u.user_metadata?.full_name as string) ?? "—",
      phone:         profile?.phone ?? null,
      created_at:    u.created_at,
      last_sign_in:  u.last_sign_in_at ?? null,
      biz_id:        biz?.id ?? null,
      biz_name:      biz?.name ?? null,
      biz_type:      biz?.type ?? null,
      trial_ends_at: biz?.trial_ends_at ?? null,
      sub_status:    activeSub ? "Active" : onTrial ? "Trial" : expired ? "Expired" : "No business",
      sub_interval:  activeSub?.billing_interval ?? null,
      sub_ends_at:   activeSub?.ends_at ?? null,
      branches:      bizBranches.length,
      total_revenue: totalRevenue,
      total_profit:  totalProfit,
      total_sales:   bizSales.length,
    };
  });

  // Platform totals
  const totalRevenue  = salesArr.reduce((a, s) => a + s.total, 0);
  const totalProfit   = salesArr.reduce((a, s) => a + (s.profit ?? 0), 0);
  const activeUsers   = users.filter(u => u.sub_status === "Active").length;
  const trialUsers    = users.filter(u => u.sub_status === "Trial").length;
  const expiredUsers  = users.filter(u => u.sub_status === "Expired").length;

  // Monthly revenue (last 6 months)
  const monthlyRevenue: Record<string, number> = {};
  salesArr.forEach(s => {
    const key = s.created_at.slice(0, 7); // YYYY-MM
    monthlyRevenue[key] = (monthlyRevenue[key] ?? 0) + s.total;
  });

  return {
    users,
    totalRevenue,
    totalProfit,
    activeUsers,
    trialUsers,
    expiredUsers,
    totalBiz:   bizArr.length,
    totalUsers: authUsers.length,
    monthlyRevenue,
    subscriptions: subArr,
    businesses: bizArr,
  };
}

export type AdminData   = Awaited<ReturnType<typeof getAdminData>>;
export type AdminUser   = AdminData["users"][number];
