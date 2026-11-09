import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";

const html = fs.readFileSync(new URL("../www/index.html", import.meta.url), "utf8");
const scriptMatch = html.match(/<script id="funcionamiento">([\s\S]*?)<\/script>/i);
assert.ok(scriptMatch, "No se encontró el script principal de funcionamiento.");
const script = scriptMatch[1];

// Syntax check without executing browser startup.
new Function(script);

// Every static $("id") reference must point to an element in the supplied interface.
const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]));
const referencedIds = new Set([...script.matchAll(/\$\(["']([^"']+)["']\)/g)].map((m) => m[1]));
const missingIds = [...referencedIds].filter((id) => !ids.has(id));
assert.deepEqual(missingIds, [], `IDs usados por la lógica pero ausentes en la interfaz: ${missingIds.join(", ")}`);

// All inline event handlers must call functions that exist in the application script.
const declared = new Set([
  ...[...script.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]),
  ...[...script.matchAll(/\b(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/g)].map((m) => m[1]),
  "document", "window", "event"
]);
const handlers = [...html.matchAll(/\bon(?:click|change|input|submit)=["']([^"']+)["']/gi)].map((m) => m[1]);
for (const handler of handlers) {
  const match = handler.match(/^\s*([A-Za-z_$][\w$]*)\s*\(/);
  if (match) assert.ok(declared.has(match[1]), `Handler sin función definida: ${handler}`);
}

assert.match(html, /<title>Mi Control Financiero<\/title>/);
assert.match(html, /id="coachOrb"/);
assert.match(html, /Nilo/);
assert.match(html, /rel="manifest"/);
assert.match(html, /serviceWorker\.register/);
assert.match(script, /function isValidISODate/);
assert.match(script, /function makeId/);
assert.match(script, /validTransactionTypes/);
const css = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1];
assert.ok(css, "No se encontró el CSS oficial");
assert.equal(
  crypto.createHash("sha256").update(css).digest("hex"),
  "fcbe2f81f83fe4688037cbde8c2d503781c0715eefb89b5b3406f653f86d6035",
  "El CSS de la interfaz oficial fue modificado"
);
for (const page of ["home", "analysis", "budget", "movements", "account"]) {
  assert.match(html, new RegExp('data-page="' + page + '"'), "Falta la pestaña " + page);
}
assert.doesNotMatch(html, /Aurora/i, "El nombre de otra app se filtró al proyecto.");

// Run pure financial calculations from the same source, stopping before DOM startup.
const startup = script.indexOf("\nload();\nshowApp();");
assert.ok(startup > 0, "No se encontró el bloque de inicio esperado.");
const context = vm.createContext({ console, Intl, Date, Math, Number, String, Object, Array, Set, Map, JSON });
vm.runInContext(script.slice(0, startup), context);
vm.runInContext(`
  const d = today();
  state.accounts = { cash: 1000, nequi: 500, nu: 300 };
  state.transactions = [
    { id: 1, type: "income", amount: 200, date: d, account: "cash" },
    { id: 2, type: "expense", amount: 50, date: d, account: "cash" },
    { id: 3, type: "saving", amount: 25, date: d, account: "cash" },
    { id: 4, type: "expense", amount: 20, date: d, account: "cash", debtId: "debt-1" },
    { id: 5, type: "saving", amount: 30, date: d, account: "nequi", goalId: "goal-1" }
  ];
`, context);

const totals = vm.runInContext("monthTotals()", context);
assert.equal(totals.income, 200);
assert.equal(totals.expense, 70);
assert.equal(totals.savings, 55);
assert.equal(totals.balance, 75);
assert.equal(vm.runInContext("totalAvailable()", context), 1875);
assert.equal(vm.runInContext("totalSavings()", context), 55);
assert.equal(vm.runInContext('debtPayments("debt-1")', context), 20);
assert.equal(vm.runInContext('debtRemaining({id:"debt-1", total:80})', context), 60);
assert.equal(vm.runInContext('goalSaved({id:"goal-1"})', context), 30);

console.log(`OK: sintaxis, ${referencedIds.size} referencias DOM, ${handlers.length} handlers y cálculos financieros básicos.`);
