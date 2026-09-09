"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload, X, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "../components/LanguageProvider";
import { importProducts } from "@/lib/supabase/bulk-products";
import { MAX_IMPORT_BYTES, parseProductSheet, productTemplateData, PRODUCT_COLUMNS, type ImportResult } from "@/lib/product-import";
import type { Product } from "@/lib/supabase/types";

export default function BulkProductUpload({ branchId, products, onClose, onImported }: {
  branchId: string; products: Product[]; onClose: () => void; onImported: (products: Product[]) => void;
}) {
  const { t, locale } = useTranslation();
  const dialog = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { dialog.current?.showModal(); }, []);

  async function downloadTemplate() {
    setError(null);
    setBusy(true);
    try {
      const { default: writeExcelFile } = await import("write-excel-file/browser");
      await writeExcelFile(productTemplateData(), { sheet: "Products", columns: PRODUCT_COLUMNS.map(() => ({ width: 24 })), stickyRowsCount: 1 }).toFile("DukaVerse-products-template.xlsx");
    } catch { setError("Could not download the template. Please try again."); }
    finally { setBusy(false); }
  }

  async function readFile(file: File) {
    setPreview(null);
    setError(null);
    setFilename(file.name);
    if (!/\.xlsx$/i.test(file.name)) { setError("Choose an Excel .xlsx file. Save older .xls files as .xlsx first."); return; }
    if (file.size > MAX_IMPORT_BYTES) { setError("The file must be 5 MB or smaller."); return; }
    setBusy(true);
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const sheet = await readSheet(file, 1);
      setPreview(parseProductSheet(sheet, products.map(product => product.name)));
    } catch { setError("Could not read this workbook. Use an unprotected .xlsx file and try again."); }
    finally { setBusy(false); }
  }

  async function save() {
    if (inFlight.current || !preview?.products.length || preview.issues.length) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await importProducts(branchId, preview.products);
      if (!result.success) {
        setError(result.error);
        if (result.issues) setPreview({ ...preview, issues: result.issues });
        return;
      }
      onImported(result.products);
    } catch { setError("Could not confirm the import. Refresh Inventory before retrying to avoid duplicates."); }
    finally { inFlight.current = false; setBusy(false); }
  }

  const ready = preview && preview.products.length > 0 && preview.issues.length === 0;
  return (
    <dialog ref={dialog} aria-labelledby="bulk-upload-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      className="m-auto w-[calc(100%_-_2rem)] max-w-4xl max-h-[90dvh] overflow-y-auto rounded-xl p-0 backdrop:bg-black/50"
      style={{ background: "var(--surface)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
      <div className="p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="bulk-upload-title" className="text-lg font-bold">{t("Upload products from Excel", "Pakia bidhaa kutoka Excel")}</h2>
          <button type="button" className="btn-ghost p-2" disabled={busy} onClick={onClose} aria-label={t("Close", "Funga")}><X size={18} /></button>
        </div>
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
          {t("Add new products to the current branch. Existing products are not changed.", "Ongeza bidhaa mpya kwenye tawi hili. Bidhaa zilizopo hazitabadilishwa.")}
        </p>
        <ol className="list-decimal pl-5 space-y-1 text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          <li>{t("Download the template and fill one product per row, starting on row 2.", "Pakua kiolezo na ujaze bidhaa moja kwa kila mstari, kuanzia mstari wa 2.")}</li>
          <li>{t("Keep the headers on row 1. Only the first worksheet is imported. Maximum 500 products and 5 MB.", "Acha vichwa kwenye mstari wa 1. Karatasi ya kwanza pekee itapakiwa. Kiwango cha juu ni bidhaa 500 na MB 5.")}</li>
          <li>{t("Use whole TZS prices and whole quantities. Blank stock defaults to 0, unit to units, category to Other, and reorder level to 10.", "Tumia bei za TZS na idadi zisizo na desimali. Nafasi tupu zitatumia idadi 0, kipimo units, aina Other na kiwango cha kuagiza 10.")}</li>
          <li>{t("Kipimo (Size) is optional: use small, mid or large, or leave the cell blank.", "Kipimo (Saizi) ni si lazima: tumia small, mid au large, au acha wazi.")}</li>
        </ol>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>{t("Required: product name, cost price and selling price. Names: up to 160 characters; category: 80; unit: 30. Stock and reorder: up to 2,147,483,647.", "Lazima: jina la bidhaa, bei ya kununua na bei ya kuuza. Jina: herufi 160; aina: 80; kipimo: 30. Idadi na kiwango cha kuagiza: hadi 2,147,483,647.")}</p>
        <div className="flex flex-wrap items-end gap-4 mb-5">
          <button type="button" className="btn-ghost" onClick={downloadTemplate} disabled={busy}><Download size={16} />{t("Download Excel template", "Pakua kiolezo cha Excel")}</button>
          <label className="flex-1 min-w-48 text-sm font-semibold">
            {t("Choose Excel file", "Chagua faili la Excel")}
            <input className="dv-input mt-2 w-full" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy}
              onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void readFile(file); }} />
          </label>
        </div>
        {busy && <p role="status" className="flex gap-2 items-center mb-4 text-sm"><Loader2 size={16} className="animate-spin" />{t("Processing…", "Inachakatwa…")}</p>}
        {error && <p role="alert" className="rounded-lg p-3 mb-4 text-sm" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>{t(error)}</p>}
        {preview && <>
          <p className="text-sm font-semibold mb-3 break-all">{filename} · {preview.products.length} {t("products", "bidhaa")}</p>
          {preview.issues.length > 0 && <div role="alert" className="rounded-lg p-3 mb-4" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
            <p className="font-semibold text-sm flex items-center gap-2"><AlertCircle size={16} />{t("Fix the highlighted rows before importing.")}</p>
            <ul className="list-disc pl-5 mt-2 max-h-48 overflow-auto text-sm space-y-1">
              {preview.issues.map((issue, index) => <li key={index}>{issue.row > 0 ? `${t("Row", "Mstari")} ${issue.row} · ` : ""}{t(issue.column)}: {t(issue.message)}</li>)}
            </ul>
            <p className="text-sm mt-2">{t("Correct the file and choose it again. No rows will be imported until all errors are fixed.", "Sahihisha faili na ulichague tena. Hakuna mstari utakaopakiwa hadi makosa yote yasahihishwe.")}</p>
          </div>}
          {preview.products.length > 0 && <div className="overflow-auto max-h-72 rounded-lg mb-4" style={{ border: "1px solid var(--border)" }}>
            <table className="dv-table" style={{ minWidth: 820 }}>
              <caption className="sr-only">{t("Product import preview", "Hakiki bidhaa za kupakia")}</caption>
              <thead><tr><th>{t("Row", "Mstari")}</th>{PRODUCT_COLUMNS.map(column => <th key={column}>{t(column)}</th>)}</tr></thead>
              <tbody>{preview.products.map(product => <tr key={product.row} style={preview.issues.some(issue => issue.row === product.row) ? { background: "var(--danger-bg)" } : undefined}>
                <td>{product.row}</td><td>{product.name}</td><td>{product.category}</td><td>{product.stock.toLocaleString(locale)}</td><td>{product.unit}</td>
                <td>{product.size ? t(product.size.charAt(0).toUpperCase() + product.size.slice(1)) : "—"}</td>
                <td>{product.cost_price.toLocaleString(locale)}</td><td>{product.selling_price.toLocaleString(locale)}</td><td>{product.reorder.toLocaleString(locale)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
        </>}
        <div className="flex flex-wrap justify-end gap-3 mt-5">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>{t("Cancel", "Ghairi")}</button>
          <button type="button" className="btn-gold" onClick={save} disabled={!ready || busy}><Upload size={16} />{t("Import products", "Pakia bidhaa")}{ready ? ` (${preview.products.length})` : ""}</button>
        </div>
      </div>
    </dialog>
  );
}
