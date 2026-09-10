"use client";
import { T, useTranslation } from "@/app/components/LanguageProvider";
import BulkProductUpload from "./BulkProductUpload";

import { useMemo, useState, useTransition } from "react";
import { Search, Plus, X, Package, Loader2, AlertCircle, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { addStockEntry, createProduct, editProduct, deleteProduct } from "@/lib/supabase/server-actions";
import type { Product } from "@/lib/supabase/types";

const CATEGORIES = [
  "Beer","Cider","Wine","Spirits","Soft Drink","Water",
  "Juice","Energy Drink","Snacks","Tobacco","Groceries",
  "Dairy","Bread & Bakery","Meat & Fish","Household","Personal Care","Other",
];
const UNITS = ["bottles","cans","packs","cartons","kg","litres","units","pieces","sachets"];
const SIZES = ["small","mid","large"];
const sizeLabel = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

function money(n: number) { return `TZS ${n.toLocaleString("en-TZ")}`; }

const EMPTY_NP = {
  name:"", category:"Beer", customCategory:"",
  stock:"" as string|number, unit:"bottles", size:"",
  cost_price:"" as string|number,
  selling_price:"" as string|number,
  reorder:"10" as string|number,
};

type Modal = "add-stock"|"new-product"|"edit-product"|"delete-product"|null;

export default function InventoryClient({
  initialProducts, branchId,
}: {
  initialProducts: Product[];
  branchId: string;
}) {
  const { t: translateUi } = useTranslation();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showUpload, setShowUpload] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [q, setQ]               = useState("");
  const [filter, setFilter]     = useState("All");
  const [modal, setModal]       = useState<Modal>(null);
  const [error, setError]       = useState<string|null>(null);
  const [pending, start]        = useTransition();

  // Add stock state
  const [selectedId, setSelectedId] = useState(initialProducts[0]?.id ?? "");
  const [qtyToAdd, setQtyToAdd]     = useState(1);
  const [note, setNote]             = useState("");

  // New product state
  const [np, setNp] = useState({...EMPTY_NP});

  // Edit product state
  const [editTarget, setEditTarget] = useState<Product|null>(null);
  const [ep, setEp] = useState({ name:"", category:"", unit:"bottles", size:"", cost_price:"" as string|number, selling_price:"" as string|number, reorder:"" as string|number });

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Product|null>(null);

  const rows = useMemo(() =>
    products.filter(p =>
      p.name.toLowerCase().includes(q.toLowerCase()) &&
      (filter==="All" || (filter==="Low" && p.stock <= p.reorder))
    ), [products, q, filter]);

  function openEdit(p: Product) {
    setEditTarget(p);
    setEp({
      name:          p.name,
      category:      p.category || "Beer",
      unit:          p.unit,
      size:          p.size ?? "",
      cost_price:    p.cost_price ?? 0,
      selling_price: p.selling_price ?? p.price,
      reorder:       p.reorder,
    });
    setError(null);
    setModal("edit-product");
  }

  function handleAddStock(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const fd = new FormData();
    fd.append("product_id", selectedId);
    fd.append("qty",        String(qtyToAdd));
    fd.append("note",       note);
    fd.append("branch_id",  branchId);
    start(async () => {
      const res = await addStockEntry(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      setProducts(ps => ps.map(p => p.id===selectedId
        ? {...p, stock: p.stock+qtyToAdd, updated_at: new Date().toISOString()} : p));
      setQtyToAdd(1); setNote(""); setModal(null);
    });
  }

  function handleNewProduct(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    const cat = np.category==="Other" ? np.customCategory : np.category;
    const cost = Number(np.cost_price), sell = Number(np.selling_price);
    if (!cat.trim())  { setError("Please enter a category."); return; }
    if (cost <= 0)    { setError("Cost price must be > 0."); return; }
    if (sell <= 0)    { setError("Selling price must be > 0."); return; }
    if (sell < cost)  { setError("Selling price should be ≥ cost price."); return; }
    const fd = new FormData();
    fd.append("branch_id",     branchId);
    fd.append("name",          np.name);
    fd.append("category",      cat);
    fd.append("stock",         String(np.stock || 0));
    fd.append("unit",          np.unit);
    fd.append("size",          np.size);
    fd.append("cost_price",    String(cost));
    fd.append("selling_price", String(sell));
    fd.append("reorder",       String(np.reorder || 10));
    start(async () => {
      const res = await createProduct(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      if ("product" in res && res.product) {
        setProducts(ps => [...ps, res.product as Product].sort((a,b)=>a.name.localeCompare(b.name)));
        setSelectedId((res.product as Product).id);
      }
      setNp({...EMPTY_NP}); setModal(null);
    });
  }

  function handleEditProduct(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!editTarget) return;
    const cost = Number(ep.cost_price), sell = Number(ep.selling_price);
    if (sell < cost) { setError("Selling price should be ≥ cost price."); return; }
    const fd = new FormData();
    fd.append("product_id",    editTarget.id);
    fd.append("name",          ep.name);
    fd.append("category",      ep.category);
    fd.append("unit",          ep.unit);
    fd.append("size",          ep.size);
    fd.append("cost_price",    String(cost));
    fd.append("selling_price", String(sell));
    fd.append("reorder",       String(ep.reorder));
    start(async () => {
      const res = await editProduct(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      setProducts(ps => ps.map(p => p.id===editTarget.id
        ? {...p, name:ep.name, category:ep.category, unit:ep.unit,
            size:ep.size, cost_price:cost, selling_price:sell, price:sell, reorder:Number(ep.reorder)}
        : p));
      setModal(null); setEditTarget(null);
    });
  }

  function handleDeleteProduct(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!deleteTarget) return;
    const fd = new FormData();
    fd.append("product_id", deleteTarget.id);
    start(async () => {
      const res = await deleteProduct(fd);
      if ("error" in res && res.error) { setError(res.error); return; }
      setProducts(ps => ps.filter(p => p.id !== deleteTarget.id));
      setModal(null); setDeleteTarget(null);
    });
  }

  const profit_per = (p: Product) => (p.selling_price ?? p.price) - (p.cost_price ?? 0);
  const margin_pct = (p: Product) => {
    const sell = p.selling_price ?? p.price;
    if (!sell) return 0;
    return Math.round(((sell-(p.cost_price??0))/sell)*100);
  };

  const totalStockValue   = products.reduce((a,p) => a+p.stock*(p.cost_price??0), 0);
  const totalSellingValue = products.reduce((a,p) => a+p.stock*(p.selling_price??p.price), 0);
  const lowCount          = products.filter(p => p.stock<=p.reorder).length;

  return (
    <>
      {showUpload && <BulkProductUpload branchId={branchId} products={products} onClose={() => setShowUpload(false)} onImported={added => {
        setProducts(current => [...current, ...added].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedId(current => current || added[0]?.id || "");
        setImportedCount(added.length);
        setQ("");
        setFilter("All");
        setShowUpload(false);
      }} />}
      {importedCount !== null && <p role="status" className="rounded-lg p-3 mb-4 text-sm" style={{ background: "var(--success-bg)", color: "var(--success)" }}>
        {importedCount} {translateUi("products imported successfully", "bidhaa zimepakiwa kwa mafanikio")}
      </p>}
      {/* Action bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => { setImportedCount(null); setShowUpload(true); }}>
            <Plus size={15} /> {translateUi("Upload Excel", "Pakia Excel")}
          </button>
          <button className="btn-ghost" onClick={() => { setModal("new-product"); setError(null); }}>
            <Plus size={15}/> <T text={"New product"} /> </button>
          <button className="btn-gold" onClick={() => { setModal("add-stock"); setError(null); }}>
            <Plus size={15}/> <T text={"Add stock"} /> </button>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-lg px-3"
            style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
            <Search size={15} style={{color:"var(--text-muted)"}}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder={translateUi("Search…")}
              className="h-9 w-40 outline-none bg-transparent text-sm"/>
          </div>
          <div className="flex rounded-lg p-1 gap-1"
            style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
            {["All","Low"].map(v=>(
              <button key={v} onClick={()=>setFilter(v)}
                className="px-3 py-1 rounded-md text-xs font-semibold"
                style={filter===v?{background:"var(--navy-700)",color:"#fff"}:{color:"var(--text-secondary)"}}>
                {v==="Low"?<T text={"Low stock"} />:<T text={"All"} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {label:"Products",   value:String(products.length)},
          {label:"Low stock",  value:String(lowCount), warn:lowCount>0},
          {label:"Cost value", value:money(totalStockValue)},
          {label:"Sell value", value:money(totalSellingValue), gold:true},
        ].map(s=>(
          <div key={s.label} className="rounded-lg px-4 py-3"
            style={{background:s.warn?"var(--warning-bg)":"var(--surface)",border:`1px solid ${s.warn?"#FDE68A":"var(--border)"}`}}>
            <p className="text-xs" style={{color:"var(--text-muted)"}}><T text={s.label} /></p>
            <p className="text-base font-bold mt-0.5"
              style={{color:s.warn?"var(--warning)":s.gold?"var(--gold-500)":"var(--text-primary)"}}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      {products.length===0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-lg dv-card text-center">
          <Package size={36} style={{color:"var(--text-muted)"}} className="mb-3"/>
          <p className="font-semibold"><T text={"No products yet"} /></p>
          <p className="text-sm mt-1" style={{color:"var(--text-muted)"}}><T text={"Add your first product to get started."} /></p>
          <button className="btn-gold mt-4" onClick={()=>{setModal("new-product");setError(null);}}>
            <Plus size={15}/> <T text={"Add product"} /> </button>
        </div>
      ) : (
        <div className="dv-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="dv-table" style={{minWidth:1040}}>
              <thead>
                <tr>
                  <th style={{minWidth:160}}><T text={"Product"} /></th>
                  <th><T text={"Category"} /></th>
                  <th style={{textAlign:"right"}}><T text={"Stock"} /></th>
                  <th><T text={"Unit"} /></th>
                  <th><T text={"Kipimo (Size)"} /></th>
                  <th style={{textAlign:"right"}}><T text={"Cost"} /></th>
                  <th style={{textAlign:"right"}}><T text={"Selling"} /></th>
                  <th style={{textAlign:"right"}}><T text={"Profit/unit"} /></th>
                  <th style={{textAlign:"right"}}><T text={"Margin"} /></th>
                  <th style={{textAlign:"right"}}><T text={"Stock value"} /></th>
                  <th style={{textAlign:"right"}}><T text={"Reorder"} /></th>
                  <th style={{textAlign:"center"}}><T text={"Status"} /></th>
                  <th style={{textAlign:"center"}}><T text={"Actions"} /></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(p=>{
                  const low=p.stock<=p.reorder;
                  const prof=profit_per(p);
                  const mgn=margin_pct(p);
                  return(
                    <tr key={p.id} style={low?{background:"#FFFBEB"}:{}}>
                      <td><span className="font-semibold block">{p.name}</span></td>
                      <td style={{color:"var(--text-secondary)"}}>{p.category||"—"}</td>
                      <td style={{textAlign:"right",fontWeight:700,color:low?"var(--warning)":"var(--text-primary)"}}>{p.stock}</td>
                      <td style={{color:"var(--text-muted)"}}><T text={p.unit} /></td>
                      <td style={{color:"var(--text-secondary)"}}>{p.size ? <T text={sizeLabel(p.size)} /> : <span style={{color:"var(--border)"}}>—</span>}</td>
                      <td style={{textAlign:"right"}}>{money(p.cost_price??0)}</td>
                      <td style={{textAlign:"right",fontWeight:600}}>{money(p.selling_price??p.price)}</td>
                      <td style={{textAlign:"right"}}>
                        <span className="font-semibold" style={{color:prof>=0?"var(--success)":"var(--danger)"}}>
                          {prof>=0?"+":""}{money(prof)}
                        </span>
                      </td>
                      <td style={{textAlign:"right"}}>
                        <span className="text-xs font-semibold rounded-full px-2 py-0.5"
                          style={{background:mgn>=20?"var(--success-bg)":"var(--warning-bg)",color:mgn>=20?"var(--success)":"var(--warning)"}}>
                          {mgn}%
                        </span>
                      </td>
                      <td style={{textAlign:"right"}}>{money(p.stock*(p.cost_price??0))}</td>
                      <td style={{textAlign:"right",color:"var(--text-muted)"}}>{p.reorder}</td>
                      <td style={{textAlign:"center"}}>
                        <span className={low?"badge-warn":"badge-ok"}>{low?<T text={"Low"} />:<T text={"OK"} />}</span>
                      </td>
                      <td style={{textAlign:"center"}}>
                        <div style={{display:"flex",gap:"0.25rem",justifyContent:"center"}}>
                          <button
                            title={translateUi("Add stock")}
                            className="text-xs font-semibold px-2 py-1 rounded-lg"
                            style={{background:"var(--gold-100)",color:"var(--navy-700)"}}
                            onClick={()=>{setSelectedId(p.id);setModal("add-stock");setError(null);}}> <T text={"+Stock"} /> </button>
                          <button
                            title={translateUi("Edit product")}
                            className="text-xs font-semibold px-2 py-1 rounded-lg"
                            style={{background:"#EFF6FF",color:"#1D4ED8"}}
                            onClick={()=>openEdit(p)}>
                            <Pencil size={12}/>
                          </button>
                          <button
                            title={translateUi("Delete product")}
                            className="text-xs font-semibold px-2 py-1 rounded-lg"
                            style={{background:"var(--danger-bg)",color:"var(--danger)"}}
                            onClick={()=>{setDeleteTarget(p);setError(null);setModal("delete-product");}}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {rows.length===0&&(
                  <tr><td colSpan={13} style={{textAlign:"center",padding:"3rem",color:"var(--text-muted)"}}> <T text={"No products match your search."} /> </td></tr>
                )}
              </tbody>
              {rows.length>0&&(
                <tfoot>
                  <tr style={{background:"#F8FAFC",borderTop:"2px solid var(--border)"}}>
                    <td colSpan={2} style={{padding:"0.75rem 1rem",fontWeight:700,fontSize:"0.8125rem"}}> <T text={"Totals ("} />{rows.length})
                    </td>
                    <td style={{textAlign:"right",fontWeight:700,padding:"0.75rem 1rem"}}>
                      {rows.reduce((a,p)=>a+p.stock,0)}
                    </td>
                    <td colSpan={6}/>
                    <td style={{textAlign:"right",fontWeight:700,padding:"0.75rem 1rem",color:"var(--navy-700)"}}>
                      {money(rows.reduce((a,p)=>a+p.stock*(p.cost_price??0),0))}
                    </td>
                    <td colSpan={3}/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── Add stock modal ── */}
      {modal==="add-stock"&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold"><T text={"Add stock"} /></h2>
              <button className="btn-ghost px-2 py-2" onClick={()=>setModal(null)}><X size={18}/></button>
            </div>
            {error&&<ErrorBanner msg={error}/>}
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="form-label"><T text={"Product"} /></label>
                <select className="dv-select" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label"><T text={"Quantity received"} /></label>
                <input required min="1" type="number" className="dv-input" value={qtyToAdd}
                  onChange={e=>setQtyToAdd(+e.target.value)}/>
              </div>
              <div>
                <label className="form-label"><T text={"Note"} /> <span style={{color:"var(--text-muted)",fontWeight:400}}><T text={"(optional)"} /></span></label>
                <input className="dv-input" placeholder={translateUi("Supplier or delivery reference")}
                  value={note} onChange={e=>setNote(e.target.value)}/>
              </div>
              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending?<Loader2 size={17} className="animate-spin"/>:<T text={"Save stock addition"} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── New product modal ── */}
      {modal==="new-product"&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-sheet overflow-y-auto" style={{maxWidth:"32rem",maxHeight:"92dvh"}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold"><T text={"New product"} /></h2>
              <button className="btn-ghost px-2 py-2" onClick={()=>setModal(null)}><X size={18}/></button>
            </div>
            {error&&<ErrorBanner msg={error}/>}
            <form onSubmit={handleNewProduct} className="space-y-4">
              <div>
                <label className="form-label"><T text={"Product name"} /></label>
                <input required className="dv-input" placeholder={translateUi("e.g. Kilimanjaro Lager KB")}
                  value={np.name} onChange={e=>setNp(n=>({...n,name:e.target.value}))}/>
              </div>
              <div>
                <label className="form-label"><T text={"Category"} /></label>
                <select className="dv-select" value={np.category}
                  onChange={e=>setNp(n=>({...n,category:e.target.value,customCategory:""}))}>
                  {CATEGORIES.map(c=><option key={c} value={c}><T text={c} /></option>)}
                </select>
                {np.category==="Other"&&(
                  <input className="dv-input mt-2" placeholder={translateUi("Enter category name")}
                    value={np.customCategory} onChange={e=>setNp(n=>({...n,customCategory:e.target.value}))}/>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label"><T text={"Unit"} /></label>
                  <select className="dv-select" value={np.unit} onChange={e=>setNp(n=>({...n,unit:e.target.value}))}>
                    {UNITS.map(u=><option key={u} value={u}><T text={u} /></option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label"><T text={"Kipimo (Size)"} /></label>
                  <select className="dv-select" value={np.size} onChange={e=>setNp(n=>({...n,size:e.target.value}))}>
                    <option value="">—</option>
                    {SIZES.map(s=><option key={s} value={s}><T text={sizeLabel(s)} /></option>)}
                  </select>
                  <p className="text-xs mt-1" style={{color:"var(--text-muted)"}}><T text={"Small, Mid or Large (optional)"} /></p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label"><T text={"Opening stock"} /></label>
                  <input required type="number" min="0" className="dv-input" placeholder={translateUi("e.g. 24")}
                    value={np.stock} onChange={e=>setNp(n=>({...n,stock:e.target.value}))}/>
                </div>
                <div>
                  <label className="form-label"><T text={"Reorder level"} /></label>
                  <input required type="number" min="0" className="dv-input"
                    placeholder={translateUi("Alert when stock falls below this")}
                    value={np.reorder} onChange={e=>setNp(n=>({...n,reorder:e.target.value}))}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label"><T text={"Cost price (TZS)"} /></label>
                  <input required type="number" min="0" className="dv-input" placeholder={translateUi("Buying price")}
                    value={np.cost_price} onChange={e=>setNp(n=>({...n,cost_price:e.target.value}))}/>
                  <p className="text-xs mt-1" style={{color:"var(--text-muted)"}}><T text={"What you pay supplier"} /></p>
                </div>
                <div>
                  <label className="form-label"><T text={"Selling price (TZS)"} /></label>
                  <input required type="number" min="0" className="dv-input" placeholder={translateUi("Customer price")}
                    value={np.selling_price} onChange={e=>setNp(n=>({...n,selling_price:e.target.value}))}/>
                  <p className="text-xs mt-1" style={{color:"var(--text-muted)"}}><T text={"What you charge"} /></p>
                </div>
              </div>
              {Number(np.cost_price)>0&&Number(np.selling_price)>0&&(
                <div className="rounded-lg px-4 py-3 grid grid-cols-3 gap-2 text-center"
                  style={{background:"var(--gold-100)",border:"1px solid var(--gold-300)"}}>
                  {[
                    {label:"Profit/unit",value:money(Number(np.selling_price)-Number(np.cost_price)),color:Number(np.selling_price)>=Number(np.cost_price)?"var(--success)":"var(--danger)"},
                    {label:"Margin",value:`${Math.round(((Number(np.selling_price)-Number(np.cost_price))/Number(np.selling_price))*100)}%`,color:"var(--navy-700)"},
                    {label:"Stock profit",value:money((Number(np.selling_price)-Number(np.cost_price))*Number(np.stock||0)),color:"var(--navy-700)"},
                  ].map(x=>(
                    <div key={x.label}>
                      <p className="text-xs" style={{color:"var(--text-muted)"}}><T text={x.label} /></p>
                      <p className="font-bold text-sm" style={{color:x.color}}>{x.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <label className="form-label"><T text={"Reorder level"} /></label>
                <input required type="number" min="0" className="dv-input"
                  placeholder={translateUi("Alert when stock falls below this")}
                  value={np.reorder} onChange={e=>setNp(n=>({...n,reorder:e.target.value}))}/>
              </div>
              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending?<Loader2 size={17} className="animate-spin"/>:<T text={"Create product"} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit product modal ── */}
      {modal==="edit-product"&&editTarget&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-sheet overflow-y-auto" style={{maxWidth:"32rem",maxHeight:"92dvh"}} onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold"><T text={"Edit product"} /></h2>
              <button className="btn-ghost px-2 py-2" onClick={()=>setModal(null)}><X size={18}/></button>
            </div>
            {error&&<ErrorBanner msg={error}/>}
            <form onSubmit={handleEditProduct} className="space-y-4">
              <div>
                <label className="form-label"><T text={"Product name"} /></label>
                <input required className="dv-input"
                  value={ep.name} onChange={e=>setEp(v=>({...v,name:e.target.value}))}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label"><T text={"Category"} /></label>
                  <select className="dv-select" value={ep.category}
                    onChange={e=>setEp(v=>({...v,category:e.target.value}))}>
                    {CATEGORIES.map(c=><option key={c} value={c}><T text={c} /></option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label"><T text={"Unit"} /></label>
                  <select className="dv-select" value={ep.unit}
                    onChange={e=>setEp(v=>({...v,unit:e.target.value}))}>
                    {UNITS.map(u=><option key={u} value={u}><T text={u} /></option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label"><T text={"Cost price (TZS)"} /></label>
                  <input required type="number" min="0" className="dv-input"
                    value={ep.cost_price} onChange={e=>setEp(v=>({...v,cost_price:e.target.value}))}/>
                </div>
                <div>
                  <label className="form-label"><T text={"Selling price (TZS)"} /></label>
                  <input required type="number" min="0" className="dv-input"
                    value={ep.selling_price} onChange={e=>setEp(v=>({...v,selling_price:e.target.value}))}/>
                </div>
              </div>
              {Number(ep.cost_price)>0&&Number(ep.selling_price)>0&&(
                <div className="rounded-lg px-4 py-3 flex justify-between"
                  style={{background:"var(--gold-100)",border:"1px solid var(--gold-300)"}}>
                  <span className="text-sm" style={{color:"var(--navy-700)"}}><T text={"New profit/unit"} /></span>
                  <span className="font-bold text-sm" style={{color:Number(ep.selling_price)>=Number(ep.cost_price)?"var(--success)":"var(--danger)"}}>
                    {Number(ep.selling_price)>=Number(ep.cost_price)?"+":""}{money(Number(ep.selling_price)-Number(ep.cost_price))}
                  </span>
                </div>
              )}
              <div>
                <label className="form-label"><T text={"Kipimo (Size)"} /></label>
                <select className="dv-select" value={ep.size}
                  onChange={e=>setEp(v=>({...v,size:e.target.value}))}>
                  <option value="">—</option>
                  {SIZES.map(s=><option key={s} value={s}><T text={sizeLabel(s)} /></option>)}
                </select>
                <p className="text-xs mt-1" style={{color:"var(--text-muted)"}}><T text={"Small, Mid or Large (optional)"} /></p>
              </div>
              <div>
                <label className="form-label"><T text={"Reorder level"} /></label>
                <input required type="number" min="0" className="dv-input"
                  value={ep.reorder} onChange={e=>setEp(v=>({...v,reorder:e.target.value}))}/>
              </div>
              <button type="submit" disabled={pending} className="btn-gold w-full justify-center py-3">
                {pending?<Loader2 size={17} className="animate-spin"/>:<T text={"Save changes"} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {modal==="delete-product"&&deleteTarget&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold"><T text={"Delete product?"} /></h2>
              <button className="btn-ghost px-2 py-2" onClick={()=>setModal(null)}><X size={18}/></button>
            </div>
            {error&&<ErrorBanner msg={error}/>}
            <div className="rounded-lg px-4 py-4 mb-5"
              style={{background:"var(--danger-bg)",border:"1px solid #FECACA"}}>
              <p className="font-semibold text-sm" style={{color:"var(--danger)"}}>{deleteTarget.name}</p>
              <p className="text-xs mt-1" style={{color:"var(--danger)"}}> <T text={"This will hide the product from your inventory. Past sales records are kept intact."} /> </p>
            </div>
            <form onSubmit={handleDeleteProduct} className="flex gap-3">
              <button type="button" className="btn-ghost flex-1 justify-center py-3"
                onClick={()=>setModal(null)}><T text={"Cancel"} /></button>
              <button type="submit" disabled={pending}
                className="flex-1 justify-center py-3 rounded-lg font-semibold text-sm inline-flex items-center gap-2"
                style={{background:"var(--danger)",color:"#fff"}}>
                {pending?<Loader2 size={17} className="animate-spin"/>:<><Trash2 size={15}/><T text={"Delete"} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ErrorBanner({msg}:{msg:string}){
  return(
    <div className="mb-4 flex items-center gap-3 rounded-lg px-4 py-3"
      style={{background:"var(--danger-bg)",border:"1px solid #FECACA"}}>
      <AlertCircle size={15} style={{color:"var(--danger)",flexShrink:0}}/>
      <p className="text-sm" style={{color:"var(--danger)"}}><T text={msg} /></p>
    </div>
  );
}
