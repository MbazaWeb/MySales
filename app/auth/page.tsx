"use client";
import { Suspense, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, EyeOff, AlertCircle, Loader2, ChevronLeft } from "lucide-react";
import { signIn, signUp, setSecurityQuestion, getSecurityQuestion, resetPasswordWithAnswer } from "@/lib/supabase/server-actions";
import { REGIONS, getDistricts } from "@/lib/tanzania";

export default function Auth() {
  return (
    <Suspense fallback={<main className="min-h-screen" style={{ background: "var(--background)" }} />}>
      <AuthContent />
    </Suspense>
  );
}

type Mode = "login" | "register" | "forgot";

const SECURITY_QUESTIONS = [
  "What was the name of your first school?",
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is the name of your childhood best friend?",
  "What was the make of your first car?",
  "What street did you grow up on?",
  "What was your childhood nickname?",
];

function AuthContent() {
  const router            = useRouter();
  const [mode, setMode]   = useState<Mode>("login");
  const [step, setStep]   = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start]  = useTransition();

  // Shared
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");

  // Register
  const [fullName, setFullName] = useState("");
  const [biz, setBiz] = useState({ name: "", type: "Bar", region: "", district: "", ward: "" });
  const [secQ, setSecQ] = useState(SECURITY_QUESTIONS[0]);
  const [secA, setSecA] = useState("");

  // Forgot password
  const [fpEmail,    setFpEmail]    = useState("");
  const [fpQuestion, setFpQuestion] = useState<string | null>(null);
  const [fpAnswer,   setFpAnswer]   = useState("");
  const [fpNewPw,    setFpNewPw]    = useState("");
  const [fpStep,     setFpStep]     = useState<"email" | "answer" | "done">("email");

  function resetAll() { setStep(1); setError(null); setPassword(""); setConfirm(""); }
  function switchMode(m: Mode) { setMode(m); resetAll(); }

  // ── Login ──────────────────────────────────────────────────────────────────
  function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!email.trim()) { setError("Enter your email address."); return; }
    if (!password)     { setError("Enter your password."); return; }
    const fd = new FormData();
    fd.append("identifier", email.trim());
    fd.append("password",   password);
    start(async () => {
      const res = await signIn(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      router.push("/dashboard");
    });
  }

  // ── Register step 1 ────────────────────────────────────────────────────────
  function handleStep1(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!fullName.trim())     { setError("Enter your full name."); return; }
    if (!email.trim())        { setError("Enter your email address."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setStep(2);
  }

  // ── Register step 2 ────────────────────────────────────────────────────────
  function handleStep2(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!biz.name.trim()) { setError("Enter your business name."); return; }
    if (!biz.region)      { setError("Select your region."); return; }
    if (!biz.district)    { setError("Select your district."); return; }
    setStep(3);
  }

  // ── Register step 3 — security question + submit ───────────────────────────
  function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!secA.trim()) { setError("Enter your answer to the security question."); return; }
    const fd = new FormData();
    fd.append("full_name",  fullName.trim());
    fd.append("identifier", email.trim());
    fd.append("password",   password);
    fd.append("biz_name",   biz.name.trim());
    fd.append("biz_type",   biz.type);
    const loc = [biz.ward, biz.district, biz.region, "Tanzania"].filter(Boolean).join(", ");
    fd.append("biz_loc", loc);
    start(async () => {
      const res = await signUp(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      const qfd = new FormData();
      qfd.append("question", secQ);
      qfd.append("answer",   secA.trim());
      await setSecurityQuestion(qfd);
      router.push("/dashboard");
    });
  }

  // ── Forgot step 1 ──────────────────────────────────────────────────────────
  function handleFpEmail(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!fpEmail.trim()) { setError("Enter your email address."); return; }
    start(async () => {
      const res = await getSecurityQuestion(fpEmail.trim());
      if ("error" in res) { setError(res.error); return; }
      setFpQuestion((res as any).question ?? null);
      setFpStep("answer");
    });
  }

  // ── Forgot step 2 ──────────────────────────────────────────────────────────
  function handleFpReset(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!fpAnswer.trim())   { setError("Enter your answer."); return; }
    if (fpNewPw.length < 8) { setError("New password must be at least 8 characters."); return; }
    const fd = new FormData();
    fd.append("email",        fpEmail.trim());
    fd.append("answer",       fpAnswer.trim());
    fd.append("new_password", fpNewPw);
    start(async () => {
      const res = await resetPasswordWithAnswer(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      setFpStep("done");
    });
  }

  const steps = ["Account", "Business", "Security"];

  return (
    <main className="min-h-screen p-4 sm:grid sm:place-items-center"
      style={{ background: "var(--background)" }}>
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden shadow-2xl lg:grid-cols-[.95fr_1.05fr]"
        style={{ borderRadius: "1.5rem", background: "var(--surface)" }}>

        {/* ── Left hero ── */}
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

        {/* ── Right form ── */}
        <section className="p-7 sm:p-10">

          {/* Mobile logo */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl"
              style={{ background: "var(--navy-700)" }}>
              <img src="/logo.png" alt="" className="size-7 object-contain" />
            </span>
            <span className="text-xl font-bold">DukaVerse</span>
          </div>

          {/* Mode tabs */}
          {mode !== "forgot" && (
            <div className="flex rounded-lg p-1 gap-1 mb-6"
              style={{ background: "var(--navy-700)" }}>
              {(["login", "register"] as const).map(m => (
                <button key={m} onClick={() => switchMode(m)}
                  className="flex-1 rounded-md py-2.5 text-sm font-semibold transition-all"
                  style={mode === m
                    ? { background: "var(--navy-500)", color: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }
                    : { color: "rgba(255,255,255,0.55)" }}>
                  {m === "login" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>
          )}

          {/* Back for forgot */}
          {mode === "forgot" && (
            <button onClick={() => { switchMode("login"); setFpStep("email"); setFpEmail(""); setFpQuestion(null); setFpAnswer(""); setFpNewPw(""); }}
              className="flex items-center gap-1.5 mb-6 text-sm"
              style={{ color: "var(--text-muted)" }}>
              <ChevronLeft size={16} /> Back to sign in
            </button>
          )}

          {/* Step indicator — register only */}
          {mode === "register" && (
            <div className="flex items-center gap-2 mb-6">
              {steps.map((label, i) => {
                const n = i + 1;
                const done   = step > n;
                const active = step === n;
                return (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="grid size-6 place-items-center rounded-full text-xs font-bold flex-shrink-0"
                        style={{
                          background: done ? "var(--success)" : active ? "var(--navy-700)" : "var(--border)",
                          color: done || active ? "#fff" : "var(--text-muted)",
                        }}>
                        {done ? <Check size={12} /> : n}
                      </div>
                      <span className="text-xs font-medium hidden sm:block"
                        style={{ color: active ? "var(--text-primary)" : "var(--text-muted)" }}>
                        {label}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="h-px flex-1"
                        style={{ background: step > n ? "var(--success)" : "var(--border)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-lg px-4 py-3"
              style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
              <AlertCircle size={16} style={{ color: "var(--danger)", flexShrink: 0 }} />
              <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
            </div>
          )}

          {/* ══ LOGIN ══ */}
          {mode === "login" && (
            <>
              <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                Sign in to your business account.
              </p>
              <form onSubmit={handleLogin} className="space-y-4">
                <TF label="Email address" type="email" placeholder="you@email.com"
                  value={email} onChange={setEmail} />
                <PwF label="Password" value={password} onChange={setPassword}
                  show={showPw} onToggle={() => setShowPw(!showPw)}
                  placeholder="Your password" />
                <button type="submit" disabled={pending}
                  className="btn-gold w-full justify-center py-3">
                  {pending ? <Loader2 size={17} className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
                </button>
                <button type="button" onClick={() => switchMode("forgot")}
                  className="w-full text-sm text-center pt-1"
                  style={{ color: "var(--gold-500)" }}>
                  Forgot password?
                </button>
              </form>
            </>
          )}

          {/* ══ REGISTER STEP 1 — Account ══ */}
          {mode === "register" && step === 1 && (
            <>
              <h1 className="text-2xl font-bold mb-1">Create your account</h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                14 days free, no credit card required.
              </p>
              <form onSubmit={handleStep1} className="space-y-4">
                <TF label="Full name" placeholder="e.g. David Mbazza"
                  value={fullName} onChange={setFullName} />
                <TF label="Email address" type="email" placeholder="you@email.com"
                  value={email} onChange={setEmail} />
                <PwF label="Password" value={password} onChange={setPassword}
                  show={showPw} onToggle={() => setShowPw(!showPw)}
                  placeholder="At least 8 characters" hint="Minimum 8 characters" />
                <PwF label="Confirm password" value={confirm} onChange={setConfirm}
                  show={showPw} onToggle={() => setShowPw(!showPw)}
                  placeholder="Re-enter password" />
                <button type="submit" className="btn-gold w-full justify-center py-3">
                  Continue <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {/* ══ REGISTER STEP 2 — Business ══ */}
          {mode === "register" && step === 2 && (
            <>
              <h1 className="text-2xl font-bold mb-1">Your business</h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                Your first branch will be created automatically.
              </p>
              <form onSubmit={handleStep2} className="space-y-4">
                <TF label="Business name" placeholder="e.g. Safari Corner Bar"
                  value={biz.name} onChange={v => setBiz(b => ({ ...b, name: v }))} />
                <div>
                  <label className="form-label">Business type</label>
                  <select className="dv-select" value={biz.type}
                    onChange={e => setBiz(b => ({ ...b, type: e.target.value }))}>
                    {["Bar","Grocery","Mini-market","Retail shop","Other"].map(t =>
                      <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Region</label>
                  <select required className="dv-select" value={biz.region}
                    onChange={e => setBiz(b => ({ ...b, region: e.target.value, district: "", ward: "" }))}>
                    <option value="">Select region…</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                {biz.region && (
                  <div>
                    <label className="form-label">District</label>
                    <select required className="dv-select" value={biz.district}
                      onChange={e => setBiz(b => ({ ...b, district: e.target.value, ward: "" }))}>
                      <option value="">Select district…</option>
                      {getDistricts(biz.region).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                {biz.district && (
                  <div>
                    <label className="form-label">
                      Ward / Street{" "}
                      <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input className="dv-input" placeholder="e.g. Kariakoo, Msasani…"
                      value={biz.ward} onChange={e => setBiz(b => ({ ...b, ward: e.target.value }))} />
                  </div>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setStep(1); setError(null); }}
                    className="btn-ghost px-6">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button type="submit" className="btn-gold flex-1 justify-center py-3">
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ══ REGISTER STEP 3 — Security question ══ */}
          {mode === "register" && step === 3 && (
            <>
              <h1 className="text-2xl font-bold mb-1">Security question</h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                Used to verify your identity if you forget your password.
                Remember your answer exactly.
              </p>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="form-label">Security question</label>
                  <select className="dv-select" value={secQ}
                    onChange={e => setSecQ(e.target.value)}>
                    {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Your answer</label>
                  <input required className="dv-input" placeholder="Enter your answer"
                    value={secA} onChange={e => setSecA(e.target.value)}
                    autoComplete="off" />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Answer is not case-sensitive. Keep it somewhere safe.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => { setStep(2); setError(null); }}
                    className="btn-ghost px-6">
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button type="submit" disabled={pending}
                    className="btn-gold flex-1 justify-center py-3">
                    {pending
                      ? <Loader2 size={17} className="animate-spin" />
                      : "Create account"}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ══ FORGOT PASSWORD ══ */}
          {mode === "forgot" && (
            <>
              {fpStep === "email" && (
                <>
                  <h1 className="text-2xl font-bold mb-1">Reset password</h1>
                  <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Enter your email — we'll show your security question.
                  </p>
                  <form onSubmit={handleFpEmail} className="space-y-4">
                    <TF label="Email address" type="email" placeholder="you@email.com"
                      value={fpEmail} onChange={setFpEmail} />
                    <button type="submit" disabled={pending}
                      className="btn-gold w-full justify-center py-3">
                      {pending ? <Loader2 size={17} className="animate-spin" /> : <>Continue <ArrowRight size={16} /></>}
                    </button>
                  </form>
                </>
              )}

              {fpStep === "answer" && fpQuestion && (
                <>
                  <h1 className="text-2xl font-bold mb-1">Answer your question</h1>
                  <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Verify your identity to set a new password.
                  </p>
                  <form onSubmit={handleFpReset} className="space-y-4">
                    <div className="rounded-lg px-4 py-3"
                      style={{ background: "var(--gold-100)", border: "1px solid var(--gold-300)" }}>
                      <p className="text-xs font-semibold mb-1"
                        style={{ color: "var(--text-muted)" }}>Security question</p>
                      <p className="text-sm font-medium"
                        style={{ color: "var(--navy-700)" }}>{fpQuestion}</p>
                    </div>
                    <TF label="Your answer" placeholder="Enter your answer"
                      value={fpAnswer} onChange={setFpAnswer} />
                    <PwF label="New password" value={fpNewPw} onChange={setFpNewPw}
                      show={showPw} onToggle={() => setShowPw(!showPw)}
                      placeholder="At least 8 characters" hint="Minimum 8 characters" />
                    <button type="submit" disabled={pending}
                      className="btn-gold w-full justify-center py-3">
                      {pending ? <Loader2 size={17} className="animate-spin" /> : "Set new password"}
                    </button>
                  </form>
                </>
              )}

              {fpStep === "done" && (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full"
                    style={{ background: "var(--success-bg)" }}>
                    <Check size={30} style={{ color: "var(--success)" }} />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Password updated</h2>
                  <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                    Your password has been reset successfully.
                  </p>
                  <button className="btn-gold w-full justify-center py-3"
                    onClick={() => {
                      switchMode("login");
                      setFpStep("email");
                      setFpEmail("");
                      setFpQuestion(null);
                    }}>
                    Sign in now
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

// ── Field components ──────────────────────────────────────────────────────────
function TF({ label, placeholder, type = "text", value, onChange }: {
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

function PwF({ label, placeholder, hint, value, onChange, show, onToggle }: {
  label: string; placeholder: string; hint?: string;
  value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="form-label mb-0">{label}</label>
        <button type="button" onClick={onToggle}
          className="flex items-center gap-1 text-xs"
          style={{ color: "var(--text-muted)" }}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <input required type={show ? "text" : "password"} placeholder={placeholder}
        className="dv-input" value={value} onChange={e => onChange(e.target.value)} />
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}
