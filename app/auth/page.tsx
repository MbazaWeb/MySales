"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/supabase/actions";

type AuthMethod = "email" | "mobile";

export default function Auth() {
  const router = useRouter();
  const [mode, setMode]   = useState<"login" | "register">("register");
  const [step, setStep]   = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [resendPending, startResendTransition] = useTransition();
  const [otpIdentifier, setOtpIdentifier] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");

  // Register step-1 fields (held in state so step 2 can submit them together)
  const [reg, setReg] = useState({ full_name: "", email: "", countryCode: "+255", mobile: "" });
  const [login, setLogin] = useState({ email: "", countryCode: "+255", mobile: "" });
  const [biz, setBiz] = useState({ name: "", type: "Bar", location: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get("error");
    if (callbackError) setError(callbackError);
  }, []);

  function identifierFor(values: { email: string; countryCode: string; mobile: string }) {
    if (authMethod === "email") return values.email.trim();
    return `${values.countryCode}${values.mobile.replace(/\D/g, "")}`;
  }

  const otpIsEmail = otpIdentifier?.includes("@") ?? false;

  async function handleRegisterStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const identifier = identifierFor(reg);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("full_name", reg.full_name);
      fd.append("identifier", identifier);
      fd.append("biz_name",  biz.name);
      fd.append("biz_type",  biz.type);
      fd.append("biz_loc",   biz.location);
      const result = await sendOtp(fd);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setResendNote(null);
        setOtpIdentifier(identifier);
      }
    });
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const identifier = identifierFor(login);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("identifier", identifier);
      const result = await sendOtp(fd);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        setResendNote(null);
        setOtpIdentifier(identifier);
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
      } else {
        setResendNote(otpIsEmail
          ? "We sent a new email. Check your inbox and spam folder."
          : "We sent a new code. Check your mobile messages.");
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
                onClick={() => { setMode(m); setStep(1); setOtpIdentifier(null); setError(null); setResendNote(null); setAuthMethod("email"); }}
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
            {otpIdentifier ? otpIsEmail ? "Check your email" : "Check your mobile" : mode === "login" ? "Welcome back" : step === 1 ? "Start your free trial" : "Your business details"}
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
            {otpIdentifier ? otpIsEmail ? "Use the email link or enter the six-digit code." : "Enter the six-digit code from your SMS."
              : mode === "login" ? "Continue managing your businesses."
              : step === 1 ? "14 days free, no credit card required."
              : "Your first branch will be created automatically."}
          </p>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-lg px-4 py-3"
              style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
              <AlertCircle size={16} style={{ color: "var(--danger)", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
            </div>
          )}

          {/* OTP verification */}
          {otpIdentifier && (
            <div className="text-center py-6">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full"
                style={{ background: "var(--gold-100)" }}>
                <Check size={24} style={{ color: "var(--gold-500)" }} />
              </div>
              <h2 className="text-xl font-bold mb-2">{otpIsEmail ? "Check your inbox" : "Check your messages"}</h2>
              <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
                {otpIsEmail ? "We sent a sign-in email to" : "We sent a six-digit code to"}
              </p>
              <p className="text-sm font-semibold mb-3">{otpIdentifier}</p>
              <p className="mx-auto mb-6 max-w-sm text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {otpIsEmail
                  ? "Click the link in the email, or enter the six-digit code if your email includes one."
                  : "Enter the code from the SMS to continue."}
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
                {resendPending ? "Sending..." : otpIsEmail ? "Didn't receive it? Resend email" : "Didn't receive it? Resend code"}
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
              <AuthMethodSelect value={authMethod} onChange={setAuthMethod} />
              {authMethod === "email" ? (
                <Field label="Email" type="email" placeholder="you@email.com"
                  value={reg.email} onChange={v => setReg(r => ({ ...r, email: v }))} />
              ) : (
                <MobileField
                  countryCode={reg.countryCode}
                  mobile={reg.mobile}
                  onCountryCodeChange={v => setReg(r => ({ ...r, countryCode: v }))}
                  onMobileChange={v => setReg(r => ({ ...r, mobile: v }))}
                />
              )}
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
              <AuthMethodSelect value={authMethod} onChange={setAuthMethod} />
              {authMethod === "email" ? (
                <Field label="Email" type="email" placeholder="you@email.com"
                  value={login.email} onChange={v => setLogin(l => ({ ...l, email: v }))} />
              ) : (
                <MobileField
                  countryCode={login.countryCode}
                  mobile={login.mobile}
                  onCountryCodeChange={v => setLogin(l => ({ ...l, countryCode: v }))}
                  onMobileChange={v => setLogin(l => ({ ...l, mobile: v }))}
                />
              )}
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

function AuthMethodSelect({ value, onChange }: {
  value: AuthMethod; onChange: (value: AuthMethod) => void;
}) {
  return (
    <div>
      <label className="form-label">Choose sign-in method</label>
      <div className="grid grid-cols-2 gap-2">
        {(["email", "mobile"] as const).map(method => (
          <button
            key={method}
            type="button"
            onClick={() => onChange(method)}
            className="rounded-lg border py-2.5 text-sm font-semibold transition-colors"
            style={value === method
              ? { background: "var(--navy-700)", borderColor: "var(--navy-700)", color: "#fff" }
              : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            {method === "email" ? "Email" : "Mobile"}
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileField({ countryCode, mobile, onCountryCodeChange, onMobileChange }: {
  countryCode: string;
  mobile: string;
  onCountryCodeChange: (value: string) => void;
  onMobileChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="form-label">Mobile number</label>
      <div className="grid grid-cols-[5.5rem_1fr] gap-2">
        <input
          aria-label="Country code"
          className="dv-input text-center"
          inputMode="tel"
          pattern="\+[0-9]{1,4}"
          required
          value={countryCode}
          onChange={e => onCountryCodeChange(e.target.value.startsWith("+") ? e.target.value : `+${e.target.value}`)}
        />
        <input
          aria-label="Mobile number"
          className="dv-input"
          inputMode="numeric"
          pattern="[0-9 ]{6,15}"
          placeholder="7xx xxx xxx"
          required
          value={mobile}
          onChange={e => onMobileChange(e.target.value)}
        />
      </div>
    </div>
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
