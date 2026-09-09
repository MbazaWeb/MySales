"use server";

import { revalidatePath } from "next/cache";
import { headers }        from "next/headers";
import { redirect }        from "next/navigation";
import { createClient }    from "./server";
import { bizDayRange }     from "./tz";

// ── Auth ──────────────────────────────────────────────────────────────────────

type AuthPhase = "send" | "verify" | "password";

/** Map raw Supabase auth errors to messages a business owner can act on. */
function friendlyAuthError(message: string, code = "", phase: AuthPhase = "password"): string {
  const m = `${code} ${message}`.toLowerCase();
  if (m.includes("rate limit") || m.includes("over_email_send_rate_limit")) {
    return "Too many verification messages were sent from our side. Please wait about an hour and try again - your details are safe.";
  }
  if (m.includes("email_address_invalid") || m.includes("invalid email") || m.includes("email address") && m.includes("invalid")) {
    return "That email address was not accepted. Please double-check it, or try another email provider (e.g. Gmail).";
  }
  if (m.includes("phone") && m.includes("invalid")) {
    return "That mobile number was not accepted. Please include the country code and try again.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (m.includes("email not confirmed")) {
    return "Please confirm your email first - check your inbox for the confirmation link.";
  }
  if (m.includes("invalid login credentials")) {
    return "Wrong email or password. Please try again.";
  }
  if (phase === "send" && (m.includes("signup") && m.includes("disabled"))) {
    return "New account registration is temporarily unavailable. Please contact support.";
  }
  if (phase === "send" && (m.includes("database") || m.includes("saving new user") || m.includes("unexpected_failure"))) {
    return "We could not create your account details. Please try again; if this continues, contact support.";
  }
  if (phase === "send" && (m.includes("sms") || m.includes("email") || m.includes("otp") || m.includes("token"))) {
    return "We could not send the verification message. Check the address or mobile number, then try again.";
  }
  if (phase === "verify" && (m.includes("token") || m.includes("otp") || m.includes("expired"))) {
    return "That verification code was not accepted. Please check the code and try again.";
  }
  return message;
}

function normalizePhone(value: string): string {
  const compact = value.replace(/[\s()-]/g, "");
  if (compact.startsWith("0")) return `+255${compact.slice(1)}`;
  if (compact.startsWith("255")) return `+${compact}`;
  return compact;
}

async function getAuthRedirectTo() {
  const headerStore = await headers();
  const requestOrigin = headerStore.get("origin");
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelOrigin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;
  const origin = requestOrigin ?? configuredOrigin ?? vercelOrigin;

  return origin ? `${origin}/auth/callback?next=/dashboard` : undefined;
}

export async function sendOtp(formData: FormData) {
  const supabase = await createClient();
  const rawIdentifier = (formData.get("identifier") as string | null)?.trim() ?? "";
  const isEmail = rawIdentifier.includes("@");
  const identifier = isEmail ? rawIdentifier.toLowerCase() : normalizePhone(rawIdentifier);
  const isRegistration = formData.get("intent") === "register";

  if (
    !identifier
    || (isEmail && !/^\S+@\S+\.\S+$/.test(identifier))
    || (!isEmail && !/^\+[1-9]\d{7,14}$/.test(identifier))
  ) {
    return { error: "Enter a valid email address or mobile number." };
  }

  const data = {
    full_name: (formData.get("full_name") as string | null)?.trim() ?? "",
    phone: (formData.get("phone") as string | null)?.trim() ?? (isEmail ? "" : identifier),
    business_name: (formData.get("biz_name") as string | null)?.trim() ?? "",
    business_type: (formData.get("biz_type") as string | null)?.trim() ?? "Retail shop",
    branch_name: (formData.get("biz_name") as string | null)?.trim() ?? "",
    business_location: (formData.get("biz_loc") as string | null)?.trim() ?? "",
  };

  const emailRedirectTo = await getAuthRedirectTo();
  const options = {
    data: isRegistration ? data : undefined,
    shouldCreateUser: isRegistration,
    ...(isEmail && emailRedirectTo ? { emailRedirectTo } : {}),
  };
  const credentials = isEmail
    ? { email: identifier, options }
    : { phone: identifier, options };
  const { data: authData, error } = await supabase.auth.signInWithOtp(credentials);

  if (error) {
    console.error("Supabase OTP send failed", { code: error.code, message: error.message, isEmail, isRegistration });
    return { error: friendlyAuthError(error.message, error.code, "send") };
  }
  return {
    success: true,
    identifier,
    // Email auto-confirm can establish a session immediately. The UI must not
    // ask for an OTP in that case because there is nothing left to verify.
    authenticated: Boolean(authData.session),
  };
}

export async function verifyOtp(formData: FormData) {
  const supabase = await createClient();
  const rawIdentifier = (formData.get("identifier") as string | null)?.trim() ?? "";
  const isEmail = rawIdentifier.includes("@");
  const identifier = isEmail ? rawIdentifier.toLowerCase() : normalizePhone(rawIdentifier);
  const token = ((formData.get("token") as string | null) ?? "").replace(/\D/g, "");

  if (!identifier || !/^\d{6}$/.test(token)) {
    return { error: "Enter the six-digit verification code." };
  }

  const { error } = await supabase.auth.verifyOtp(
    isEmail
      ? { email: identifier, token, type: "email" }
      : { phone: identifier, token, type: "sms" },
  );

  if (error) {
    console.error("Supabase OTP verification failed", { code: error.code, message: error.message, isEmail });
    return { error: friendlyAuthError(error.message, error.code, "verify") };
  }
  revalidatePath("/dashboard");
  return { success: true };
}

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
  if (authErr) return { error: friendlyAuthError(authErr.message, authErr.code) };

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
  if (error) return { error: friendlyAuthError(error.message, error.code) };
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
  const supabase    = await createClient();
  const branchId    = formData.get("branch_id")    as string;
  const costPrice   = Number(formData.get("cost_price"));
  const sellingPrice = Number(formData.get("selling_price"));
  const size        = String(formData.get("size") ?? "");

  const { data: product, error } = await supabase.from("products").insert({
    branch_id:     branchId,
    name:          formData.get("name")     as string,
    category:      formData.get("category") as string,
    stock:         Number(formData.get("stock")),
    unit:          formData.get("unit")     as string,
    size:          ["small", "mid", "large"].includes(size) ? size : "",
    cost_price:    costPrice,
    selling_price: sellingPrice,
    price:         sellingPrice,
    reorder:       Number(formData.get("reorder")),
  } as any).select().single();
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
  const supabase      = await createClient();
  const productId     = formData.get("product_id")     as string;
  const qty           = Number(formData.get("qty"));
  const payment       = formData.get("payment")         as string;
  const customerName  = (formData.get("customer_name")  as string) || null;
  const customerPhone = (formData.get("customer_phone") as string) || null;
  const status        = payment === "Credit" ? "Not paid" : "Paid";
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };
  if (!Number.isInteger(qty) || qty <= 0) {
    return { error: "Quantity must be a positive whole number." };
  }

  const { error: saleErr } = await supabase.rpc("record_sale", {
    p_product_id:     productId,
    p_qty:            qty,
    p_payment:        payment,
    p_status:         status as "Paid" | "Not paid",
    p_customer_name:  customerName,
    p_customer_phone: customerPhone,
  } as any);
  if (saleErr) return { error: saleErr.message };

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Sale lifecycle: mark paid / return ─────────────────────────────────────────

/** Mark an unpaid (active) sale as paid. */
export async function markSalePaid(formData: FormData) {
  const supabase = await createClient();
  const saleId   = formData.get("sale_id") as string;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase.rpc("mark_sale_paid", { p_sale_id: saleId } as any);
  if (error) return { error: error.message };

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: true };
}

/** Return a sale — status becomes 'Returned' and the goods go back to inventory. */
export async function returnSale(formData: FormData) {
  const supabase = await createClient();
  const saleId   = formData.get("sale_id") as string;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const { error } = await supabase.rpc("return_sale", { p_sale_id: saleId } as any);
  if (error) return { error: error.message };

  revalidatePath("/sales");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
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
    // profit & cost_price are required for the Faida (profit) figures —
    // omitting them made every report show 0 profit.
    .select("id, product_name, qty, unit_price, cost_price, profit, total, status, payment, created_at")
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

// ── Branch + staff user creation ──────────────────────────────────────────────

export async function addBranchWithStaff(formData: FormData) {
  const { createAdminClient } = await import("./admin");
  const supabase      = await createClient();
  const adminClient   = createAdminClient();

  // Verify caller is authenticated
  const { data: { user: caller } } = await supabase.auth.getUser();
  if (!caller) return { error: "Authentication required." };

  const businessId   = formData.get("business_id")   as string;
  const branchName   = formData.get("branch_name")   as string;
  const location     = formData.get("location")      as string;
  const staffName    = formData.get("staff_name")    as string;
  const staffEmail   = formData.get("staff_email")   as string;
  const staffPass    = formData.get("staff_password") as string;
  const staffRole    = (formData.get("staff_role")   as string) || "Manager";

  // 1. Verify caller owns this business
  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .eq("owner_id", caller.id)
    .single();
  if (!biz) return { error: "Business not found or you do not own it." };

  // 2. Create branch
  const { data: branch, error: branchErr } = await supabase
    .from("branches")
    .insert({ business_id: businessId, name: branchName, location })
    .select()
    .single();
  if (branchErr) return { error: branchErr.message };

  // 3. Create auth user via admin API (bypasses email confirmation)
  const { data: newUser, error: userErr } = await adminClient.auth.admin.createUser({
    email:              staffEmail,
    password:           staffPass,
    email_confirm:      true,       // auto-confirm so they can log in immediately
    user_metadata: {
      full_name:     staffName,
      role:          staffRole,
      branch_id:     branch.id,
      business_id:   businessId,
      business_name: biz.name,
    },
  });
  if (userErr) {
    // Roll back branch
    await supabase.from("branches").delete().eq("id", branch.id);
    return { error: userErr.message };
  }

  // 4. Create staff row linking new user to this branch only
  const { error: staffErr } = await adminClient.from("staff").insert({
    business_id: businessId,
    user_id:     newUser.user.id,
    name:        staffName,
    role:        staffRole as any,
    branch_id:   branch.id,   // scoped to this branch only
  });
  if (staffErr) {
    // Roll back user + branch
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    await supabase.from("branches").delete().eq("id", branch.id);
    return { error: staffErr.message };
  }

  revalidatePath("/profile");
  return {
    success:  true as const,
    branch,
    credentials: {
      name:     staffName,
      email:    staffEmail,
      password: staffPass,
      role:     staffRole,
    },
  };
}

export async function getBusinessDataWithStaff(userId: string) {
  const supabase = await createClient();

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name, type")
    .eq("owner_id", userId)
    .order("created_at");

  if (!businesses || businesses.length === 0) {
    return { businesses: [], branches: [], staff: [] };
  }

  const ids = businesses.map(b => b.id);

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name, location, business_id, is_active")
    .in("business_id", ids)
    .order("created_at");

  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name, role, branch_id, business_id, is_active, user_id")
    .in("business_id", ids)
    .order("name");

  return {
    businesses: businesses ?? [],
    branches:   branches   ?? [],
    staff:      staffList  ?? [],
  };
}

// ── Subscription / payment flow (Pesapal — Tanzania/EAC) ────────────────────

const PLAN_PRICES: Record<string, { amount: number; label: string; months: number }> = {
  monthly:   { amount: 15000,  label: "Monthly",   months: 1  },
  quarterly: { amount: 40000,  label: "3 months",  months: 3  },
  biannual:  { amount: 75000,  label: "6 months",  months: 6  },
  yearly:    { amount: 140000, label: "Yearly",    months: 12 },
};

async function getPesapalToken(): Promise<string> {
  const res = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
    method:  "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key:    process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!data.token) throw new Error(data.message ?? "Pesapal auth failed");
  return data.token;
}

/**
 * Initiates a Pesapal payment session for the selected plan.
 * Returns a redirect_url the client should navigate to.
 * Pesapal supports: M-Pesa TZ, Airtel Money TZ, Tigo Pesa, Halo Pesa, card.
 * Works across Tanzania, Kenya, Uganda, Rwanda, Zambia.
 */
export async function createCheckoutSession(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Authentication required." };

  const planKey    = formData.get("plan") as string;
  const businessId = formData.get("business_id") as string;
  const plan       = PLAN_PRICES[planKey];
  if (!plan) return { error: "Invalid plan selected." };

  const { data: biz } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();
  if (!biz) return { error: "Business not found." };

  const orderRef = `DUKA-${businessId.slice(0, 8).toUpperCase()}-${Date.now()}`;
  const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Dev mode — no Pesapal keys set
  if (!process.env.PESAPAL_CONSUMER_KEY) {
    return {
      redirect_url: `/payment-success?tx_ref=${orderRef}&plan=${planKey}&business_id=${businessId}&status=successful`,
      mock: true,
    };
  }

  try {
    const token = await getPesapalToken();

    // Register IPN (idempotent — safe to call repeatedly)
    const ipnRes = await fetch("https://pay.pesapal.com/v3/api/URLSetup/RegisterIPN", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        url:          `${appUrl}/api/payment-webhook`,
        ipn_notification_type: "GET",
      }),
    });
    const ipnData = await ipnRes.json();
    const ipnId   = ipnData.ipn_id ?? process.env.PESAPAL_IPN_ID;

    // Submit order
    const orderRes = await fetch("https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        id:                 orderRef,
        currency:           "TZS",
        amount:             plan.amount,
        description:        `DukaVerse ${plan.label} — ${biz.name}`,
        callback_url:       `${appUrl}/payment-success`,
        notification_id:    ipnId,
        billing_address: {
          email_address:   user.email,
          first_name:      (user.user_metadata?.full_name as string ?? "").split(" ")[0] || "Customer",
          last_name:       (user.user_metadata?.full_name as string ?? "").split(" ").slice(1).join(" ") || ".",
          country_code:    "TZ",
        },
      }),
    });
    const orderData = await orderRes.json();
    if (!orderData.redirect_url) return { error: orderData.message ?? "Payment initiation failed." };
    return { redirect_url: orderData.redirect_url };
  } catch (err: any) {
    return { error: err.message ?? "Payment service unavailable." };
  }
}

/**
 * Pesapal IPN webhook — called by Pesapal on successful payment.
 */
export async function handleWebhook(body: {
  event:    string;
  data: {
    tx_ref:   string;
    status:   string;
    amount:   number;
    currency: string;
    meta: {
      plan:        string;
      business_id: string;
      user_id:     string;
      months:      number;
    };
  };
}) {
  if (body.event !== "charge.completed") return { ok: false };
  if (body.data.status !== "successful") return { ok: false };

  const { createAdminClient } = await import("./admin");
  const admin = createAdminClient();

  const { plan, business_id, months } = body.data.meta;
  const planInfo = PLAN_PRICES[plan] ?? { label: plan, amount: body.data.amount };

  const now    = new Date();
  const endsAt = new Date(now);
  endsAt.setMonth(endsAt.getMonth() + months);

  const { error } = await admin.from("subscriptions").insert({
    business_id,
    billing_interval: planInfo.label as any,
    status:           "Active" as const,
    amount_tzs:       body.data.amount,
    provider:         "pesapal",
    provider_reference: body.data.tx_ref,
    starts_at:        now.toISOString(),
    ends_at:          endsAt.toISOString(),
  } as any);

  if (error) return { ok: false, error: error.message };

  await admin.from("businesses")
    .update({ trial_ends_at: endsAt.toISOString() } as any)
    .eq("id", business_id);

  revalidatePath("/profile");
  return { ok: true };
}

// ── Product edit / delete ─────────────────────────────────────────────────────

export async function editProduct(formData: FormData) {
  const supabase   = await createClient();
  const productId  = formData.get("product_id")    as string;
  const costPrice  = Number(formData.get("cost_price"));
  const sellPrice  = Number(formData.get("selling_price"));
  const size       = String(formData.get("size") ?? "");

  const { error } = await supabase
    .from("products")
    .update({
      name:          formData.get("name")     as string,
      category:      formData.get("category") as string,
      unit:          formData.get("unit")      as string,
      size:          ["small", "mid", "large"].includes(size) ? size : "",
      cost_price:    costPrice,
      selling_price: sellPrice,
      price:         sellPrice,
      reorder:       Number(formData.get("reorder")),
    } as any)
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { success: true };
}

export async function deleteProduct(formData: FormData) {
  const supabase  = await createClient();
  const productId = formData.get("product_id") as string;

  // Soft-delete: set is_active = false
  const { error } = await supabase
    .from("products")
    .update({ is_active: false } as any)
    .eq("id", productId);

  if (error) return { error: error.message };
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getStockLogs(branchId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_logs")
    .select("id, product_id, branch_id, movement_type, quantity_delta, balance_after, note, created_at")
    .eq("branch_id", branchId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return data ?? [];
}
