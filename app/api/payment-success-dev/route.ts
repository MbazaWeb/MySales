import { NextRequest, NextResponse } from "next/server";
import { handleWebhook } from "@/lib/supabase/server-actions";

export async function POST(req: NextRequest) {
  // Only allow in dev or when Pesapal keys are not set
  if (process.env.NODE_ENV === "production" && process.env.PESAPAL_CONSUMER_KEY) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const body = await req.json() as { tx_ref: string; plan: string; business_id: string };
  const { tx_ref, plan, business_id } = body;

  const monthsMap: Record<string, number> = { monthly: 1, quarterly: 3, biannual: 6, yearly: 12 };
  const amountsMap: Record<string, number> = { monthly: 15000, quarterly: 40000, biannual: 75000, yearly: 140000 };

  const result = await handleWebhook({
    event: "charge.completed",
    data: {
      tx_ref,
      status:   "successful",
      amount:   amountsMap[plan] ?? 15000,
      currency: "TZS",
      meta: {
        plan,
        business_id,
        user_id: "",
        months:  monthsMap[plan] ?? 1,
      },
    },
  });

  return NextResponse.json(result);
}

