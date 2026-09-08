"use client";
import { useMemo, useState, useTransition } from "react";
import { Search, Plus, X, History, Package, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { addStockEntry, createProduct } from "@/lib/supabase/actions";
<<<<<<< HEAD
import { useStockLogs } from "@/lib/supabase/hooks";
import type { Database } from "@/lib/supabase/types";
=======
import type { Product } from "@/lib/supabase/types";
>>>>>>> a80a9b0 (feat: cost/selling price, profit tracking, customer fields on sales, excel table inventory)

const CATEGORIES = [
  "Beer", "Cider", "Wine", "Spirits", "Soft Drink", "Water",
  "Juice", "Energy Drink", "Snacks", "Tobacco", "Groceries",
  "Dairy", "Bread & Bakery", "Meat & Fish", "Household",
  "Personal Care", "Other",
];

const UNITS = ["bottles", "cans", "packs", "cartons", "kg", "litres", "units", "pieces", "sachets"];

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }

const EMPTY_NP = { name: "", category: "Beer", customCategory: "", stock: "" as string | number, unit: "bottles", cost_price: "" as string | number, selling_price: "" as string | number, reorder: "10" as string | number };

export default function InventoryClient({
  initialProducts, branchId,
}: {
  initialProducts: Product[];
  branchId: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [q, setQ]               = useState("");
  const [filter, setFilter]     = useState("All");
  const [showLog, setShowLog]   = useState(false);
  const [modal, setModal]       = useState<"add-stock" | "new-product" | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [pending, start]        = useTransition();
  const { logs }                = useStockLogs(branchId);

  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id ?? "");
  const [qtyToAdd, setQtyToAdd]     = useState(1);
  const [note, setNote]             = useState("");
  const [np, setNp]                 = useState({ ...EMPTY_NP });

  const rows = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) &&
      (filter === "All" || (filter === "Low" && p.stock <= p.reorder))
    ), [products, q, filter]);

  function handleAddStock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.append("product_id", selectedId);
    fd.append("qty",        String(qtyToAdd));
    fd.append("note",       note);
    fd.append("branch_id",  branchId);
    start(async () => {
      const res = await addStockEntry(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      setProducts(ps => ps.map(p => p.id === selectedId
        ? { ...p, stock: p.stock + qtyToAdd, updated_at: new Date().toISOString() } : p
      ));
      setQtyToAdd(1); setNote(""); setModal(null);
    });
  }

  function handleNewProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cat = np.category === "Other" ? np.customCategory : np.category;
    const cost  = Number(np.cost_price);
    const sell  = Number(np.selling_price);
    if (!cat.trim())    { setError("Please enter a category."); return; }
    if (cost <= 0)      { setError("Cost price must be greater than 0."); return; }
    if (sell <= 0)      { setError("Selling price must be greater than 0."); return; }
    if (sell < cost)    { setError("Selling price should be ≥ cost price."); return; }
    const fd = new FormData();
    fd.append("branch_id",     branchId);
    fd.append("name",          np.name);
    fd.append("category",      cat);
    fd.append("stock",         String(np.stock || 0));
    fd.append("unit",          np.unit);
    fd.append("cost_price",    String(cost));
    fd.append("selling_price", String(sell));
    fd.append("reorder",       String(np.reorder || 10));
    start(async () => {
      const res = await createProduct(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
<<<<<<< HEAD
      if ("product" in res && res.product) {
        // Append the created row — no full page reload needed
        setProducts(ps => [...ps, res.product].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedId(res.product.id);
      }
      setNp({ name: "", category: "", stock: 0, unit: "bottles", price: 0, reorder: 10 });
      setModal(null);
=======
      setNp({ ...EMPTY_NP });
      setModal(null);
      window.location.reload();
>>>>>>> a80a9b0 (feat: cost/selling price, profit tracking, customer fields on sales, excel table inventory)
    });
  }

  const profit_per = (p: Product) => (p.selling_price ?? p.price) - (p.cost_price ?? 0);
  const margin_pct = (p: Product) => {
    const sell = p.selling_price ?? p.price;
    if (!sell) return 0;
    return Math.round(((sell - (p.cost_price ?? 0)) / sell) * 100);
  };

  const totalStockValue   = products.reduce((a, p) => a + p.stock * (p.cost_price ?? 0), 0);
  const totalSellingValue = products.reduce((a, p) => a + p.stock * (p.selling_price ?? p.price), 0);
  const lowCount          = products.filter(p => p.stock <= p.reorder).length;

  return (
    <>
      {/* Action bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => { setModal("new-product"); setError(null); }}>
            <Plus size={15} /> New product
          </button>
          <button className="btn-gold" onClick={() => { setModal("add-stock"); setError(null); }}>
            <Plus size={15} /> Add stock
          </button>
        </div>
        {/* Search + filter */}
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-lg px-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Search size={15} style={{ color: "var(--text-muted)" }} />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search…"
              className="h-9 w-40 outline-none bg-transparent text-sm" />
          </div>
          <div className="flex rounded-lg p-1 gap-1"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {["All", "Low"].map(v => (
              <button key={v} onClick={() => setFilter(v)}
                className="px-3 py-1 rounded-md text-xs font-semibold"
                style={filter === v
                  ? { background: "var(--navy-700)", color: "#fff" }
                  : { color: "var(--text-secondary)" }}>
                {v === "Low" ? "Low stock" : "All"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Products",    value: String(products.length) },
          { label: "Low stock",   value: String(lowCount),        warn: lowCount > 0 },
          { label: "Cost value",  value: money(totalStockValue) },
          { label: "Sell value",  value: money(totalSellingValue), gold: true },
        ].map(s => (
          <div key={s.label} className="rounded-lg px-4 py-3"
            style={{
              background: s.warn ? "var(--warning-bg)" : "var(--surface)",
              border: `1px solid ${s.warn ? "#FDE68A" : "var(--border)"}`,
            }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-base font-bold mt-0.5"
              style={{ color: s.warn ? "var(--warning)" : s.gold ? "var(--gold-500)" : "var(--text-primary)" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Excel-style table ── */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-lg dv-card text-center">
          <Package size={36} style={{ color: "var(--text-muted)" }} className="mb-3" />
          <p className="font-semibold">No products yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add your first product to get started.</p>
          <button className="btn-gold mt-4" onClick={() => { setModal("new-product"); setError(null); }}>
            <Plus size={15} /> Add product
          </button>
        </div>
      ) : (
        <div className="dv-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="dv-table" style={{ minWidth: "900px" }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 160 }}>Product</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Stock</th>
                  <th>Unit</th>
                  <th style={{ textAlign: "right" }}>Cost price</th>
                  <th style={{ textAlign: "right" }}>Selling price</th>
                  <th style={{ textAlign: "right" }}>Profit / unit</th>
                  <th style={{ textAlign: "right" }}>Margin</th>
                  <th style={{ textAlign: "right" }}>Stock value</th>
                  <th style={{ textAlign: "right" }}>Reorder at</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(p => {
                  const low  = p.stock <= p.reorder;
                  const prof = profit_per(p);
                  const mgn  = margin_pct(p);
                  return (
                    <tr key={p.id} style={low ? { background: "#FFFBEB" } : {}}>
                      <td>
                        <span className="font-semibold block">{p.name}</span>
                        {p.sku && <span className="text-xs" style={{ color: "var(--text-muted)" }}>SKU: {p.sku}</span>}
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{p.category || "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: low ? "var(--warning)" : "var(--text-primary)" }}>
                        {p.stock}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{p.unit}</td>
                      <td style={{ textAlign: "right" }}>{money(p.cost_price ?? 0)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{money(p.selling_price ?? p.price)}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className="font-semibold" style={{ color: prof >= 0 ? "var(--success)" : "var(--danger)" }}>
                          {prof >= 0 ? "+" : ""}{money(prof)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                          style={{ background: mgn >= 20 ? "var(--success-bg)" : "var(--warning-bg)", color: mgn >= 20 ? "var(--success)" : "var(--warning)" }}>
                          {mgn}%
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>{money(p.stock * (p.cost_price ?? 0))}</td>
                      <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{p.reorder}</td>
                      <td style={{ textAlign: "center" }}>
                        <span className={low ? "badge-warn" : "badge-ok"}>{low ? "Low" : "OK"}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="text-xs font-semibold px-3 py-1 rounded-lg"
                          style={{ background: "var(--gold-100)", color: "var(--navy-700)" }}
                          onClick={() => { setSelectedId(p.id); setModal("add-stock"); setError(null); }}>
                          + Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                      No products match your search.
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Totals footer */}
              {rows.length > 0 && (
                <tfoot>
                  <tr style={{ background: "#F8FAFC", borderTop: "2px solid var(--border)" }}>
                    <td colSpan={2} style={{ padding: "0.75rem 1rem", fontWeight: 700, fontSize: "0.8125rem" }}>
                      Totals ({rows.length} products)
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, padding: "0.75rem 1rem" }}>
                      {rows.reduce((a, p) => a + p.stock, 0)}
                    </td>
                    <td colSpan={4} />
                    <td colSpan={2} />
                    <td style={{ textAlign: "right", fontWeight: 700, padding: "0.75rem 1rem", color: "var(--navy-700)" }}>
                      {money(rows.reduce((a, p) => a + p.stock * (p.cost_price ?? 0), 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Stock log */}
      <section className="dv-card mt-6">
        <button className="flex w-full items-center justify-between text-left" onClick={() => setShowLog(!showLog)}>
          <span className="flex items-center gap-2 font-semibold">
            <History size={17} style={{ color: "var(--gold-500)" }} />
            Stock addition log
          </span>
          <ChevronDown size={16} style={{ color: "var(--gold-500)", transform: showLog ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
        </button>
        {showLog && (
<<<<<<< HEAD
          logs.length === 0 ? (
            <p className="mt-4 text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              No stock movements yet. Add stock or record a sale to see the log.
            </p>
          ) : (
            <ul className="mt-4 divide-y" style={{ borderColor: "var(--border)" }}>
              {logs.slice(0, 8).map(l => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <b className="block text-sm font-medium truncate">
                      {products.find(p => p.id === l.product_id)?.name ?? "Product"}
                    </b>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {l.movement_type}{l.note ? ` · ${l.note}` : ""} · {new Date(l.created_at).toLocaleString("en-TZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold"
                    style={{ color: l.quantity_delta > 0 ? "var(--success, #16A34A)" : "var(--danger, #DC2626)" }}>
                    {l.quantity_delta > 0 ? "+" : ""}{l.quantity_delta}
                  </span>
                </li>
              ))}
            </ul>
          )
=======
          <p className="mt-4 text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
            All stock movements are recorded in the <code className="text-xs">stock_logs</code> Supabase table automatically.
          </p>
>>>>>>> a80a9b0 (feat: cost/selling price, profit tracking, customer fields on sales, excel table inventory)
        )}
      </section>

      {/* ── Add stock modal ── */}
      {modal === "add-stock" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add stock</h2>
              <button className="btn-ghost px-2 py-2" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            {error && <ErrorBanner msg={error} />}
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="form-label">Product</label>
                <select className="dv-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Quantity received</label>
                <input required min="1" type="number" className="dv-input" value={qtyToAdd}
                  onChange={e => setQtyToAdd(+e.target.value)} />
              </div>
              <div>
                <label className="form-label">Note <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span></label>
                <input className="dv-input" placeholder="Supplier or delivery reference"
                  value={note} onChange={e => setNote(e.target.value)} />
              </div>
              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending ? <Loader2 size={17} className="animate-spin" /> : "Save stock addition"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── New product modal ── */}
      {modal === "new-product" && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-sheet" style={{ maxWidth: "32rem" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">New product</h2>
              <button className="btn-ghost px-2 py-2" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            {error && <ErrorBanner msg={error} />}
            <form onSubmit={handleNewProduct} className="space-y-4">

              {/* Name */}
              <div>
                <label className="form-label">Product name</label>
                <input required className="dv-input" placeholder="e.g. Kilimanjaro Lager KB"
                  value={np.name} onChange={e => setNp(n => ({ ...n, name: e.target.value }))} />
              </div>

              {/* Category dropdown */}
              <div>
                <label className="form-label">Category</label>
                <select className="dv-select" value={np.category}
                  onChange={e => setNp(n => ({ ...n, category: e.target.value, customCategory: "" }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {np.category === "Other" && (
                  <input className="dv-input mt-2" placeholder="Enter category name"
                    value={np.customCategory}
                    onChange={e => setNp(n => ({ ...n, customCategory: e.target.value }))} />
                )}
              </div>

              {/* Unit + opening stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Unit</label>
                  <select className="dv-select" value={np.unit}
                    onChange={e => setNp(n => ({ ...n, unit: e.target.value }))}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Opening stock</label>
                  <input required type="number" min="0" className="dv-input" placeholder="e.g. 24"
                    value={np.stock}
                    onChange={e => setNp(n => ({ ...n, stock: e.target.value }))} />
                </div>
              </div>

              {/* Cost price + Selling price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Cost price (TZS)</label>
                  <input required type="number" min="0" className="dv-input" placeholder="Buying price"
                    value={np.cost_price}
                    onChange={e => setNp(n => ({ ...n, cost_price: e.target.value }))} />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>What you pay the supplier</p>
                </div>
                <div>
                  <label className="form-label">Selling price (TZS)</label>
                  <input required type="number" min="0" className="dv-input" placeholder="Customer price"
                    value={np.selling_price}
                    onChange={e => setNp(n => ({ ...n, selling_price: e.target.value }))} />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>What you charge customers</p>
                </div>
              </div>

              {/* Profit preview */}
              {Number(np.cost_price) > 0 && Number(np.selling_price) > 0 && (
                <div className="rounded-lg px-4 py-3 grid grid-cols-3 gap-2 text-center"
                  style={{ background: "var(--gold-100)", border: "1px solid var(--gold-300)" }}>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Profit / unit</p>
                    <p className="font-bold text-sm" style={{ color: Number(np.selling_price) >= Number(np.cost_price) ? "var(--success)" : "var(--danger)" }}>
                      {money(Number(np.selling_price) - Number(np.cost_price))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Margin</p>
                    <p className="font-bold text-sm" style={{ color: "var(--navy-700)" }}>
                      {Number(np.selling_price) > 0
                        ? Math.round(((Number(np.selling_price) - Number(np.cost_price)) / Number(np.selling_price)) * 100)
                        : 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Stock profit</p>
                    <p className="font-bold text-sm" style={{ color: "var(--navy-700)" }}>
                      {money((Number(np.selling_price) - Number(np.cost_price)) * Number(np.stock || 0))}
                    </p>
                  </div>
                </div>
              )}

              {/* Reorder level */}
              <div>
                <label className="form-label">Reorder level</label>
                <input required type="number" min="0" className="dv-input"
                  placeholder="Alert when stock falls below this"
                  value={np.reorder}
                  onChange={e => setNp(n => ({ ...n, reorder: e.target.value }))} />
              </div>

              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending ? <Loader2 size={17} className="animate-spin" /> : "Create product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg px-4 py-3"
      style={{ background: "var(--danger-bg)", border: "1px solid #FECACA" }}>
      <AlertCircle size={15} style={{ color: "var(--danger)", flexShrink: 0 }} />
      <p className="text-sm" style={{ color: "var(--danger)" }}>{msg}</p>
    </div>
  );
}
