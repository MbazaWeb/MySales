"use client";
import { useMemo, useState, useTransition } from "react";
import { Search, ChevronDown, ChevronUp, X, Loader2, ShieldCheck, ShieldOff, Clock, Trash2, KeyRound } from "lucide-react";
import { grantSubscription, revokeSubscription, extendTrial, deleteUser, resetUserPassword } from "@/lib/supabase/admin-actions";
import type { AdminUser } from "@/lib/supabase/admin-guard";

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    Active:        { bg: "#052e16", color: "#4ade80", border: "#166534" },
    Trial:         { bg: "#1c1917", color: "#fbbf24", border: "#92400e" },
    Expired:       { bg: "#1c0a0a", color: "#f87171", border: "#7f1d1d" },
    "No business": { bg: "#0f172a", color: "#475569", border: "#1e293b" },
  };
  const s = map[status] ?? map["No business"];
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: 999 }}>
      {status}
    </span>
  );
}

const INTERVALS = [
  { key: "Monthly",  label: "1 month",  months: 1  },
  { key: "3 months", label: "3 months", months: 3  },
  { key: "6 months", label: "6 months", months: 6  },
  { key: "Yearly",   label: "12 months",months: 12 },
];

export default function UsersClient({
  users: initialUsers, businesses,
}: {
  users:      AdminUser[];
  businesses: { id: string; name: string; owner_id: string }[];
}) {
  const [q, setQ]           = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort]     = useState<"name" | "revenue" | "joined">("joined");
  const [asc, setAsc]       = useState(false);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [action, setAction]     = useState<"grant" | "revoke" | "trial" | "delete" | "reset" | null>(null);
  const [pending, start]        = useTransition();
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);
  const [interval, setInterval] = useState("Yearly");
  const [trialDays, setTrialDays] = useState(14);
  const [newPass, setNewPass]   = useState("");

  const filtered = useMemo(() => {
    let rows = initialUsers.filter(u => {
      const hay = `${u.full_name} ${u.email} ${u.biz_name ?? ""}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (filter !== "All" && u.sub_status !== filter) return false;
      return true;
    });
    rows.sort((a, b) => {
      let diff = 0;
      if (sort === "name")    diff = a.full_name.localeCompare(b.full_name);
      if (sort === "revenue") diff = a.total_revenue - b.total_revenue;
      if (sort === "joined")  diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return asc ? diff : -diff;
    });
    return rows;
  }, [initialUsers, q, filter, sort, asc]);

  function sortBy(col: typeof sort) {
    if (sort === col) setAsc(!asc);
    else { setSort(col); setAsc(false); }
  }

  function SortIcon({ col }: { col: typeof sort }) {
    if (sort !== col) return null;
    return asc ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  }

  async function runAction(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setMsg(null);
    const fd = new FormData();
    if (selected.biz_id) fd.append("business_id", selected.biz_id);
    fd.append("user_id", selected.uid);

    start(async () => {
      let res: { success?: true; error?: string } | { ok?: boolean; error?: string } = {};
      if (action === "grant") {
        fd.append("interval", interval);
        fd.append("months", String(INTERVALS.find(i => i.key === interval)?.months ?? 1));
        res = await grantSubscription(fd);
      } else if (action === "revoke") {
        res = await revokeSubscription(fd);
      } else if (action === "trial") {
        fd.append("days", String(trialDays));
        res = await extendTrial(fd);
      } else if (action === "delete") {
        res = await deleteUser(fd);
      } else if (action === "reset") {
        fd.append("password", newPass);
        res = await resetUserPassword(fd);
      }
      if ("error" in res && res.error) {
        setMsg({ ok: false, text: res.error });
      } else {
        setMsg({ ok: true, text: "Done." });
        setTimeout(() => { setAction(null); setSelected(null); setMsg(null); }, 1200);
      }
    });
  }

  const S = {
    page:  { padding: "2rem", minHeight: "100dvh", background: "#0A1628" } as React.CSSProperties,
    h1:    { fontSize: "1.375rem", fontWeight: 700, color: "#F1F5F9", marginBottom: "0.25rem" } as React.CSSProperties,
    sub:   { fontSize: "0.8125rem", color: "#64748B", marginBottom: "1.5rem" } as React.CSSProperties,
    wrap:  { background: "#0D1F35", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" } as React.CSSProperties,
    th:    { padding: "0.625rem 1rem", textAlign: "left" as const, fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#060E1A", whiteSpace: "nowrap" as const, cursor: "pointer" } as React.CSSProperties,
    td:    { padding: "0.75rem 1rem", fontSize: "0.8125rem", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#CBD5E1" } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Users</h1>
      <p style={S.sub}>{filtered.length} of {initialUsers.length} users</p>

      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#060E1A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "0 0.875rem", flex: 1, minWidth: 200 }}>
          <Search size={15} color="#475569" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, business…"
            style={{ height: 40, flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.875rem", color: "#E2E8F0" }} />
        </div>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {["All", "Active", "Trial", "Expired", "No business"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "0.375rem 0.875rem", borderRadius: 6, border: "1px solid", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer", borderColor: filter === f ? "#C9A84C" : "rgba(255,255,255,0.1)", background: filter === f ? "rgba(201,168,76,0.12)" : "transparent", color: filter === f ? "#C9A84C" : "#64748B" }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...S.wrap, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 900 }}>
          <thead>
            <tr>
              <th style={S.th} onClick={() => sortBy("name")}>Name <SortIcon col="name" /></th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Business</th>
              <th style={S.th}>Status</th>
              <th style={{ ...S.th, textAlign: "right" }} onClick={() => sortBy("revenue")}>Revenue <SortIcon col="revenue" /></th>
              <th style={S.th}>Sales</th>
              <th style={S.th}>Branches</th>
              <th style={S.th}>Trial ends</th>
              <th style={S.th} onClick={() => sortBy("joined")}>Joined <SortIcon col="joined" /></th>
              <th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.uid} style={{ transition: "background 80ms" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                <td style={{ ...S.td, fontWeight: 600, color: "#F1F5F9" }}>{u.full_name}</td>
                <td style={{ ...S.td, color: "#94A3B8" }}>{u.email}</td>
                <td style={S.td}>{u.biz_name ?? <span style={{ color: "#334155" }}>—</span>}</td>
                <td style={S.td}><StatusBadge status={u.sub_status} /></td>
                <td style={{ ...S.td, textAlign: "right", color: "#C9A84C" }}>{u.total_revenue > 0 ? money(u.total_revenue) : "—"}</td>
                <td style={{ ...S.td, textAlign: "center" }}>{u.total_sales || "—"}</td>
                <td style={{ ...S.td, textAlign: "center" }}>{u.branches || "—"}</td>
                <td style={{ ...S.td, color: "#475569", fontSize: "0.75rem" }}>{fmtDate(u.trial_ends_at)}</td>
                <td style={{ ...S.td, color: "#475569", fontSize: "0.75rem" }}>{fmtDate(u.created_at)}</td>
                <td style={S.td}>
                  <div style={{ display: "flex", gap: "0.375rem" }}>
                    {u.biz_id && (
                      <>
                        <ActionBtn icon={<ShieldCheck size={13} />} label="Grant" color="#4ade80" onClick={() => { setSelected(u); setAction("grant"); setMsg(null); }} />
                        <ActionBtn icon={<ShieldOff size={13} />}  label="Revoke" color="#f87171" onClick={() => { setSelected(u); setAction("revoke"); setMsg(null); }} />
                        <ActionBtn icon={<Clock size={13} />}      label="Trial"  color="#fbbf24" onClick={() => { setSelected(u); setAction("trial");  setMsg(null); }} />
                      </>
                    )}
                    <ActionBtn icon={<KeyRound size={13} />} label="Pwd" color="#94A3B8" onClick={() => { setSelected(u); setAction("reset"); setMsg(null); }} />
                    <ActionBtn icon={<Trash2 size={13} />}   label="Del" color="#f87171" onClick={() => { setSelected(u); setAction("delete"); setMsg(null); }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "3rem", textAlign: "center", color: "#334155" }}>No users match.</div>
        )}
      </div>

      {/* Action modal */}
      {action && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,14,26,0.8)", display: "grid", placeItems: "center", zIndex: 50 }}
          onClick={() => { setAction(null); setSelected(null); }}>
          <div style={{ background: "#0D1F35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "1.75rem", width: "100%", maxWidth: 420 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#F1F5F9" }}>
                {action === "grant"  ? "Grant subscription"
                : action === "revoke" ? "Revoke subscription"
                : action === "trial"  ? "Extend trial"
                : action === "reset"  ? "Reset password"
                : "Delete user"}
              </h2>
              <button onClick={() => { setAction(null); setSelected(null); }}
                style={{ background: "transparent", border: "none", color: "#475569", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.875rem", color: "#64748B", marginBottom: "1.25rem" }}>
              {selected.full_name} · {selected.email}
              {selected.biz_name && <><br />{selected.biz_name}</>}
            </p>

            {msg && (
              <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: 8, background: msg.ok ? "#052e16" : "#1c0a0a", color: msg.ok ? "#4ade80" : "#f87171", fontSize: "0.875rem" }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={runAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {action === "grant" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem" }}>Duration</label>
                  <select value={interval} onChange={e => setInterval(e.target.value)}
                    style={{ width: "100%", height: 42, background: "#060E1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#E2E8F0", padding: "0 0.875rem", fontSize: "0.875rem" }}>
                    {INTERVALS.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
                  </select>
                </div>
              )}
              {action === "trial" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem" }}>Days to add</label>
                  <input type="number" min="1" max="365" value={trialDays} onChange={e => setTrialDays(+e.target.value)}
                    style={{ width: "100%", height: 42, background: "#060E1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#E2E8F0", padding: "0 0.875rem", fontSize: "0.875rem", outline: "none" }} />
                </div>
              )}
              {action === "reset" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#94A3B8", marginBottom: "0.375rem" }}>New password</label>
                  <input type="text" required minLength={8} value={newPass} onChange={e => setNewPass(e.target.value)}
                    placeholder="Min 8 characters"
                    style={{ width: "100%", height: 42, background: "#060E1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#E2E8F0", padding: "0 0.875rem", fontSize: "0.875rem", outline: "none" }} />
                </div>
              )}
              {action === "delete" && (
                <div style={{ padding: "0.875rem", background: "#1c0a0a", border: "1px solid #7f1d1d", borderRadius: 8 }}>
                  <p style={{ fontSize: "0.8125rem", color: "#f87171" }}>
                    This will permanently delete the user and all their data. This cannot be undone.
                  </p>
                </div>
              )}
              <button type="submit" disabled={pending}
                style={{ height: 44, borderRadius: 8, border: "none", cursor: pending ? "not-allowed" : "pointer", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  background: action === "delete" || action === "revoke" ? "#7f1d1d" : "#C9A84C",
                  color: action === "delete" || action === "revoke" ? "#fca5a5" : "#0F1B2D",
                  opacity: pending ? 0.7 : 1 }}>
                {pending ? <Loader2 size={17} className="animate-spin" /> : (
                  action === "grant"  ? "Grant subscription" :
                  action === "revoke" ? "Revoke subscription" :
                  action === "trial"  ? "Extend trial" :
                  action === "reset"  ? "Reset password" :
                  "Delete user"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} title={label}
      style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem", borderRadius: 5, border: `1px solid ${color}22`, background: `${color}11`, color, fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
      {icon} {label}
    </button>
  );
}
