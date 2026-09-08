import { NextRequest, NextResponse } from "next/server";
import { handleWebhook } from "@/lib/supabase/actions";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.FLUTTERWAVE_SECRET_KEY) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }
  const { tx_ref, plan, business_id } = await req.json();
  const months = { monthly: 1, quarterly: 3, biannual: 6, yearly: 12 }[plan as string] ?? 1;
  const amounts = { monthly: 15000, quarterly: 40000, biannual: 75000, yearly: 140000 };
  const result = await handleWebhook({
    event: "charge.completed",
    data: {
      tx_ref,
      status:   "successful",
      amount:   amounts[plan as keyof typeof amounts] ?? 15000,
      currency: "TZS",
      meta: { plan, business_id, user_id: "", months },
    },
  });
  return NextResponse.json(result);
}
