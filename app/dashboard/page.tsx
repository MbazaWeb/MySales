
import { T, LocalizedDate } from "@/app/components/LanguageProvider";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowUpRight, Package, ReceiptText, TriangleAlert, 
  WalletCards, TrendingUp, BarChart3, LineChart 
} from "lucide-react";
import AppShell from "../components/AppShell";
import { getActiveBranch, getProducts, getSales } from "@/lib/supabase/server-actions";
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

  const lowStock = products.filter(p => p.stock <= p.reorder);
  const totalUnits = products.reduce((a, p) => a + p.stock, 0);
  const today = todayInBizTz();
  const todaySales = sales.filter(s => dateKeyInBizTz(s.created_at) === today);
  const todayRev = todaySales.reduce((a, s) => a + s.total, 0);
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

  // Prepare data for graphs
  // Last 7 days sales
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  }).reverse();

  const dailySales = last7Days.map(date => {
    const key = dateKeyInBizTz(date.toISOString());
    const daySales = sales.filter(s => dateKeyInBizTz(s.created_at) === key);
    return {
      date: key,
      revenue: daySales.reduce((a, s) => a + s.total, 0),
      transactions: daySales.length,
      profit: daySales.reduce((a, s) => a + (s.profit ?? 0), 0)
    };
  });

  const maxRevenue = Math.max(...dailySales.map(d => d.revenue), 1);

  // Stock by category
  const categoryMap: Record<string, number> = {};
  for (const p of products) {
    const cat = p.category || "Uncategorized";
    categoryMap[cat] = (categoryMap[cat] || 0) + p.stock;
  }
  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCategoryStock = Math.max(...categoryData.map(c => c[1]), 1);

  const currentTime = new Date().toISOString();

  const cards = [
    { label: "Today's revenue", value: money(todayRev), sub: `${todaySales.length} transactions today`, icon: WalletCards, accent: true, warn: false },
    { label: "Today's profit", value: money(todayProfit), sub: `${money(totalProfit)} all time`, icon: TrendingUp, accent: false, warn: false, ok: true },
    { label: "Units in stock", value: String(totalUnits), sub: `Stock cost ${money(stockCostValue)}`, icon: Package, accent: false, warn: false },
    { label: "Low stock", value: String(lowStock.length), sub: "Need reordering", icon: TriangleAlert, accent: false, warn: lowStock.length > 0 },
  ];

  const subtitle = ctx.branch.name;

  return (
    <AppShell 
      title="Dashboard" 
      subtitle={subtitle} 
      time={currentTime}
      branchId={ctx.branch.id} 
      bizName={ctx.biz.name} 
      userName={ctx.user.user_metadata?.full_name ?? ctx.user.email}
    >

      {/* Low stock banner */}
      {lowStock.length > 0 && (
        <div className="mb-6 flex items-center justify-between rounded-lg px-4 py-3"
          style={{ background: "var(--warning-bg)", border: "1px solid #FDE68A" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
              {lowStock.length} {lowStock.length === 1 ? <T text={"item needs"} /> : <T text={"items need"} />} <T text={"restocking"} /> </p>
            <p className="text-xs mt-0.5" style={{ color: "#92400E" }}>
              {lowStock.map(p => p.name).join(", ")}
            </p>
          </div>
          <Link href="/inventory" className="text-sm font-semibold whitespace-nowrap" style={{ color: "var(--warning)" }}> <T text={"Review →"} /> </Link>
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
                  <T text={c.label} />
                </span>
                <I size={17} style={{ color: c.accent ? "var(--gold-500)" : c.warn ? "var(--warning)" : "var(--text-muted)" }} />
              </div>
              <strong className="mt-4 block text-2xl font-bold tracking-tight"
                style={{ color: c.accent ? "#fff" : c.warn ? "var(--warning)" : "var(--text-primary)" }}>
                {c.value}
              </strong>
              <span className="mt-1 block text-xs"
                style={{ color: c.accent ? "rgba(255,255,255,0.5)" : "var(--text-muted)" }}>
                <T text={c.sub} />
              </span>
            </article>
          );
        })}
      </div>

      {/* Graphs Section */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        
        {/* Sales Trend - Last 7 Days */}
        <section className="dv-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold"><T text={"Sales Trend"} /></h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}> <T text={"Last 7 days revenue"} /> </p>
            </div>
            <LineChart size={18} style={{ color: "var(--gold-500)" }} />
          </div>
          
          <div className="space-y-3">
            {/* Bar chart for daily sales */}
            <div className="flex items-end justify-between gap-1 h-32">
              {dailySales.map((day, idx) => {
                const height = (day.revenue / maxRevenue) * 100;
                const isToday = day.date === today;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full rounded-sm transition-all"
                      style={{ 
                        height: `${height}%`,
                        background: isToday ? "var(--gold-500)" : "var(--navy-700)",
                        minHeight: "4px"
                      }}
                    />
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {<LocalizedDate value={day.date} options={{ weekday: "short" }} />}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <div>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}><T text={"Total"} /></p>
                <p className="text-sm font-semibold">{money(dailySales.reduce((a, d) => a + d.revenue, 0))}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}><T text={"Avg Daily"} /></p>
                <p className="text-sm font-semibold">{money(dailySales.reduce((a, d) => a + d.revenue, 0) / 7)}</p>
              </div>
              <div>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}><T text={"Transactions"} /></p>
                <p className="text-sm font-semibold">{dailySales.reduce((a, d) => a + d.transactions, 0)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stock by Category */}
        <section className="dv-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold"><T text={"Stock by Category"} /></h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {products.length} <T text={"total products"} /> </p>
            </div>
            <BarChart3 size={18} style={{ color: "var(--gold-500)" }} />
          </div>

          {categoryData.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}> <T text={"No products categorized yet"} /> </p>
          ) : (
            <div className="space-y-3">
              {categoryData.map(([category, stock]) => {
                const width = (stock / maxCategoryStock) * 100;
                const color = category === "Uncategorized" ? "var(--border)" : "var(--gold-500)";
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate"><T text={category} /></span>
                      <span className="shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>{stock} <T text={"units"} /></span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: "var(--border)" }}>
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${width}%`, 
                          background: color,
                          minWidth: "4px"
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Lower grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

        {/* Recent sales */}
        <section className="dv-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold"><T text={"Recent sales"} /></h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}><T text={"Latest transactions"} /></p>
            </div>
            <Link href="/sales" className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--gold-500)" }}> <T text={"View all"} /> <ArrowUpRight size={14} />
            </Link>
          </div>

          {sales.length === 0 ? (
            <div className="py-8 text-center" style={{ color: "var(--text-muted)" }}>
              <p className="text-sm"><T text={"No sales recorded yet."} /></p>
              <Link href="/sales" className="mt-2 inline-block text-xs font-semibold" style={{ color: "var(--gold-500)" }}> <T text={"Record your first sale →"} /> </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {sales.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 py-3.5">
                  <div>
                    <b className="block text-sm font-semibold">{s.product_name}</b>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.qty} <T text={"units ·"} /> <T text={s.payment} /> · {<LocalizedDate value={s.created_at} options={{ hour: "2-digit", minute: "2-digit" }} />}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <b className="block text-sm font-semibold">{money(s.total)}</b>
                    <span className={s.status === "Not paid" ? "badge-warn" : s.status === "Returned" ? "badge-returned" : "badge-ok"}>
                      <T text={s.status === "Not paid" ? "Active" : s.status} />
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
              <h2 className="font-semibold"><T text={"Top sellers"} /></h2>
            </div>
            {topSellers.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}><T text={"No data yet"} /></p>
            ) : (
              <div className="space-y-4">
                {topSellers.map(([name, qty]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium truncate">{name}</span>
                      <span className="shrink-0 ml-2" style={{ color: "var(--text-muted)" }}>{qty} <T text={"sold"} /></span>
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
              <h2 className="font-semibold mb-3"><T text={"Stock attention"} /></h2>
              <div className="space-y-2">
                {lowStock.slice(0, 5).map(p => (
                  <div key={p.id} className="flex justify-between rounded-lg px-3 py-2.5 text-sm"
                    style={{ background: "var(--warning-bg)" }}>
                    <span className="font-medium" style={{ color: "var(--warning)" }}>{p.name}</span>
                    <span className="font-semibold" style={{ color: "var(--warning)" }}>{p.stock} <T text={"left"} /></span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {products.length === 0 && (
            <section className="dv-card text-center py-6">
              <p className="text-sm font-medium"><T text={"No products yet"} /></p>
              <Link href="/inventory" className="mt-1 inline-block text-xs font-semibold" style={{ color: "var(--gold-500)" }}> <T text={"Add your first product →"} /> </Link>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
