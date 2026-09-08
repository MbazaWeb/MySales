"use client";
import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

function PaymentSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus]   = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [, start]             = useTransition();

  useEffect(() => {
    const txRef      = params.get("tx_ref");
    const status_p   = params.get("status");
    const plan       = params.get("plan");
    const businessId = params.get("business_id");

    // Mock success (dev mode — no Flutterwave key)
    if (params.get("tx_ref")?.startsWith("DUKA-") && plan && businessId) {
      start(async () => {
        // In dev mode we record the subscription directly
        await fetch("/api/payment-success-dev", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tx_ref: txRef, plan, business_id: businessId }),
        });
        setStatus("success");
        setMessage(`Your ${plan} subscription is now active.`);
        setTimeout(() => router.push("/profile"), 3000);
      });
      return;
    }

    if (status_p === "successful" || status_p === "completed") {
      setStatus("success");
      setMessage("Payment received. Your subscription is now active.");
      setTimeout(() => router.push("/profile"), 3000);
    } else if (status_p === "cancelled" || status_p === "failed") {
      setStatus("error");
      setMessage("Payment was not completed. You can try again from your profile.");
    } else {
      setStatus("loading");
      setMessage("Verifying your payment…");
    }
  }, []);

  return (
    <main className="min-h-screen grid place-items-center p-4"
      style={{ background: "var(--background)" }}>
      <div className="dv-card text-center max-w-sm w-full py-12 px-8">
        {status === "loading" && (
          <>
            <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: "var(--gold-500)" }} />
            <h1 className="text-xl font-bold mb-2">Verifying payment…</h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: "var(--success)" }} />
            <h1 className="text-xl font-bold mb-2">Payment successful!</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{message}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Redirecting to your profile…</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle size={48} className="mx-auto mb-4" style={{ color: "var(--danger)" }} />
            <h1 className="text-xl font-bold mb-2">Payment not completed</h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>{message}</p>
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
    <Suspense fallback={<main className="min-h-screen grid place-items-center" style={{ background: "var(--background)" }}><Loader2 size={32} className="animate-spin" style={{ color: "var(--gold-500)" }} /></main>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
