import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const cache = new Map();

// Transpile local UI modules without starting a server or contacting the database.
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const localRequire = (specifier) => {
    if (specifier.includes("supabase/client-actions") || specifier.includes("supabase/server-actions")) return {};
    if (specifier === "next/navigation") return { usePathname: () => "/dashboard", useRouter: () => ({}) };
    if (specifier === "next/link") return ({ children, prefetch, ...props }) => React.createElement("a", props, children);
    if (specifier.startsWith(".") || specifier.startsWith("@/")) {
      const base = specifier.startsWith("@/") ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(filename), specifier);
      const target = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
      if (target) return load(target);
    }
    return require(specifier);
  };
  new Function("require", "module", "exports", source)(localRequire, module, module.exports);
  return module.exports;
}

const { translate, isLanguage } = load("app/i18n.ts");
const { LanguageProvider, T, LocalizedDate } = load("app/components/LanguageProvider.tsx");
function render(language, children) {
  return renderToStaticMarkup(React.createElement(LanguageProvider, { initialLanguage: language }, children));
}

test("translates labels and counts without changing unknown business data", () => {
  assert.equal(translate("Sales", "sw"), "Mauzo");
  assert.equal(translate("Sales", "en"), "Sales");
  assert.equal(translate("12 transactions today", "sw"), "12 miamala leo");
  assert.equal(translate("Stock cost TZS 15,000", "sw"), "Gharama ya bidhaa TZS 15,000");
  assert.equal(translate("Mlandege Grocery", "sw"), "Mlandege Grocery");
  assert.equal(isLanguage("sw"), true);
  assert.equal(isLanguage("invalid"), false);
});

test("the shared language reaches server-composed text and localized dates", () => {
  const content = React.createElement(React.Fragment, null,
    React.createElement(T, { text: "Today's revenue" }),
    React.createElement(LocalizedDate, { value: "2026-09-09T12:00:00Z", options: { weekday: "long" } }),
  );
  assert.match(render("sw", content), /Mapato ya leoJumatano/);
  assert.match(render("en", content), /Today&#x27;s revenueWednesday/);
});

test("navigation and header share the toggle's language", () => {
  const AppShell = load("app/components/AppShell.tsx").default;
  const content = React.createElement(AppShell, { title: "Dashboard", subtitle: "Stock levels and movement", bizName: "My Shop" }, React.createElement(T, { text: "Recent sales" }));
  const sw = render("sw", content);
  assert.match(sw, /Kiswahili/);
  assert.match(sw, /Dashibodi/);
  assert.match(sw, /Mauzo/);
  assert.match(sw, /Wasifu/);
  assert.match(sw, /Mauzo ya hivi karibuni/);
  assert.match(sw, /My Shop/);
  assert.doesNotMatch(sw, />Sales</);
  assert.match(render("en", content), />Sales</);
});

for (const [screen, props, expected] of [
  ["sales", { initialSales: [], products: [], branchId: "branch" }, "Hakuna mauzo bado"],
  ["inventory", { initialProducts: [], branchId: "branch" }, "Hakuna bidhaa bado"],
  ["reports", { initialSales: [], products: [], stockLogs: [], branchId: "branch", today: "2026-09-09" }, "Mchanganuo wa mauzo"],
  ["profile", { user: { id: "owner", email: "owner@example.com", user_metadata: { full_name: "Shop Owner" } }, businesses: [], branches: [], staff: [] }, "Matawi na akaunti za wafanyakazi"],
]) {
  test(`${screen} renders Swahili content under the shared provider`, () => {
    const Component = load(`app/${screen}/client.tsx`).default;
    assert.ok(render("sw", React.createElement(Component, props)).includes(expected));
  });
}
