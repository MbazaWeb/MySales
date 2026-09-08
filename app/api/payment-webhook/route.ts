import { NextRequest, NextResponse } from "next/server";

/**
 * Pesapal IPN — GET request with orderTrackingId and orderMerchantReference.
 * Verify the transaction then activate the subscription.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get("OrderTrackingId");
  const merchantRef = searchParams.get("OrderMerchantReference");
  const notifType = searchParams.get("OrderNotificationType");

  if (!trackingId) {
    return NextResponse.json({ error: "Missing OrderTrackingId" }, { status: 400 });
  }

  try {
    // Get Pesapal token
    const tokenRes = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        consumer_key:    process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
      }),
    });
    const { token } = await tokenRes.json();

    // Get transaction status
    const statusRes = await fetch(
      `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
    );
    const status = await statusRes.json();

    if (status.payment_status_description === "Completed") {
      // Parse plan info from merchant reference: DUKA-{BIZ_ID}-{TIMESTAMP}
      const [, bizPrefix] = (merchantRef ?? "").split("-");

      const { createClient } = await import("@/lib/supabase/server");
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const admin = createAdminClient();

      // Find business by prefix
      const { data: businesses } = await admin
        .from("businesses")
        .select("id")
        .ilike("id", `${bizPrefix}%`)
        .limit(1);

      const businessId = businesses?.[0]?.id;
      if (businessId) {
        const now    = new Date();
        const endsAt = new Date(now);
        endsAt.setMonth(endsAt.getMonth() + 1); // default 1 month; amount-based logic can refine

        await admin.from("subscriptions").insert({
          business_id:        businessId,
          billing_interval:   "Monthly",
          status:             "Active",
          amount_tzs:         Math.round((status.amount ?? 15000)),
          provider:           "pesapal",
          provider_reference: trackingId,
          starts_at:          now.toISOString(),
          ends_at:            endsAt.toISOString(),
        }).onConflict("provider_reference" as any).ignore();

        await admin.from("businesses")
          .update({ trial_ends_at: endsAt.toISOString() })
          .eq("id", businessId);
      }
    }

    // Pesapal expects a specific response format
    return NextResponse.json({ orderNotificationType: notifType, orderTrackingId: trackingId, orderMerchantReference: merchantRef, status: 200 });
  } catch (err: any) {
    console.error("Pesapal IPN error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
