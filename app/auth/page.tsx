"use client";
import { Suspense, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/supabase/server-actions";

export default function Auth() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "var(--background)" }} />}>
      <AuthContent />
    </Suspense>
  );
}

type Mode   = "login" | "register";
type Field  = "email" | "mobile";

function AuthContent() {
  const router  = useRouter();
  const [mode,      setMode]      = useState<Mode>("login");
  const [field,     setField]     = useState<Field>("email");
  const [step,      setStep]      = useState(1);
  const [showPw,    setShowPw]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [pending,   start]        = useTransition();

  // Shared identifier fields
  const [email,    setEmail]    = useState("");
  const [cc,       setCc]       = useState("+255");
  const [mobile,   setMobile]   = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");

  // Register-only fields
  const [fullName, setFullName] = useState("");
  const [biz,      setBiz]      = useState({ name: "", type: "Bar", location: "" });

  function identifier() {
    return field === "email" ? email.trim() : `${cc}${mobile.replace(/\D/g, "")}`;
  }

  function switchMode(m: Mode) {
    setMode(m); setStep(1); setError(null);
    setPassword(""); setConfirm("");
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!password) { setError("Enter your password."); return; }
    const fd = new FormData();
    fd.append("identifier", identifier());
    fd.append("password",   password);
    start(async () => {
      const res = await signIn(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      router.push("/dashboard");
    });
  }

  // ── Register step 1 → step 2 ──────────────────────────────────────────────
  function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim())     { setError("Enter your full name."); return; }
    if (!identifier())        { setError("Enter your email or mobile."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setStep(2);
  }

  // ── Register step 2 — submit ───────────────────────────────────────────────
  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!biz.name.trim())     { setError("Enter your business name."); return; }
    if (!biz.location.trim()) { setError("Enter your branch location."); return; }
    const fd = new FormData();
    fd.append("full_name",  fullName.trim());
    fd.append("identifier", identifier());
    fd.append("password",   password);
    fd.append("biz_name",   biz.name.trim());
    fd.append("biz_type",   biz.type);
    fd.append("biz_loc",    biz.location.trim());
    start(async () => {
      const res = await signUp(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      router.push("/dashboard");
    });
  }

  return (
    <main className="min-h-screen p-4 sm:grid sm:place-items-center"
      style={{ background: "var(--background)" }}>
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden shadow-2xl lg:grid-cols-[.95fr_1.05fr]"
        style={{ borderRadius: "1.5rem", background: "var(--surface)" }}>

        {/* ── Left hero panel ── */}
        <section className="hidden lg:flex lg:flex-col lg:justify-between p-10"
          style={{ background: "var(--navy-900)" }}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="size-10 object-contain" />
            <span className="text-2xl font-bold text-white tracking-tight">DukaVerse</span>
          </div>
          <div>
            <p className="text-[2.4rem] font-bold leading-tight text-white mb-4"
              style={{ fontFamily: '"DM Serif Display", Georgia, serif', letterSpacing: "-0.01em" }}>
              Every branch.<br />One clear view.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", maxWidth: "22rem" }}>
              Manage sales, stock, staff and reports across your shops, groceries or bars — from one platform.
            </p>
          </div>
          <div className="space-y-3">
            {["14-day free trial, no card needed", "Up to 5 business branches", "Owner and staff access levels"].map(x => (
              <div key={x} className="flex items-center gap-3">
                <div className="grid size-5 flex-shrink-0 place-items-center rounded-full"
                  style={{ background: "rgba(201,168,76,0.2)" }}>
                  <Check size={12} style={{ color: "var(--gold-500)" }} />
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{x}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Right form panel ── */}
        <section className="p-7 sm:p-10">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl" style={{ background: "var(--navy-700)" }}>
              <img src="/logo.png" alt="" className="size-7 object-contain" />
            </span>
            <span className="text-xl font-bold">DukaVerse</span>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-lg p-1 gap-1 mb-8" style={{ background: "var(--background)" }}>
            {(["login", "register"] as Mode[]).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className="flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors"
                style={mode === m
                  ? { background: "var(--surface)", color: "var(--navy-700)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
                  : { color: "var(--text-muted)" }}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-1">
            {mode === "login" ? "Welcome back"
              : step === 1   ? "Start your free trial"
              : "Your business details"}
          </h1>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>
            {mode === "login" ? "Enter your email or mobile and password."
              : step === 1   ? "14 days free, no credit card required."
              : "Your first branch will be created automatically."}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-lg px-4 py-3"
              style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
              <AlertCircle size={16} style={{ color: "var(--danger)", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
            </div>
          )}

          {/* ── Login form ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <FieldToggle value={field} onChange={f => { setField(f); setEmail(""); setMobile(""); }} />
              {field === "email"
                ? <TextField label="Email address" type="email" placeholder="you@email.com"
                    value={email} onChange={setEmail} />
                : <MobileField cc={cc} mobile={mobile} onCc={setCc} onMobile={setMobile} />}
              <PasswordField label="Password" value={password} onChange={setPassword}
                show={showPw} onToggle={() => setShowPw(!showPw)} placeholder="Your password" />
              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending ? <Loader2 size={17} className="animate-spin" /> : "Sign in"}
              </button>
            </form>
          )}

          {/* ── Register step 1 ── */}
          {mode === "register" && step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <TextField label="Full name" placeholder="e.g. David Mbazza"
                value={fullName} onChange={setFullName} />
              <FieldToggle value={field} onChange={f => { setField(f); setEmail(""); setMobile(""); }} />
              {field === "email"
                ? <TextField label="Email address" type="email" placeholder="you@email.com"
                    value={email} onChange={setEmail} />
                : <MobileField cc={cc} mobile={mobile} onCc={setCc} onMobile={setMobile} />}
              <PasswordField label="Password" value={password} onChange={setPassword}
                show={showPw} onToggle={() => setShowPw(!showPw)}
                placeholder="At least 8 characters" hint="Min 8 characters" />
              <PasswordField label="Confirm password" value={confirm} onChange={setConfirm}
                show={showPw} onToggle={() => setShowPw(!showPw)} placeholder="Re-enter password" />
              <button type="submit" className="btn-gold w-full justify-center py-3">
                Continue <ArrowRight size={17} />
              </button>
            </form>
          )}

          {/* ── Register step 2 ── */}
          {mode === "register" && step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <TextField label="Business name" placeholder="e.g. Safari Corner Bar"
                value={biz.name} onChange={v => setBiz(b => ({ ...b, name: v }))} />
              <div>
                <label className="form-label">Business type</label>
                <select className="dv-select" value={biz.type}
                  onChange={e => setBiz(b => ({ ...b, type: e.target.value }))}>
                  <option>Bar</option>
                  <option>Grocery</option>
                  <option>Mini-market</option>
                  <option>Retail shop</option>
                  <option>Other</option>
                </select>
              </div>
              <TextField label="Branch location" placeholder="Town, district or region"
                value={biz.location} onChange={v => setBiz(b => ({ ...b, location: v }))} />
              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending ? <Loader2 size={17} className="animate-spin" /> : "Create account & start trial"}
              </button>
              <button type="button" onClick={() => { setStep(1); setError(null); }}
                className="w-full text-sm text-center" style={{ color: "var(--text-muted)" }}>
                ← Back
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

// ── Reusable field components ─────────────────────────────────────────────────

function FieldToggle({ value, onChange }: { value: Field; onChange: (v: Field) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(["email", "mobile"] as Field[]).map(f => (
        <button key={f} type="button" onClick={() => onChange(f)}
          className="rounded-lg border py-2.5 text-sm font-semibold transition-colors"
          style={value === f
            ? { background: "var(--navy-700)", borderColor: "var(--navy-700)", color: "#fff" }
            : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
          {f === "email" ? "📧 Email" : "📱 Mobile"}
        </button>
      ))}
    </div>
  );
}

function TextField({ label, placeholder, type = "text", value, onChange }: {
  label: string; placeholder: string; type?: string;
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <input required type={type} placeholder={placeholder} className="dv-input"
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function PasswordField({ label, placeholder, hint, value, onChange, show, onToggle }: {
  label: string; placeholder: string; hint?: string;
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="form-label mb-0">{label}</label>
        <button type="button" onClick={onToggle}
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: "var(--text-muted)" }}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <input required type={show ? "text" : "password"} placeholder={placeholder}
        minLength={label.toLowerCase().includes("confirm") ? undefined : 8}
        className="dv-input" value={value} onChange={e => onChange(e.target.value)} />
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

function MobileField({ cc, mobile, onCc, onMobile }: {
  cc: string; mobile: string;
  onCc: (v: string) => void; onMobile: (v: string) => void;
}) {
  return (
    <div>
      <label className="form-label">Mobile number</label>
      <div className="grid grid-cols-[5.5rem_1fr] gap-2">
        <input required aria-label="Country code" className="dv-input text-center"
          inputMode="tel" placeholder="+255" value={cc}
          onChange={e => onCc(e.target.value.startsWith("+") ? e.target.value : `+${e.target.value}`)} />
        <input required aria-label="Mobile number" className="dv-input"
          inputMode="numeric" placeholder="7xx xxx xxx" value={mobile}
          onChange={e => onMobile(e.target.value)} />
      </div>
    </div>
  );
}
