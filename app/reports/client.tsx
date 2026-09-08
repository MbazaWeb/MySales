"use client";
import { useState, useTransition } from "react";
import {
  CalendarDays, CheckCircle2, Clock3, Download,
  PackageCheck, Printer, TrendingUp, Loader2, History,
} from "lucide-react";
import { getReportSales, getStockLogs } from "@/lib/supabase/client-actions";
import type { Database } from "@/lib/supabase/types";

type Sale     = Awaited<ReturnType<typeof getReportSales>>[number];
type Product  = Database["public"]["Tables"]["products"]["Row"];
type StockLog = Awaited<ReturnType<typeof getStockLogs>>[number];
type Period   = "Daily"|"Weekly"|"Monthly"|"Custom";

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }

function rangeForPeriod(period: Period, today: string, from: string, to: string): [string,string] {
  const d = new Date(today);
  if (period==="Daily")   return [today, today];
  if (period==="Weekly") {
    const mon = new Date(d); mon.setDate(d.getDate()-d.getDay()+1);
    return [mon.toISOString().slice(0,10), today];
  }
  if (period==="Monthly") return [`${today.slice(0,7)}-01`, today];
  return [from, to];
}

export default function ReportsClient({
  initialSales, products, stockLogs: initialLogs, branchId, today,
}: {
  initialSales: Sale[];
  products:     Product[];
  stockLogs:    StockLog[];
  branchId:     string;
  today:        string;
}) {
  const [period, setPeriod]   = useState<Period>("Daily");
  const [from, setFrom]       = useState(()=>today.slice(0,7)+"-01");
  const [to, setTo]           = useState(today);
  const [sales, setSales]     = useState<Sale[]>(initialSales);
  const [logs, setLogs]       = useState<StockLog[]>(initialLogs);
  const [logFilter, setLogFilter] = useState("All");
  const [pending, start]      = useTransition();

  function loadReport(p: Period, f: string, t: string) {
    const [rangeFrom, rangeTo] = rangeForPeriod(p, today, f, t);
    start(async () => {
      const [data, logData] = await Promise.all([
        getReportSales(branchId, rangeFrom, rangeTo),
        getStockLogs(branchId),
      ]);
      setSales(data);
      setLogs(logData);
    });
  }

  function handlePeriodChange(p: Period) {
    setPeriod(p);
    loadReport(p, from, to);
  }

  const total    = sales.reduce((a,s)=>a+s.total,0);
  const paid     = sales.filter(s=>s.status!=="Not paid").reduce((a,s)=>a+s.total,0);
  const unpaid   = total-paid;
  const profit   = sales.reduce((a,s)=>a+((s as any).profit??0),0);
  const units    = products.reduce((a,p)=>a+p.stock,0);
  const stockVal = products.reduce((a,p)=>a+p.stock*(p.selling_price??p.price),0);
  const low      = products.filter(p=>p.stock<=p.reorder);

  const periodLabel =
    period==="Daily"   ? new Date(today).toLocaleDateString("en-TZ",{day:"numeric",month:"long",year:"numeric"})
    : period==="Weekly"  ? "This week"
    : period==="Monthly" ? new Date(today).toLocaleDateString("en-TZ",{month:"long",year:"numeric"})
    : `${from} – ${to}`;

  const cards = [
    {label:"Total revenue",  value:money(total),    sub:`${sales.length} transactions`, icon:TrendingUp,   accent:true},
    {label:"Collected",      value:money(paid),     sub:"Received",                     icon:CheckCircle2, ok:true},
    {label:"Outstanding",    value:money(unpaid),   sub:"Not yet paid",                 icon:Clock3,       warn:true},
    {label:"Gross profit",   value:money(profit),   sub:"This period",                  icon:TrendingUp,   profit:true},
    {label:"Stock value",    value:money(stockVal), sub:`${units} units on hand`,       icon:PackageCheck, plain:true},
  ];

  // Filter stock logs
  const filteredLogs = logFilter==="All"
    ? logs
    : logs.filter(l => l.movement_type===logFilter);

  const movementTypes = Array.from(new Set(logs.map(l=>l.movement_type)));

  const productMap = Object.fromEntries(products.map(p=>[p.id, p.name]));

  return (
    <>
      {/* Period selector */}
      <div className="dv-card mb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex rounded-lg p-1 gap-1" style={{background:"var(--background)"}}>
            {(["Daily","Weekly","Monthly","Custom"] as Period[]).map(v=>(
              <button key={v} onClick={()=>handlePeriodChange(v)}
                className="whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-colors"
                style={period===v?{background:"var(--navy-700)",color:"#fff"}:{color:"var(--text-secondary)"}}>
                {v}
              </button>
            ))}
          </div>

          {period==="Custom"&&(
            <div className="flex gap-3">
              {([["From",from,setFrom],["To",to,setTo]] as [string,string,(v:string)=>void][]).map(([lbl,val,set])=>((
                <label key={lbl} className="text-xs font-semibold" style={{color:"var(--text-muted)"}}>
                  {lbl}
                  <input type="date" value={val} className="dv-input mt-1 block" style={{width:"auto"}}
                    onChange={e=>{set(e.target.value);loadReport("Custom",lbl==="From"?e.target.value:from,lbl==="To"?e.target.value:to);}}/>
                </label>
              )))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <CalendarDays size={15} style={{color:"var(--text-muted)"}}/>
            <span className="text-sm" style={{color:"var(--text-muted)"}}>{periodLabel}</span>
            {pending&&<Loader2 size={14} className="animate-spin" style={{color:"var(--gold-500)"}}/>}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mb-6">
        {cards.map(c=>{
          const I=c.icon;
          const bg    = c.accent?"var(--navy-700)":c.warn?"var(--warning-bg)":c.ok?"var(--success-bg)":c.profit?"#F0FDF4":"var(--surface)";
          const tc    = c.accent?"#fff":c.warn?"var(--warning)":c.ok?"var(--success)":c.profit?"var(--success)":"var(--text-primary)";
          const sc    = c.accent?"rgba(255,255,255,0.5)":"var(--text-muted)";
          const ic    = c.accent?"var(--gold-500)":c.warn?"var(--warning)":c.ok?"var(--success)":"var(--text-muted)";
          return(
            <article key={c.label} className="rounded-xl px-4 py-4"
              style={{background:bg,border:`1px solid ${c.accent?"var(--navy-500)":"var(--border)"}`}}>
              <div className="flex justify-between"><span className="text-xs font-medium" style={{color:sc}}>{c.label}</span><I size={16} style={{color:ic}}/></div>
              <strong className="mt-2 block text-xl font-bold tracking-tight" style={{color:tc}}>{c.value}</strong>
              <span className="mt-1 block text-xs" style={{color:sc}}>{c.sub}</span>
            </article>
          );
        })}
      </div>

      {/* Detail grid */}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_.6fr] mb-6">
        {/* Sales breakdown */}
        <section className="dv-card p-0">
          <div className="flex items-center justify-between px-5 py-4"
            style={{borderBottom:"1px solid var(--border)"}}>
            <div>
              <h2 className="font-semibold">Sales breakdown</h2>
              <p className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>Paid and outstanding — {periodLabel}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost px-2.5 py-2" onClick={()=>window.print()}><Printer size={16}/></button>
              <button className="btn-ghost px-2.5 py-2" onClick={()=>window.print()}><Download size={16}/></button>
            </div>
          </div>
          {sales.length===0?(
            <div className="py-12 text-center text-sm" style={{color:"var(--text-muted)"}}>No sales in this period.</div>
          ):(
            <table className="dv-table">
              <thead><tr>
                <th>Product</th><th>Status</th>
                <th style={{textAlign:"right"}}>Revenue</th>
                <th style={{textAlign:"right"}}>Profit</th>
              </tr></thead>
              <tbody>
                {sales.map(s=>(
                  <tr key={s.id}>
                    <td>
                      <span className="font-semibold block">{s.product_name}</span>
                      <span className="text-xs" style={{color:"var(--text-muted)"}}>{s.qty} units · {new Date(s.created_at).toLocaleDateString("en-TZ")}</span>
                    </td>
                    <td><span className={s.status==="Not paid"?"badge-warn":"badge-ok"}>{s.status}</span></td>
                    <td style={{textAlign:"right",fontWeight:600}}>{money(s.total)}</td>
                    <td style={{textAlign:"right"}}>
                      <span style={{color:"var(--success)",fontWeight:600}}>
                        +{money((s as any).profit??0)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Stock panel */}
        <section className="dv-card">
          <h2 className="font-semibold mb-1">Stock availability</h2>
          <p className="text-xs mb-4" style={{color:"var(--text-muted)"}}>{products.length} products · {units} units</p>
          {products.length===0?(
            <p className="text-sm text-center py-4" style={{color:"var(--text-muted)"}}>No products yet.</p>
          ):(
            <div className="space-y-3">
              {products.slice(0,8).map(p=>(
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <b className="block truncate text-sm">{p.name}</b>
                    <span className="text-xs" style={{color:"var(--text-muted)"}}>{money(p.stock*(p.selling_price??p.price))}</span>
                  </div>
                  <span className={p.stock<=p.reorder?"badge-warn":"badge-ok"}>
                    {p.stock} {p.stock<=p.reorder?"Low":"Ok"}
                  </span>
                </div>
              ))}
            </div>
          )}
          {low.length>0&&(
            <div className="mt-5 rounded-lg px-3 py-3 text-sm" style={{background:"var(--warning-bg)"}}>
              <b style={{color:"var(--warning)"}}>{low.length} items need restocking.</b>
              <span className="block text-xs mt-0.5" style={{color:"#92400E"}}>Reorder before they run out.</span>
            </div>
          )}
        </section>
      </div>

      {/* ── Stock movement log ── */}
      <section className="dv-card p-0">
        <div className="flex items-center justify-between px-5 py-4"
          style={{borderBottom:"1px solid var(--border)"}}>
          <div className="flex items-center gap-2">
            <History size={17} style={{color:"var(--gold-500)"}}/>
            <div>
              <h2 className="font-semibold">Stock movement log</h2>
              <p className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>All inventory additions and sales deductions</p>
            </div>
          </div>
          {/* Type filter */}
          <div className="flex gap-1">
            {["All",...movementTypes].map(t=>(
              <button key={t} onClick={()=>setLogFilter(t)}
                className="px-3 py-1 rounded-md text-xs font-semibold"
                style={logFilter===t?{background:"var(--navy-700)",color:"#fff"}:{background:"var(--background)",color:"var(--text-secondary)",border:"1px solid var(--border)"}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {filteredLogs.length===0?(
          <div className="py-10 text-center text-sm" style={{color:"var(--text-muted)"}}>
            No stock movements yet.
          </div>
        ):(
          <div className="overflow-x-auto">
            <table className="dv-table">
              <thead><tr>
                <th>Product</th>
                <th>Type</th>
                <th style={{textAlign:"right"}}>Change</th>
                <th style={{textAlign:"right"}}>Balance after</th>
                <th>Note</th>
                <th>Date & time</th>
              </tr></thead>
              <tbody>
                {filteredLogs.map(l=>{
                  const isPositive = l.quantity_delta>0;
                  const typeColor: Record<string,string> = {
                    Opening:"#6366F1", Purchase:"var(--success)",
                    Sale:"var(--warning)", Adjustment:"#F59E0B", Return:"#14B8A6",
                  };
                  return(
                    <tr key={l.id}>
                      <td className="font-medium">{productMap[l.product_id]??l.product_id.slice(0,8)}</td>
                      <td>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{background:`${typeColor[l.movement_type] ?? "#94A3B8"}18`,color:typeColor[l.movement_type]??"var(--text-muted)"}}>
                          {l.movement_type}
                        </span>
                      </td>
                      <td style={{textAlign:"right",fontWeight:700,color:isPositive?"var(--success)":"var(--danger)"}}>
                        {isPositive?"+":""}{l.quantity_delta}
                      </td>
                      <td style={{textAlign:"right",color:"var(--text-secondary)"}}>{l.balance_after}</td>
                      <td style={{color:"var(--text-muted)",fontSize:"0.8rem"}}>{l.note??<span style={{color:"var(--border)"}}>—</span>}</td>
                      <td style={{color:"var(--text-muted)",fontSize:"0.75rem",whiteSpace:"nowrap"}}>
                        {new Date(l.created_at).toLocaleString("en-TZ",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}