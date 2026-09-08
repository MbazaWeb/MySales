"use server";

import { revalidatePath } from "next/cache";
import { redirect }        from "next/navigation";
import { createClient }    from "./server";

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email     = formData.get("email")    as string;
  const password  = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const phone     = formData.get("phone")    as string;
  const biz_name  = formData.get("biz_name") as string;
  const biz_type  = formData.get("biz_type") as string;
  const biz_loc   = formData.get("biz_loc")  as string;

  // 1. Create auth user
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone } },
  });
  if (authErr) return { error: authErr.message };

  const userId = authData.user?.id;
  if (!userId) return { error: "Account created but could not retrieve user ID. Check your email for a confirmation link." };

  // 2. Create business row
  const { data: bizRow, error: bizErr } = await supabase
    .from("businesses")
    .insert({ owner_id: userId, name: biz_name, type: biz_type })
    .select("id")
    .single();
  if (bizErr) return { error: bizErr.message };

  // 3. Create first branch row
  const { error: branchErr } = await supabase
    .from("branches")
    .insert({ business_id: bizRow.id, name: biz_name, location: biz_loc });
  if (branchErr) return { error: branchErr.message };

  // 4. Add owner to staff table
  await supabase.from("staff").insert({
    business_id: bizRow.id,
    user_id:     userId,
    name:        full_name,
    role:        "Owner",
    branch_id:   null,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email:    formData.get("email")    as string,
    password: formData.get("password") as string,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

// ── Session helpers ───────────────────────────────────────────────────────────

/** Returns the current user's first business and its first branch, or null. */
export async function getActiveBranch() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name, type")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .single();
  if (!biz) return null;

  const { data: branch } = await supabase
    .from("branches")
    .select("id, name, location")
    .eq("business_id", biz.id)
    .order("created_at")
    .limit(1)
    .single();
  if (!branch) return null;

  return { user, biz, branch };
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(branchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("branch_id", branchId)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const branchId = formData.get("branch_id") as string;

  const { error } = await supabase.from("products").insert({
    branch_id: branchId,
    name:      formData.get("name")     as string,
    category:  formData.get("category") as string,
    stock:     Number(formData.get("stock")),
    unit:      formData.get("unit")     as string,
    price:     Number(formData.get("price")),
    reorder:   Number(formData.get("reorder")),
  });
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { success: true };
}

export async function addStockEntry(formData: FormData) {
  const supabase  = await createClient();
  const productId = formData.get("product_id") as string;
  const qtyAdded  = Number(formData.get("qty"));
  const note      = (formData.get("note") as string) || null;
  const branchId  = formData.get("branch_id") as string;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: product, error: fetchErr } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();
  if (fetchErr) return { error: fetchErr.message };

  const { error: updateErr } = await supabase
    .from("products")
    .update({ stock: product.stock + qtyAdded, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (updateErr) return { error: updateErr.message };

  const { error: logErr } = await supabase.from("stock_logs").insert({
    product_id: productId,
    branch_id:  branchId,
    qty_added:  qtyAdded,
    note,
    added_by:   user?.id ?? null,
  });
  if (logErr) return { error: logErr.message };

  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Sales ─────────────────────────────────────────────────────────────────────

export async function getSales(branchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function recordSale(formData: FormData) {
  const supabase    = await createClient();
  const productId   = formData.get("product_id")   as string;
  const productName = formData.get("product_name")  as string;
  const qty         = Number(formData.get("qty"));
  const price       = Number(formData.get("price"));
  const payment     = formData.get("payment")       as string;
  const branchId    = formData.get("branch_id")     as string;
  const status      = payment === "Credit" ? "Not paid" : "Paid";

  const { data: { user } } = await supabase.auth.getUser();

  const { error: saleErr } = await supabase.from("sales").insert({
    branch_id:    branchId,
    product_id:   productId,
    product_name: productName,
    qty,
    total:   qty * price,
    payment,
    status:  status as "Paid" | "Not paid",
    sold_by: user?.id ?? null,
  });
  if (saleErr) return { error: saleErr.message };

  // Decrement stock
  const { data: prod } = await supabase
    .from("products").select("stock").eq("id", productId).single();
  if (prod) {
    await supabase.from("products")
      .update({ stock: Math.max(0, prod.stock - qty), updated_at: new Date().toISOString() })
      .eq("id", productId);
  }

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getReportSales(branchId: string, from: string, to: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("id, product_name, qty, total, status, payment, created_at")
    .eq("branch_id", branchId)
    .gte("created_at", from)
    .lte("created_at", to + "T23:59:59")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Staff & business ──────────────────────────────────────────────────────────

export async function getBusinessData(userId: string) {
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, type")
    .eq("owner_id", userId)
    .order("created_at");

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, location, business_id")
    .in("business_id", (businesses ?? []).map(b => b.id));

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name, role, branch_id, business_id")
    .in("business_id", (businesses ?? []).map(b => b.id))
    .order("name");

  return {
    businesses: businesses ?? [],
    branches:   branches   ?? [],
    staff:      staffList  ?? [],
  };
}

export async function addBranch(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("branches").insert({
    business_id: formData.get("business_id") as string,
    name:        formData.get("name")        as string,
    location:    formData.get("location")    as string,
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}

export async function inviteStaff(formData: FormData) {
  const supabase = await createClient();
  // In production: send email invite. Here we create a placeholder staff row.
  const { error } = await supabase.from("staff").insert({
    business_id: formData.get("business_id") as string,
    user_id:     formData.get("user_id")     as string,
    name:        formData.get("name")        as string,
    role:        formData.get("role")        as "Cashier",
    branch_id:   (formData.get("branch_id") as string) || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true };
}
