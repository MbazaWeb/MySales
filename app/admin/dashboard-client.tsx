"use client";
import type { AdminData } from "@/lib/supabase/admin-guard";

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" });
}

const S = {
  page:    { padding: "2rem" } as React.CSSProperties,
  h1:      { fontSize: "1.5rem", fontWeight: 700, color: "#F1F5F9", marginBottom: "0.25rem" } as React.CSSProperties,
  sub:     { fontSize: "0.8125rem", color: "#64748B", marginBottom: "2rem" } as React.CSSProperties,
  grid4:   { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "1rem", marginBottom: "2rem" } as React.CSSProperties,
  card:    { background: "#0D1F35", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.25rem" } as React.CSSProperties,
  cardAccent: { background: "#1E3A5F", border: "1px solid #2D5282", borderRadius: 12, padding: "1.25rem" } as React.CSSProperties,
  label:   { fontSize: "0.75rem", color: "#64748B", fontWeight: 500 } as React.CSSProperties,
  value:   { fontSize: "1.75rem", fontWeight: 700, color: "#F1F5F9", marginTop: "0.5rem" } as React.CSSProperties,
  hint:    { fontSize: "0.75rem", color: "#475569", marginTop: "0.25rem" } as React.CSSProperties,
  table:   { width: "100%", borderCollapse: "separate" as const, borderSpacing: 0 },
  th:      { padding: "0.625rem 1rem", textAlign: "left" as const, fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#060E1A", whiteSpace: "nowrap" as const },
  td:      { padding: "0.875rem 1rem", fontSize: "0.8125rem", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#CBD5E1" },
  section: { background: "#0D1F35", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem" } as React.CSSProperties,
  secHead: { padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" } as React.CSSProperties,
  secTitle:{ fontSize: "0.9375rem", fontWeight: 600, color: "#F1F5F9" } as React.CSSProperties,
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    Active:      { background: "#052e16", color: "#4ade80", border: "1px solid #166534" },
    Trial:       { background: "#1c1917", color: "#fbbf24", border: "1px solid #92400e" },
    Expired:     { background: "#1c0a0a", color: "#f87171", border: "1px solid #7f1d1d" },
    "No business": { background: "#0f172a", color: "#475569", border: "1px solid #1e293b" },
  };
  const style = styles[status] ?? styles["No business"];
  return (
    <span style={{ ...style, fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: 999 }}>
      {status}
    </span>
  );
}

export default function AdminDashClient({ data }: { data: AdminData }) {
  const now = new Date();
  const recentUsers = data.users.slice(0, 8);

  // Sort months for revenue chart
  const months = Object.entries(data.monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);
  const maxRev = Math.max(...months.map(([, v]) => v), 1);

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Platform Overview</h1>
      <p style={S.sub}>
        {now.toLocaleDateString("en-TZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        {" · "}{data.totalUsers} total users
      </p>

      {/* Stat cards */}
      <div style={S.grid4}>
        {[
          { label: "Total revenue",    value: money(data.totalRevenue),    hint: "All time platform",      accent: true  },
          { label: "Total profit",     value: money(data.totalProfit),     hint: "Across all businesses",  accent: false },
          { label: "Active (paid)",    value: String(data.activeUsers),    hint: "Paid subscriptions",     accent: false, ok: true },
          { label: "On trial",         value: String(data.trialUsers),     hint: "Free trial period",      accent: false },
          { label: "Expired",          value: String(data.expiredUsers),   hint: "Need renewal",           accent: false, warn: true },
          { label: "Businesses",       value: String(data.totalBiz),       hint: "Registered",             accent: false },
          { label: "Total users",      value: String(data.totalUsers),     hint: "Auth accounts",          accent: false },
          { label: "Conversion rate",  value: data.totalBiz > 0 ? `${Math.round((data.activeUsers / data.totalBiz) * 100)}%` : "0%", hint: "Trial → paid", accent: false },
        ].map(c => (
          <div key={c.label} style={c.accent ? S.cardAccent : S.card}>
            <p style={S.label}>{c.label}</p>
            <p style={{ ...S.value, color: c.ok ? "#4ade80" : c.warn ? "#f87171" : c.accent ? "#C9A84C" : "#F1F5F9" }}>
              {c.value}
            </p>
            <p style={S.hint}>{c.hint}</p>
          </div>
        ))}
      </div>

      {/* Revenue bar chart */}
      {months.length > 0 && (
        <div style={{ ...S.section, marginBottom: "1.5rem" }}>
          <div style={S.secHead}>
            <span style={S.secTitle}>Monthly Revenue</span>
            <span style={{ fontSize: "0.75rem", color: "#475569" }}>Last 6 months</span>
          </div>
          <div style={{ padding: "1.25rem", display: "flex", alignItems: "flex-end", gap: "0.75rem", height: 160 }}>
            {months.map(([month, rev]) => (
              <div key={month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem", height: "100%" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                  <div style={{
                    width: "100%",
                    height: `${Math.max(4, (rev / maxRev) * 100)}%`,
                    background: "linear-gradient(180deg, #C9A84C, #8B6914)",
                    borderRadius: "4px 4px 0 0",
                    transition: "height 300ms",
                  }} title={money(rev)} />
                </div>
                <span style={{ fontSize: "9px", color: "#475569", whiteSpace: "nowrap" }}>
                  {new Date(month + "-01").toLocaleDateString("en-TZ", { month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent signups */}
      <div style={S.section}>
        <div style={S.secHead}>
          <span style={S.secTitle}>Recent users</span>
          <a href="/admin/users" style={{ fontSize: "0.8rem", color: "#C9A84C", textDecoration: "none" }}>View all →</a>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Name", "Email", "Business", "Status", "Revenue", "Joined"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.uid} style={{ cursor: "pointer" }}>
                  <td style={{ ...S.td, fontWeight: 600, color: "#F1F5F9" }}>{u.full_name}</td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}>{u.biz_name ?? <span style={{ color: "#334155" }}>—</span>}</td>
                  <td style={S.td}><StatusBadge status={u.sub_status} /></td>
                  <td style={S.td}>{u.total_revenue > 0 ? money(u.total_revenue) : <span style={{ color: "#334155" }}>—</span>}</td>
                  <td style={{ ...S.td, color: "#475569" }}>{fmtDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {[
          { label: "Active",    count: data.activeUsers,  color: "#4ade80" },
          { label: "Trial",     count: data.trialUsers,   color: "#fbbf24" },
          { label: "Expired",   count: data.expiredUsers, color: "#f87171" },
          { label: "No account",count: data.totalUsers - data.activeUsers - data.trialUsers - data.expiredUsers, color: "#475569" },
        ].filter(r => r.count > 0).length > 0 && (
          <div style={S.section}>
            <div style={S.secHead}><span style={S.secTitle}>Subscription breakdown</span></div>
            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { label: "Active (paid)", count: data.activeUsers,  color: "#4ade80" },
                { label: "On trial",      count: data.trialUsers,   color: "#fbbf24" },
                { label: "Expired",       count: data.expiredUsers, color: "#f87171" },
                { label: "No business",   count: data.totalUsers - data.activeUsers - data.trialUsers - data.expiredUsers, color: "#475569" },
              ].map(r => (
                <div key={r.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.8125rem", color: "#94A3B8" }}>{r.label}</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: r.color }}>{r.count}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.06)" }}>
                    <div style={{ height: 5, borderRadius: 999, background: r.color, width: `${data.totalUsers > 0 ? (r.count / data.totalUsers) * 100 : 0}%`, transition: "width 400ms" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top businesses by revenue */}
        <div style={S.section}>
          <div style={S.secHead}><span style={S.secTitle}>Top businesses</span></div>
          <div style={{ overflowX: "auto" }}>
            <table style={S.table}>
              <thead><tr>
                <th style={S.th}>Business</th>
                <th style={{ ...S.th, textAlign: "right" }}>Revenue</th>
                <th style={{ ...S.th, textAlign: "right" }}>Sales</th>
              </tr></thead>
              <tbody>
                {data.users.filter(u => u.biz_name).sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 5).map(u => (
                  <tr key={u.uid}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{u.biz_name}</td>
                    <td style={{ ...S.td, textAlign: "right", color: "#C9A84C" }}>{money(u.total_revenue)}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{u.total_sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
