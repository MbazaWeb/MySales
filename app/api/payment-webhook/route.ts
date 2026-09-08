import { NextRequest, NextResponse } from "next/server";
import { handleWebhook } from "@/lib/supabase/actions";

export async function POST(req: NextRequest) {
  // Verify Flutterwave webhook signature
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature  = req.headers.get("verif-hash");

  if (secretHash && signature !== secretHash) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = await req.json();
  const result = await handleWebhook(body);

  if (!result.ok) {
    return NextResponse.json({ error: "error" in result ? result.error : "Unhandled" }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}
