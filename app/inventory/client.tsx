"use client";
import { useMemo, useState, useTransition } from "react";
import { Search, Plus, X, History, Package, Loader2, AlertCircle } from "lucide-react";
import { addStockEntry, createProduct } from "@/lib/supabase/actions";
import type { Database } from "@/lib/supabase/types";

type Product  = Database["public"]["Tables"]["products"]["Row"];

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }

export default function InventoryClient({
  initialProducts, branchId,
}: {
  initialProducts: Product[];
  branchId: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [q, setQ]               = useState("");
  const [filter, setFilter]     = useState("All");
  const [showLog, setShowLog]   = useState(true);
  const [modal, setModal]       = useState<"add-stock" | "new-product" | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [pending, start]        = useTransition();

  // Selected product for add-stock modal
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id ?? "");
  const [qtyToAdd, setQtyToAdd]     = useState(1);
  const [note, setNote]             = useState("");

  // New product fields
  const [np, setNp] = useState({ name: "", category: "", stock: 0, unit: "bottles", price: 0, reorder: 10 });

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
      // optimistic update
      setProducts(ps => ps.map(p => p.id === selectedId
        ? { ...p, stock: p.stock + qtyToAdd, updated_at: new Date().toISOString() }
        : p
      ));
      setQtyToAdd(1); setNote(""); setModal(null);
    });
  }

  function handleNewProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.append("branch_id", branchId);
    fd.append("name",      np.name);
    fd.append("category",  np.category);
    fd.append("stock",     String(np.stock));
    fd.append("unit",      np.unit);
    fd.append("price",     String(np.price));
    fd.append("reorder",   String(np.reorder));
    start(async () => {
      const res = await createProduct(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      // full reload from server not needed — router.refresh() would work; for now add optimistic placeholder
      setNp({ name: "", category: "", stock: 0, unit: "bottles", price: 0, reorder: 10 });
      setModal(null);
      // trigger soft refresh
      window.location.reload();
    });
  }

  const actionBar = (
    <div className="flex gap-2">
      <button className="btn-ghost" onClick={() => { setModal("new-product"); setError(null); }}>
        <Plus size={15} /> New product
      </button>
      <button className="btn-gold" onClick={() => { setModal("add-stock"); setError(null); }}>
        <Plus size={15} /> Add stock
      </button>
    </div>
  );

  return (
    <>
      {/* inject action into AppShell via slot — rendered as children header addon */}
      <div className="mb-1 flex justify-end">{actionBar}</div>

      {/* Controls */}
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-3 rounded-lg px-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Search size={17} style={{ color: "var(--text-muted)" }} />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search inventory…"
            className="h-11 w-full outline-none bg-transparent text-sm" />
        </div>
        <div className="flex rounded-lg p-1 gap-1"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {["All", "Low"].map(v => (
            <button key={v} onClick={() => setFilter(v)}
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors"
              style={filter === v
                ? { background: "var(--navy-700)", color: "#fff" }
                : { color: "var(--text-secondary)" }}>
              {v === "Low" ? "Low stock" : "All items"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Products",       value: products.length },
          { label: "Units in stock", value: products.reduce((a, p) => a + p.stock, 0) },
          { label: "Low stock",      value: products.filter(p => p.stock <= p.reorder).length },
        ].map(s => (
          <div key={s.label} className="rounded-lg px-4 py-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-xl font-bold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Product grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-lg dv-card text-center">
          <Package size={36} style={{ color: "var(--text-muted)" }} className="mb-3" />
          <p className="font-semibold">No products yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Add your first product to get started.</p>
          <button className="btn-gold mt-4" onClick={() => setModal("new-product")}>
            <Plus size={15} /> Add product
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map(p => {
            const low = p.stock <= p.reorder;
            return (
              <article key={p.id} className="dv-card" style={{ borderColor: low ? "#FDE68A" : "var(--border)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-sm">{p.name}</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {p.category} · {money(p.price)}
                    </p>
                  </div>
                  <span className={low ? "badge-warn" : "badge-ok"}>{low ? "Low" : "In stock"}</span>
                </div>
                <div className="mt-4 pt-4 flex items-end justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                  <div>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Available</span>
                    <strong className="block text-2xl font-bold">
                      {p.stock}{" "}
                      <small className="text-sm font-normal" style={{ color: "var(--text-muted)" }}>{p.unit}</small>
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Stock value</span>
                    <b className="block text-sm font-semibold">{money(p.stock * p.price)}</b>
                  </div>
                </div>
                <button
                  className="mt-3 w-full text-xs font-semibold py-1.5 rounded-lg transition-colors"
                  style={{ background: "var(--gold-100)", color: "var(--navy-700)" }}
                  onClick={() => { setSelectedId(p.id); setModal("add-stock"); setError(null); }}
                >
                  + Add stock
                </button>
              </article>
            );
          })}
          {rows.length === 0 && (
            <div className="col-span-3 text-center py-12" style={{ color: "var(--text-muted)" }}>
              No products match your search.
            </div>
          )}
        </div>
      )}

      {/* Stock log placeholder */}
      <section className="dv-card mt-6">
        <button className="flex w-full items-center justify-between text-left" onClick={() => setShowLog(!showLog)}>
          <span className="flex items-center gap-2 font-semibold">
            <History size={17} style={{ color: "var(--gold-500)" }} />
            Stock addition log
          </span>
          <span className="text-xs font-semibold" style={{ color: "var(--gold-500)" }}>{showLog ? "Hide" : "Show"}</span>
        </button>
        {showLog && (
          <p className="mt-4 text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
            Stock logs are stored in Supabase and visible in the <code className="text-xs">stock_logs</code> table.
            Connect the <code className="text-xs">useStockLogs</code> hook from <code className="text-xs">lib/supabase/hooks.ts</code> to display them here.
          </p>
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
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">New product</h2>
              <button className="btn-ghost px-2 py-2" onClick={() => setModal(null)}><X size={18} /></button>
            </div>
            {error && <ErrorBanner msg={error} />}
            <form onSubmit={handleNewProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="form-label">Product name</label>
                  <input required className="dv-input" placeholder="e.g. Kilimanjaro Lager KB"
                    value={np.name} onChange={e => setNp(n => ({ ...n, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <input required className="dv-input" placeholder="e.g. Beer"
                    value={np.category} onChange={e => setNp(n => ({ ...n, category: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Unit</label>
                  <select className="dv-select" value={np.unit} onChange={e => setNp(n => ({ ...n, unit: e.target.value }))}>
                    <option>bottles</option><option>cans</option><option>packs</option>
                    <option>kg</option><option>litres</option><option>units</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Price (TZS)</label>
                  <input required type="number" min="0" className="dv-input" placeholder="e.g. 3000"
                    value={np.price || ""} onChange={e => setNp(n => ({ ...n, price: +e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Opening stock</label>
                  <input required type="number" min="0" className="dv-input" placeholder="e.g. 24"
                    value={np.stock || ""} onChange={e => setNp(n => ({ ...n, stock: +e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="form-label">Reorder level</label>
                  <input required type="number" min="0" className="dv-input" placeholder="Alert when stock falls below this"
                    value={np.reorder || ""} onChange={e => setNp(n => ({ ...n, reorder: +e.target.value }))} />
                </div>
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
