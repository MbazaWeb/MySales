"use server";

import { revalidatePath } from "next/cache";
import { redirect }        from "next/navigation";
import { createClient }    from "./server";
import { bizDayRange }     from "./tz";

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
    options: {
      data: {
        full_name,
        phone,
        business_name: biz_name,
        business_type: biz_type,
        branch_name: biz_name,
        business_location: biz_loc,
      },
    },
  });
  if (authErr) return { error: authErr.message };

  if (!authData.user) {
    return { error: "Account creation did not return a user. Please try again." };
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    requiresEmailConfirmation: !authData.session,
  };
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

  let { data: biz } = await supabase
    .from("businesses")
    .select("id, name, type")
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (!biz) {
    const { data: membership } = await supabase
      .from("staff")
      .select("business_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (membership) {
      const result = await supabase
        .from("businesses")
        .select("id, name, type")
        .eq("id", membership.business_id)
        .maybeSingle();
      biz = result.data;
    }
  }
  if (!biz) return null;

  const { data: branch } = await supabase
    .from("branches")
    .select("id, name, location")
    .eq("business_id", biz.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
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

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      branch_id: branchId,
      name:      formData.get("name")     as string,
      category:  formData.get("category") as string,
      stock:     Number(formData.get("stock")),
      unit:      formData.get("unit")     as string,
      price:     Number(formData.get("price")),
      reorder:   Number(formData.get("reorder")),
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { success: true as const, product };
}

export async function addStockEntry(formData: FormData) {
  const supabase  = await createClient();
  const productId = formData.get("product_id") as string;
  const qtyAdded  = Number(formData.get("qty"));
  const note      = (formData.get("note") as string) || null;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: "Authentication required." };
  if (!Number.isInteger(qtyAdded) || qtyAdded <= 0) {
    return { error: "Quantity must be a positive whole number." };
  }

  const { error } = await supabase.rpc("add_stock", {
    p_product_id: productId,
    p_quantity: qtyAdded,
    p_note: note,
  });
  if (error) return { error: error.message };

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
  const qty         = Number(formData.get("qty"));
  const payment     = formData.get("payment")       as string;
  const status      = payment === "Credit" ? "Not paid" : "Paid";

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };
  if (!Number.isInteger(qty) || qty <= 0) {
    return { error: "Quantity must be a positive whole number." };
  }

  const { error: saleErr } = await supabase.rpc("record_sale", {
    p_product_id: productId,
    p_qty: qty,
    p_payment: payment,
    p_status: status as "Paid" | "Not paid",
  });
  if (saleErr) return { error: saleErr.message };

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function getReportSales(branchId: string, from: string, to: string) {
  const supabase = await createClient();
  // Bounds are pinned to the business timezone (EAT) so a calendar day in
  // Tanzania is not cut at 21:00 local time by the server's UTC clock.
  const { gte, lte } = bizDayRange(from, to);
  const { data, error } = await supabase
    .from("sales")
    .select("id, product_name, qty, total, status, payment, created_at")
    .eq("branch_id", branchId)
    .gte("created_at", gte)
    .lte("created_at", lte)
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

  // Guard: `.in()` with an empty array is an invalid PostgREST filter.
  if (!businesses || businesses.length === 0) {
    return { businesses: [], branches: [], staff: [] };
  }

  const ids = businesses.map(b => b.id);

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, location, business_id")
    .in("business_id", ids);

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name, role, branch_id, business_id")
    .in("business_id", ids)
    .order("name");

  return {
    businesses,
    branches:   branches   ?? [],
    staff:      staffList  ?? [],
  };
}

export async function addBranch(formData: FormData) {
  const supabase = await createClient();
  const { data: branch, error } = await supabase
    .from("branches")
    .insert({
      business_id: formData.get("business_id") as string,
      name:        formData.get("name")        as string,
      location:    formData.get("location")    as string,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath("/profile");
  return { success: true as const, branch };
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
