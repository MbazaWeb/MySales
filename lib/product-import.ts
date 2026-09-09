export const MAX_IMPORT_ROWS = 500;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const PRODUCT_COLUMNS = ["Product name", "Category", "Opening stock", "Unit", "Kipimo (Size)", "Cost price (TZS)", "Selling price (TZS)", "Reorder level"] as const;
export const SIZE_OPTIONS = ["small", "mid", "large"] as const;
export type ImportProduct = { row: number; name: string; category: string; stock: number; unit: string; size: string; cost_price: number; selling_price: number; reorder: number };
export type ImportIssue = { row: number; column: string; message: string };
export type ImportResult = { products: ImportProduct[]; issues: ImportIssue[] };

const fields = ["name", "category", "stock", "unit", "size", "cost_price", "selling_price", "reorder"] as const;
const aliases: Record<string, typeof fields[number]> = {
  "product name": "name", name: "name", product: "name", "jina la bidhaa": "name",
  category: "category", aina: "category", "aina ya bidhaa": "category",
  "opening stock": "stock", stock: "stock", quantity: "stock", "idadi ya kuanzia": "stock",
  unit: "unit", kipimo: "unit",
  "kipimo (size)": "size", "size": "size", "saizi": "size", "ukubwa": "size",
  "cost price (tzs)": "cost_price", "cost price": "cost_price", "cost_price": "cost_price", "buying price": "cost_price", "bei ya kununua (tzs)": "cost_price",
  "selling price (tzs)": "selling_price", "selling price": "selling_price", "selling_price": "selling_price", price: "selling_price", "bei ya kuuza (tzs)": "selling_price",
  "reorder level": "reorder", reorder: "reorder", "kiwango cha kuagiza": "reorder",
};
export const productNameKey = (name: string) => name.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
const empty = (value: unknown) => value === null || value === undefined || (typeof value === "string" && !value.trim());

/** Used again on the server: browser validation is only a preview. */
export function validateImportProducts(input: unknown, existingNames: string[] = []): ImportResult {
  const issues: ImportIssue[] = [];
  const products: ImportProduct[] = [];
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_IMPORT_ROWS) {
    return { products, issues: [{ row: 0, column: "File", message: "Upload between 1 and 500 products." }] };
  }
  const existing = new Set(existingNames.map(productNameKey));
  const seen = new Set<string>();
  input.forEach((value, index) => {
    const raw = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
    const row = typeof raw.row === "number" && Number.isInteger(raw.row) && raw.row >= 2 && raw.row <= 5001 ? raw.row : index + 2;
    const addIssue = (column: string, message: string) => issues.push({ row, column, message });
    const text = (key: string, column: string, max: number, fallback?: string) => {
      const candidate = raw[key];
      if (empty(candidate) && fallback) return fallback;
      if (typeof candidate !== "string" || !candidate.trim() || candidate.trim().length > max) {
        addIssue(column, "Enter text within the allowed length.");
        return "";
      }
      return candidate.trim().replace(/\s+/g, " ");
    };
    const number = (key: string, column: string, min: number, max: number, fallback?: number) => {
      let candidate = raw[key];
      if (empty(candidate) && fallback !== undefined) return fallback;
      if (typeof candidate === "string") {
        const cleaned = candidate.trim();
        candidate = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.0+)?$/.test(cleaned) ? Number(cleaned.replaceAll(",", "")) : NaN;
      }
      if (typeof candidate !== "number" || !Number.isSafeInteger(candidate) || candidate < min || candidate > max) {
        addIssue(column, min === 0 ? "Use a non-negative whole number within the allowed range." : "Use a positive whole TZS amount, up to 1 trillion.");
        return 0;
      }
      return candidate;
    };
    const sizeText = (() => {
      const candidate = raw["size"];
      if (empty(candidate) || (typeof candidate === "string" && !candidate.trim())) return "";
      const normalized = String(candidate).trim().toLowerCase();
      if ((SIZE_OPTIONS as readonly string[]).includes(normalized)) return normalized;
      // Friendly aliases people type in the wild.
      if (normalized === "medium" || normalized === "katikati") return "mid";
      if (normalized === "s" || normalized === "sm") return "small";
      if (normalized === "l" || normalized === "lg" || normalized === "kubwa") return "large";
      addIssue("Kipimo (Size)", "Use small, mid or large — or leave the cell blank.");
      return "";
    })();
    const product: ImportProduct = {
      row, name: text("name", "Product name", 160), category: text("category", "Category", 80, "Other"),
      unit: text("unit", "Unit", 30, "units"), size: sizeText,
      stock: number("stock", "Opening stock", 0, 2147483647, 0),
      cost_price: number("cost_price", "Cost price (TZS)", 1, 1e12), selling_price: number("selling_price", "Selling price (TZS)", 1, 1e12),
      reorder: number("reorder", "Reorder level", 0, 2147483647, 10),
    };
    if (product.selling_price < product.cost_price) addIssue("Selling price (TZS)", "Selling price should be ≥ cost price.");
    if (product.name) {
      const key = productNameKey(product.name);
      if (seen.has(key)) addIssue("Product name", "This product name appears more than once in the file.");
      if (existing.has(key)) addIssue("Product name", "This product already exists in this branch.");
      seen.add(key);
    }
    products.push(product);
  });
  return { products, issues };
}

export function parseProductSheet(sheet: unknown[][], existingNames: string[] = []): ImportResult {
  if (!sheet.length || sheet.length > 5001 || sheet.some(row => row.length > 100)) {
    return { products: [], issues: [{ row: 0, column: "File", message: "Use the template with up to 500 products." }] };
  }
  const issues: ImportIssue[] = [];
  const columns = sheet[0].map(cell => typeof cell === "string" ? aliases[cell.trim().toLowerCase()] : undefined);
  for (const field of ["name", "cost_price", "selling_price"]) {
    if (!columns.includes(field as typeof fields[number])) issues.push({ row: 1, column: PRODUCT_COLUMNS[fields.indexOf(field as typeof fields[number])], message: "Required column is missing." });
  }
  const recognized = columns.filter(Boolean);
  if (new Set(recognized).size !== recognized.length) issues.push({ row: 1, column: "File", message: "A column appears more than once." });
  if (issues.length) return { products: [], issues };
  const data = sheet.slice(1).flatMap((cells, index) => {
    if (cells.every(empty)) return [];
    const row: Record<string, unknown> = { row: index + 2 };
    columns.forEach((field, column) => { if (field) row[field] = cells[column]; });
    return [row];
  });
  return validateImportProducts(data, existingNames);
}

/** Header-only workbook: downloading a template can never import sample products by accident. */
export function productTemplateData() {
  return [PRODUCT_COLUMNS.map(value => ({ value, fontWeight: "bold" as const, backgroundColor: "#0F1B2D", color: "#FFFFFF" }))];
}
