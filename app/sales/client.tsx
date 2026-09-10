"use client";
import { T, useTranslation } from "@/app/components/LanguageProvider";

import { useMemo, useState, useTransition } from "react";
import { Plus, Search, X, Loader2, AlertCircle, User, Phone, CheckCircle2, RotateCcw, PackageCheck } from "lucide-react";
import { recordSale, markSalePaid, returnSale } from "@/lib/supabase/server-actions";
import type { Sale, Product } from "@/lib/supabase/types";

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }
function fmt(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

const MOBILE_PAYMENTS = ["M-Pesa", "Airtel Money", "Mixx by Yas", "Bank Transfer", "Tigopesa"];

/** Unpaid sales are shown as "Active". */
function statusLabel(status: string) {
  return status === "Not paid" ? "Active" : status;
}
function statusBadgeClass(status: string) {
  if (status === "Not paid") return "badge-warn";
  if (status === "Returned") return "badge-returned";
  return "badge-ok";
}

export default function SalesClient({
  initialSales, products, branchId,
}: {
  initialSales: Sale[];
  products:     Product[];
  branchId:     string;
}) {
  const { t: translateUi, locale } = useTranslation();
  const [sales, setSales]         = useState<Sale[]>(initialSales);
  const [show, setShow]           = useState(false);
  const [q, setQ]                 = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty]             = useState(1);
  const [payment, setPayment]     = useState("Cash");
  const [custName, setCustName]   = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [error, setError]         = useState<string | null>(null);
  const [pending, start]          = useTransition();

  const selectedProduct   = products.find(p => p.id === productId);
  const sellingPrice      = selectedProduct?.selling_price ?? selectedProduct?.price ?? 0;
  const costPrice         = selectedProduct?.cost_price ?? 0;
  const lineTotal         = sellingPrice * qty;
  const lineProfit        = (sellingPrice - costPrice) * qty;
  const needsCustomer     = MOBILE_PAYMENTS.includes(payment);

  const filtered = useMemo(() =>
    sales.filter(s => s.product_name.toLowerCase().includes(q.toLowerCase())),
    [sales, q]
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    if (needsCustomer && !custName.trim()) {
      setError("Customer name is required for mobile payments.");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.append("product_id",     productId);
    fd.append("qty",            String(qty));
    fd.append("payment",        payment);
    fd.append("customer_name",  custName.trim());
    fd.append("customer_phone", custPhone.trim());
    start(async () => {
      const res = await recordSale(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      const optimistic: Sale = {
        id:             crypto.randomUUID(),
        branch_id:      branchId,
        product_id:     productId,
        product_name:   selectedProduct.name,
        qty,
        unit_price:     sellingPrice,
        cost_price:     costPrice,
        total:          lineTotal,
        profit:         lineProfit,
        payment,
        status:         payment === "Credit" ? "Not paid" : "Paid",
        customer_name:  custName.trim() || null,
        customer_phone: custPhone.trim() || null,
        sold_by:        null,
        created_at:     new Date().toISOString(),
      };
      setSales(s => [optimistic, ...s]);
      setShow(false);
      setQty(1);
      setCustName("");
      setCustPhone("");
    });
  }

  const totalRevenue = sales.filter(s => s.status !== "Returned").reduce((a, s) => a + s.total, 0);
  const totalProfit  = sales.filter(s => s.status !== "Returned").reduce((a, s) => a + (s.profit ?? 0), 0);
  const activeCount  = sales.filter(s => s.status === "Not paid").length;
  const returnedCount = sales.filter(s => s.status === "Returned").length;

  function handleMarkPaid(sale: Sale) {
    setError(null);
    const fd = new FormData();
    fd.append("sale_id", sale.id);
    start(async () => {
      const res = await markSalePaid(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      setSales(list => list.map(x => x.id === sale.id ? { ...x, status: "Paid" as const } : x));
    });
  }

  function handleReturn(sale: Sale) {
    setError(null);
    const fd = new FormData();
    fd.append("sale_id", sale.id);
    start(async () => {
      const res = await returnSale(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      setSales(list => list.map(x => x.id === sale.id ? { ...x, status: "Returned" as const } : x));
    });
  }

  return (
    <>
      {/* Header action */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Summary pills */}
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg px-4 py-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}><T text={"Revenue"} /></p>
            <p className="font-bold text-sm">{money(totalRevenue)}</p>
          </div>
          <div className="rounded-lg px-4 py-2" style={{ background: "var(--success-bg)", border: "1px solid #BBF7D0" }}>
            <p className="text-xs" style={{ color: "var(--success)" }}><T text={"Profit"} /></p>
            <p className="font-bold text-sm" style={{ color: "var(--success)" }}>{money(totalProfit)}</p>
          </div>
          {activeCount > 0 && (
            <div className="rounded-lg px-4 py-2" style={{ background: "var(--warning-bg)", border: "1px solid #FDE68A" }}>
              <p className="text-xs" style={{ color: "var(--warning)" }}><T text={"Active"} /></p>
              <p className="font-bold text-sm" style={{ color: "var(--warning)" }}>{activeCount}</p>
            </div>
          )}
          {returnedCount > 0 && (
            <div className="rounded-lg px-4 py-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}><T text={"Returned"} /></p>
              <p className="font-bold text-sm">{returnedCount}</p>
            </div>
          )}
        </div>
        <button className="btn-gold" onClick={() => { setShow(true); setError(null); }}>
          <Plus size={16} /> <T text={"New sale"} /> </button>
      </div>

      {/* Search */}
      <div className="mb-5 flex items-center gap-3 rounded-lg px-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <Search size={17} style={{ color: "var(--text-muted)" }} />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder={translateUi("Search by product or customer…")}
          className="h-11 w-full outline-none bg-transparent text-sm" />
      </div>

      {/* Sales table */}
      <div className="dv-card overflow-hidden p-0">
        {sales.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="font-medium"><T text={"No sales recorded yet"} /></p>
            <p className="text-sm mt-1"><T text={"Record your first sale to see it here."} /></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dv-table" style={{ minWidth: "980px" }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th><T text={"Product"} /></th>
                  <th style={{ textAlign: "right" }}><T text={"Qty"} /></th>
                  <th style={{ textAlign: "right" }}><T text={"Unit price"} /></th>
                  <th><T text={"Payment"} /></th>
                  <th><T text={"Customer"} /></th>
                  <th><T text={"Time"} /></th>
                  <th><T text={"Status"} /></th>
                  <th style={{ textAlign: "right" }}><T text={"Total"} /></th>
                  <th style={{ textAlign: "right" }}><T text={"Profit"} /></th>
                  <th style={{ textAlign: "center" }}><T text={"Actions"} /></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                      {s.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td className="font-semibold">{s.product_name}</td>
                    <td style={{ textAlign: "right" }}>{s.qty}</td>
                    <td style={{ textAlign: "right" }}>{money(s.unit_price)}</td>
                    <td><T text={s.payment} /></td>
                    <td>
                      {s.customer_name ? (
                        <div>
                          <span className="block text-sm font-medium">{s.customer_name}</span>
                          {s.customer_phone && (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.customer_phone}</span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{fmt(s.created_at, locale)}</td>
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <span className={statusBadgeClass(s.status)}><T text={statusLabel(s.status)} /></span>
                        {s.status === "Returned" && (
                          <span className="badge-returned inline-flex items-center gap-1">
                            <PackageCheck size={11} /> <T text={"Stock returned"} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      {s.status === "Returned" ? (
                        <span style={{ color: "var(--text-muted)", textDecoration: "line-through" }}>{money(s.total)}</span>
                      ) : money(s.total)}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {s.status === "Returned" ? (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      ) : s.profit != null ? (
                        <span className="font-semibold text-sm"
                          style={{ color: s.profit >= 0 ? "var(--success)" : "var(--danger)" }}>
                          {s.profit >= 0 ? "+" : ""}{money(s.profit)}
                        </span>
                      ) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {s.status === "Returned" ? (
                        <span style={{ color: "var(--border)" }}>—</span>
                      ) : (
                        <div style={{ display: "flex", gap: "0.25rem", justifyContent: "center" }}>
                          {s.status === "Not paid" && (
                            <button
                              title={translateUi("Mark paid")}
                              disabled={pending}
                              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg disabled:opacity-50"
                              style={{ background: "var(--success-bg)", color: "var(--success)" }}
                              onClick={() => handleMarkPaid(s)}>
                              <CheckCircle2 size={12} /> <T text={"Mark paid"} />
                            </button>
                          )}
                          <button
                            title={translateUi("Return — restock items")}
                            disabled={pending}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg disabled:opacity-50"
                            style={{ background: "#EFF6FF", color: "#1D4ED8" }}
                            onClick={() => handleReturn(s)}>
                            <RotateCcw size={12} /> <T text={"Return"} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && q && (
              <div className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}> <T text={"No transactions match your search."} /> </div>
            )}
          </div>
        )}
      </div>

      {/* ── New sale modal ── */}
      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold"><T text={"Record a sale"} /></h2>
              <button className="btn-ghost px-2 py-2" onClick={() => setShow(false)}>
                <X size={18} />
              </button>
            </div>

            {products.length === 0 && (
              <div className="mb-4 rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--warning-bg)", color: "var(--warning)" }}> <T text={"No products found. Add products in Inventory first."} /> </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
                <AlertCircle size={15} style={{ color: "var(--danger)", flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--danger)" }}><T text={error} /></p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {/* Product */}
              <div>
                <label className="form-label"><T text={"Product"} /></label>
                <select className="dv-select" value={productId}
                  onChange={e => setProductId(e.target.value)}
                  disabled={products.length === 0}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {money(p.selling_price ?? p.price)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Qty */}
              <div>
                <label className="form-label"><T text={"Quantity"} /></label>
                <input type="number" min="1" required className="dv-input" value={qty}
                  onChange={e => setQty(+e.target.value)} />
              </div>

              {/* Payment */}
              <div>
                <label className="form-label"><T text={"Payment method"} /></label>
                <select className="dv-select" value={payment}
                  onChange={e => { setPayment(e.target.value); setCustName(""); setCustPhone(""); }}>
                  <option value="Cash"><T text={"Cash"} /></option>
                  {MOBILE_PAYMENTS.map(m => <option key={m} value={m}><T text={m} /></option>)}
                  <option value="Credit"><T text={"Credit"} /></option>
                </select>
              </div>

              {/* Customer info — shown for mobile payments */}
              {needsCustomer && (
                <div className="rounded-lg p-4 space-y-3"
                  style={{ background: "var(--background)", border: "1px solid var(--gold-300)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--gold-500)" }}> <T text={"Customer details required for"} /> <T text={payment} />
                  </p>
                  <div>
                    <label className="form-label flex items-center gap-1">
                      <User size={13} /> <T text={"Customer name"} /> <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <input required className="dv-input" placeholder={translateUi("Full name")}
                      value={custName} onChange={e => setCustName(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label flex items-center gap-1">
                      <Phone size={13} /> <T text={"Phone number"} /> <span style={{ color: "var(--text-muted)", fontWeight: 400 }}><T text={"(optional)"} /></span>
                    </label>
                    <input className="dv-input" placeholder={translateUi("+255 7••  •••  •••")}
                      value={custPhone} onChange={e => setCustPhone(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Also show for Credit */}
              {payment === "Credit" && (
                <div className="rounded-lg p-4 space-y-3"
                  style={{ background: "var(--warning-bg)", border: "1px solid #FDE68A" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--warning)" }}> <T text={"Credit sale — record customer for follow-up"} /> </p>
                  <div>
                    <label className="form-label flex items-center gap-1">
                      <User size={13} /> <T text={"Customer name"} /> </label>
                    <input className="dv-input" placeholder={translateUi("Who owes this payment?")}
                      value={custName} onChange={e => setCustName(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label flex items-center gap-1">
                      <Phone size={13} /> <T text={"Phone number"} /> </label>
                    <input className="dv-input" placeholder={translateUi("+255 7••  •••  •••")}
                      value={custPhone} onChange={e => setCustPhone(e.target.value)} />
                  </div>
                </div>
              )}

              {/* Total + profit preview */}
              <div className="rounded-lg px-4 py-3"
                style={{ background: "var(--gold-100)", border: "1px solid var(--gold-300)" }}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: "var(--navy-700)" }}><T text={"Total"} /></span>
                  <span className="font-bold text-lg" style={{ color: "var(--navy-700)" }}>{money(lineTotal)}</span>
                </div>
                {costPrice > 0 && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}><T text={"Profit on this sale"} /></span>
                    <span className="text-sm font-semibold"
                      style={{ color: lineProfit >= 0 ? "var(--success)" : "var(--danger)" }}>
                      {lineProfit >= 0 ? "+" : ""}{money(lineProfit)}
                    </span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={pending || products.length === 0}
                className="btn-gold w-full justify-center py-3">
                {pending ? <Loader2 size={17} className="animate-spin" /> : <T text={"Save sale"} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}