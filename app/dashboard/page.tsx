import { redirect }       from "next/navigation";
import Link               from "next/link";
import { ArrowUpRight, Package, ReceiptText, TriangleAlert, WalletCards, TrendingUp } from "lucide-react";
import AppShell           from "../components/AppShell";
import { getActiveBranch, getProducts, getSales } from "@/lib/supabase/actions";
import { BIZ_TZ, dateKeyInBizTz, todayInBizTz } from "@/lib/supabase/tz";

export const dynamic = "force-dynamic";

function money(n: number) {
  return `TZS ${n.toLocaleString("en-TZ")}`;
}

export default async function Dashboard() {
  const ctx = await getActiveBranch();
  if (!ctx) redirect("/auth");

  const [products, sales] = await Promise.all([
    getProducts(ctx.branch.id),
    getSales(ctx.branch.id),
  ]);

  const lowStock   = products.filter(p => p.stock <= p.reorder);
  const totalUnits = products.reduce((a, p) => a + p.stock, 0);
  const today = todayInBizTz();
  const todaySales = sales.filter(s => dateKeyInBizTz(s.created_at) === today);
  const todayRev    = todaySales.reduce((a, s) => a + s.total, 0);
  const todayProfit = todaySales.reduce((a, s) => a + (s.profit ?? 0), 0);
  const totalProfit = sales.reduce((a, s) => a + (s.profit ?? 0), 0);
  const stockCostValue = products.reduce((a, p) => a + p.stock * (p.cost_price ?? 0), 0);

  // Top sellers by qty this session
  const sellerMap: Record<string, number> = {};
  for (const s of sales) {
    sellerMap[s.product_name] = (sellerMap[s.product_name] ?? 0) + s.qty;
  }
  const topSellers = Object.entries(sellerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const maxQty = topSellers[0]?.[1] ?? 1;

  const cards = [
    { label: "Today's revenue", value: money(todayRev),    sub: `${todaySales.length} transactions today`,  icon: WalletCards,   accent: true,  warn: false },
    { label: "Today's profit",  value: money(todayProfit), sub: `${money(totalProfit)} all time`,           icon: TrendingUp,    accent: false, warn: false, ok: true },
    { label: "Units in stock",  value: String(totalUnits), sub: `Stock cost ${money(stockCostValue)}`,      icon: Package,       accent: false, warn: false },
    { label: "Low stock",       value: String(lowStock.length), sub: "Need reordering",                    icon: TriangleAlert, accent: false, warn: lowStock.length > 0 },
  ];

  const now = new Date();
  const subtitle = `${ctx.branch.name} · ${now.toLocaleDateString("en-TZ", { timeZone: BIZ_TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" })}`;

  return (
    <AppShell title="Dashboard" subtitle={subtitle} branchId={ctx.branch.id} bizName={ctx.biz.name} userName={ctx.user.user_metadata?.full_name ?? ctx.user.email}>

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-lg px-4 py-3"
          style={{ background: "var(--warning-bg)", border: "1px solid #FDE68A" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
              {lowStock.length} {lowStock.length === 1 ? "item needs" : "items need"} restocking
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#92400E" }}>
              {lowStock.map(p => p.name).join(", ")}
            </p>
          </div>
          <Link href="/inventory" className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--warning)" }}>
            Review →
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(c => {
          const I = c.icon;
          return (
            <article key={c.label} className="stat-card"
              style={c.accent
                ? { background: "var(--navy-700)", borderColor: "var(--navy-500)" }
                : c.warn
                ? { background: "var(--warning-bg)", borderColor: "#FDE68A" }
                : (c as any).ok
                ? { background: "var(--success-bg)", borderColor: "#BBF7D0" }
                : {}}>
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium"
                  style={{ color: c.accent ? "rgba(255,255,255,0.6)" : "var(--text-muted)" }}>
                  {c.label}
                </span>
                <I size={17} style={{ color: c.accent ? "var(--gold-500)" : c.warn ? "var(--warning)" : "var(--text-muted)" }} />
              </div>
              <strong className="mt-4 block text-2xl font-bold tracking-tight"
                style={{ color: c.accent ? "#fff" : c.warn ? "var(--warning)" : "var(--text-primary)" }}>
                {c.value}
              </strong>
              <span className="mt-1 block text-xs"
                style={{ color: c.accent ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>
                {c.sub}
              </span>
            </article>
          );
        })}
      </div>

      {/* Lower grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

        {/* Recent sales */}
        <section className="dv-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Recent sales</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Latest transactions</p>
            </div>
            <Link href="/sales" className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--gold-500)" }}>
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {sales.length === 0 ? (
            <div className="py-8 text-center" style={{ color: "var(--text-muted)" }}>
              <p className="text-sm">No sales recorded yet.</p>
              <Link href="/sales" className="mt-2 inline-block text-xs font-semibold" style={{ color: "var(--gold-500)" }}>
                Record your first sale →
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {sales.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 py-3.5">
                  <div>
                    <b className="block text-sm font-semibold">{s.product_name}</b>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.qty} units · {s.payment} · {new Date(s.created_at).toLocaleTimeString("en-TZ", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <b className="block text-sm font-semibold">{money(s.total)}</b>
                    <span className={s.status === "Not paid" ? "badge-warn" : "badge-ok"}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right column */}
        <div className="space-y-5">

          {/* Top sellers */}
          <section className="dv-card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} style={{ color: "var(--gold-500)" }} />
              <h2 className="font-semibold">Top sellers</h2>
            </div>
            {topSellers.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No data yet</p>
            ) : (
              <div className="space-y-4">
                {topSellers.map(([name, qty]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium truncate">{name}</span>
                      <span className="shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>{qty} sold</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${(qty / maxQty) * 100}%`, background: "var(--gold-500)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Low stock */}
          {lowStock.length > 0 && (
            <section className="dv-card">
              <h2 className="font-semibold mb-3">Stock attention</h2>
              <div className="space-y-2">
                {lowStock.slice(0, 5).map(p => (
                  <div key={p.id} className="flex justify-between rounded-lg px-3 py-2.5 text-sm"
                    style={{ background: "var(--warning-bg)" }}>
                    <span className="font-medium" style={{ color: "var(--warning)" }}>{p.name}</span>
                    <span className="font-semibold" style={{ color: "var(--warning)" }}>{p.stock} left</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {products.length === 0 && (
            <section className="dv-card text-center py-6">
              <p className="text-sm font-medium">No products yet</p>
              <Link href="/inventory" className="mt-1 inline-block text-xs font-semibold" style={{ color: "var(--gold-500)" }}>
                Add your first product →
              </Link>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
