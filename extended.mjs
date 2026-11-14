import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../www/index.html", import.meta.url), "utf8");
const script = html.match(/<script id="funcionamiento">([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script, "Falta el script principal.");
const startup = script.indexOf("\nload();\nshowApp();");
assert.ok(startup > 0, "No se encontró el inicio de la aplicación.");

class StorageMock {
  data = new Map();
  get length() { return this.data.size; }
  key(i) { return [...this.data.keys()][i] ?? null; }
  getItem(k) { return this.data.has(String(k)) ? this.data.get(String(k)) : null; }
  setItem(k, v) { this.data.set(String(k), String(v)); }
  removeItem(k) { this.data.delete(String(k)); }
  clear() { this.data.clear(); }
}

function makeContext(storage = new StorageMock()) {
  const context = vm.createContext({
    localStorage: storage,
    console,
    Intl,
    Date,
    Math,
    Number,
    String,
    Object,
    Array,
    Set,
    Map,
    JSON,
    encodeURIComponent,
    decodeURIComponent,
    unescape,
    btoa: (value) => Buffer.from(value, "binary").toString("base64"),
  });
  vm.runInContext(script.slice(0, startup), context);
  return context;
}

// Persistence and profile isolation.
const storage = new StorageMock();
storage.setItem("mcf_active_profile_v1", "p_one");
storage.setItem("mcf_display_name", "Perfil uno");
storage.setItem("mcf_profiles_v1", JSON.stringify([{ id: "p_one", name: "Perfil uno" }, { id: "p_two", name: "Perfil dos" }]));
storage.setItem("mcf_profile_data_p_one", JSON.stringify({
  transactions: [{ id: 1, type: "income", amount: 100, date: "2026-11-13", account: "cash" }],
  budgets: {}, monthlyBudget: 0, monthlyIncomeTarget: 0, monthlyReports: {}, categories: [],
  accounts: { cash: 20, nequi: 0, nu: 0 }, debts: [], savingsGoals: [], recurringExpenses: [],
}));
storage.setItem("mcf_profile_data_p_two", JSON.stringify({
  transactions: [{ id: 2, type: "expense", amount: 30, date: "2026-11-13", account: "nu" }],
  budgets: {}, monthlyBudget: 0, monthlyIncomeTarget: 0, monthlyReports: {}, categories: [],
  accounts: { cash: 0, nequi: 0, nu: 90 }, debts: [], savingsGoals: [], recurringExpenses: [],
}));
const ctx = makeContext(storage);
vm.runInContext("load()", ctx);
assert.equal(vm.runInContext("state.transactions.length", ctx), 1);
assert.equal(vm.runInContext("state.transactions[0].id", ctx), 1);
assert.equal(vm.runInContext("KEY", ctx), "mcf_profile_data_p_one");
vm.runInContext("state.monthlyBudget = 500; persist()", ctx);
assert.equal(JSON.parse(storage.getItem("mcf_profile_data_p_one")).monthlyBudget, 500);

storage.setItem("mcf_active_profile_v1", "p_two");
vm.runInContext("load()", ctx);
assert.equal(vm.runInContext("state.transactions.length", ctx), 1);
assert.equal(vm.runInContext("state.transactions[0].id", ctx), 2);
assert.equal(vm.runInContext("KEY", ctx), "mcf_profile_data_p_two");
vm.runInContext("state.monthlyBudget = 900; persist()", ctx);
assert.equal(JSON.parse(storage.getItem("mcf_profile_data_p_two")).monthlyBudget, 900);
assert.equal(JSON.parse(storage.getItem("mcf_profile_data_p_one")).monthlyBudget, 500);

// Financial arithmetic, savings, debt repayments, and goal contributions.
const today = vm.runInContext("today()", ctx);
vm.runInContext(`
  state.accounts = { cash: 1000, nequi: 500, nu: 300 };
  state.transactions = [
    { id: 11, type: "income", amount: 200, date: ${JSON.stringify(today)}, account: "cash" },
    { id: 12, type: "expense", amount: 50, date: ${JSON.stringify(today)}, account: "cash" },
    { id: 13, type: "saving", amount: 25, date: ${JSON.stringify(today)}, account: "cash" },
    { id: 14, type: "expense", amount: 20, date: ${JSON.stringify(today)}, account: "cash", debtId: "d1" },
    { id: 15, type: "saving", amount: 30, date: ${JSON.stringify(today)}, account: "nequi", goalId: "g1" }
  ];
`, ctx);
const totals = vm.runInContext("monthTotals()", ctx);
assert.equal(totals.income, 200);
assert.equal(totals.expense, 70);
assert.equal(totals.savings, 55);
assert.equal(totals.balance, 75);
assert.equal(vm.runInContext("accountBalance('cash')", ctx), 1105);
assert.equal(vm.runInContext("accountBalance('nequi')", ctx), 470);
assert.equal(vm.runInContext("totalAvailable()", ctx), 1875);
assert.equal(vm.runInContext("totalSavings()", ctx), 55);
assert.equal(vm.runInContext("debtPayments('d1')", ctx), 20);
assert.equal(vm.runInContext('debtRemaining({id:"d1", total:80})', ctx), 60);
assert.equal(vm.runInContext('goalSaved({id:"g1"})', ctx), 30);

// Imported or legacy data is normalized before it reaches the UI or calculations.
const unsafeStorage = new StorageMock();
unsafeStorage.setItem("mcf_active_profile_v1", "p_unsafe");
unsafeStorage.setItem("mcf_display_name", "Perfil");
unsafeStorage.setItem("mcf_profile_data_p_unsafe", JSON.stringify({
  transactions: [
    { id: 1, type: "expense", amount: "Infinity", date: "2026-11-13", account: "<img>", category: "<svg>", description: "<script>" },
    { id: 2, type: "expense", amount: 25, date: "2026-11-13", account: "<img>", category: "<svg>", description: "<script>", debtId: 'd" onmouseover="x' }
  ],
  budgets: { "Alimentación": "Infinity", "Transporte": 100 },
  monthlyBudget: "Infinity", monthlyIncomeTarget: -5,
  monthlyReports: { "<img>": {}, "2026-11": {} },
  categories: [{ name: "<img>", type: "expense", emoji: "<svg onload=x>" }],
  accounts: { cash: "Infinity", nequi: -1, nu: 500 },
  debts: [{ id: 'd" onload=x', name: "<img>", total: 80 }],
  savingsGoals: [{ id: "g1", name: "Meta", target: 100 }],
  recurringExpenses: [{ id: "r1", name: "Internet", amount: 50, day: 10, category: "Hogar", account: "nu" }]
}));
const unsafeCtx = makeContext(unsafeStorage);
vm.runInContext("load()", unsafeCtx);
assert.equal(vm.runInContext("state.transactions.length", unsafeCtx), 1, "Se descarta un movimiento con monto infinito");
assert.equal(vm.runInContext("state.transactions[0].account", unsafeCtx), "cash");
assert.equal(vm.runInContext("state.transactions[0].debtId", unsafeCtx), "d__onmouseover__x");
assert.equal(vm.runInContext("state.accounts.cash", unsafeCtx), 0);
assert.equal(vm.runInContext("state.accounts.nequi", unsafeCtx), 0);
assert.equal(vm.runInContext("state.accounts.nu", unsafeCtx), 500);
assert.equal(vm.runInContext("state.monthlyBudget", unsafeCtx), 0);
assert.equal(vm.runInContext("state.monthlyIncomeTarget", unsafeCtx), 0);
assert.deepEqual(JSON.parse(JSON.stringify(vm.runInContext("Object.keys(state.monthlyReports)", unsafeCtx))), ["2026-11"]);
assert.equal(vm.runInContext("state.categories.some(c => c.emoji.includes('<'))", unsafeCtx), false);
assert.equal(vm.runInContext("state.debts[0].id", unsafeCtx), "d__onload_x");

// HTML escaping used when rendering user-controlled labels and descriptions.
assert.equal(vm.runInContext('esc(`<img src=x onerror="alert(1)">`)', ctx), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");

// Ensure the official five-tab interface and PWA/Android shell remain present.
for (const id of ["home", "analysis", "budget", "movements", "account"]) {
  assert.match(html, new RegExp(`id="${id}"`), `Falta la pestaña ${id}`);
}
assert.match(html, /rel="manifest"/);
assert.match(html, /service-worker\.js/);
assert.match(html, /data-page="home"/);
assert.match(html, /data-page="analysis"/);
assert.match(html, /data-page="budget"/);
assert.match(html, /data-page="movements"/);
assert.match(html, /data-page="account"/);

console.log("OK: persistencia, aislamiento entre perfiles, saldos, movimientos, ahorros, deudas, metas, escape HTML y cinco pestañas.");
