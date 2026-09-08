import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";
import writeExcelFile from "write-excel-file/node";
import { readSheet } from "read-excel-file/node";

const require = createRequire(import.meta.url);
function load(file, dependencies = {}) {
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }, fileName: file,
  }).outputText;
  const module = { exports: {} };
  new Function("require", "exports", "module", source)(name => dependencies[name] ?? require(name), module.exports, module);
  return module.exports;
}
const validation = load("lib/product-import.ts");
const { parseProductSheet, validateImportProducts, productTemplateData, PRODUCT_COLUMNS } = validation;
const branchId = "11111111-1111-4111-8111-111111111111";
const valid = { row: 2, name: "Water 500ml", category: "Water", stock: 24, unit: "bottles", cost_price: 500, selling_price: 1000, reorder: 5 };

test("a real downloaded XLSX template round-trips through the Excel reader", async () => {
  const workbook = await writeExcelFile([
    ...productTemplateData(),
    ["Water 500ml", "Water", 24, "bottles", 500, 1000, 5],
  ]).toBuffer();
  assert.deepEqual(parseProductSheet(await readSheet(workbook)), { products: [valid], issues: [] });
});

test("recognizes reordered headers, formatted numbers, blank rows and optional defaults", () => {
  const result = parseProductSheet([
    ["Selling price", "Name", "Cost price"],
    ["1,000", "  Water 500ml  ", 500],
    [],
    [2000, "Juice", 1000],
  ]);
  assert.deepEqual(result.issues, []);
  assert.equal(result.products[0].stock, 0);
  assert.equal(result.products[0].reorder, 10);
  assert.equal(result.products[0].unit, "units");
  assert.equal(result.products[0].selling_price, 1000);
  assert.equal(result.products[1].row, 4);
});

test("rejects missing and duplicate headers, empty and oversized imports", () => {
  assert.equal(parseProductSheet([["Product name"], ["Water"]]).issues.length, 2);
  assert.ok(parseProductSheet([[...PRODUCT_COLUMNS, "Name"], ["Water"]]).issues.some(issue => issue.message.includes("more than once")));
  assert.ok(parseProductSheet([PRODUCT_COLUMNS]).issues.length);
  assert.ok(validateImportProducts(Array.from({ length: 501 }, () => valid)).issues.length);
});

test("rejects invalid numeric types, negative/fractional stock, invalid prices and long names", () => {
  for (const patch of [{ stock: -1 }, { stock: 1.5 }, { stock: true }, { stock: 2147483648 }, { stock: "2,5" }, { cost_price: "" }, { selling_price: Infinity }, { selling_price: 0 }, { selling_price: 499 }, { selling_price: 1000.5 }, { name: "a".repeat(161) }, { unit: "a".repeat(31) }]) {
    assert.ok(validateImportProducts([{ ...valid, ...patch }]).issues.length, JSON.stringify(patch));
  }
});

test("detects duplicates within a workbook and in current inventory", () => {
  const result = validateImportProducts([valid, { ...valid, row: 3, name: " WATER   500ml " }], ["water 500ML"]);
  assert.equal(result.issues.filter(issue => issue.message.includes("already exists")).length, 2);
  assert.ok(result.issues.some(issue => issue.row === 3 && issue.message.includes("more than once")));
});

function actionHarness({ user = { id: "owner" }, ownerId = "owner", membership = null, names = [], insertError = null } = {}) {
  const inserts = [];
  const invalidated = [];
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      let pendingRows;
      const query = {
        eq() { return query; }, order() { return query; },
        select() {
          if (pendingRows) return Promise.resolve({ data: insertError ? null : pendingRows.map((row, i) => ({ id: `id-${i}`, ...row })), error: insertError });
          return query;
        },
        maybeSingle: async () => ({ data: table === "branches" ? { id: branchId, business_id: "business" } : table === "businesses" ? { owner_id: ownerId } : membership }),
        range: async (from, to) => ({ data: names.slice(from, to + 1).map(name => ({ name })), error: null }),
        insert(rows) { pendingRows = rows; inserts.push(rows); return query; },
      };
      return query;
    },
  };
  const { importProducts } = load("lib/supabase/bulk-products.ts", {
    "next/cache": { revalidatePath: pathname => invalidated.push(pathname) },
    "./server": { createClient: async () => client }, "../product-import": validation,
  });
  return { importProducts, inserts, invalidated };
}

test("server revalidates tampered input and rejects unauthenticated or unauthorized uploads", async () => {
  for (const options of [{ user: null }, { ownerId: "someone-else" }, { ownerId: "someone-else", membership: { role: "Cashier", branch_id: branchId } }, { ownerId: "someone-else", membership: { role: "Manager", branch_id: "other-branch" } }]) {
    const h = actionHarness(options);
    assert.equal((await h.importProducts(branchId, [valid])).success, false);
    assert.equal(h.inserts.length, 0);
  }
  const h = actionHarness();
  assert.equal((await h.importProducts(branchId, [{ ...valid, stock: -1 }])).success, false);
  assert.equal(h.inserts.length, 0);
});

test("authorized import sends one batch with trusted branch and price fields", async () => {
  const h = actionHarness({ ownerId: "someone-else", membership: { role: "Stock keeper", branch_id: branchId } });
  const result = await h.importProducts(branchId, [{ ...valid, branch_id: "injected", price: 1 }, { ...valid, row: 3, name: "Juice" }]);
  assert.equal(result.success, true);
  assert.equal(result.products.length, 2);
  assert.equal(h.inserts.length, 1);
  assert.equal(h.inserts[0].length, 2);
  assert.equal(h.inserts[0][0].branch_id, branchId);
  assert.equal(h.inserts[0][0].price, 1000);
  assert.equal("row" in h.inserts[0][0], false);
  assert.deepEqual(h.invalidated, ["/inventory", "/dashboard", "/reports"]);
});

test("server checks inventory beyond 1,000 products and returns database failures", async () => {
  const h = actionHarness({ names: [...Array.from({ length: 1000 }, (_, i) => `Item ${i}`), valid.name] });
  assert.equal((await h.importProducts(branchId, [valid])).success, false);
  assert.equal(h.inserts.length, 0);
  const failed = actionHarness({ insertError: { code: "23505" } });
  assert.equal((await failed.importProducts(branchId, [valid])).success, false);
  assert.equal(failed.invalidated.length, 0);
});
