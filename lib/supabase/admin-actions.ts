"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "./admin";
import { requireAdmin }      from "./admin-guard";

/** Grant a paid subscription to a business */
export async function grantSubscription(formData: FormData) {
  await requireAdmin();
  const admin      = createAdminClient();
  const businessId = formData.get("business_id") as string;
  const interval   = formData.get("interval")    as string;
  const months     = Number(formData.get("months"));

  const now    = new Date();
  const endsAt = new Date(now);
  endsAt.setMonth(endsAt.getMonth() + months);

  const { error } = await admin.from("subscriptions").insert({
    business_id:      businessId,
    billing_interval: interval as any,
    status:           "Active"  as const,
    amount_tzs:       0,           // admin grant = free
    provider:         "admin",
    starts_at:        now.toISOString(),
    ends_at:          endsAt.toISOString(),
  } as any);

  if (error) return { error: error.message };

  await admin.from("businesses")
    .update({ trial_ends_at: endsAt.toISOString() } as any)
    .eq("id", businessId);

  revalidatePath("/admin");
  return { success: true };
}

/** Revoke (cancel) all active subscriptions for a business */
export async function revokeSubscription(formData: FormData) {
  await requireAdmin();
  const admin      = createAdminClient();
  const businessId = formData.get("business_id") as string;

  const { error } = await admin
    .from("subscriptions")
    .update({ status: "Canceled" as any })
    .eq("business_id", businessId)
    .eq("status", "Active");

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

/** Extend trial for a user */
export async function extendTrial(formData: FormData) {
  await requireAdmin();
  const admin      = createAdminClient();
  const businessId = formData.get("business_id") as string;
  const days       = Number(formData.get("days") ?? 14);

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + days);

  const { error } = await admin
    .from("businesses")
    .update({ trial_ends_at: endsAt.toISOString() } as any)
    .eq("id", businessId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

/** Delete a user account and all their data */
export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const admin  = createAdminClient();
  const userId = formData.get("user_id") as string;

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}

/** Reset a user's password */
export async function resetUserPassword(formData: FormData) {
  await requireAdmin();
  const admin    = createAdminClient();
  const userId   = formData.get("user_id")  as string;
  const password = formData.get("password") as string;

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  return { success: true };
}
