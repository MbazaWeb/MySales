"use client";
import { useState, useTransition } from "react";
import {
  Bell, Building2, Check, Crown, Mail,
  MessageSquareText, Plus, ShieldCheck, UserPlus, X, Loader2, AlertCircle,
} from "lucide-react";
import { addBranch, signOut } from "@/lib/supabase/actions";
import type { User } from "@supabase/supabase-js";

type Business = { id: string; name: string; type: string };
type Branch   = { id: string; name: string; location: string; business_id: string };
type StaffRow = { id: string; name: string; role: string; branch_id: string | null; business_id: string };

const PLANS = [
  { period: "Monthly",  price: "TZS 15,000", note: "/ month",    best: false },
  { period: "3 months", price: "TZS 40,000", note: "save 11%",   best: false },
  { period: "6 months", price: "TZS 75,000", note: "save 17%",   best: false },
  { period: "Yearly",   price: "TZS 140,000",note: "best value", best: true  },
];

export default function ProfileClient({
  user, businesses, branches, staff,
}: {
  user:       User;
  businesses: Business[];
  branches:   Branch[];
  staff:      StaffRow[];
}) {
  const fullName  = user.user_metadata?.full_name ?? "—";
  const email     = user.email ?? "—";
  const initials  = fullName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const [showBranch, setShowBranch] = useState(false);
  const [newBranch, setNewBranch]   = useState({ name: "", location: "", business_id: businesses[0]?.id ?? "" });
  const [branchError, setBranchError] = useState<string | null>(null);
  const [pending, start]            = useTransition();
  const [signOutPending, startSO]   = useTransition();

  function handleAddBranch(e: React.FormEvent) {
    e.preventDefault();
    setBranchError(null);
    const fd = new FormData();
    fd.append("name",        newBranch.name);
    fd.append("location",    newBranch.location);
    fd.append("business_id", newBranch.business_id);
    start(async () => {
      const res = await addBranch(fd);
      if ("error" in res && res.error) { setBranchError(res.error); return; }
      setShowBranch(false);
      setNewBranch(b => ({ ...b, name: "", location: "" }));
      window.location.reload();
    });
  }

  // Group branches by business
  const bizMap = Object.fromEntries(businesses.map(b => [b.id, b]));

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
            <button
              onClick={() => startSO(async () => { await signOut(); })}
              disabled={signOutPending}
              className="rounded-lg px-4 py-3 text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>
              {signOutPending ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="space-y-6">

          {/* Branches */}
          <section className="dv-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Branches</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {branches.length} of 5 slots used
                </p>
              </div>
              {branches.length < 5 && (
                <button className="btn-gold" onClick={() => setShowBranch(true)}>
                  <Plus size={15} /> Add branch
                </button>
              )}
            </div>
            {branches.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
                No branches yet.
              </p>
            ) : (
              <div className="space-y-2">
                {branches.map(b => (
                  <div key={b.id} className="flex items-center justify-between rounded-lg p-3"
                    style={{ border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-lg" style={{ background: "var(--gold-100)" }}>
                        <Building2 size={17} style={{ color: "var(--gold-500)" }} />
                      </div>
                      <div>
                        <b className="block text-sm font-semibold">{b.name}</b>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {b.location} · {bizMap[b.business_id]?.name ?? ""}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Staff */}
          <section className="dv-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Users & access</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Staff assigned to this business</p>
              </div>
              <button className="btn-ghost px-2.5 py-2" title="Invite staff (coming soon)">
                <UserPlus size={17} />
              </button>
            </div>
            {staff.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>No staff added yet.</p>
            ) : (
              <table className="dv-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Scope</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(u => {
                    const branchName = u.branch_id
                      ? branches.find(b => b.id === u.branch_id)?.name ?? "Unknown"
                      : "All branches";
                    return (
                      <tr key={u.id}>
                        <td className="font-semibold">{u.name}</td>
                        <td style={{ color: "var(--text-muted)" }}>{u.role}</td>
                        <td>
                          <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ background: "var(--gold-100)", color: "var(--navy-700)" }}>
                            {branchName}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
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
          <section className="dv-card">
            <h2 className="flex items-center gap-2 font-semibold mb-1">
              <Crown size={17} style={{ color: "var(--gold-500)" }} />
              Subscription plans
            </h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Subscribe after your trial ends.</p>
            <div className="grid grid-cols-2 gap-3">
              {PLANS.map(p => (
                <button key={p.period} className="rounded-xl p-3.5 text-left transition-all"
                  style={{
                    border:      p.best ? "2px solid var(--gold-500)" : "1px solid var(--border)",
                    background:  p.best ? "var(--gold-100)" : "var(--surface)",
                  }}>
                  <b className="block text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{p.period}</b>
                  <strong className="mt-1.5 block text-base font-bold">{p.price}</strong>
                  <span className="text-xs" style={{ color: p.best ? "var(--gold-500)" : "var(--text-muted)" }}>
                    {p.note}
                  </span>
                  {p.best && (
                    <span className="mt-2 flex items-center gap-1 text-xs font-bold" style={{ color: "var(--navy-700)" }}>
                      <Check size={12} /> Recommended
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Add branch modal */}
      {showBranch && (
        <div className="modal-overlay" onClick={() => setShowBranch(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add branch</h2>
              <button className="btn-ghost px-2 py-2" onClick={() => setShowBranch(false)}><X size={18} /></button>
            </div>
            {branchError && (
              <div className="mb-4 flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
                <AlertCircle size={15} style={{ color: "var(--danger)", flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--danger)" }}>{branchError}</p>
              </div>
            )}
            <form onSubmit={handleAddBranch} className="space-y-4">
              {businesses.length > 1 && (
                <div>
                  <label className="form-label">Business</label>
                  <select className="dv-select" value={newBranch.business_id}
                    onChange={e => setNewBranch(b => ({ ...b, business_id: e.target.value }))}>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Branch name</label>
                <input required className="dv-input" placeholder="e.g. Mlandege Grocery"
                  value={newBranch.name} onChange={e => setNewBranch(b => ({ ...b, name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Location</label>
                <input required className="dv-input" placeholder="Town or district"
                  value={newBranch.location} onChange={e => setNewBranch(b => ({ ...b, location: e.target.value }))} />
              </div>
              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending ? <Loader2 size={17} className="animate-spin" /> : "Create branch"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
