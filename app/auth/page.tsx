"use client";
import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/supabase/actions";

export default function Auth() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "var(--background)" }} />}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode]   = useState<"login" | "register">("register");
  const [step, setStep]   = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resendPending, startResendTransition] = useTransition();
  const [otpIdentifier, setOtpIdentifier] = useState<string | null>(null);

  // Register step-1 fields (held in state so step 2 can submit them together)
  const [reg, setReg] = useState({ full_name: "", identifier: "" });
  const [biz, setBiz] = useState({ name: "", type: "Bar", location: "" });

  const displayedError = error ?? searchParams.get("error");

  async function handleRegisterStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("full_name", reg.full_name);
      fd.append("identifier", reg.identifier);
      fd.append("intent", "register");
      fd.append("biz_name",  biz.name);
      fd.append("biz_type",  biz.type);
      fd.append("biz_loc",   biz.location);
      const result = await sendOtp(fd);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("authenticated" in result && result.authenticated) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setResendNote(null);
        setOtpIdentifier(("identifier" in result ? result.identifier : null) ?? reg.identifier);
      }
    });
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("intent", "login");
    startTransition(async () => {
      const result = await sendOtp(fd);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("authenticated" in result && result.authenticated) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setResendNote(null);
        setOtpIdentifier(("identifier" in result ? result.identifier : null) ?? fd.get("identifier") as string);
      }
    });
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("identifier", otpIdentifier ?? "");
    startTransition(async () => {
      const result = await verifyOtp(fd);
      if ("error" in result && result.error) setError(result.error);
      else router.push("/dashboard");
    });
  }

  async function handleResend() {
    if (!otpIdentifier) return;
    setError(null);
    setResendNote(null);
    const fd = new FormData();
    fd.set("identifier", otpIdentifier);
    fd.set("intent", mode);
    if (mode === "register") {
      fd.set("full_name", reg.full_name);
      fd.set("biz_name", biz.name);
      fd.set("biz_type", biz.type);
      fd.set("biz_loc", biz.location);
    }
    startResendTransition(async () => {
      const result = await sendOtp(fd);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("authenticated" in result && result.authenticated) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setResendNote("We sent a new email. Check your inbox and spam folder.");
      }
    });
  }

  return (
    <main
      className="min-h-screen p-4 sm:grid sm:place-items-center"
      style={{ background: "var(--background)" }}
    >
      <div
        className="mx-auto grid w-full max-w-5xl overflow-hidden shadow-2xl lg:grid-cols-[.95fr_1.05fr]"
        style={{ borderRadius: "1.5rem", background: "var(--surface)" }}
      >
        {/* ── Left panel ── */}
        <section
          className="hidden lg:flex lg:flex-col lg:justify-between p-10"
          style={{ background: "var(--navy-900)" }}
        >
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="size-10 object-contain" />
            <span className="text-2xl font-bold text-white tracking-tight">DukaVerse</span>
          </div>

          <div>
            <p
              className="text-[2.4rem] font-bold leading-tight text-white mb-4"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif', letterSpacing: "-0.01em" }}
            >
              Every branch.<br />One clear view.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", maxWidth: "22rem" }}>
              Manage sales, stock, staff and reports across your shops, groceries or bars — from one platform.
            </p>
          </div>

          <div className="space-y-3">
            {["14-day free trial, no card needed", "Up to 5 business branches", "Owner and staff access levels"].map(x => (
              <div key={x} className="flex items-center gap-3">
                <div className="grid size-5 flex-shrink-0 place-items-center rounded-full" style={{ background: "rgba(201,168,76,0.2)" }}>
                  <Check size={12} style={{ color: "var(--gold-500)" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{x}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Right panel ── */}
        <section className="p-7 sm:p-10">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl" style={{ background: "var(--navy-700)" }}>
              <img src="/logo.png" alt="" className="size-7 object-contain" />
            </span>
            <span className="text-xl font-bold">DukaVerse</span>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-lg p-1 gap-1 mb-8" style={{ background: "var(--background)" }}>
            {(["register", "login"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setStep(1); setOtpIdentifier(null); setError(null); setResendNote(null); }}
                className="flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors"
                style={mode === m
                  ? { background: "var(--surface)", color: "var(--navy-700)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
                  : { color: "var(--text-muted)" }}
              >
                {m === "register" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {otpIdentifier ? "Check your email" : mode === "login" ? "Welcome back" : step === 1 ? "Start your free trial" : "Your business details"}
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
            {otpIdentifier ? "Use the email link or enter the six-digit code."
              : mode === "login" ? "Continue managing your businesses."
              : step === 1 ? "14 days free, no credit card required."
              : "Your first branch will be created automatically."}
          </p>

          {/* Error banner */}
          {displayedError && (
            <div className="mb-5 flex items-center gap-3 rounded-lg px-4 py-3"
              style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
              <AlertCircle size={16} style={{ color: "var(--danger)", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "var(--danger)" }}>{displayedError}</p>
            </div>
          )}

          {/* OTP verification */}
          {otpIdentifier && (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full"
                style={{ background: "var(--gold-100)" }}>
                <Check size={24} style={{ color: "var(--gold-500)" }} />
              </div>
              <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
              <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                We sent a sign-in email to
              </p>
              <p className="text-sm font-semibold mb-3">{otpIdentifier}</p>
              <p className="mx-auto mb-6 max-w-sm text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Click the link in the email, or enter the six-digit code if your email includes one.
              </p>
              <form onSubmit={handleVerify} className="space-y-4 text-left">
                <div>
                  <label className="form-label">Verification code</label>
                  <input name="token" inputMode="numeric" autoComplete="one-time-code"
                    pattern="[0-9]{6}" maxLength={6} required className="dv-input text-center tracking-[0.35em]"
                    placeholder="000000" />
                </div>
                <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                  {pending ? <Loader2 size={17} className="animate-spin" /> : "Verify and continue"}
                </button>
              </form>
              {resendNote && (
                <p className="mt-4 text-xs font-medium" style={{ color: "var(--success)" }}>
                  {resendNote}
                </p>
              )}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendPending}
                className="mt-4 w-full text-sm font-semibold text-center"
                style={{ color: "var(--gold-500)" }}>
                {resendPending ? "Sending..." : "Didn't receive it? Resend code"}
              </button>
              <button
                onClick={() => { setOtpIdentifier(null); setError(null); setResendNote(null); }}
                className="mt-3 w-full text-sm text-center" style={{ color: "var(--text-muted)" }}>
                Use a different email or mobile number
              </button>
            </div>
          )}

          {/* ── Register step 1 ── */}
          {mode === "register" && step === 1 && !otpIdentifier && (
            <form onSubmit={e => { e.preventDefault(); setStep(2); }} className="space-y-4">
              <Field label="Full name" placeholder="e.g. David Mbazza"
                value={reg.full_name} onChange={v => setReg(r => ({ ...r, full_name: v }))} />
              <Field label="Email or mobile number" placeholder="you@email.com or +255 7xx xxx xxx"
                value={reg.identifier} onChange={v => setReg(r => ({ ...r, identifier: v }))} />
              <button type="submit" className="btn-gold w-full justify-center py-3">
                Continue <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* ── Register step 2 ── */}
          {mode === "register" && step === 2 && !otpIdentifier && (
            <form onSubmit={handleRegisterStep2} className="space-y-4">
              <Field label="Business name" placeholder="e.g. Safari Corner Bar"
                value={biz.name} onChange={v => setBiz(b => ({ ...b, name: v }))} />
              <div>
                <label className="form-label">Business type</label>
                <select className="dv-select" value={biz.type} onChange={e => setBiz(b => ({ ...b, type: e.target.value }))}>
                  <option>Bar</option>
                  <option>Grocery</option>
                  <option>Mini-market</option>
                  <option>Retail shop</option>
                  <option>Other</option>
                </select>
              </div>
              <Field label="Branch location" placeholder="Town, district or region"
                value={biz.location} onChange={v => setBiz(b => ({ ...b, location: v }))} />
              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending ? <Loader2 size={17} className="animate-spin" /> : "Create account & start trial"}
              </button>
              <button type="button" onClick={() => setStep(1)}
                className="w-full text-sm text-center" style={{ color: "var(--text-muted)" }}>
                ← Back
              </button>
            </form>
          )}

          {/* ── Login ── */}
          {mode === "login" && !otpIdentifier && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="form-label">Email or mobile number</label>
                <input name="identifier" type="text" required className="dv-input"
                  autoComplete={mode === "login" ? "username" : "email"}
                  placeholder="you@email.com or +255 7xx xxx xxx" />
              </div>
              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending ? <Loader2 size={17} className="animate-spin" /> : "Sign in"}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, placeholder, type = "text", value, onChange }: {
  label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input required type={type} placeholder={placeholder} className="dv-input"
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
