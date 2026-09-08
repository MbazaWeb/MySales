"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";

function PaymentSuccessContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const [status, setStatus]   = useState<"verifying" | "success" | "failed" | "cancelled">("verifying");
  const [plan,   setPlan]     = useState("");

  useEffect(() => {
    // Pesapal redirect params
    const trackingId = params.get("OrderTrackingId");
    const txRef      = params.get("tx_ref");
    const planKey    = params.get("plan") ?? "monthly";
    const businessId = params.get("business_id");
    const mockStatus = params.get("status");

    setPlan({ monthly: "Monthly", quarterly: "3-month", biannual: "6-month", yearly: "Yearly" }[planKey] ?? planKey);

    // Dev mode mock
    if (mockStatus === "successful" && txRef?.startsWith("DUKA-")) {
      fetch("/api/payment-success-dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tx_ref: txRef, plan: planKey, business_id: businessId }),
      }).then(() => {
        setStatus("success");
        setTimeout(() => router.push("/profile"), 3500);
      });
      return;
    }

    // Real Pesapal — IPN already handled server-side; just show result
    if (trackingId) {
      setStatus("success");
      setTimeout(() => router.push("/profile"), 3500);
      return;
    }

    // Cancelled or unknown
    setStatus("cancelled");
  }, []);

  return (
    <main className="min-h-dvh grid place-items-center p-4" style={{ background: "var(--background)" }}>
      <div className="dv-card text-center w-full max-w-sm py-12 px-8">

        {status === "verifying" && (
          <>
            <Loader2 size={44} className="animate-spin mx-auto mb-5" style={{ color: "var(--gold-500)" }} />
            <h1 className="text-xl font-bold mb-2">Verifying payment</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Just a moment…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full"
              style={{ background: "var(--success-bg)" }}>
              <CheckCircle2 size={36} style={{ color: "var(--success)" }} />
            </div>
            <h1 className="text-xl font-bold mb-2">Payment successful!</h1>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              Your {plan} subscription is now active.
            </p>
            <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
              You can now use all DukaVerse features across your branches.
            </p>
            <div className="rounded-lg px-4 py-3 mb-6"
              style={{ background: "var(--success-bg)", border: "1px solid #BBF7D0" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                Redirecting to your profile…
              </p>
            </div>
            <button className="btn-gold w-full justify-center py-3" onClick={() => router.push("/profile")}>
              Go to profile <ArrowRight size={16} />
            </button>
          </>
        )}

        {(status === "failed" || status === "cancelled") && (
          <>
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full"
              style={{ background: "var(--danger-bg)" }}>
              <XCircle size={36} style={{ color: "var(--danger)" }} />
            </div>
            <h1 className="text-xl font-bold mb-2">
              {status === "cancelled" ? "Payment cancelled" : "Payment failed"}
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              {status === "cancelled"
                ? "You cancelled the payment. You can try again from your profile."
                : "Something went wrong. Please try again or contact support."}
            </p>
            <button className="btn-gold w-full justify-center py-3" onClick={() => router.push("/profile")}>
              Back to profile
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-dvh grid place-items-center" style={{ background: "var(--background)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--gold-500)" }} />
      </main>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
