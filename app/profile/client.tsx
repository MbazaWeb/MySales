"use client";
import { useState, useTransition } from "react";
import { REGIONS, getDistricts } from "@/lib/tanzania";
import {
  Bell, Building2, Check, Crown, Mail, Eye, EyeOff,
  MessageSquareText, Plus, ShieldCheck, UserPlus, X, Loader2,
  AlertCircle, Copy, CheckCheck, KeyRound, Shield,
} from "lucide-react";
import { addBranchWithStaff, signOut, initiateSTKPush, checkPaymentStatus, activateSubscriptionAfterPayment } from "@/lib/supabase/server-actions";
import type { User } from "@supabase/supabase-js";

type Business = { id: string; name: string; type: string };
type Branch   = { id: string; name: string; location: string; business_id: string; is_active?: boolean };
type StaffRow = { id: string; name: string; role: string; branch_id: string | null; business_id: string; is_active?: boolean; user_id: string };

type NewCredentials = { name: string; email: string; password: string; role: string };

const ROLES = ["Manager", "Cashier", "Stock keeper"] as const;

function genPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}



export default function ProfileClient({
  user, businesses, branches: initialBranches, staff: initialStaff,
  trialEndsAt, subscription,
}: {
  user:         User;
  businesses:   Business[];
  branches:     Branch[];
  staff:        StaffRow[];
  trialEndsAt:  string | null;
  subscription: Record<string,any> | null;
}) {
  const fullName = (user.user_metadata?.full_name as string) ?? "—";
  const email    = user.email ?? "—";
  const initials = fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  // State
  const [branches, setBranches]       = useState<Branch[]>(initialBranches);
  const [staff, setStaff]             = useState<StaffRow[]>(initialStaff);
  const [showModal, setShowModal]     = useState(false);
  const [credentials, setCredentials] = useState<NewCredentials | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [pending, start]              = useTransition();
  const [signOutPending, startSO]     = useTransition();
  const [showPass, setShowPass]       = useState(false);
  const [copied, setCopied]           = useState<string | null>(null);

  // New branch form state
  const [form, setForm] = useState({
    business_id:    businesses[0]?.id ?? "",
    branch_name:    "",
    location:       "",
    staff_name:     "",
    staff_email:    "",
    staff_password: genPassword(),
    staff_role:     "Manager" as typeof ROLES[number],
  });

  const bizMap = Object.fromEntries(businesses.map(b => [b.id, b]));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    start(async () => {
      const res = await addBranchWithStaff(fd);
      if ("error" in res) { setError(res.error ?? null); return; }
      // Optimistic update
      setBranches(bs => [...bs, res.branch as Branch]);
      setShowModal(false);
      setCredentials((res as any).credentials);
      setForm(f => ({ ...f, branch_name: "", location: "", staff_name: "", staff_email: "", staff_password: genPassword() }));
    });
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function getBranchStaff(branchId: string) {
    return staff.filter(s => s.branch_id === branchId && s.user_id !== user.id);
  }

  return (
    <>
      {/* Owner hero */}
      <section className="rounded-xl p-5 sm:p-6 mb-6" style={{ background: "var(--navy-700)" }}>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-full text-xl font-black"
              style={{ background: "var(--gold-500)", color: "var(--navy-900)" }}>
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{fullName}</h2>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>Owner · {email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg px-4 py-3"
              style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.25)" }}>
              <b className="block text-sm font-semibold" style={{ color: "var(--gold-500)" }}>Free trial</b>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Active</span>
            </div>
            <button onClick={() => startSO(async () => { await signOut(); })} disabled={signOutPending}
              className="rounded-lg px-4 py-3 text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
              {signOutPending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </section>

      {/* ── New credentials toast ── */}
      {credentials && (
        <div className="mb-6 rounded-xl p-5"
          style={{ background: "var(--success-bg)", border: "2px solid #86EFAC" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <KeyRound size={18} style={{ color: "var(--success)" }} />
              <h3 className="font-semibold" style={{ color: "var(--success)" }}>
                Branch account created — save these credentials now
              </h3>
            </div>
            <button onClick={() => setCredentials(null)} style={{ color: "var(--text-muted)" }}>
              <X size={16} />
            </button>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            This password will not be shown again. Share it securely with your staff member.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { label: "Name",     value: credentials.name,     key: "name" },
              { label: "Role",     value: credentials.role,     key: "role" },
              { label: "Email",    value: credentials.email,    key: "email" },
              { label: "Password", value: credentials.password, key: "pass" },
            ].map(f => (
              <div key={f.key} className="flex items-center justify-between rounded-lg px-3 py-2.5"
                style={{ background: "white", border: "1px solid #BBF7D0" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{f.label}</p>
                  <p className="font-semibold text-sm font-mono">{f.value}</p>
                </div>
                <button onClick={() => copyText(f.value, f.key)}
                  className="ml-2 shrink-0 p-1.5 rounded-lg"
                  style={{ background: "var(--success-bg)", color: "var(--success)" }}>
                  {copied === f.key ? <CheckCheck size={15} /> : <Copy size={15} />}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              const text = `DukaVerse Login\nURL: ${window.location.origin}/auth\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nRole: ${credentials.role}`;
              copyText(text, "all");
            }}
            className="btn-gold mt-4 w-full justify-center py-2.5 text-sm">
            {copied === "all" ? <><CheckCheck size={15} /> Copied!</> : <><Copy size={15} /> Copy all credentials</>}
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr]">
        <div className="space-y-6">

          {/* ── Branches ── */}
          <section className="dv-card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold">Branches & staff accounts</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {branches.length} of 5 branches · each with its own login
                </p>
              </div>
              {branches.length < 5 && (
                <button className="btn-gold" onClick={() => { setShowModal(true); setError(null); }}>
                  <Plus size={15} /> Add branch
                </button>
              )}
            </div>

            {branches.length === 0 ? (
              <div className="text-center py-8"
                style={{ border: "2px dashed var(--border)", borderRadius: "0.75rem" }}>
                <Building2 size={28} style={{ color: "var(--text-muted)", margin: "0 auto 0.75rem" }} />
                <p className="font-medium text-sm">No branches yet</p>
                <p className="text-xs mt-1 mb-4" style={{ color: "var(--text-muted)" }}>
                  Add a branch and create a login for your staff
                </p>
                <button className="btn-gold" onClick={() => { setShowModal(true); setError(null); }}>
                  <Plus size={15} /> Add first branch
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {branches.map(b => {
                  const branchStaff = getBranchStaff(b.id);
                  return (
                    <div key={b.id} className="rounded-xl overflow-hidden"
                      style={{ border: "1px solid var(--border)" }}>
                      {/* Branch header */}
                      <div className="flex items-center gap-3 px-4 py-3"
                        style={{ background: "var(--navy-900)" }}>
                        <div className="grid size-8 place-items-center rounded-lg"
                          style={{ background: "rgba(201,168,76,0.2)" }}>
                          <Building2 size={15} style={{ color: "var(--gold-500)" }} />
                        </div>
                        <div className="flex-1">
                          <b className="block text-sm font-semibold text-white">{b.name}</b>
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            {b.location} · {bizMap[b.business_id]?.name}
                          </span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold-500)" }}>
                          {branchStaff.length} staff
                        </span>
                      </div>

                      {/* Staff accounts */}
                      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                        {branchStaff.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-center" style={{ color: "var(--text-muted)" }}>
                            No staff account for this branch yet.
                          </p>
                        ) : (
                          branchStaff.map(s => (
                            <div key={s.id} className="flex items-center justify-between px-4 py-3 gap-3">
                              <div className="flex items-center gap-3">
                                <div className="grid size-8 place-items-center rounded-full text-xs font-bold"
                                  style={{ background: "var(--gold-100)", color: "var(--navy-700)" }}>
                                  {s.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <b className="block text-sm">{s.name}</b>
                                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.role}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.is_active ? "badge-ok" : "badge-err"}`}>
                                  {s.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Owner access summary */}
          <section className="dv-card">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} style={{ color: "var(--gold-500)" }} />
              <h2 className="font-semibold">Your access</h2>
            </div>
            <div className="flex items-center gap-3 rounded-lg px-3 py-3"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="grid size-9 place-items-center rounded-full font-bold text-sm"
                style={{ background: "var(--navy-700)", color: "var(--gold-500)" }}>
                {initials}
              </div>
              <div className="flex-1">
                <b className="block text-sm">{fullName}</b>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{email}</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "var(--gold-100)", color: "var(--navy-700)" }}>
                Owner · All branches
              </span>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Alerts */}
          <section className="dv-card">
            <h2 className="flex items-center gap-2 font-semibold mb-4">
              <Bell size={17} style={{ color: "var(--gold-500)" }} />
              Alerts & summaries
            </h2>
            <div className="space-y-2">
              {[
                { icon: Mail,              label: "Email alerts",  sub: "Low stock & daily report" },
                { icon: MessageSquareText, label: "SMS alerts",    sub: "Urgent low-stock warnings" },
                { icon: ShieldCheck,       label: "Owner summary", sub: "Revenue across branches" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 rounded-lg px-3 py-3"
                  style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                  <item.icon size={17} style={{ color: "var(--gold-500)" }} />
                  <div className="flex-1">
                    <b className="block text-sm">{item.label}</b>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.sub}</span>
                  </div>
                  <div className="relative h-5 w-9 rounded-full" style={{ background: "var(--navy-700)" }}>
                    <div className="absolute top-0.5 right-0.5 size-4 rounded-full bg-white" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Plans */}
          <SubscriptionPlans businesses={businesses} trialEndsAt={trialEndsAt} subscription={subscription} />
        </div>
      </div>

      {/* ── Add branch + staff modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-sheet overflow-y-auto"
            style={{ maxWidth: "34rem", maxHeight: "92dvh" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold">Add branch</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Creates the branch and a staff login account in one step
                </p>
              </div>
              <button className="btn-ghost px-2 py-2" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
                <AlertCircle size={15} style={{ color: "var(--danger)", flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── Branch details ── */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3"
                  style={{ color: "var(--gold-500)" }}>Branch details</p>
                <div className="space-y-3">
                  {businesses.length > 1 && (
                    <div>
                      <label className="form-label">Business</label>
                      <select className="dv-select" value={form.business_id}
                        onChange={e => setForm(f => ({ ...f, business_id: e.target.value }))}>
                        {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Branch name</label>
                      <input required className="dv-input" placeholder="e.g. Mlandege Grocery"
                        value={form.branch_name}
                        onChange={e => setForm(f => ({ ...f, branch_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Location</label>
                      <input required className="dv-input" placeholder="Town or area"
                        value={form.location}
                        onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </div>

              <hr style={{ borderColor: "var(--border)" }} />

              {/* ── Staff account ── */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1"
                  style={{ color: "var(--gold-500)" }}>Staff login account</p>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  A Supabase auth account will be created. This person can log in at <b>/auth</b> and will only see this branch.
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Staff name</label>
                      <input required className="dv-input" placeholder="Full name"
                        value={form.staff_name}
                        onChange={e => setForm(f => ({ ...f, staff_name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Role</label>
                      <select className="dv-select" value={form.staff_role}
                        onChange={e => setForm(f => ({ ...f, staff_role: e.target.value as any }))}>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Login email</label>
                    <input required type="email" className="dv-input" placeholder="staff@email.com"
                      value={form.staff_email}
                      onChange={e => setForm(f => ({ ...f, staff_email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label flex items-center justify-between">
                      <span>Login password</span>
                      <button type="button"
                        className="text-xs font-semibold"
                        style={{ color: "var(--gold-500)" }}
                        onClick={() => setForm(f => ({ ...f, staff_password: genPassword() }))}>
                        ↻ Regenerate
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        required
                        type={showPass ? "text" : "password"}
                        className="dv-input pr-24"
                        value={form.staff_password}
                        onChange={e => setForm(f => ({ ...f, staff_password: e.target.value }))}
                      />
                      <div className="absolute right-1 top-1 flex gap-1">
                        <button type="button"
                          className="px-2 py-1.5 rounded text-xs"
                          style={{ color: "var(--text-muted)" }}
                          onClick={() => setShowPass(!showPass)}>
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button type="button"
                          className="px-2 py-1.5 rounded text-xs font-medium"
                          style={{ color: "var(--gold-500)" }}
                          onClick={() => copyText(form.staff_password, "modal-pass")}>
                          {copied === "modal-pass" ? <CheckCheck size={15} /> : <Copy size={15} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Share this with the staff member — they can change it after logging in.
                    </p>
                  </div>
                </div>
              </div>

              {/* Role permissions info */}
              <div className="rounded-lg px-4 py-3 space-y-2"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  What can a <span style={{ color: "var(--navy-700)" }}>{form.staff_role}</span> do?
                </p>
                {form.staff_role === "Manager" && (
                  <ul className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
                    <li>· Record sales</li>
                    <li>· Add and update inventory</li>
                    <li>· View branch reports</li>
                    <li>✕ Cannot see other branches</li>
                    <li>✕ Cannot manage staff</li>
                  </ul>
                )}
                {form.staff_role === "Cashier" && (
                  <ul className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
                    <li>· Record sales</li>
                    <li>· View inventory levels</li>
                    <li>✕ Cannot add or edit products</li>
                    <li>✕ Cannot see other branches</li>
                  </ul>
                )}
                {form.staff_role === "Stock keeper" && (
                  <ul className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
                    <li>· Add and update inventory</li>
                    <li>· View stock levels</li>
                    <li>✕ Cannot record sales</li>
                    <li>✕ Cannot see other branches</li>
                  </ul>
                )}
              </div>

              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending
                  ? <><Loader2 size={17} className="animate-spin" /> Creating branch & account…</>
                  : <><UserPlus size={17} /> Create branch & staff account</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}



// ── Subscription Plans — full in-app checkout flow ────────────────────────────

const PLANS = [
  { key: "monthly",   period: "Monthly",   price: "TZS 15,000",  amount: 15000,  note: "per month",  months: 1,  best: false },
  { key: "quarterly", period: "3 months",  price: "TZS 40,000",  amount: 40000,  note: "save 11%",   months: 3,  best: false },
  { key: "biannual",  period: "6 months",  price: "TZS 75,000",  amount: 75000,  note: "save 17%",   months: 6,  best: false },
  { key: "yearly",    period: "Yearly",    price: "TZS 140,000", amount: 140000, note: "best value", months: 12, best: true  },
];

const OPERATORS = [
  { name: "M-Pesa",       color: "#00A651", prefix: ["065","067","068","077","078"] },
  { name: "Airtel Money", color: "#ED1C24", prefix: ["068","069","078","079"]       },
  { name: "Tigo Pesa",    color: "#00AEEF", prefix: ["071","072","073","074"]       },
  { name: "Halo Pesa",    color: "#F7941D", prefix: ["062","061"]                   },
];

type CheckoutStep = "plan" | "operator" | "summary" | "waiting" | "success" | "failed";

type PushResult = {
  mock: boolean; ref: string; phone: string; operator: string;
  plan: string; amount: number; businessId: string; planKey: string;
  trackingId?: string; message?: string;
};

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }

function SubscriptionPlans({
  businesses, trialEndsAt, subscription,
}: {
  businesses:   Business[];
  trialEndsAt:  string | null;
  subscription: Record<string, any> | null;
}) {
  const now          = new Date();
  const trialEnd     = trialEndsAt ? new Date(trialEndsAt) : null;
  const trialDays    = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000) : 0;
  const trialActive  = trialDays > 0;
  const isSubscribed = !!subscription;

  const [step,      setStep]      = useState<CheckoutStep>("plan");
  const [bizId,     setBizId]     = useState(businesses[0]?.id ?? "");
  const [selPlan,   setSelPlan]   = useState<string | null>(null);
  const [selOp,     setSelOp]     = useState<string | null>(null);
  const [phone,     setPhone]     = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [pending,   start]        = useTransition();
  const [pushData,  setPushData]  = useState<PushResult | null>(null);
  const [countdown, setCountdown] = useState(120);
  const [polling,   setPolling]   = useState(false);

  const plan = PLANS.find(p => p.key === selPlan);
  const op   = OPERATORS.find(o => o.name === selOp);

  // Start countdown + polling when in waiting step
  const startPolling = (data: PushResult) => {
    setCountdown(120);
    setPolling(true);
    let secs = 120;

    const timer = setInterval(() => {
      secs--;
      setCountdown(secs);
      if (secs <= 0) {
        clearInterval(timer);
        setPolling(false);
        setStep("failed");
      }
    }, 1000);

    // Poll every 5s for real; mock completes after 4s
    if (data.mock) {
      setTimeout(async () => {
        clearInterval(timer);
        setPolling(false);
        // Activate subscription in dev mode
        const fd = new FormData();
        fd.append("business_id", data.businessId);
        fd.append("plan",        data.planKey);
        fd.append("ref",         data.ref);
        start(async () => {
          await activateSubscriptionAfterPayment(fd);
          setStep("success");
        });
      }, 4000);
      return;
    }

    // Real polling
    if (!data.trackingId) return;
    const poller = setInterval(async () => {
      const status = await checkPaymentStatus(data.trackingId!);
      if (status.status === "completed") {
        clearInterval(poller);
        clearInterval(timer);
        setPolling(false);
        const fd = new FormData();
        fd.append("business_id", data.businessId);
        fd.append("plan",        data.planKey);
        fd.append("ref",         data.ref);
        start(async () => {
          await activateSubscriptionAfterPayment(fd);
          setStep("success");
        });
      } else if (status.status === "failed") {
        clearInterval(poller);
        clearInterval(timer);
        setPolling(false);
        setStep("failed");
      }
    }, 5000);
  };

  function handleSendPush() {
    if (!selPlan || !selOp || !phone.trim() || !bizId) return;
    setError(null);
    const fd = new FormData();
    fd.append("plan",        selPlan);
    fd.append("business_id", bizId);
    fd.append("operator",    selOp);
    fd.append("phone",       phone.trim());
    start(async () => {
      const res = await initiateSTKPush(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      const data = res as PushResult;
      setPushData(data);
      setStep("waiting");
      startPolling(data);
    });
  }

  const mm = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;

  return (
    <section className="dv-card">
      <h2 className="flex items-center gap-2 font-semibold mb-4">
        <Crown size={17} style={{ color: "var(--gold-500)" }} />
        Subscription
      </h2>

      {/* ── Status banner ── */}
      {isSubscribed && step === "plan" && (
        <div className="mb-5 rounded-xl px-4 py-4"
          style={{ background: "var(--success-bg)", border: "1px solid #BBF7D0" }}>
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--success)" }}>Active subscription</p>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{subscription!.billing_interval}</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{money(subscription!.amount_tzs)} · {subscription!.provider}</p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Expires</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {new Date(subscription!.ends_at).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--success)" }}>
                {Math.ceil((new Date(subscription!.ends_at).getTime() - now.getTime()) / 86400000)} days left
              </p>
            </div>
          </div>
        </div>
      )}
      {!isSubscribed && step === "plan" && (
        <div className="mb-5 rounded-xl px-4 py-3"
          style={{
            background: trialDays <= 3 ? "var(--danger-bg)" : trialActive ? "var(--warning-bg)" : "var(--danger-bg)",
            border: `1px solid ${trialDays <= 3 || !trialActive ? "#FECACA" : "#FDE68A"}`,
          }}>
          <p className="text-xs font-semibold" style={{ color: trialActive && trialDays > 3 ? "var(--warning)" : "var(--danger)" }}>
            {trialActive ? `Free trial — ${trialDays} day${trialDays === 1 ? "" : "s"} remaining` : "Trial expired"}
          </p>
          <p className="text-xs mt-1" style={{ color: trialActive && trialDays > 3 ? "var(--warning)" : "var(--danger)" }}>
            {trialActive ? "Subscribe before your trial ends to keep all features." : "Subscribe now to restore full access."}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5"
          style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
          <AlertCircle size={14} style={{ color: "var(--danger)", flexShrink: 0 }} />
          <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
        </div>
      )}

      {/* ══ STEP 1 — Select plan ══ */}
      {step === "plan" && (
        <>
          {businesses.length > 1 && (
            <div className="mb-4">
              <label className="form-label">Business</label>
              <select className="dv-select" value={bizId} onChange={e => setBizId(e.target.value)}>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <p className="form-label mb-3">{isSubscribed ? "Renew or upgrade" : "Choose a plan"}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {PLANS.map(p => {
              const isSel = selPlan === p.key;
              return (
                <button key={p.key} type="button" onClick={() => setSelPlan(p.key)}
                  className="rounded-xl p-3.5 text-left transition-all"
                  style={{
                    border:     isSel ? "2px solid var(--navy-700)" : p.best ? "2px solid var(--gold-500)" : "1px solid var(--border)",
                    background: isSel ? "var(--navy-700)" : p.best ? "var(--gold-100)" : "var(--surface)",
                  }}>
                  <b className="block text-xs font-semibold"
                    style={{ color: isSel ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}>
                    {p.period}
                  </b>
                  <strong className="mt-1.5 block text-base font-bold"
                    style={{ color: isSel ? "#fff" : "var(--text-primary)" }}>
                    {p.price}
                  </strong>
                  <span className="text-xs"
                    style={{ color: isSel ? "rgba(255,255,255,0.5)" : p.best ? "var(--gold-500)" : "var(--text-muted)" }}>
                    {p.note}
                  </span>
                  {isSel && <span className="mt-1.5 flex items-center gap-1 text-xs font-bold text-white"><Check size={11} /> Selected</span>}
                </button>
              );
            })}
          </div>
          <button className="btn-gold w-full justify-center py-3"
            disabled={!selPlan}
            style={!selPlan ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            onClick={() => { if (selPlan) setStep("operator"); }}>
            Continue — select payment method
          </button>
        </>
      )}

      {/* ══ STEP 2 — Select operator + phone ══ */}
      {step === "operator" && (
        <>
          <button className="flex items-center gap-1.5 text-xs mb-5"
            style={{ color: "var(--text-muted)" }}
            onClick={() => { setStep("plan"); setError(null); }}>
            ← Back
          </button>
          <p className="form-label mb-3">Mobile operator</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {OPERATORS.map(o => {
              const isSel = selOp === o.name;
              return (
                <button key={o.name} type="button" onClick={() => setSelOp(o.name)}
                  className="rounded-xl p-3.5 text-left transition-all flex items-center gap-3"
                  style={{
                    border:     isSel ? `2px solid ${o.color}` : "1px solid var(--border)",
                    background: isSel ? `${o.color}18` : "var(--surface)",
                  }}>
                  <div className="size-8 rounded-full flex-shrink-0 grid place-items-center font-bold text-xs text-white"
                    style={{ background: o.color }}>
                    {o.name.slice(0, 1)}
                  </div>
                  <div>
                    <b className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{o.name}</b>
                    {isSel && <span className="text-xs font-semibold" style={{ color: o.color }}>Selected</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mb-5">
            <label className="form-label">Mobile number</label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center rounded-lg px-3 text-sm font-semibold"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--text-secondary)", flexShrink: 0 }}>
                +255
              </div>
              <input className="dv-input" placeholder="7xx xxx xxx"
                inputMode="numeric" value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                maxLength={9} />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Enter your {selOp ?? "mobile"} number without country code
            </p>
          </div>

          <button className="btn-gold w-full justify-center py-3"
            disabled={!selOp || phone.length < 9}
            style={(!selOp || phone.length < 9) ? { opacity: 0.5, cursor: "not-allowed" } : {}}
            onClick={() => { if (selOp && phone.length >= 9) setStep("summary"); }}>
            Review and confirm
          </button>
        </>
      )}

      {/* ══ STEP 3 — Summary card ══ */}
      {step === "summary" && plan && (
        <>
          <button className="flex items-center gap-1.5 text-xs mb-5"
            style={{ color: "var(--text-muted)" }}
            onClick={() => { setStep("operator"); setError(null); }}>
            ← Back
          </button>

          <div className="rounded-xl overflow-hidden mb-5"
            style={{ border: "1px solid var(--border-gold)" }}>
            {/* Summary header */}
            <div className="px-5 py-4" style={{ background: "var(--navy-700)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--gold-300)" }}>Payment summary</p>
              <p className="text-2xl font-bold text-white mt-1">{plan.price}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                DukaVerse {plan.period} subscription
              </p>
            </div>
            {/* Detail rows */}
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {[
                { label: "Plan",     value: `${plan.period} (${plan.months} month${plan.months > 1 ? "s" : ""})` },
                { label: "Operator", value: selOp ?? "" },
                { label: "Number",   value: `+255 ${phone}` },
                { label: "Amount",   value: plan.price, bold: true, gold: true },
                { label: "Reference", value: `DV-${Date.now().toString(36).toUpperCase().slice(-6)}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{row.label}</span>
                  <span className="text-sm font-semibold"
                    style={{ color: row.gold ? "var(--gold-500)" : "var(--text-primary)", fontWeight: row.bold ? 700 : 600 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 rounded-lg px-4 py-3"
            style={{ background: "var(--gold-100)", border: "1px solid var(--gold-300)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--navy-700)" }}>
              What happens next
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--navy-500)" }}>
              A USSD prompt will appear on your phone. Reply <strong>1</strong> to confirm or <strong>2</strong> to cancel. Then enter your {selOp} PIN to complete the payment.
            </p>
          </div>

          <button className="btn-gold w-full justify-center py-3"
            disabled={pending}
            onClick={handleSendPush}>
            {pending
              ? <><Loader2 size={17} className="animate-spin" /> Sending request…</>
              : `Send payment request to +255 ${phone}`}
          </button>
        </>
      )}

      {/* ══ STEP 4 — Waiting for USSD confirmation ══ */}
      {step === "waiting" && pushData && (
        <div className="text-center py-4">
          {/* Animated phone */}
          <div className="mx-auto mb-5 relative w-16 h-16">
            <div className="absolute inset-0 rounded-full animate-ping"
              style={{ background: "rgba(201,168,76,0.2)" }} />
            <div className="relative grid size-16 place-items-center rounded-full"
              style={{ background: "var(--gold-100)", border: "2px solid var(--gold-500)" }}>
              <span className="text-2xl">📲</span>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            Check your phone
          </h3>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
            A payment prompt has been sent to <strong style={{ color: "var(--text-primary)" }}>+255 {phone}</strong>
          </p>

          {/* USSD message mockup */}
          <div className="rounded-xl p-4 mb-5 text-left"
            style={{ background: "var(--navy-900)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              {selOp} USSD prompt
            </p>
            <p className="text-sm leading-relaxed text-white">
              Dear Customer, confirm payment of <strong style={{ color: "var(--gold-500)" }}>TZS {plan?.amount.toLocaleString("en-TZ")}</strong> to DukaVerse for <strong style={{ color: "var(--gold-500)" }}>{plan?.period}</strong> subscription.
            </p>
            <p className="text-sm mt-2 text-white">
              Reply <strong style={{ color: "#4ade80" }}>1</strong> to COMPLETE or <strong style={{ color: "#f87171" }}>2</strong> to DECLINE
            </p>
            <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              Then enter your {selOp} PIN to finalize.
            </p>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="text-2xl font-bold font-mono" style={{ color: countdown <= 30 ? "var(--danger)" : "var(--gold-500)" }}>
              {mm(countdown)}
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>remaining</p>
          </div>

          {/* Progress bar */}
          <div className="rounded-full h-1.5 mb-5 overflow-hidden"
            style={{ background: "var(--border)" }}>
            <div className="h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${(countdown / 120) * 100}%`, background: countdown <= 30 ? "var(--danger)" : "var(--gold-500)" }} />
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Waiting for your confirmation{polling ? "…" : ""}
          </p>

          <button className="btn-ghost mt-4 text-sm"
            onClick={() => { setStep("plan"); setError(null); setPushData(null); }}>
            Cancel
          </button>
        </div>
      )}

      {/* ══ STEP 5 — Success ══ */}
      {step === "success" && plan && (
        <div className="text-center py-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full"
            style={{ background: "var(--success-bg)", border: "2px solid #86EFAC" }}>
            <Check size={30} style={{ color: "var(--success)" }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Payment confirmed!</h3>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Your <strong style={{ color: "var(--text-primary)" }}>{plan.period}</strong> subscription is now active.
          </p>
          <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
            Reference: <span className="font-mono font-semibold">{pushData?.ref}</span>
          </p>
          <div className="rounded-xl px-5 py-4 mb-5"
            style={{ background: "var(--success-bg)", border: "1px solid #BBF7D0" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
              {plan.period} subscription active
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--success)" }}>
              Valid for {plan.months} month{plan.months > 1 ? "s" : ""} from today
            </p>
          </div>
          <button className="btn-gold w-full justify-center py-3"
            onClick={() => window.location.reload()}>
            Done
          </button>
        </div>
      )}

      {/* ══ STEP 6 — Failed / timeout ══ */}
      {step === "failed" && (
        <div className="text-center py-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full"
            style={{ background: "var(--danger-bg)", border: "2px solid #FECACA" }}>
            <X size={30} style={{ color: "var(--danger)" }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Payment not confirmed</h3>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            The payment was not completed in time or was declined. No charge was made.
          </p>
          <button className="btn-gold w-full justify-center py-3 mb-3"
            onClick={() => { setStep("summary"); setError(null); }}>
            Try again
          </button>
          <button className="btn-ghost w-full justify-center py-2.5 text-sm"
            onClick={() => { setStep("plan"); setError(null); setPushData(null); }}>
            Change plan or number
          </button>
        </div>
      )}

      {/* Footer — payment methods, shown on plan step only */}
      {step === "plan" && (
        <div className="mt-4 rounded-lg px-3 py-3"
          style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            Accepted payment methods
          </p>
          <div className="flex flex-wrap gap-2">
            {["M-Pesa TZ", "Airtel Money", "Tigo Pesa", "Halo Pesa", "Visa/Mastercard"].map(pm => (
              <span key={pm} className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                {pm}
              </span>
            ))}
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
            Powered by Pesapal · Secure checkout
          </p>
        </div>
      )}
    </section>
  );
}
