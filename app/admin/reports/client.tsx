"use client";
import type { AdminData } from "@/lib/supabase/admin-guard";

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }

export default function ReportsClient({ data }: { data: AdminData }) {
  const months = Object.entries(data.monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  const totalSubs  = data.subscriptions.length;
  const activeSubs = data.subscriptions.filter(s => s.status === "Active").length;
  const subRevenue = data.subscriptions.reduce((a, s) => a + s.amount_tzs, 0);

  const S = {
    page: { padding: "2rem", minHeight: "100dvh", background: "#0A1628" } as React.CSSProperties,
    h1:   { fontSize: "1.375rem", fontWeight: 700, color: "#F1F5F9", marginBottom: "1.5rem" } as React.CSSProperties,
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "1rem", marginBottom: "2rem" } as React.CSSProperties,
    card: { background: "#0D1F35", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.25rem" } as React.CSSProperties,
    lbl:  { fontSize: "0.75rem", color: "#64748B" } as React.CSSProperties,
    val:  { fontSize: "1.5rem", fontWeight: 700, color: "#F1F5F9", marginTop: "0.375rem" } as React.CSSProperties,
    sec:  { background: "#0D1F35", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem" } as React.CSSProperties,
    sech: { padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" } as React.CSSProperties,
    th:   { padding: "0.625rem 1rem", textAlign: "left" as const, fontSize: "0.7rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" as const, letterSpacing: "0.06em", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#060E1A" },
    td:   { padding: "0.75rem 1rem", fontSize: "0.8125rem", borderBottom: "1px solid rgba(255,255,255,0.04)", color: "#CBD5E1" },
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Platform Reports</h1>

      {/* KPIs */}
      <div style={S.grid}>
        {[
          { label: "Platform revenue",     value: money(data.totalRevenue), color: "#C9A84C" },
          { label: "Platform profit",      value: money(data.totalProfit),  color: "#4ade80" },
          { label: "Subscription revenue", value: money(subRevenue),        color: "#818cf8" },
          { label: "Active subscriptions", value: String(activeSubs),       color: "#4ade80" },
          { label: "Total subscriptions",  value: String(totalSubs),        color: "#F1F5F9" },
          { label: "Paid conversion",      value: data.totalBiz > 0 ? `${Math.round((data.activeUsers/data.totalBiz)*100)}%` : "0%", color: "#fbbf24" },
        ].map(c => (
          <div key={c.label} style={S.card}>
            <p style={S.lbl}>{c.label}</p>
            <p style={{ ...S.val, color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Monthly revenue table */}
      <div style={S.sec}>
        <div style={S.sech}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#F1F5F9" }}>Monthly Revenue</p>
        </div>
        {months.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#334155" }}>No sales data yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead><tr>
              <th style={S.th}>Month</th>
              <th style={{ ...S.th, textAlign: "right" as const }}>Revenue (TZS)</th>
              <th style={S.th}>Bar</th>
            </tr></thead>
            <tbody>
              {[...months].reverse().map(([month, rev]) => {
                const maxR = Math.max(...months.map(([, v]) => v), 1);
                return (
                  <tr key={month}>
                    <td style={S.td}>
                      {new Date(month + "-01").toLocaleDateString("en-TZ", { month: "long", year: "numeric" })}
                    </td>
                    <td style={{ ...S.td, textAlign: "right" as const, color: "#C9A84C", fontWeight: 600 }}>{money(rev)}</td>
                    <td style={{ ...S.td, width: "40%" }}>
                      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{ height: 8, borderRadius: 999, background: "#C9A84C", width: `${(rev / maxR) * 100}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Subscriptions table */}
      <div style={S.sec}>
        <div style={S.sech}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#F1F5F9" }}>All Subscriptions</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 700 }}>
            <thead><tr>
              {["Business", "Plan", "Status", "Amount", "Started", "Ends"].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.subscriptions.map(s => {
                const biz = data.businesses.find(b => b.id === s.business_id);
                const statusColor: Record<string, string> = { Active: "#4ade80", Trialing: "#fbbf24", Canceled: "#f87171", Expired: "#f87171", "Past due": "#fb923c" };
                return (
                  <tr key={s.id}>
                    <td style={{ ...S.td, fontWeight: 500 }}>{biz?.name ?? "—"}</td>
                    <td style={S.td}>{s.billing_interval}</td>
                    <td style={S.td}>
                      <span style={{ color: statusColor[s.status] ?? "#94A3B8", fontSize: "0.75rem", fontWeight: 600 }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: "#C9A84C" }}>{money(s.amount_tzs)}</td>
                    <td style={{ ...S.td, color: "#475569", fontSize: "0.75rem" }}>
                      {new Date(s.starts_at).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ ...S.td, color: "#475569", fontSize: "0.75rem" }}>
                      {new Date(s.ends_at).toLocaleDateString("en-TZ", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                );
              })}
              {data.subscriptions.length === 0 && (
                <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#334155" }}>No subscriptions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User breakdown */}
      <div style={S.sec}>
        <div style={S.sech}>
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#F1F5F9" }}>User Revenue Breakdown</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead><tr>
              {["User", "Business", "Status", "Revenue", "Profit", "Sales"].map(h => (
                <th key={h} style={{ ...S.th, textAlign: h === "Revenue" || h === "Profit" || h === "Sales" ? "right" as const : "left" as const }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {data.users.filter(u => u.biz_id).sort((a, b) => b.total_revenue - a.total_revenue).map(u => (
                <tr key={u.uid}>
                  <td style={{ ...S.td, fontWeight: 500, color: "#F1F5F9" }}>{u.full_name}</td>
                  <td style={S.td}>{u.biz_name ?? "—"}</td>
                  <td style={S.td}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: u.sub_status === "Active" ? "#4ade80" : u.sub_status === "Trial" ? "#fbbf24" : "#f87171" }}>
                      {u.sub_status}
                    </span>
                  </td>
                  <td style={{ ...S.td, textAlign: "right", color: "#C9A84C" }}>{money(u.total_revenue)}</td>
                  <td style={{ ...S.td, textAlign: "right", color: "#4ade80" }}>{money(u.total_profit)}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{u.total_sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}