import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../www/index.html", import.meta.url), "utf8");
const script = html.match(/<script id="funcionamiento">([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script, "Falta el script principal");
const startup = script.indexOf("\nload();\nshowApp();");
assert.ok(startup > 0, "No se encontró el inicio de la aplicación");

const values = new Map();
const localStorage = {
  getItem: (k) => values.has(k) ? values.get(k) : null,
  setItem: (k, v) => values.set(k, String(v)),
  removeItem: (k) => values.delete(k),
  key: (i) => [...values.keys()][i] ?? null,
  get length() { return values.size; },
};
const nodes = new Map();
const getNode = (id) => {
  if (!nodes.has(id)) nodes.set(id, {
    value: "", textContent: "", innerHTML: "", hidden: false,
    dataset: {}, style: {}, classList: { add(){}, remove(){}, toggle(){} },
    setAttribute(){}, removeAttribute(){}, focus(){},
  });
  return nodes.get(id);
};
const document = {
  getElementById: getNode,
  querySelectorAll: () => [],
  addEventListener(){},
};
let uuidCounter = 0;
const context = vm.createContext({
  console, Intl, Date, Math, Number, String, Object, Array, Set, Map, JSON,
  localStorage, document, window: { addEventListener(){}, scrollTo(){} },
  confirm: () => true, setTimeout: () => 0,
  Blob, URL, crypto: { randomUUID: () => "test-uuid-" + (++uuidCounter) },
});
vm.runInContext(script.slice(0, startup), context);
context.paint = () => {};
context.closeModal = () => {};
context.checkBudgetAlerts = () => {};
const messages = [];
context.toast = (message) => messages.push(String(message));
const run = (code) => vm.runInContext(code, context);
const state = run("state");
state.categories = [
  { name: "Ahorro", type: "saving", emoji: "🎯" },
  { name: "Salario", type: "income", emoji: "💼" },
  { name: "Alimentación", type: "expense", emoji: "🍽️" },
  { name: "Otros gastos", type: "expense", emoji: "📌" },
  { name: "Otros ingresos", type: "income", emoji: "✨" },
];
state.accounts = { cash: 0, nequi: 0, nu: 0 };
state.transactions = [];
state.budgets = {};
state.monthlyReports = {};
state.debts = [];
state.savingsGoals = [];
state.recurringExpenses = [];

const set = (id, value) => { getNode(id).value = String(value); };
const today = vm.runInContext("today()", context);
function tx(type, amount, category, account = "cash", date = today) {
  set("txAmount", amount); set("txType", type); set("txCategory", category);
  set("txAccount", account); set("txDate", date); set("txDescription", "Prueba");
  context.saveTx();
}
tx("income", "100", "Salario", "cash");
assert.equal(state.transactions.length, 1, "Debe crear un ingreso");
assert.equal(context.monthTotals().income, 100);
tx("expense", "30", "Alimentación", "nequi");
assert.equal(context.monthTotals().expense, 30, "Debe crear un gasto");
tx("saving", "10", "Ahorro", "nu");
assert.equal(context.monthTotals().savings, 10, "Debe crear un ahorro");
assert.equal(new Set(state.transactions.map((t) => t.id)).size, 3, "Los IDs de movimientos deben ser únicos");
assert.equal(context.totalAvailable(), 60, "El saldo debe descontar gasto y ahorro de sus bolsillos");

const incomeId = state.transactions[0].id;
getNode("txModal").dataset.editId = String(incomeId);
tx("income", "120", "Salario", "cash");
assert.equal(state.transactions.length, 3, "Editar no debe duplicar el movimiento");
assert.equal(context.monthTotals().income, 120, "La edición debe actualizar los totales");
assert.equal(context.totalAvailable(), 80, "La edición debe actualizar el saldo");

const countBeforeInvalid = state.transactions.length;
tx("expense", "-1", "Alimentación");
assert.equal(state.transactions.length, countBeforeInvalid, "No debe aceptar montos negativos");
tx("expense", "15", "Salario");
assert.equal(state.transactions.length, countBeforeInvalid, "No debe aceptar categoría de otro tipo");
tx("expense", "15", "Alimentación", "cash", "2026-02-31");
assert.equal(state.transactions.length, countBeforeInvalid, "No debe aceptar fechas imposibles");

state.monthlyBudget = 50;
state.budgets["Alimentación"] = 20;

set("monthlyAmount", "500");
context.saveMonthlyBudget();
assert.equal(state.monthlyBudget, 500, "Debe guardar presupuesto mensual");
set("monthlyAmount", "");
context.saveMonthlyBudget();
assert.equal(state.monthlyBudget, 500, "Un campo vacío no debe borrar el presupuesto");
set("limitCategory", "Alimentación");
set("limitAmount", "80");
context.saveLimit();
assert.equal(state.budgets["Alimentación"], 80, "Debe guardar límite por categoría");
set("limitAmount", "0");
context.saveLimit();
assert.equal(state.budgets["Alimentación"], undefined, "Cero debe quitar el límite");
set("incomeTargetAmount", "900");
context.saveIncomePlan();
assert.equal(state.monthlyIncomeTarget, 900, "Debe guardar la estimación mensual de ingresos");
set("openCash", "100");
set("openNequi", "200");
set("openNu", "300");
context.saveWallets();
assert.equal(context.totalAvailable(), 680, "Debe guardar saldos iniciales por bolsillo y conservar los movimientos");
set("openCash", "");
context.saveWallets();
assert.equal(state.accounts.cash, 100, "Un saldo vacío no debe sobrescribir el saldo anterior");

const report = context.monthReport(today.slice(0, 7));
assert.equal(report.income, 120);
assert.equal(report.expense, 30);
assert.equal(report.savings, 10);
assert.equal(report.balance, 80);
assert.equal(report.methods.nequi, 30);
const expenseId = state.transactions.find((t) => t.type === "expense").id;
context.deleteTx(expenseId);
assert.equal(context.monthTotals().expense, 0, "Eliminar un movimiento debe actualizar los totales");
assert.equal(state.transactions.length, 2, "Eliminar debe quitar solo el movimiento seleccionado");
assert.equal(context.debtRemaining({ id: "d1", total: 80 }), 80);

context.confirm = () => true;
context.nextFormData = { name: "Préstamo de prueba", total: "80" };
context.askForm = () => Promise.resolve(context.nextFormData);
context.addDebt();
await new Promise((resolve) => setImmediate(resolve));
assert.equal(state.debts.length, 1, "Debe crear una deuda");
const debtId = state.debts[0].id;
context.nextFormData = { amount: "25", account: "cash" };
context.payDebt(debtId);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(context.debtRemaining(state.debts[0]), 55, "El abono debe reducir la deuda");
assert.equal(context.debtPayments(debtId), 25, "El abono debe quedar como movimiento asociado");

context.nextFormData = { name: "Meta de prueba", target: "100" };
context.addSavingsGoal();
await new Promise((resolve) => setImmediate(resolve));
assert.equal(state.savingsGoals.length, 1, "Debe crear una meta");
const goalId = state.savingsGoals[0].id;
context.nextFormData = { amount: "20", account: "nu" };
context.contributeGoal(goalId);
await new Promise((resolve) => setImmediate(resolve));
assert.equal(context.goalSaved(state.savingsGoals[0]), 20, "El aporte debe acumularse en la meta");

context.nextFormData = { name: "Internet", amount: "45", day: "1", category: "Hogar", account: "nequi" };
state.categories.push({ name: "Hogar", type: "expense", emoji: "🏠" });
context.addRecurringExpense();
await new Promise((resolve) => setImmediate(resolve));
assert.equal(state.recurringExpenses.length, 1, "Debe crear recordatorio recurrente");
assert.equal(state.transactions.length, 4, "Crear recordatorio no debe crear un gasto automáticamente");

run('KEY = "mcf_profile_data_p1"');
context.localStorage.setItem("mcf_profiles_v1", JSON.stringify([{id:"p1",name:"Uno"},{id:"p2",name:"Dos"}]));
context.localStorage.setItem("mcf_active_profile_v1", "p1");
context.localStorage.setItem("mcf_profile_data_p1", JSON.stringify({
  transactions: [{id:"p1tx",type:"income",amount:7,category:"Salario",date:today,account:"cash"}],
  budgets:{},monthlyBudget:0,monthlyIncomeTarget:0,monthlyReports:{},
  categories:[{name:"Salario",type:"income",emoji:"💼"}],
  accounts:{cash:0,nequi:0,nu:0},debts:[],savingsGoals:[],recurringExpenses:[]
}));
context.localStorage.setItem("mcf_profile_data_p2", JSON.stringify({
  transactions: [{id:"p2tx",type:"income",amount:9,category:"Salario",date:today,account:"cash"}],
  budgets:{},monthlyBudget:0,monthlyIncomeTarget:0,monthlyReports:{},
  categories:[{name:"Salario",type:"income",emoji:"💼"}],
  accounts:{cash:0,nequi:0,nu:0},debts:[],savingsGoals:[],recurringExpenses:[]
}));
run("load()");
context.switchProfile("p2");
assert.equal(state.transactions[0].id, "p2tx", "El perfil Dos debe cargar solo sus movimientos");
context.switchProfile("p1");
assert.equal(state.transactions[0].id, "p1tx", "El perfil Uno debe conservar sus movimientos");


// CSV export escapes spreadsheet formulas in user-controlled text.
let lastBlob = null;
class CapturedBlob {
  constructor(parts, options) { this.parts = parts; this.type = options?.type || ""; lastBlob = this; }
}
context.Blob = CapturedBlob;
context.URL = { createObjectURL: (blob) => { lastBlob = blob; return "blob:test"; }, revokeObjectURL(){} };
const anchor = { href:"", download:"", click(){}, remove(){} };
context.document.createElement = () => anchor;
context.document.body = { appendChild(){} };
state.transactions = [{ id:"csv1", type:"income", amount:10, category:"Salario", description:"=1+1", date:today, account:"cash" }];
context.exportTransactionsCSV();
const csvText = lastBlob.parts.join("");
assert.ok(csvText.includes("\"'=1+1\""), "El CSV debe neutralizar fórmulas de hoja de cálculo");

// JSON backup export must contain all local profiles and their data.
context.exportFullBackup();
const exportedBackup = JSON.parse(lastBlob.parts.join(""));
assert.equal(exportedBackup.format, "mi-control-financiero-backup");
assert.ok(exportedBackup.values.mcf_profiles_v1, "El respaldo debe incluir la lista de perfiles");

// Restore rejects a malformed financial amount without changing stored data.
const restoreProfile = (amount) => ({
  format: "mi-control-financiero-backup",
  version: 1,
  values: {
    mcf_display_name: "Restaurado",
    mcf_profiles_v1: JSON.stringify([{id:"pRestore",name:"Restaurado"}]),
    mcf_active_profile_v1: "pRestore",
    mcf_profile_data_pRestore: JSON.stringify({
      transactions: [{id:"r1",type:"income",amount,date:today,account:"cash",category:"Salario"}],
      budgets:{},monthlyBudget:0,monthlyIncomeTarget:0,monthlyReports:{},
      categories:[{name:"Salario",type:"income",emoji:"💼"}],
      accounts:{cash:0,nequi:0,nu:0},debts:[],savingsGoals:[],recurringExpenses:[]
    })
  }
});
context.FileReader = class {
  readAsText(file) { this.result = file.contents; this.onload(); }
};
context.location = { reload(){} };
const beforeBadRestore = JSON.stringify([...values.entries()]);
const badBackup = restoreProfile("Infinity");
context.importFullBackup({target:{files:[{size:JSON.stringify(badBackup).length,contents:JSON.stringify(badBackup)}],value:""}});
assert.equal(JSON.stringify([...values.entries()]), beforeBadRestore, "Un respaldo inválido no debe tocar los datos actuales");
const goodBackup = restoreProfile(42);
context.importFullBackup({target:{files:[{size:JSON.stringify(goodBackup).length,contents:JSON.stringify(goodBackup)}],value:""}});
assert.equal(context.localStorage.getItem("mcf_active_profile_v1"), "pRestore", "Un respaldo válido debe restaurar el perfil activo");
assert.equal(JSON.parse(context.localStorage.getItem("mcf_profile_data_pRestore")).transactions[0].amount, 42);

console.log("OK: movimientos, cálculos, deudas, metas, recurrencias, perfiles, exportación CSV, respaldo JSON y restauración validada.");
