"use client";
import { useMemo, useState, useTransition } from "react";
import { Plus, Search, X, Loader2, AlertCircle } from "lucide-react";
import { recordSale } from "@/lib/supabase/actions";
import type { Database } from "@/lib/supabase/types";

type Sale    = Database["public"]["Tables"]["sales"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }
function timeAgo(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-TZ", { hour: "2-digit", minute: "2-digit" });
}

export default function SalesClient({
  initialSales, products, branchId,
}: {
  initialSales: Sale[];
  products:     Product[];
  branchId:     string;
}) {
  const [sales, setSales]       = useState<Sale[]>(initialSales);
  const [show, setShow]         = useState(false);
  const [q, setQ]               = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [qty, setQty]           = useState(1);
  const [payment, setPayment]   = useState("Cash");
  const [error, setError]       = useState<string | null>(null);
  const [pending, start]        = useTransition();

  const selectedProduct = products.find(p => p.id === productId);
  const lineTotal = (selectedProduct?.price ?? 0) * qty;

  const filtered = useMemo(() =>
    sales.filter(s => s.product_name.toLowerCase().includes(q.toLowerCase())),
    [sales, q]
  );

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct) return;
    setError(null);
    const fd = new FormData();
    fd.append("product_id",   productId);
    fd.append("product_name", selectedProduct.name);
    fd.append("qty",          String(qty));
    fd.append("price",        String(selectedProduct.price));
    fd.append("payment",      payment);
    fd.append("branch_id",    branchId);
    start(async () => {
      const res = await recordSale(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      // Optimistic prepend
      const optimistic: Sale = {
        id:           crypto.randomUUID(),
        branch_id:    branchId,
        product_id:   productId,
        product_name: selectedProduct.name,
        qty,
        total:        lineTotal,
        payment,
        status:       payment === "Credit" ? "Not paid" : "Paid",
        sold_by:      null,
        created_at:   new Date().toISOString(),
      };
      setSales(s => [optimistic, ...s]);
      setShow(false);
      setQty(1);
    });
  }

  const action = (
    <button className="btn-gold" onClick={() => { setShow(true); setError(null); }}>
      <Plus size={16} /> New sale
    </button>
  );

  return (
    <>
      <div className="mb-1 flex justify-end">{action}</div>

      {/* Search */}
      <div className="mb-5 flex items-center gap-3 rounded-lg px-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <Search size={17} style={{ color: "var(--text-muted)" }} />
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder="Search by product…"
          className="h-11 w-full outline-none bg-transparent text-sm" />
      </div>

      {/* Table */}
      <div className="dv-card overflow-hidden p-0">
        {sales.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="font-medium">No sales recorded yet</p>
            <p className="text-sm mt-1">Record your first sale to see it here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dv-table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Payment</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>#{s.id.slice(0, 8)}</td>
                    <td className="font-semibold">{s.product_name}</td>
                    <td>{s.qty} units</td>
                    <td>{s.payment}</td>
                    <td style={{ color: "var(--text-muted)" }}>{timeAgo(s.created_at)}</td>
                    <td><span className={s.status === "Not paid" ? "badge-warn" : "badge-ok"}>{s.status}</span></td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{money(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No transactions match your search.
              </div>
            )}
          </div>
        )}
      </div>

      {/* New sale modal */}
      {show && (
        <div className="modal-overlay" onClick={() => setShow(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Record a sale</h2>
              <button className="btn-ghost px-2 py-2" onClick={() => setShow(false)}>
                <X size={18} />
              </button>
            </div>

            {products.length === 0 && (
              <div className="mb-4 rounded-lg px-4 py-3 text-sm"
                style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
                No products found. Add products in Inventory first.
              </div>
            )}

            {error && (
              <div className="mb-4 flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
                <AlertCircle size={15} style={{ color: "var(--danger)", flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">Product</label>
                <select className="dv-select" value={productId} onChange={e => setProductId(e.target.value)}
                  disabled={products.length === 0}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Quantity</label>
                <input type="number" min="1" className="dv-input" value={qty}
                  onChange={e => setQty(+e.target.value)} />
              </div>
              <div>
                <label className="form-label">Payment method</label>
                <select className="dv-select" value={payment} onChange={e => setPayment(e.target.value)}>
                  <option>Cash</option>
                  <option>M-Pesa</option>
                  <option>Airtel Money</option>
                  <option>Mixx by Yas</option>
                  <option>Credit</option>
                </select>
              </div>
              <div className="flex justify-between items-center rounded-lg px-4 py-3"
                style={{ background: "var(--gold-100)", border: "1px solid var(--gold-300)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--navy-700)" }}>Total</span>
                <span className="font-bold text-lg" style={{ color: "var(--navy-700)" }}>{money(lineTotal)}</span>
              </div>
              <button type="submit" disabled={pending || products.length === 0}
                className="btn-gold w-full justify-center py-3">
                {pending ? <Loader2 size={17} className="animate-spin" /> : "Save sale"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
