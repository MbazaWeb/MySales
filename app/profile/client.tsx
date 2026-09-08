"use client";
import { useState, useTransition } from "react";
import {
  Bell, Building2, Check, Crown, Mail, Eye, EyeOff,
  MessageSquareText, Plus, ShieldCheck, UserPlus, X, Loader2,
  AlertCircle, Copy, CheckCheck, KeyRound, Shield,
} from "lucide-react";
import { addBranchWithStaff, signOut, createCheckoutSession } from "@/lib/supabase/client-actions";
import type { User } from "@supabase/supabase-js";

type Business = { id: string; name: string; type: string };
type Branch   = { id: string; name: string; location: string; business_id: string; is_active?: boolean };
type StaffRow = { id: string; name: string; role: string; branch_id: string | null; business_id: string; is_active?: boolean; user_id: string };

type NewCredentials = { name: string; email: string; password: string; role: string };

const PLANS = [
  { period: "Monthly",  price: "TZS 15,000", note: "/ month",    best: false },
  { period: "3 months", price: "TZS 40,000", note: "save 11%",   best: false },
  { period: "6 months", price: "TZS 75,000", note: "save 17%",   best: false },
  { period: "Yearly",   price: "TZS 140,000",note: "best value", best: true  },
];

const ROLES = ["Manager", "Cashier", "Stock keeper"] as const;

function genPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function ProfileClient({
  user, businesses, branches: initialBranches, staff: initialStaff,
}: {
  user:       User;
  businesses: Business[];
  branches:   Branch[];
  staff:      StaffRow[];
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
      setCredentials(res.credentials);
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
          <SubscriptionPlans businesses={businesses} />
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
                    <li>✓ Record sales</li>
                    <li>✓ Add and update inventory</li>
                    <li>✓ View branch reports</li>
                    <li>✗ Cannot see other branches</li>
                    <li>✗ Cannot manage staff</li>
                  </ul>
                )}
                {form.staff_role === "Cashier" && (
                  <ul className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
                    <li>✓ Record sales</li>
                    <li>✓ View inventory levels</li>
                    <li>✗ Cannot add or edit products</li>
                    <li>✗ Cannot see other branches</li>
                  </ul>
                )}
                {form.staff_role === "Stock keeper" && (
                  <ul className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
                    <li>✓ Add and update inventory</li>
                    <li>✓ View stock levels</li>
                    <li>✗ Cannot record sales</li>
                    <li>✗ Cannot see other branches</li>
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

// ── Subscription Plans component ──────────────────────────────────────────────
function SubscriptionPlans({ businesses }: { businesses: Business[] }) {
  const [selected, setSelected]   = useState<string | null>(null);
  const [bizId, setBizId]         = useState(businesses[0]?.id ?? "");
  const [payError, setPayError]   = useState<string | null>(null);
  const [paying, startPay]        = useTransition();

  const plans = [
    { key: "monthly",   period: "Monthly",  price: "TZS 15,000", note: "/ month",    best: false },
    { key: "quarterly", period: "3 months", price: "TZS 40,000", note: "save 11%",   best: false },
    { key: "biannual",  period: "6 months", price: "TZS 75,000", note: "save 17%",   best: false },
    { key: "yearly",    period: "Yearly",   price: "TZS 140,000",note: "best value", best: true  },
  ];

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setPayError(null);
    const fd = new FormData();
    fd.append("plan",        selected);
    fd.append("business_id", bizId);
    startPay(async () => {
      const res = await createCheckoutSession(fd);
      if ("error" in res && res.error) { setPayError(res.error); return; }
      if ("payment_link" in res && res.payment_link) {
        const url = (res as any).redirect_url ?? (res as any).payment_link;
      if (url) window.location.href = url;
      }
    });
  }

  return (
    <section className="dv-card">
      <h2 className="flex items-center gap-2 font-semibold mb-1">
        <Crown size={17} style={{ color: "var(--gold-500)" }} />
        Subscription plans
      </h2>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Subscribe to keep your account active after the trial.
      </p>

      {payError && (
        <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm"
          style={{ background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #FECACA" }}>
          <AlertCircle size={14} /> {payError}
        </div>
      )}

      {businesses.length > 1 && (
        <div className="mb-4">
          <label className="form-label">Business</label>
          <select className="dv-select" value={bizId} onChange={e => setBizId(e.target.value)}>
            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-4">
        {plans.map(p => (
          <button key={p.key} type="button"
            onClick={() => setSelected(p.key)}
            className="rounded-xl p-3.5 text-left transition-all"
            style={{
              border:     selected === p.key ? "2px solid var(--navy-700)"
                          : p.best ? "2px solid var(--gold-500)"
                          : "1px solid var(--border)",
              background: selected === p.key ? "var(--navy-700)"
                          : p.best ? "var(--gold-100)"
                          : "var(--surface)",
            }}>
            <b className="block text-xs font-semibold"
              style={{ color: selected === p.key ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}>
              {p.period}
            </b>
            <strong className="mt-1.5 block text-base font-bold"
              style={{ color: selected === p.key ? "#fff" : "var(--text-primary)" }}>
              {p.price}
            </strong>
            <span className="text-xs"
              style={{ color: selected === p.key ? "rgba(255,255,255,0.5)" : p.best ? "var(--gold-500)" : "var(--text-muted)" }}>
              {p.note}
            </span>
            {p.best && selected !== p.key && (
              <span className="mt-2 flex items-center gap-1 text-xs font-bold" style={{ color: "var(--navy-700)" }}>
                <Check size={12} /> Recommended
              </span>
            )}
            {selected === p.key && (
              <span className="mt-2 flex items-center gap-1 text-xs font-bold text-white">
                <Check size={12} /> Selected
              </span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handlePay}>
        <button type="submit" disabled={!selected || paying}
          className="btn-gold w-full justify-center py-3"
          style={!selected ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
          {paying
            ? <><Loader2 size={17} className="animate-spin" /> Redirecting to payment…</>
            : selected
            ? `Pay with Pesapal — ${plans.find(p => p.key === selected)?.price}`
            : "Select a plan to continue"}
        </button>
      </form>

      <p className="text-xs mt-3 text-center" style={{ color: "var(--text-muted)" }}>
        Pesapal · M-Pesa TZ, Airtel Money, Tigo Pesa, Halo Pesa, card
      </p>
    </section>
  );
}
