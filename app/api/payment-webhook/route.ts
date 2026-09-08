import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackingId  = searchParams.get("OrderTrackingId");
  const merchantRef = searchParams.get("OrderMerchantReference");
  const notifType   = searchParams.get("OrderNotificationType");

  if (!trackingId) {
    return NextResponse.json({ error: "Missing OrderTrackingId" }, { status: 400 });
  }

  try {
    const tokenRes = await fetch("https://pay.pesapal.com/v3/api/Auth/RequestToken", {
      method:  "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        consumer_key:    process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
      }),
    });
    const { token } = await tokenRes.json() as { token: string };

    const statusRes = await fetch(
      `https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
    );
    const txStatus = await statusRes.json() as { payment_status_description?: string; amount?: number };

    if (txStatus.payment_status_description === "Completed") {
      const [, bizPrefix] = (merchantRef ?? "").split("-");
      const admin = createAdminClient();

      const { data: businesses } = await admin
        .from("businesses")
        .select("id")
        .ilike("id", `${bizPrefix}%`)
        .limit(1);

      const businessId = businesses?.[0]?.id;
      if (businessId) {
        const now    = new Date();
        const endsAt = new Date(now);
        endsAt.setMonth(endsAt.getMonth() + 1);

        await (admin
          .from("subscriptions")
          .insert({
            business_id:        businessId,
            billing_interval:   "Monthly" as const,
            status:             "Active"  as const,
            amount_tzs:         Math.round(txStatus.amount ?? 15000),
            provider:           "pesapal",
            provider_reference: trackingId,
            starts_at:          now.toISOString(),
            ends_at:            endsAt.toISOString(),
          } as any)
        );

        await admin
          .from("businesses")
          .update({ trial_ends_at: endsAt.toISOString() })
          .eq("id", businessId);
      }
    }

    return NextResponse.json({
      orderNotificationType:    notifType,
      orderTrackingId:          trackingId,
      orderMerchantReference:   merchantRef,
      status:                   200,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Pesapal IPN error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
