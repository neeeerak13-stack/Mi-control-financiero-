"use strict";
let KEY = "mcf_final_v4";
const NAME_KEY = "mcf_display_name",
  PROFILES_KEY = "mcf_profiles_v1",
  ACTIVE_PROFILE_KEY = "mcf_active_profile_v1";
const DEFAULT_CATEGORIES = [
  { name: "Ahorro", type: "saving" },
  { name: "Transporte / Pasajes", type: "expense" },
  { name: "Alimentación", type: "expense" },
  { name: "Compras", type: "expense" },
  { name: "Entretenimiento", type: "expense" },
  { name: "Hogar", type: "expense" },
  { name: "Estudio", type: "expense" },
  { name: "Salud", type: "expense" },
  { name: "Otros gastos", type: "expense" },
  { name: "Salario", type: "income" },
  { name: "Beca", type: "income" },
  { name: "Venta", type: "income" },
  { name: "Otros ingresos", type: "income" },
];
const state = {
  transactions: [],
  budgets: {},
  monthlyBudget: 0,
  monthlyIncomeTarget: 0,
  categories: [],
  accounts: { cash: 0, nequi: 0, nu: 0 },
  filter: "all",
  monthlyReports: {},
  debts: [],
  savingsGoals: [],
  recurringExpenses: [],
};
let categoryMode = "create",
  categoryOriginal = "";
let askResolver = null;
const $ = (id) => document.getElementById(id);
const money = (n) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
    .format(Number(n) || 0)
    .replace("COP", "")
    .trim();
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>'"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c],
  );
function emojiForCategory(name, type) {
  const n = name.toLowerCase();
  const map = [
    [/transporte|pasaje|bus|taxi|uber|moto|gasolina|viaje/, "🚌"],
    [/aliment|comida|mercado|restaurante|cena|desayuno/, "🍽️"],
    [/compr|ropa|zapato|shopping/, "🛍️"],
    [/entreten|cine|juego|fiesta|salida|ocio/, "🎬"],
    [/hogar|casa|arriendo|servicio|luz|agua/, "🏠"],
    [/estudio|univers|colegio|libro|curso|matrícula/, "📚"],
    [/salud|médic|medic|farmacia|dent/, "🩺"],
    [/mascota|perro|gato/, "🐾"],
    [/ahorro|meta|invers/, "🎯"],
    [/salario|sueldo|nómina/, "💼"],
    [/beca|subsidio|apoyo/, "🎓"],
    [/venta|vend/, "💰"],
    [/regalo/, "🎁"],
    [/familia|mamá|papá/, "🤍"],
  ];
  for (const [rx, e] of map) if (rx.test(n)) return e;
  return type === "income" ? "✨" : "📌";
}
function categoryObj(name) {
  return (
    state.categories.find((c) => c.name === name) || {
      name,
      type: "expense",
      emoji: emojiForCategory(name, "expense"),
    }
  );
}
function load() {
  try {
    const active = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (active) {
      KEY = "mcf_profile_data_" + active;
    } else {
      const legacyName = localStorage.getItem(NAME_KEY) || "Principal";
      const pid =
        "p_" +
        btoa(unescape(encodeURIComponent(legacyName)))
          .replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 24);
      const list = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
      if (!list.length) {
        localStorage.setItem(PROFILES_KEY, JSON.stringify([{ id: pid, name: legacyName }]));
        localStorage.setItem(ACTIVE_PROFILE_KEY, pid);
        KEY = "mcf_profile_data_" + pid;
        const legacy =
          localStorage.getItem("mcf_final_v4") ||
          localStorage.getItem("mcf_final_v3") ||
          localStorage.getItem("mcf_final_v2");
        if (legacy && !localStorage.getItem(KEY)) localStorage.setItem(KEY, legacy);
      } else {
        const first = list[0];
        localStorage.setItem(ACTIVE_PROFILE_KEY, first.id);
        KEY = "mcf_profile_data_" + first.id;
      }
    }
    const raw = JSON.parse(
      localStorage.getItem(KEY) ||
        localStorage.getItem("mcf_final_v3") ||
        localStorage.getItem("mcf_final_v2") ||
        "null",
    );
    if (raw) {
      Object.assign(state, raw);
      state.transactions = Array.isArray(state.transactions) ? state.transactions : [];
      state.budgets = state.budgets && typeof state.budgets === "object" ? state.budgets : {};
      state.categories =
        Array.isArray(state.categories) && state.categories.length
          ? state.categories
          : DEFAULT_CATEGORIES.map((c) => ({ ...c, emoji: emojiForCategory(c.name, c.type) }));
      state.accounts =
        state.accounts && typeof state.accounts === "object"
          ? {
              cash: +state.accounts.cash || 0,
              nequi: +state.accounts.nequi || 0,
              nu: +state.accounts.nu || 0,
            }
          : { cash: 0, nequi: 0, nu: 0 };
      state.monthlyBudget = +state.monthlyBudget || 0;
      state.monthlyIncomeTarget = +state.monthlyIncomeTarget || 0;
      state.monthlyReports =
        state.monthlyReports && typeof state.monthlyReports === "object"
          ? state.monthlyReports
          : {};
      state.debts = Array.isArray(state.debts) ? state.debts : [];
      state.savingsGoals = Array.isArray(state.savingsGoals) ? state.savingsGoals : [];
      state.recurringExpenses = Array.isArray(state.recurringExpenses)
        ? state.recurringExpenses
        : [];
    } else {
      state.categories = DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        emoji: emojiForCategory(c.name, c.type),
      }));
    }
    migrateLegacy();
  } catch (e) {
    state.categories = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      emoji: emojiForCategory(c.name, c.type),
    }));
    migrateLegacy();
  }
}
function migrateLegacy() {
  if (!state.categories.length)
    state.categories = DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      emoji: emojiForCategory(c.name, c.type),
    }));
  state.categories = state.categories.map((c) => ({
    ...c,
    emoji: c.emoji || emojiForCategory(c.name, c.type),
  }));
  const ensure = (name, type) => {
    if (!state.categories.some((c) => c.name === name))
      state.categories.push({ name, type, emoji: emojiForCategory(name, type) });
  };
  ensure("Otros gastos", "expense");
  ensure("Otros ingresos", "income");
  ensure("Ahorro", "saving");
  state.transactions = state.transactions.map((t) => ({
    ...t,
    id: t.id || Date.now() + Math.random(),
    account: t.account || "cash",
  }));
  if (!state.accounts) state.accounts = { cash: 0, nequi: 0, nu: 0 };
}
function persist() {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      transactions: state.transactions,
      budgets: state.budgets,
      monthlyBudget: state.monthlyBudget,
      monthlyIncomeTarget: state.monthlyIncomeTarget,
      monthlyReports: state.monthlyReports,
      categories: state.categories,
      accounts: state.accounts,
      debts: state.debts || [],
      savingsGoals: state.savingsGoals || [],
      recurringExpenses: state.recurringExpenses || [],
    }),
  );
}
function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function currentMonthTransactions() {
  const m = monthKey();
  return state.transactions.filter((t) => String(t.date).slice(0, 7) === m);
}
function profileList() {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
  } catch (e) {
    return [];
  }
}
function renderProfiles() {
  const sel = $("profileSelect");
  if (!sel) return;
  const active = localStorage.getItem(ACTIVE_PROFILE_KEY);
  sel.innerHTML = profileList()
    .map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`)
    .join("");
  sel.value = active || "";
}
function profileId() {
  return localStorage.getItem(ACTIVE_PROFILE_KEY) || "";
}
function createProfile() {
  askForm({
    title: "Nuevo perfil",
    copy: "Tendrá sus propios movimientos, bolsillos y presupuestos. Nada se mezcla.",
    submit: "Crear perfil",
    fields: [{ name: "name", label: "Nombre", placeholder: "Ej. Casa, viaje, personal", maxlength: 24 }],
  }).then((data) => {
    if (!data) return;
    const clean = String(data.name || "").trim().slice(0, 24);
    if (!clean) { toast("Escribe un nombre"); return; }
    const list = profileList();
    if (list.some((p) => p.name.toLowerCase() === clean.toLowerCase())) {
      toast("Ya existe un perfil con ese nombre");
      return;
    }
    const id = "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
    persist();
    list.push({ id, name: clean });
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
    localStorage.setItem("mcf_profile_data_" + id, JSON.stringify({
      transactions: [], budgets: {}, monthlyBudget: 0, monthlyIncomeTarget: 0, monthlyReports: {},
      categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, emoji: emojiForCategory(c.name, c.type) })),
      accounts: { cash: 0, nequi: 0, nu: 0 }, debts: [], savingsGoals: [], recurringExpenses: [],
    }));
    localStorage.setItem(ACTIVE_PROFILE_KEY, id);
    localStorage.setItem(NAME_KEY, clean);
    KEY = "mcf_profile_data_" + id;
    Object.assign(state, {
      transactions: [], budgets: {}, monthlyBudget: 0, monthlyIncomeTarget: 0, monthlyReports: {},
      categories: DEFAULT_CATEGORIES.map((c) => ({ ...c, emoji: emojiForCategory(c.name, c.type) })),
      accounts: { cash: 0, nequi: 0, nu: 0 }, debts: [], savingsGoals: [], recurringExpenses: [], filter: "all",
    });
    paint();
    toast("Perfil creado, con sus datos aparte");
  });
}
function switchProfile(id) {
  const p = profileList().find((x) => x.id === id);
  if (!p || id === profileId()) return;
  persist();
  localStorage.setItem(ACTIVE_PROFILE_KEY, id);
  localStorage.setItem(NAME_KEY, p.name);
  KEY = "mcf_profile_data_" + id;
  for (const k of [
    "transactions",
    "budgets",
    "monthlyBudget",
    "monthlyIncomeTarget",
    "monthlyReports",
    "categories",
    "accounts",
    "debts",
    "savingsGoals",
    "recurringExpenses",
  ])
    delete state[k];
  state.filter = "all";
  load();
  $("movementSearch").value = "";
  paint();
  toast("Perfil cambiado sin mezclar datos");
}
function renameProfile() {
  const list = profileList(), p = list.find((x) => x.id === profileId());
  if (!p) return;
  askForm({
    title: "Nombre del perfil",
    submit: "Guardar",
    fields: [{ name: "name", label: "Cómo quieres verlo", value: p.name, maxlength: 24 }],
  }).then((data) => {
    if (!data) return;
    const clean = String(data.name || "").trim().slice(0, 24);
    if (!clean) return;
    if (list.some((x) => x.id !== p.id && x.name.toLowerCase() === clean.toLowerCase())) {
      toast("Ya existe un perfil con ese nombre");
      return;
    }
    p.name = clean;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
    localStorage.setItem(NAME_KEY, clean);
    paint();
    toast("Nombre actualizado");
  });
}
function enterApp() {
  const n = $("nameInput").value.trim();
  if (!n) {
    toast("Escribe tu nombre para continuar");
    return;
  }
  localStorage.setItem(NAME_KEY, n);
  const list = profileList(),
    active = list.find((x) => x.id === profileId());
  if (active && active.name === "Principal" && list.length === 1) {
    active.name = n;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
  }
  showApp();
}
function showApp() {
  const n = localStorage.getItem(NAME_KEY) || "";
  if (!n) {
    $("entry").classList.add("show");
    $("app").hidden = true;
    $("bottomNav").hidden = true;
    setTimeout(() => $("nameInput").focus(), 50);
    return;
  }
  $("entry").classList.remove("show");
  $("app").hidden = false;
  $("bottomNav").hidden = false;
  paint();
}
function go(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.toggle("active", p.id === page));
  document
    .querySelectorAll(".nav")
    .forEach((n) => n.classList.toggle("active", n.dataset.page === page));
  const movementFab = document.getElementById("movementFab");
  if (movementFab) movementFab.hidden = page !== "movements";
  window.scrollTo(0, 0);
  paint();
}
function monthTotals() {
  let income = 0,
    expense = 0,
    savings = 0;
  currentMonthTransactions().forEach((t) => {
    if (t.type === "income") income += +t.amount;
    else if (t.type === "saving") savings += +t.amount;
    else expense += +t.amount;
  });
  return { income, expense, savings, balance: income - expense - savings };
}
function incomePlan() {
  const target = Number(state.monthlyIncomeTarget) || 0,
    received = monthTotals().income,
    diff = received - target,
    pct = target ? (received / target) * 100 : 0;
  return { target, received, diff, pct, hit: target > 0 && received >= target };
}
function incomePlanStatus() {
  const p = incomePlan();
  if (!p.target) return "Define tu estimación";
  if (p.received === 0) return "Aún no has registrado ingresos";
  if (p.hit) return `Superaste tu estimación por ${money(p.diff)}`;
  return `Te faltan ${money(Math.abs(p.diff))} para alcanzarla`;
}
function weeklyTotals(type) {
  const out = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = todayFor(d);
    const val = state.transactions
      .filter((t) => t.type === type && t.date === iso)
      .reduce((s, t) => s + Number(t.amount), 0);
    out.push({ val, label: d.toLocaleDateString("es-CO", { weekday: "short" }).slice(0, 2) });
  }
  return out;
}
function todayFor(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function accountBalance(id) {
  const base = Number(state.accounts[id]) || 0;
  let v = base;
  state.transactions.forEach((t) => {
    if ((t.account || "cash") !== id) return;
    v +=
      t.type === "income"
        ? Number(t.amount)
        : t.type === "expense" || t.type === "saving"
          ? -Number(t.amount)
          : 0;
  });
  return v;
}
function totalAvailable() {
  return ["cash", "nequi", "nu"].reduce((s, a) => s + accountBalance(a), 0);
}
function totalSavings() {
  return state.transactions
    .filter((t) => t.type === "saving")
    .reduce((s, t) => s + Number(t.amount), 0);
}
function walletHTML(id, name, emoji, cls) {
  const icon = {
    cash: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 8.2v7.2M9.6 10.4h3.6a1.6 1.6 0 0 1 0 3.2H10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    nequi: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="3.5" width="10" height="17" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10.5 17.5h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    nu: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 10.5h17" stroke="currentColor" stroke-width="1.7"/></svg>',
  }[id] || "";
  return `<button type="button" class="wallet ${cls}" onclick="go('account')"><div class="wallet-icon">${icon}</div><div class="wallet-name">${name}</div><div class="wallet-value">${money(accountBalance(id))}</div></button>`;
}
function movementHTML(t) {
  const c = categoryObj(t.category),
    sign = t.type === "income" ? "+" : "−";
  const account = { cash: "Efectivo", nequi: "Nequi", nu: "Nu" }[t.account || "cash"] || "Efectivo";
  return `<div class="movement-card"><div class="movement-icon">${c.emoji}</div><div class="movement-main"><div class="movement-name">${esc(t.description || t.category)}</div><div class="movement-meta">${esc(t.type === "saving" ? "Ahorro" : t.category)} · ${esc(account)} · ${esc(t.date)}</div><div class="movement-actions"><button class="movement-action" onclick="editTx(${Number(t.id)})">Editar</button><button class="movement-action delete" onclick="deleteTx(${Number(t.id)})">Eliminar</button></div></div><div class="movement-amount ${t.type === "saving" ? "saving" : t.type}">${sign} ${money(t.amount)}</div></div>`;
}
function visiblePage() {
  const page = document.querySelector(".page.active");
  return (page && page.id) || "home";
}
function paint() {
  const n = localStorage.getItem(NAME_KEY) || "";
  $("homeName").textContent = n;
  $("accountName").textContent = n;
  $("avatar").textContent = n.charAt(0).toUpperCase() || "K";
  const mt = monthTotals(),
    available = totalAvailable();
  $("homeBalance").textContent = money(available);
  $("balanceSub").textContent =
    available >= 0 ? "Disponible entre efectivo, Nequi y Nu." : "Revisa tus saldos registrados.";
  $("homeIncome").textContent = money(mt.income);
  $("homeExpense").textContent = money(mt.expense);
  $("homeSavings").textContent = money(mt.savings);
  $("homeAvailable").textContent = money(available);
  $("walletTotal").textContent = money(available);
  $("dataCount").textContent =
    `${state.transactions.length} movimiento${state.transactions.length === 1 ? "" : "s"}`;
  $("accountSavings").textContent = money(totalSavings());
  renderIncomePlan();
  const page = visiblePage();
  if (page === "home") {
    renderWallets();
    renderRecent();
  } else if (page === "analysis") {
    renderAnalysis();
  } else if (page === "budget") {
    renderBudget();
  } else if (page === "movements") {
    renderMovements();
  } else if (page === "account") {
    renderProfiles();
    renderDebtGoals();
    renderRecurringExpenses();
    $("openCash").value = state.accounts.cash || 0;
    $("openNequi").value = state.accounts.nequi || 0;
    $("openNu").value = state.accounts.nu || 0;
  }
  niloReact();
}
function renderWallets() {
  $("homeWallets").innerHTML =
    walletHTML("cash", "Efectivo", "💵", "cash") +
    walletHTML("nequi", "Nequi", "🟢", "nequi") +
    walletHTML("nu", "Nu", "🔵", "nu");
}
function renderRecent() {
  const rows = [...state.transactions]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 4);
  $("recentList").innerHTML = rows.length
    ? rows.map(movementHTML).join("")
    : '<div class="empty">Aún no hay movimientos. Registra tu primer ingreso o gasto.</div>';
}
function setFilter(f, el) {
  state.filter = f;
  document.querySelectorAll(".filter").forEach((x) => x.classList.remove("active"));
  el.classList.add("active");
  renderMovements();
}
let movementTimer = 0;
function queueMovements() {
  clearTimeout(movementTimer);
  movementTimer = setTimeout(renderMovements, 40);
}
function renderMovements() {
  const q = ($("movementSearch")?.value || "").toLowerCase().trim();
  const rows = [...state.transactions]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .filter((t) => state.filter === "all" || t.type === state.filter)
    .filter((t) => !q || `${t.description} ${t.category} ${t.amount}`.toLowerCase().includes(q));
  $("movementList").innerHTML = rows.length
    ? rows.map(movementHTML).join("")
    : '<div class="empty">No encontramos movimientos con ese filtro.</div>';
}
function refreshTxCategories() {
  const type = $("txType").value;
  const cats = state.categories.filter((c) => c.type === type);
  $("txCategory").innerHTML =
    cats.map((c) => `<option value="${esc(c.name)}">${c.emoji} ${esc(c.name)}</option>`).join("") ||
    (type === "saving"
      ? '<option value="Ahorro">🎯 Ahorro</option>'
      : '<option value="Otros gastos">📌 Otros gastos</option>');
}
function openTx(type = "expense") {
  delete $("txModal").dataset.editId;
  $("txType").value = type;
  $("txTitle").textContent =
    type === "income"
      ? "Registrar ingreso"
      : type === "saving"
        ? "Apartar para ahorro"
        : "Registrar gasto";
  $("txAmount").value = "";
  $("txDescription").value = "";
  $("txDate").value = today();
  refreshTxCategories();
  $("txAccount").value = "cash";
  $("txModal").classList.add("show");
  setTimeout(() => $("txAmount").focus(), 50);
}
function saveTx() {
  const amount = Number($("txAmount").value),
    type = $("txType").value;
  if (!(amount > 0)) {
    toast("Escribe un monto válido");
    return;
  }
  const cat = $("txCategory").value;
  const editId = $("txModal").dataset.editId;
  if (editId) {
    const t = state.transactions.find((x) => String(x.id) === String(editId));
    if (t) {
      const previousType = t.type;
      t.type = type;
      t.amount = amount;
      t.category = cat;
      t.description = $("txDescription").value.trim() || cat;
      t.date = $("txDate").value || today();
      t.account = $("txAccount").value;
      if (type !== "expense") {
        delete t.debtId;
        delete t.recurringId;
      }
      if (type !== "saving") delete t.goalId;
    }
  } else {
    state.transactions.push({
      id: Date.now(),
      type,
      amount,
      category: cat,
      description: $("txDescription").value.trim() || cat,
      date: $("txDate").value || today(),
      account: $("txAccount").value,
    });
  }
  delete $("txModal").dataset.editId;
  persist();
  closeModal("txModal");
  paint();
  checkBudgetAlerts();
  toast(
    editId
      ? "Movimiento actualizado"
      : type === "income"
        ? "Ingreso guardado"
        : type === "saving"
          ? "Ahorro registrado"
          : "Gasto guardado",
  );
}
function openMonthlyBudget() {
  $("monthlyAmount").value = state.monthlyBudget || "";
  $("monthlyModal").classList.add("show");
  setTimeout(() => $("monthlyAmount").focus(), 50);
}
function saveMonthlyBudget() {
  const a = Number($("monthlyAmount").value);
  if (a < 0 || Number.isNaN(a)) {
    toast("Escribe un presupuesto válido");
    return;
  }
  state.monthlyBudget = a;
  persist();
  closeModal("monthlyModal");
  paint();
  toast("Presupuesto mensual actualizado");
}
function openCategory() {
  categoryMode = "create";
  categoryOriginal = "";
  $("categoryModalTitle").textContent = "Nueva categoría";
  $("categorySaveBtn").textContent = "Crear categoría";
  $("categoryName").value = "";
  $("categoryType").value = "expense";
  $("categoryType").disabled = false;
  $("categoryLimit").value = "";
  updateEmojiPreview();
  $("categoryModal").classList.add("show");
  setTimeout(() => $("categoryName").focus(), 50);
}
function openEditCategory(name) {
  const c = state.categories.find((x) => x.name === name);
  if (!c) return;
  categoryMode = "edit";
  categoryOriginal = name;
  $("categoryModalTitle").textContent = "Editar categoría";
  $("categorySaveBtn").textContent = "Guardar cambios";
  $("categoryName").value = c.name;
  $("categoryType").value = c.type;
  const hasTx = state.transactions.some((t) => t.category === name),
    hasRecurring = (state.recurringExpenses || []).some((r) => r.category === name);
  $("categoryType").disabled = hasTx || hasRecurring || name === "Ahorro";
  $("categoryLimit").value =
    c.type === "expense" && state.budgets[name] != null ? state.budgets[name] : "";
  updateEmojiPreview();
  $("categoryModal").classList.add("show");
  setTimeout(() => $("categoryName").focus(), 50);
}
function openLimit(categoryName = "") {
  const cats = state.categories.filter((c) => c.type === "expense");
  $("limitCategory").innerHTML = cats
    .map((c) => `<option value="${esc(c.name)}">${c.emoji} ${esc(c.name)}</option>`)
    .join("");
  if (categoryName && cats.some((c) => c.name === categoryName))
    $("limitCategory").value = categoryName;
  $("limitAmount").value =
    categoryName && state.budgets[categoryName] != null ? state.budgets[categoryName] : "";
  $("limitModal").classList.add("show");
  setTimeout(() => $("limitAmount").focus(), 50);
}
function saveLimit() {
  const c = $("limitCategory").value,
    a = Number($("limitAmount").value);
  if (!c || a < 0 || Number.isNaN(a)) {
    toast("Escribe un límite válido");
    return;
  }
  if (a === 0) delete state.budgets[c];
  else state.budgets[c] = a;
  persist();
  closeModal("limitModal");
  paint();
  toast(a === 0 ? "Límite eliminado" : "Límite de categoría guardado");
}
function updateEmojiPreview() {
  $("categoryEmojiPreview").textContent = emojiForCategory(
    $("categoryName").value || "Nueva categoría",
    $("categoryType").value,
  );
}
function saveCategory() {
  const name = $("categoryName").value.trim();
  const type = $("categoryType").value;
  if (!name) {
    toast("Ponle un nombre a la categoría");
    return;
  }
  if (categoryMode === "create") {
    if (state.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast("Esa categoría ya existe");
      return;
    }
    state.categories.push({ name, type, emoji: emojiForCategory(name, type) });
    const limit = Number($("categoryLimit").value) || 0;
    if (type === "expense" && limit > 0) state.budgets[name] = limit;
    persist();
    closeModal("categoryModal");
    paint();
    toast(`${emojiForCategory(name, type)} ${name} creada`);
    return;
  }
  const original = state.categories.find((c) => c.name === categoryOriginal);
  if (!original) return;
  if (
    state.categories.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.name !== categoryOriginal,
    )
  ) {
    toast("Ya existe una categoría con ese nombre");
    return;
  }
  const hasTx = state.transactions.some((t) => t.category === categoryOriginal),
    hasRecurring = (state.recurringExpenses || []).some((r) => r.category === categoryOriginal);
  if ((hasTx || hasRecurring) && type !== original.type) {
    toast(
      "No puedes cambiar el tipo de una categoría que ya tiene movimientos o gastos recurrentes. Crea otra categoría para no alterar tus datos.",
    );
    return;
  }
  if (categoryOriginal === "Ahorro" && (name !== "Ahorro" || type !== "saving")) {
    toast(
      "La categoría Ahorro es necesaria para registrar tus reservas y no se puede renombrar ni cambiar de tipo.",
    );
    return;
  }
  const previousLimit = state.budgets[categoryOriginal];
  if (name !== categoryOriginal) {
    state.transactions.forEach((t) => {
      if (t.category === categoryOriginal) t.category = name;
    });
    (state.recurringExpenses || []).forEach((r) => {
      if (r.category === categoryOriginal) r.category = name;
    });
    if (Object.prototype.hasOwnProperty.call(state.budgets, categoryOriginal)) {
      state.budgets[name] = state.budgets[categoryOriginal];
      delete state.budgets[categoryOriginal];
    }
  }
  original.name = name;
  original.type = type;
  original.emoji = emojiForCategory(name, type);
  const limitRaw = $("categoryLimit").value.trim();
  if (type === "expense") {
    if (limitRaw === "") {
      if (previousLimit != null) state.budgets[name] = previousLimit;
      else delete state.budgets[name];
    } else {
      const limit = Number(limitRaw);
      if (limit > 0) state.budgets[name] = limit;
      else delete state.budgets[name];
    }
  } else delete state.budgets[name];
  persist();
  closeModal("categoryModal");
  paint();
  toast("Categoría actualizada sin perder movimientos");
}
function deleteCategory(name) {
  const c = state.categories.find((x) => x.name === name);
  if (!c) return;
  const fallback =
    c.type === "income" ? "Otros ingresos" : c.type === "saving" ? "Ahorro" : "Otros gastos";
  if (name === fallback) {
    toast("Esta categoría es necesaria como respaldo y no se puede eliminar");
    return;
  }
  const hasTx = state.transactions.filter((t) => t.category === name);
  let msg = `¿Eliminar ${c.emoji} ${name}?`;
  if (hasTx.length)
    msg += `\n\nTiene ${hasTx.length} movimiento${hasTx.length === 1 ? "" : "s"}. No se borrarán: se moverán a ${fallback} para conservar todos tus datos.`;
  if (!confirm(msg)) return;
  state.transactions.forEach((t) => {
    if (t.category === name) t.category = fallback;
  });
  (state.recurringExpenses || []).forEach((r) => {
    if (r.category === name) r.category = fallback;
  });
  delete state.budgets[name];
  state.categories = state.categories.filter((x) => x.name !== name);
  persist();
  paint();
  toast(`${name} eliminada sin borrar movimientos`);
}
function jsArg(v) {
  return encodeURIComponent(String(v));
}
function renderCategoryManager() {
  const groups = [
    ["Gastos", state.categories.filter((c) => c.type === "expense")],
    ["Ingresos", state.categories.filter((c) => c.type === "income")],
    ["Ahorros", state.categories.filter((c) => c.type === "saving")],
  ];
  $("categoryManagerList").innerHTML = groups
    .map(
      ([title, cats]) =>
        `<div class="group-label">${title}</div>${cats.map((c) => `<div class="manage-cat"><div class="manage-cat-main"><div class="manage-cat-name">${c.emoji} ${esc(c.name)}</div><div class="manage-cat-meta">${c.type === "expense" ? (state.budgets[c.name] != null ? `Límite: ${money(state.budgets[c.name])}` : "Sin límite") : "Categoría de ingreso"}</div></div><div class="manage-cat-actions"><button class="mini-btn" onclick="openEditCategory(decodeURIComponent('${jsArg(c.name)}'))">Editar</button>${c.type === "expense" ? `<button class="mini-btn limit" onclick="openLimit(decodeURIComponent('${jsArg(c.name)}'))">Límite</button>` : ""}<button class="mini-btn delete" onclick="deleteCategory(decodeURIComponent('${jsArg(c.name)}'))">Eliminar</button></div></div>`).join("")}`,
    )
    .join("");
}
function renderBudget() {
  const entries = Object.entries(state.budgets);
  let spent = 0;
  const m = monthKey();
  state.transactions
    .filter((t) => t.type === "expense" && String(t.date).slice(0, 7) === m)
    .forEach((t) => (spent += Number(t.amount)));
  const total = Number(state.monthlyBudget) || 0;
  $("budgetTotal").textContent = money(total);
  $("budgetSpent").textContent = money(spent);
  $("budgetLeft").textContent = money(total - spent);
  $("budgetLeft").classList.toggle("over", total > 0 && spent > total);
  const meter = $("budgetMeter");
  if (meter) {
    const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
    meter.style.width = pct + "%";
    meter.classList.toggle("warn", total > 0 && spent > total);
  }
  $("budgetList").innerHTML = entries.length
    ? entries
        .map(([c, l]) => {
          const cat = categoryObj(c),
            used = state.transactions
              .filter(
                (t) => t.type === "expense" && t.category === c && String(t.date).slice(0, 7) === m,
              )
              .reduce((s, t) => s + Number(t.amount), 0),
            pct = Math.min(100, l ? (used / l) * 100 : 0),
            over = used > l;
          return `<div class="budget-item"><div class="budget-top"><strong>${cat.emoji} ${esc(c)}</strong><span>${over ? "Sobre el límite" : Math.round(pct) + "% usado"}</span></div><div class="track"><div class="fill ${over ? "warn" : ""}" style="width:${pct}%"></div></div><div class="budget-numbers"><span>Gastado <strong>${money(used)}</strong></span><span>Límite <strong>${money(l)}</strong></span></div><div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="mini-btn limit" onclick="openLimit(decodeURIComponent('${jsArg(c)}'))">Editar límite</button></div></div>`;
        })
        .join("")
    : '<div class="empty">Puedes usar solo el presupuesto mensual o añadir límites para las categorías que quieras controlar.</div>';
  renderCategoryManager();
}
function editTx(id) {
  const t = state.transactions.find((x) => Number(x.id) === Number(id));
  if (!t) return;
  $("txType").value = t.type;
  $("txTitle").textContent =
    t.type === "income" ? "Editar ingreso" : t.type === "saving" ? "Editar ahorro" : "Editar gasto";
  $("txAmount").value = t.amount;
  $("txDescription").value = t.description || "";
  $("txDate").value = t.date || today();
  refreshTxCategories();
  $("txCategory").value = t.category;
  $("txAccount").value = t.account || "cash";
  $("txModal").dataset.editId = String(t.id);
  $("txModal").classList.add("show");
  setTimeout(() => $("txAmount").focus(), 50);
}
function deleteTx(id) {
  const i = state.transactions.findIndex((x) => Number(x.id) === Number(id));
  if (i < 0) return;
  const t = state.transactions[i];
  if (
    !confirm(
      `¿Eliminar ${t.type === "income" ? "el ingreso" : t.type === "saving" ? "el ahorro" : "el gasto"} de ${money(t.amount)}?`,
    )
  )
    return;
  state.transactions.splice(i, 1);
  persist();
  paint();
  toast("Movimiento eliminado");
}
function renderIncomePlan() {
  const p = incomePlan();
  $("homeIncomeTarget").textContent = p.target ? money(p.target) : "Sin estimar";
  $("homeIncomeReceived").textContent = money(p.received);
  $("homeIncomeStatus").textContent = p.target
    ? p.hit
      ? "Meta alcanzada"
      : "En progreso"
    : "Aún no definida";
  $("incomePlanFill").style.width = p.target ? `${Math.min(100, p.pct)}%` : "0%";
  $("incomePlanFill").classList.toggle("hit", p.hit);
}
function openIncomePlan() {
  $("incomeTargetAmount").value = state.monthlyIncomeTarget || "";
  $("incomePlanModal").classList.add("show");
  setTimeout(() => $("incomeTargetAmount").focus(), 50);
}
function saveIncomePlan() {
  const a = Number($("incomeTargetAmount").value);
  if (a < 0 || Number.isNaN(a)) {
    toast("Escribe una estimación válida");
    return;
  }
  state.monthlyIncomeTarget = a;
  persist();
  closeModal("incomePlanModal");
  paint();
  toast("Estimación de ingresos actualizada");
}
function monthReport(key) {
  const rows = state.transactions.filter((t) => String(t.date).slice(0, 7) === key);
  let income = 0,
    expense = 0,
    savings = 0;
  const cats = {},
    methods = { cash: 0, nequi: 0, nu: 0 };
  rows.forEach((t) => {
    const a = Number(t.amount) || 0;
    if (t.type === "income") income += a;
    else if (t.type === "saving") savings += a;
    else {
      expense += a;
      cats[t.category] = (cats[t.category] || 0) + a;
      methods[t.account || "cash"] = (methods[t.account || "cash"] || 0) + a;
    }
  });
  const top = Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const prevDate = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 2, 1);
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const prevRows = state.transactions.filter((t) => String(t.date).slice(0, 7) === prevKey);
  const prevExpense = prevRows
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + Number(t.amount), 0);
  return {
    key,
    income,
    expense,
    savings,
    balance: income - expense - savings,
    methods,
    top,
    prevExpense,
    change: expense - prevExpense,
    hasPrevious: prevRows.length > 0,
  };
}
function renderMonthlyReport() {
  const current = monthKey();
  const keys = [
    ...new Set([
      ...Object.keys(state.monthlyReports || {}),
      ...state.transactions
        .map((t) => String(t.date).slice(0, 7))
        .filter((k) => /^\d{4}-\d{2}$/.test(k)),
      current,
    ]),
  ]
    .sort()
    .reverse();
  const picker = $("monthlyReportMonth");
  const selected = picker.value && keys.includes(picker.value) ? picker.value : current;
  picker.innerHTML = keys
    .map((k) => `<option value="${k}">${k === current ? "Este mes" : k}</option>`)
    .join("");
  picker.value = selected;
  const r = monthReport(selected);
  const methodName = { cash: "Efectivo", nequi: "Nequi", nu: "Nu" };
  const top = r.top.length
    ? r.top
        .map(
          ([c, v]) =>
            `<div class="cat-line" style="margin-top:8px"><span>${esc(c)}</span><strong>${money(v)}</strong></div>`,
        )
        .join("")
    : '<div class="empty">Aún no hay gastos registrados.</div>';
  $("monthlyReport").innerHTML =
    `<div class="cat-line"><span>Ingresos</span><strong>${money(r.income)}</strong></div><div class="cat-line" style="margin-top:8px"><span>Gastos</span><strong>${money(r.expense)}</strong></div><div class="cat-line" style="margin-top:8px"><span>Ahorros apartados</span><strong>${money(r.savings)}</strong></div><div class="cat-line" style="margin-top:8px"><span>Saldo disponible generado este mes</span><strong>${money(r.balance)}</strong></div><div class="category-row"><strong style="font-size:12px">Gastos por método de pago</strong>${Object.entries(
      r.methods,
    )
      .map(
        ([k, v]) =>
          `<div class="cat-line" style="margin-top:8px"><span>${methodName[k] || k}</span><strong>${money(v)}</strong></div>`,
      )
      .join(
        "",
      )}</div><div class="category-row"><strong style="font-size:12px">Mayores categorías de gasto</strong>${top}</div><div class="cat-line"><span>Comparación con mes anterior</span><strong>${r.hasPrevious ? (r.change > 0 ? "+ " : "") + money(r.change) : "Sin datos anteriores"}</strong></div>`;
}
function expenseProjection() {
  const now = new Date(),
    rows = state.transactions.filter(
      (t) => t.type === "expense" && String(t.date).slice(0, 7) === monthKey(now),
    );
  const spent = rows.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const elapsed = now.getDate(),
    days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return { spent, elapsed, days, projected: elapsed ? Math.round((spent / elapsed) * days) : 0 };
}
function exportFullBackup() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (
      k &&
      (k === NAME_KEY ||
        k === PROFILES_KEY ||
        k === ACTIVE_PROFILE_KEY ||
        k === "mcf_final_v4" ||
        k === "mcf_final_v3" ||
        k === "mcf_final_v2" ||
        k.startsWith("mcf_profile_data_"))
    )
      keys.push(k);
  }
  const data = {
    format: "mi-control-financiero-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    appId: "com.micontrolfinanciero.app",
    values: {},
  };
  keys.forEach((k) => (data.values[k] = localStorage.getItem(k)));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "respaldo-mi-control-financiero-" + today() + ".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast("Respaldo completo preparado");
}
function importFullBackup(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    toast("El respaldo supera el tamaño permitido");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try {
      data = JSON.parse(String(reader.result || ""));
    } catch (e) {
      toast("El archivo no es un JSON válido");
      return;
    }
    const v = data && data.values,
      allowed = (k) =>
        k === NAME_KEY ||
        k === PROFILES_KEY ||
        k === ACTIVE_PROFILE_KEY ||
        k === "mcf_final_v4" ||
        k === "mcf_final_v3" ||
        k === "mcf_final_v2" ||
        (typeof k === "string" && k.startsWith("mcf_profile_data_"));
    let profileRows;
    try {
      profileRows = JSON.parse((v && v[PROFILES_KEY]) || "[]");
    } catch (e) {
      toast("La lista de perfiles del respaldo está dañada");
      return;
    }
    if (
      !data ||
      data.format !== "mi-control-financiero-backup" ||
      data.version !== 1 ||
      !v ||
      typeof v !== "object" ||
      Array.isArray(v) ||
      !Object.keys(v).length ||
      !Object.keys(v).every(allowed) ||
      !Array.isArray(profileRows) ||
      !profileRows.length ||
      !Object.prototype.hasOwnProperty.call(v, NAME_KEY) ||
      !Object.prototype.hasOwnProperty.call(v, ACTIVE_PROFILE_KEY)
    ) {
      toast("El respaldo no pertenece a Mi Control Financiero o está incompleto");
      return;
    }
    const profileIds = profileRows.map((p) => p && p.id);
    if (
      profileRows.length > 100 ||
      profileRows.some(
        (p) =>
          !p || typeof p.id !== "string" || !p.id || typeof p.name !== "string" || !p.name.trim(),
      ) ||
      new Set(profileIds).size !== profileIds.length ||
      !profileIds.includes(v[ACTIVE_PROFILE_KEY])
    ) {
      toast("La lista de perfiles del respaldo no es válida");
      return;
    }
    for (const k of Object.keys(v)) {
      if (typeof v[k] !== "string") {
        toast("El respaldo contiene datos no válidos");
        return;
      }
      if (k.startsWith("mcf_profile_data_")) {
        try {
          const d = JSON.parse(v[k]);
          if (
            !d ||
            typeof d !== "object" ||
            Array.isArray(d) ||
            !Array.isArray(d.transactions) ||
            !d.transactions.every(
              (t) =>
                t &&
                typeof t === "object" &&
                !Array.isArray(t) &&
                ["income", "expense", "saving"].includes(t.type) &&
                Number(t.amount) > 0,
            )
          ) {
            toast("Un perfil del respaldo está dañado");
            return;
          }
          if (d.budgets != null && (typeof d.budgets !== "object" || Array.isArray(d.budgets))) {
            toast("Los presupuestos de un perfil están dañados");
            return;
          }
          if (d.categories != null && !Array.isArray(d.categories)) {
            toast("Las categorías de un perfil están dañadas");
            return;
          }
          if (d.accounts != null && (typeof d.accounts !== "object" || Array.isArray(d.accounts))) {
            toast("Los saldos de un perfil están dañados");
            return;
          }
        } catch (e) {
          toast("Un perfil del respaldo está dañado");
          return;
        }
      }
    }
    for (const p of profileRows) {
      const k = "mcf_profile_data_" + p.id;
      if (typeof v[k] !== "string") {
        toast("Faltan los datos de uno de los perfiles del respaldo");
        return;
      }
    }
    if (
      !confirm(
        "Restaurar este respaldo reemplazará los datos actuales de Mi Control Financiero en esta instalación. ¿Ya guardaste un respaldo de lo que tienes aquí y deseas continuar?",
      )
    )
      return;
    const before = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && allowed(k)) before[k] = localStorage.getItem(k);
    }
    try {
      Object.keys(before).forEach((k) => localStorage.removeItem(k));
      Object.keys(v).forEach((k) => localStorage.setItem(k, v[k]));
      toast("Respaldo restaurado. Abriendo tus perfiles…");
      setTimeout(() => location.reload(), 350);
    } catch (e) {
      Object.keys(v).forEach((k) => localStorage.removeItem(k));
      Object.keys(before).forEach((k) => localStorage.setItem(k, before[k]));
      toast("No se pudo restaurar; se conservaron los datos anteriores");
    }
  };
  reader.onerror = () => toast("No se pudo leer el archivo de respaldo");
  reader.readAsText(file);
}
function exportTransactionsCSV() {
  if (!state.transactions.length) {
    toast("Todavía no hay movimientos para exportar");
    return;
  }
  const rows = [
    ["Fecha", "Tipo", "Descripción", "Categoría", "Método de pago", "Valor"],
    ...state.transactions
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((t) => [
        t.date,
        t.type === "income" ? "Ingreso" : t.type === "saving" ? "Ahorro" : "Gasto",
        t.description || "",
        t.category || "",
        { cash: "Efectivo", nequi: "Nequi", nu: "Nu" }[t.account || "cash"] || "Efectivo",
        Number(t.amount) || 0,
      ]),
  ];
  const csv =
    "\uFEFF" +
    rows
      .map((row) => row.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(";"))
      .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download =
    "mi-control-financiero-" +
    (profileList().find((p) => p.id === profileId())?.name || "perfil").replace(
      /[^a-z0-9_-]/gi,
      "_",
    ) +
    "-" +
    today() +
    ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Exportación preparada");
}
function renderAnalysis() {
  const mt = monthTotals(),
    p = incomePlan();
  $("aIncome").textContent = money(mt.income);
  $("aExpense").textContent = money(mt.expense);
  $("aBalance").textContent = money(mt.balance);
  $("aSavings").textContent = money(mt.savings);
  $("aIncomeTarget").textContent = p.target ? money(p.target) : "Sin definir";
  $("aIncomeReceived").textContent = money(p.received);
  $("aIncomeDifference").textContent = p.target
    ? p.diff >= 0
      ? `+ ${money(p.diff)}`
      : `− ${money(Math.abs(p.diff))}`
    : "—";
  $("aIncomePercent").textContent = p.target ? `${Math.round(p.pct)}%` : "—";
  $("aIncomeStatus").textContent = p.target
    ? p.hit
      ? `Sí, alcanzaste y superaste tu estimación. ${incomePlanStatus()}.`
      : `Todavía estás en ${Math.round(p.pct)}% de tu estimación. ${incomePlanStatus()}.`
    : "Define cuánto esperas recibir este mes y luego registra cada envío semanal como ingreso.";
  const incomeDays = weeklyTotals("income"),
    maxIncome = Math.max(...incomeDays.map((d) => d.val), 1);
  $("incomeWeekChart").innerHTML = incomeDays
    .map(
      (d) =>
        `<div class="bar-wrap"><div class="bar income-bar" style="height:${Math.max(4, (d.val / maxIncome) * 115)}px"></div><div class="bar-day">${esc(d.label)}</div></div>`,
    )
    .join("");
  const days = weeklyTotals("expense"),
    max = Math.max(...days.map((d) => d.val), 1);
  $("weekChart").innerHTML = days
    .map(
      (d) =>
        `<div class="bar-wrap"><div class="bar" style="height:${Math.max(4, (d.val / max) * 115)}px"></div><div class="bar-day">${esc(d.label)}</div></div>`,
    )
    .join("");
  const cats = state.categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      c,
      val: state.transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.category === c.name &&
            String(t.date).slice(0, 7) === monthKey(),
        )
        .reduce((s, t) => s + Number(t.amount), 0),
    }))
    .filter((x) => x.val > 0)
    .sort((a, b) => b.val - a.val);
  $("categoryAnalysis").innerHTML = cats.length
    ? cats
        .map(
          (x) =>
            `<div class="category-row"><div class="cat-line"><strong>${x.c.emoji} ${esc(x.c.name)}</strong><span>${money(x.val)}</span></div></div>`,
        )
        .join("")
    : '<div class="empty">Cuando registres gastos, aquí verás en qué categorías estás gastando.</div>';
  const projection = expenseProjection();
  $("expenseProjection").textContent = money(projection.projected);
  $("expenseProjectionNote").textContent = projection.spent
    ? `Llevas ${money(projection.spent)} en ${projection.elapsed} de ${projection.days} días. Es una proyección orientativa basada en tu ritmo actual.`
    : "Registra gastos durante el mes para calcular una proyección.";
  renderMonthlyReport();
}
function debtPayments(id) {
  return state.transactions
    .filter((t) => t.type === "expense" && t.debtId === id)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}
function debtRemaining(d) {
  return Math.max(0, (Number(d.total) || 0) - debtPayments(d.id));
}
function goalSaved(g) {
  return state.transactions
    .filter((t) => t.type === "saving" && t.goalId === g.id)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
}
function renderDebtGoals() {
  const debts = state.debts || [],
    goals = state.savingsGoals || [];
  $("debtList").innerHTML = debts.length
    ? debts
        .map((d) => {
          const left = debtRemaining(d),
            paid = Number(d.total) - left;
          return `<div class="category-row"><div class="cat-line"><strong>${esc(d.name)}</strong><strong>${money(left)}</strong></div><div class="movement-meta">Saldo inicial: ${money(d.total)} · Abonado: ${money(paid)}</div><div style="display:flex;justify-content:flex-end;margin-top:8px;gap:7px"><button class="mini-btn limit" onclick="payDebt('${d.id}')">Registrar abono</button><button class="mini-btn delete" onclick="removeDebt('${d.id}')">Eliminar</button></div></div>`;
        })
        .join("")
    : '<div class="empty">Aún no tienes deudas registradas.</div>';
  $("goalList").innerHTML = goals.length
    ? goals
        .map((g) => {
          const saved = goalSaved(g),
            pct = Math.min(100, g.target ? Math.round((saved / g.target) * 100) : 0);
          return `<div class="category-row"><div class="cat-line"><strong>🎯 ${esc(g.name)}</strong><strong>${pct}%</strong></div><div class="track"><div class="fill" style="width:${pct}%"></div></div><div class="budget-numbers"><span>Ahorrado <strong>${money(saved)}</strong></span><span>Meta <strong>${money(g.target)}</strong></span></div><div style="display:flex;justify-content:flex-end;margin-top:8px;gap:7px"><button class="mini-btn limit" onclick="contributeGoal('${g.id}')">Aportar ahorro</button><button class="mini-btn delete" onclick="removeGoal('${g.id}')">Eliminar</button></div></div>`;
        })
        .join("")
    : '<div class="empty">Crea una meta para seguir cuánto llevas ahorrado.</div>';
}

function renderRecurringExpenses() {
  const rows = state.recurringExpenses || [];
  const now = new Date(),
    m = monthKey(now),
    day = now.getDate(),
    lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  $("recurringList").innerHTML = rows.length
    ? rows
        .map((r) => {
          const done = r.lastRegistered === m,
            due = Math.min(Number(r.day) || 1, lastDay) <= day;
          return `<div class="category-row"><div class="cat-line"><strong>${esc(r.name)}</strong><strong>${money(r.amount)}</strong></div><div class="movement-meta">Día ${r.day} · ${esc(r.category)} · ${{ cash: "Efectivo", nequi: "Nequi", nu: "Nu" }[r.account] || "Efectivo"}</div><div style="display:flex;justify-content:flex-end;gap:6px;margin-top:8px"><button class="mini-btn limit" ${done || !due ? "disabled" : ""} onclick="registerRecurringExpense('${r.id}')">${done ? "Registrado este mes" : due ? "Confirmar cobro" : "Aún no vence"}</button><button class="mini-btn delete" onclick="removeRecurringExpense('${r.id}')">Eliminar</button></div></div>`;
        })
        .join("")
    : '<div class="empty">Aún no tienes gastos recurrentes.</div>';
}
function addRecurringExpense() {
  const cats = state.categories.filter((c) => c.type === "expense");
  askForm({
    title: "Gasto que se repite",
    copy: "Solo es un recordatorio. Nada se descuenta hasta que lo confirmes.",
    submit: "Guardar recordatorio",
    fields: [
      { name: "name", label: "Nombre", placeholder: "Ej. Internet, arriendo", maxlength: 50 },
      { name: "amount", label: "Valor habitual", type: "number", inputmode: "numeric", min: 1, placeholder: "0" },
      { name: "day", label: "Día del mes", type: "number", inputmode: "numeric", min: 1, max: 31, value: "1" },
      { name: "category", label: "Categoría", type: "select", options: cats.map((c) => ({ value: c.name, label: c.name })) },
      { name: "account", label: "Bolsillo", type: "select", value: "nequi", options: [
        { value: "cash", label: "Efectivo" }, { value: "nequi", label: "Nequi" }, { value: "nu", label: "Nu" },
      ]},
    ],
  }).then((data) => {
    if (!data) return;
    const name = String(data.name || "").trim();
    const amount = Number(data.amount);
    const day = Number(data.day);
    if (!name) { toast("Ponle un nombre"); return; }
    if (!(amount > 0)) { toast("Ingresa un valor válido"); return; }
    if (!Number.isInteger(day) || day < 1 || day > 31) { toast("El día debe estar entre 1 y 31"); return; }
    const category = cats.find((c) => c.name === data.category);
    if (!category) { toast("Elige una categoría de gasto"); return; }
    if (!["cash", "nequi", "nu"].includes(data.account)) { toast("Elige un bolsillo"); return; }
    state.recurringExpenses.push({
      id: "r_" + Date.now(), name: name.slice(0, 50), amount, day,
      category: category.name, account: data.account, lastRegistered: "",
    });
    persist();
    paint();
    toast("Recordatorio guardado");
  });
}
function registerRecurringExpense(id) {
  const r = state.recurringExpenses.find((x) => x.id === id);
  if (!r) return;
  const now = new Date(),
    m = monthKey(now),
    lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    dueDay = Math.min(Number(r.day) || 1, lastDay);
  if (r.lastRegistered === m) {
    toast("Este gasto ya se registró este mes");
    return;
  }
  if (dueDay > now.getDate()) {
    toast("Todavía no llega la fecha habitual de cobro");
    return;
  }
  if (!confirm(`¿Confirmas que ya pagaste ${r.name} por ${money(r.amount)}?`)) return;
  state.transactions.push({
    id: Date.now(),
    type: "expense",
    amount: r.amount,
    category: r.category,
    description: r.name + " (recurrente)",
    date: today(),
    account: r.account,
    recurringId: r.id,
  });
  r.lastRegistered = m;
  persist();
  paint();
  toast("Cobro confirmado y registrado");
}
function removeRecurringExpense(id) {
  if (!confirm("¿Eliminar este recordatorio? Los movimientos ya registrados se conservarán."))
    return;
  state.recurringExpenses = state.recurringExpenses.filter((r) => r.id !== id);
  persist();
  paint();
  toast("Recordatorio eliminado");
}
function addDebt() {
  askForm({
    title: "Nueva deuda",
    copy: "Anota a quién le debes y el total. Los abonos quedan como gastos reales.",
    submit: "Registrar deuda",
    fields: [
      { name: "name", label: "¿A quién o por qué?", placeholder: "Ej. Préstamo de Ana", maxlength: 50 },
      { name: "total", label: "Valor total", type: "number", inputmode: "numeric", min: 1, placeholder: "0" },
    ],
  }).then((data) => {
    if (!data) return;
    const name = String(data.name || "").trim();
    const total = Number(data.total);
    if (!name) { toast("Escribe a quién corresponde"); return; }
    if (!(total > 0)) { toast("Ingresa un valor válido"); return; }
    state.debts.push({ id: "d_" + Date.now(), name: name.slice(0, 50), total });
    persist();
    paint();
    toast("Deuda anotada");
  });
}
function payDebt(id) {
  const d = state.debts.find((x) => x.id === id);
  if (!d) return;
  const left = debtRemaining(d);
  if (!left) { toast("Esta deuda ya está saldada"); return; }
  askForm({
    title: "Abono",
    copy: "Quedan " + money(left) + " de " + d.name + ". El abono se anota como gasto.",
    submit: "Registrar abono",
    fields: [
      { name: "amount", label: "¿Cuánto abonas?", type: "number", inputmode: "numeric", min: 1, placeholder: "0" },
      { name: "account", label: "¿De qué bolsillo sale?", type: "select", value: "nequi", options: [
        { value: "cash", label: "Efectivo" }, { value: "nequi", label: "Nequi" }, { value: "nu", label: "Nu" },
      ]},
    ],
  }).then((data) => {
    if (!data) return;
    const amount = Number(data.amount);
    if (!(amount > 0) || amount > left) {
      toast("El abono debe ser mayor que cero y no superar lo pendiente");
      return;
    }
    if (!["cash", "nequi", "nu"].includes(data.account)) { toast("Elige un bolsillo"); return; }
    if (!state.categories.some((c) => c.name === "Pago de deudas"))
      state.categories.push({ name: "Pago de deudas", type: "expense", emoji: "💳" });
    state.transactions.push({
      id: Date.now(), type: "expense", amount, category: "Pago de deudas",
      description: "Abono: " + d.name, date: today(), account: data.account, debtId: id,
    });
    persist();
    paint();
    toast("Abono anotado como gasto");
  });
}
function removeDebt(id) {
  if (
    !confirm(
      "¿Eliminar esta deuda y su historial de abonos? Los movimientos de pago registrados se conservarán como gastos.",
    )
  )
    return;
  state.debts = state.debts.filter((d) => d.id !== id);
  persist();
  paint();
  toast("Deuda eliminada; los gastos históricos se conservaron");
}
function addSavingsGoal() {
  askForm({
    title: "Nueva meta",
    copy: "Ponle nombre a lo que quieres reunir. Los aportes son ahorro, no gasto.",
    submit: "Crear meta",
    fields: [
      { name: "name", label: "Nombre", placeholder: "Ej. Viaje, emergencia", maxlength: 50 },
      { name: "target", label: "¿Cuánto quieres reunir?", type: "number", inputmode: "numeric", min: 1, placeholder: "0" },
    ],
  }).then((data) => {
    if (!data) return;
    const name = String(data.name || "").trim();
    const target = Number(data.target);
    if (!name) { toast("Ponle un nombre a la meta"); return; }
    if (!(target > 0)) { toast("Ingresa un objetivo válido"); return; }
    state.savingsGoals.push({ id: "g_" + Date.now(), name: name.slice(0, 50), target });
    persist();
    paint();
    toast("Meta creada");
  });
}
function contributeGoal(id) {
  const g = state.savingsGoals.find((x) => x.id === id);
  if (!g) return;
  const saved = goalSaved(g);
  const remaining = Math.max(0, g.target - saved);
  if (!remaining) { toast("Esta meta ya está completa"); return; }
  askForm({
    title: "Apartar para " + g.name,
    copy: "Llevas " + money(saved) + " de " + money(g.target) + ". Sale del bolsillo, pero no cuenta como gasto.",
    submit: "Apartar",
    fields: [
      { name: "amount", label: "¿Cuánto apartas ahora?", type: "number", inputmode: "numeric", min: 1, placeholder: "0" },
      { name: "account", label: "¿De qué bolsillo?", type: "select", value: "nequi", options: [
        { value: "cash", label: "Efectivo" }, { value: "nequi", label: "Nequi" }, { value: "nu", label: "Nu" },
      ]},
    ],
  }).then((data) => {
    if (!data) return;
    const amount = Number(data.amount);
    if (!(amount > 0)) { toast("Ingresa un valor válido"); return; }
    if (!["cash", "nequi", "nu"].includes(data.account)) { toast("Elige un bolsillo"); return; }
    state.transactions.push({
      id: Date.now(), type: "saving", amount, category: "Ahorro",
      description: "Meta: " + g.name, date: today(), account: data.account, goalId: id,
    });
    persist();
    paint();
    toast("Aporte guardado como ahorro");
  });
}
function removeGoal(id) {
  if (!confirm("¿Eliminar esta meta? Los ahorros ya registrados se conservarán.")) return;
  state.savingsGoals = state.savingsGoals.filter((g) => g.id !== id);
  persist();
  paint();
  toast("Meta eliminada; los ahorros se conservaron");
}
function saveWallets() {
  state.accounts.cash = Math.max(0, Number($("openCash").value) || 0);
  state.accounts.nequi = Math.max(0, Number($("openNequi").value) || 0);
  state.accounts.nu = Math.max(0, Number($("openNu").value) || 0);
  persist();
  paint();
  toast("Saldos guardados");
}
function changeName() {
  const current = localStorage.getItem(NAME_KEY) || "";
  askForm({
    title: "Tu nombre",
    submit: "Guardar",
    fields: [{ name: "name", label: "Cómo quieres que te salude", value: current, maxlength: 24 }],
  }).then((data) => {
    if (!data) return;
    const n = String(data.name || "").trim();
    if (!n) return;
    localStorage.setItem(NAME_KEY, n);
    const list = profileList();
    const p = list.find((x) => x.id === profileId());
    if (p) {
      p.name = n.slice(0, 24);
      localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
    }
    paint();
    toast("Listo, así te saludo ahora");
  });
}
function clearData() {
  if (
    !confirm(
      "¿Borrar todos los datos financieros de este perfil? Esta acción no se puede deshacer.",
    )
  )
    return;
  state.transactions = [];
  state.budgets = {};
  state.monthlyBudget = 0;
  state.monthlyIncomeTarget = 0;
  state.monthlyReports = {};
  state.categories = DEFAULT_CATEGORIES.map((c) => ({
    ...c,
    emoji: emojiForCategory(c.name, c.type),
  }));
  state.accounts = { cash: 0, nequi: 0, nu: 0 };
  state.debts = [];
  state.savingsGoals = [];
  state.recurringExpenses = [];
  persist();
  paint();
  toast("Todos los datos del perfil fueron borrados");
}
function closeModal(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove("show");
  if (id === "txModal") delete el.dataset.editId;
  if (id === "askModal" && askResolver) {
    const resolve = askResolver;
    askResolver = null;
    resolve(null);
  }
  if (typeof niloReact === "function") niloReact();
}
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => t.classList.remove("show"), 2300);
}
function checkBudgetAlerts() {
  const m = monthKey();
  const spent = state.transactions
    .filter((t) => t.type === "expense" && String(t.date).slice(0, 7) === m)
    .reduce((s, t) => s + Number(t.amount), 0);
  if (state.monthlyBudget > 0 && spent >= state.monthlyBudget) {
    toast("Has alcanzado tu presupuesto mensual");
    return;
  }
  for (const [c, l] of Object.entries(state.budgets)) {
    const used = state.transactions
      .filter((t) => t.type === "expense" && t.category === c && String(t.date).slice(0, 7) === m)
      .reduce((s, t) => s + Number(t.amount), 0);
    if (used >= l && used > 0) {
      toast(`Has alcanzado el límite de ${c}`);
      return;
    }
    if (used >= l * 0.8 && used > 0) {
      toast(`Vas en ${Math.round((used / l) * 100)}% de ${c}`);
      return;
    }
  }
}
function financialContext() {
  const mt = monthTotals(),
    p = incomePlan(),
    avail = totalAvailable(),
    m = monthKey();
  const catSpend = {};
  state.transactions
    .filter((t) => t.type === "expense" && String(t.date).slice(0, 7) === m)
    .forEach((t) => (catSpend[t.category] = (catSpend[t.category] || 0) + Number(t.amount)));
  const top = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0];
  const limits = Object.entries(state.budgets)
    .map(([c, l]) => {
      const used = catSpend[c] || 0;
      return { c, l, used, pct: l ? (used / l) * 100 : 0 };
    })
    .sort((a, b) => b.pct - a.pct);
  return {
    mt,
    p,
    avail,
    top,
    limits,
    accounts: {
      cash: accountBalance("cash"),
      nequi: accountBalance("nequi"),
      nu: accountBalance("nu"),
    },
  };
}
function coachInsights() {
  const m = monthKey(),
    rows = state.transactions.filter(
      (t) => t.type === "expense" && String(t.date).slice(0, 7) === m,
    ),
    cats = {};
  rows.forEach((t) => (cats[t.category] = (cats[t.category] || 0) + (Number(t.amount) || 0)));
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
  const total = rows.reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const prev = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 2, 1);
  const pk = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const prevRows = state.transactions.filter(
    (t) => t.type === "expense" && String(t.date).slice(0, 7) === pk,
  );
  const prevTotal = prevRows.reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const limits = Object.entries(state.budgets || {})
    .map(([c, l]) => ({ c, l: Number(l) || 0, used: cats[c] || 0 }))
    .filter((x) => x.l > 0)
    .sort((a, b) => b.used / b.l - a.used / a.l);
  const biggest = rows.slice().sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))[0];
  const out = [];
  if (!rows.length) out.push("Aún no hay gastos registrados este mes.");
  else {
    out.push(`Gasto del mes: ${money(total)}.`);
    if (top) out.push(`Mayor categoría: ${top[0]} (${money(top[1])}).`);
    if (biggest)
      out.push(
        `Gasto individual más alto: ${biggest.description || biggest.category} (${money(biggest.amount)}).`,
      );
    if (prevRows.length)
      out.push(
        `Frente al mes anterior: ${total > prevTotal ? "+" : ""}${money(total - prevTotal)} (${total > prevTotal ? "más" : "menos"}).`,
      );
    if (limits[0]) {
      const pct = Math.round((limits[0].used / limits[0].l) * 100);
      if (pct >= 80)
        out.push(
          `${limits[0].c}: ${pct}% de su límite (${money(limits[0].used)} de ${money(limits[0].l)}).`,
        );
    }
  }
  return out;
}
function renderCoachInsights() {
  const el = $("coachInsights");
  if (el)
    el.innerHTML =
      '<strong style="font-size:12px">Resumen inteligente</strong>' +
      coachInsights()
        .map((x) => `<div style="font-size:11px;color:var(--muted);margin-top:7px">${esc(x)}</div>`)
        .join("");
}
function coachSummary() {
  const x = financialContext(),
    name = localStorage.getItem(NAME_KEY) || "";
  if (!x.mt.income && !x.mt.expense && !state.monthlyIncomeTarget)
    return `Hola ${name}. Todavía no tengo suficientes movimientos para analizar tu mes. Puedes contarme qué quieres organizar y registrar tus ingresos semanales y gastos; yo iré construyendo el análisis contigo.`;
  if (x.p.target && !x.p.hit && x.p.received > 0)
    return `Has recibido ${money(x.p.received)} de una estimación de ${money(x.p.target)}. Vas en ${Math.round(x.p.pct)}% y te faltan ${money(Math.abs(x.p.diff))} para alcanzarla.`;
  if (x.p.hit)
    return `Este mes ya alcanzaste tu estimación de ingresos: ${money(x.p.received)} recibidos frente a ${money(x.p.target)} estimados.`;
  if (x.limits[0] && x.limits[0].pct >= 80)
    return `${x.limits[0].c} va en ${Math.round(x.limits[0].pct)}% de su límite. Has usado ${money(x.limits[0].used)} de ${money(x.limits[0].l)}.`;
  if (x.mt.expense > x.mt.income && x.mt.income > 0)
    return `Este mes tus gastos (${money(x.mt.expense)}) superan tus ingresos registrados (${money(x.mt.income)}). Conviene revisar primero ${x.top ? x.top[0] : "las categorías principales"}.`;
  return `Este mes llevas ${money(x.mt.income)} recibidos y ${money(x.mt.expense)} gastados. Tienes ${money(x.avail)} repartidos entre efectivo, Nequi y Nu.`;
}
function normalizeText(q) {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
function answerCoach(q) {
  const l = normalizeText(q),
    x = financialContext(),
    m = x.mt;
  const wants = (...terms) => terms.some((t) => l.includes(t));
  const categoryMatch = state.categories.find((c) => l.includes(normalizeText(c.name)));
  if (categoryMatch) {
    const total = state.transactions
      .filter(
        (t) =>
          t.type === categoryMatch.type &&
          t.category === categoryMatch.name &&
          String(t.date).slice(0, 7) === monthKey(),
      )
      .reduce((s, t) => s + Number(t.amount), 0);
    if (
      wants(
        "cuanto",
        "cuanto gaste",
        "cuanto gasto",
        "cuanto he gastado",
        "en que",
        "categoria",
        "gaste",
      )
    )
      return `En ${categoryMatch.name} llevas ${money(total)} este mes.`;
  }
  if (/\bnu\b|\bnubank\b|\bnu bank\b/.test(l))
    return `Según tus registros, tienes ${money(x.accounts.nu)} en Nu.`;
  if (wants("efectivo", "cash"))
    return `Según tus registros, tienes ${money(x.accounts.cash)} en efectivo.`;
  if (wants("nequi")) return `Según tus registros, tienes ${money(x.accounts.nequi)} en Nequi.`;
  if (wants("cuanto tengo", "cuanto dinero", "saldo", "disponible", "total tengo"))
    return `Tienes ${money(x.avail)} disponibles entre efectivo, Nequi y Nu.`;
  if (wants("meta", "estimacion", "estimación", "cuanto me falta", "alcanzar")) {
    if (!x.p.target) return "Todavía no has definido una estimación mensual de ingresos.";
    return x.p.hit
      ? `Ya alcanzaste tu estimación de ${money(x.p.target)} y llevas ${money(x.p.received)} recibidos.`
      : `Te faltan ${money(Math.abs(x.p.diff))} para alcanzar tu estimación de ${money(x.p.target)}; llevas ${Math.round(x.p.pct)}%.`;
  }
  if (wants("compar", "diferencia", "versus", "frente"))
    return `Este mes has recibido ${money(m.income)} y has gastado ${money(m.expense)}. La diferencia entre ambos es ${money(m.balance)}.`;
  if (
    wants(
      "ingreso de esta semana",
      "recibido esta semana",
      "me mandaron esta semana",
      "esta semana",
    )
  ) {
    const v = weeklyTotals("income").reduce((s, d) => s + d.val, 0);
    if (wants("ingreso", "recib", "mandaron", "dinero"))
      return `En los últimos 7 días has registrado ${money(v)} en ingresos.`;
  }
  if (wants("ingreso", "ingresos", "me han mandado", "recibi", "recibido")) {
    if (x.p.target)
      return `Has recibido ${money(x.p.received)} este mes. Tu estimación era ${money(x.p.target)}, así que vas en ${Math.round(x.p.pct)}% y ${x.p.diff >= 0 ? "la superaste por " + money(x.p.diff) : "te faltan " + money(Math.abs(x.p.diff))}.`;
    return `Tus ingresos registrados este mes son ${money(m.income)}. Si quieres, puedo compararlos con una estimación mensual.`;
  }
  if (wants("gasto", "gastos", "gastando", "he gastado")) {
    if (x.top)
      return `Este mes has gastado ${money(m.expense)}. La categoría con mayor gasto registrado es ${x.top[0]} con ${money(x.top[1])}.`;
    return `Este mes has gastado ${money(m.expense)}.`;
  }
  if (wants("presupuesto", "presupuest", "limite")) {
    const b = Number(state.monthlyBudget) || 0;
    if (!b)
      return "Todavía no has definido un presupuesto mensual. Puedes establecerlo en Presupuesto y luego añadir límites por categoría.";
    return `Tu presupuesto mensual es ${money(b)} y llevas ${money(m.expense)} gastados; te quedan ${money(b - m.expense)}.`;
  }
  if (wants("categoria", "categorias", "en que se va", "donde gasto", "donde se va")) {
    if (!x.top) return "Todavía no hay gastos suficientes para detectar una categoría dominante.";
    const rows = x.limits.length;
    return `La categoría que más pesa este mes es ${x.top[0]} con ${money(x.top[1])}. ${rows ? "También estoy vigilando los límites que hayas definido." : ""}`;
  }
  if (wants("pasando", "voy", "como voy", "como estoy", "estado")) return coachSummary();
  if (wants("consejo", "recomend", "que hago", "deberia", "ayuda")) {
    if (x.p.target && !x.p.hit)
      return `Como tus ingresos pueden variar semana a semana, trata ${money(x.p.target)} como una referencia y no como dinero garantizado. Registra cada envío cuando llegue y ajusta tus gastos según lo realmente recibido.`;
    if (x.limits[0] && x.limits[0].pct >= 80)
      return `Tu límite de ${x.limits[0].c} está bastante avanzado (${Math.round(x.limits[0].pct)}%). Antes de gastar más ahí, revisa cuánto te queda en el presupuesto mensual.`;
    if (m.expense > m.income && m.income > 0)
      return `Tus gastos registrados superan tus ingresos de este mes. Yo revisaría primero ${x.top ? x.top[0] : "los gastos más altos"} antes de asumir nuevos gastos.`;
    return "Puedo revisar tus ingresos, gastos, bolsillos, categorías y presupuestos. Dime qué quieres decidir y trabajaré con tus datos actuales.";
  }
  if (wants("hola", "hey", "buenas"))
    return `Hola ${localStorage.getItem(NAME_KEY) || ""}. Dime qué quieres saber de tu dinero y lo revisamos juntos.`;
  return `Entiendo preguntas en lenguaje natural y las cruzo con tus datos actuales. Puedo analizar ingresos recibidos, tu estimación mensual, gastos, categorías, presupuesto, límites y cuánto tienes en efectivo, Nequi o Nu. Si la pregunta requiere datos que todavía no has registrado, te lo diré en lugar de inventarlos.`;
}
function setMascotMood(mood) {
  const moods = ["mood-thinking", "mood-happy", "mood-alert", "mood-focus", "mood-love", "mood-soft"];
  document.querySelectorAll(".nilo-live").forEach((orb) => {
    moods.forEach((m) => orb.classList.remove(m));
    if (mood && mood !== "idle" && mood !== "calm") orb.classList.add("mood-" + mood);
  });
}
function openCoach() {
  setMascotMood("happy");
  renderCoachInsights();
  if (!$("chat").children.length)
    addAI(`Hola ${localStorage.getItem(NAME_KEY) || ""}. Soy Nilo. ${coachSummary()}`);
  $("coachModal").classList.add("show");
}
function addAI(text) {
  const d = document.createElement("div");
  d.className = "bubble ai";
  d.textContent = text;
  $("chat").appendChild(d);
  $("chat").scrollTop = $("chat").scrollHeight;
}
function addMe(text) {
  const d = document.createElement("div");
  d.className = "bubble me";
  d.textContent = text;
  $("chat").appendChild(d);
  $("chat").scrollTop = $("chat").scrollHeight;
}
function askCoach(q) {
  addMe(q);
  setMascotMood("thinking");
  setTimeout(() => {
    addAI(answerCoach(q));
    setMascotMood("happy");
  }, 420);
}
function sendCoach(e) {
  e.preventDefault();
  const input = $("coachInput"),
    q = input.value.trim();
  if (!q) return;
  input.value = "";
  addMe(q);
  setMascotMood("thinking");
  setTimeout(() => {
    const answer = answerCoach(q);
    addAI(answer);
    setMascotMood(/superan|superado|sobre el límite|supera/i.test(answer) ? "alert" : "happy");
  }, 420);
}
load();
function bindEngine() {
  const txType = $("txType");
  if (txType && txType.dataset.bound !== "1") {
    txType.dataset.bound = "1";
    txType.addEventListener("change", (e) => {
      $("txTitle").textContent =
        e.target.value === "income"
          ? "Registrar ingreso"
          : e.target.value === "saving"
            ? "Apartar para ahorro"
            : "Registrar gasto";
      refreshTxCategories();
    });
  }
  const categoryName = $("categoryName");
  if (categoryName && categoryName.dataset.bound !== "1") {
    categoryName.dataset.bound = "1";
    categoryName.addEventListener("input", updateEmojiPreview);
  }
  const categoryType = $("categoryType");
  if (categoryType && categoryType.dataset.bound !== "1") {
    categoryType.dataset.bound = "1";
    categoryType.addEventListener("change", updateEmojiPreview);
  }
  const bottomNav = $("bottomNav");
  if (bottomNav && bottomNav.dataset.bound !== "1") {
    bottomNav.dataset.bound = "1";
    const release = () => {
      bottomNav.classList.remove("pressing");
      bottomNav.querySelectorAll(".pressed").forEach((n) => n.classList.remove("pressed"));
    };
    bottomNav.addEventListener("pointerdown", (e) => {
      const b = e.target.closest(".nav");
      if (!b) return;
      bottomNav.classList.add("pressing");
      b.classList.add("pressed");
    });
    bottomNav.addEventListener("pointerup", release);
    bottomNav.addEventListener("pointercancel", release);
    bottomNav.addEventListener("pointerleave", release);
  }
  if (!window.__mcfKeys) {
    window.__mcfKeys = true;
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".modal.show").forEach((m) => closeModal(m.id));
    });
    window.addEventListener("resize", placeLiquid);
  }
  document.querySelectorAll("button").forEach((b) => {
    if (!b.hasAttribute("type")) b.setAttribute("type", "button");
  });
}
window.__mcfBind = bindEngine;
bindEngine();
showApp();

function pocketOptions() {
  return [
    { value: "cash", label: "Efectivo" },
    { value: "nequi", label: "Nequi" },
    { value: "nu", label: "Nu" },
  ];
}
function askForm(config) {
  return new Promise((resolve) => {
    askResolver = resolve;
    $("askTitle").textContent = config.title || "";
    const copy = $("askCopy");
    copy.textContent = config.copy || "";
    copy.hidden = !config.copy;
    $("askSubmit").textContent = config.submit || "Continuar";
    $("askFields").innerHTML = (config.fields || [])
      .map((f) => {
        const id = "ask_" + f.name;
        if (f.type === "select") {
          const opts = (f.options || [])
            .map((o) => `<option value="${esc(o.value)}"${String(o.value) === String(f.value) ? " selected" : ""}>${esc(o.label)}</option>`)
            .join("");
          return `<div class="field"><label for="${id}">${esc(f.label)}</label><select id="${id}" name="${esc(f.name)}">${opts}</select></div>`;
        }
        const attrs = [
          `id="${id}"`,
          `name="${esc(f.name)}"`,
          `type="${esc(f.type || "text")}"`,
          f.maxlength ? `maxlength="${Number(f.maxlength)}"` : "",
          f.min != null ? `min="${Number(f.min)}"` : "",
          f.max != null ? `max="${Number(f.max)}"` : "",
          f.inputmode ? `inputmode="${esc(f.inputmode)}"` : "",
          f.placeholder ? `placeholder="${esc(f.placeholder)}"` : "",
          f.value != null && f.value !== "" ? `value="${esc(f.value)}"` : "",
        ].filter(Boolean).join(" ");
        return `<div class="field"><label for="${id}">${esc(f.label)}</label><input ${attrs}></div>`;
      })
      .join("");
    $("askModal").classList.add("show");
    setTimeout(() => {
      const first = $("askFields").querySelector("input,select");
      if (first) first.focus();
    }, 40);
  });
}
function submitAsk(e) {
  e.preventDefault();
  const data = {};
  $("askForm").querySelectorAll("input,select").forEach((el) => {
    if (el.name) data[el.name] = el.value;
  });
  $("askModal").classList.remove("show");
  const resolve = askResolver;
  askResolver = null;
  if (resolve) resolve(data);
}
function cancelAsk() {
  closeModal("askModal");
}
function placeLiquid() {
  const nav = $("bottomNav");
  const slot = $("navLiquid");
  if (!nav || !slot || nav.hidden) return;
  const active = nav.querySelector(".nav.active");
  if (!active) return;
  const nr = nav.getBoundingClientRect();
  const ar = active.getBoundingClientRect();
  if (!nr.width || !ar.width) return;
  slot.style.width = Math.max(0, ar.width - 6) + "px";
  slot.style.transform = "translate3d(" + (ar.left - nr.left + 3) + "px,0,0)";
}
function niloReact() {
  const page = (document.querySelector(".page.active") || {}).id || "home";
  document.documentElement.dataset.tab = page;
  const app = $("app");
  if (app) app.dataset.tab = page;
  document.querySelectorAll(".nav").forEach((n) => {
    const on = n.dataset.page === page;
    if (on && n.dataset.lit !== "1") {
      n.classList.remove("just-on");
      void n.offsetWidth;
      n.classList.add("just-on");
      n.dataset.lit = "1";
    } else if (!on) {
      n.classList.remove("just-on");
      delete n.dataset.lit;
    }
  });
  requestAnimationFrame(() => requestAnimationFrame(placeLiquid));
  if ($("coachModal") && $("coachModal").classList.contains("show")) return;
  const name = localStorage.getItem(NAME_KEY) || "";
  const mt = monthTotals();
  const plan = incomePlan();
  const overBudget = state.monthlyBudget > 0 && mt.expense >= state.monthlyBudget;
  const hot = Object.entries(state.budgets).some(([c, l]) => {
    const used = state.transactions
      .filter((t) => t.type === "expense" && t.category === c && String(t.date).slice(0, 7) === monthKey())
      .reduce((s, t) => s + Number(t.amount), 0);
    return l > 0 && used >= l * 0.8 && used > 0;
  });
  let mood = "calm";
  let line = "Estoy aquí.";
  if (!state.transactions.length && page === "home") {
    mood = "soft";
    line = name ? name + ", cuando quieras anotamos el primero." : "Cuando quieras, anotamos el primero.";
  } else if (overBudget || (mt.income > 0 && mt.expense > mt.income * 1.05)) {
    mood = "alert";
    line = "Este mes va justo. Lo miramos sin asustarnos.";
  } else if (hot) {
    mood = "alert";
    line = "Hay una categoría que ya va alta.";
  } else if (plan.hit) {
    mood = "love";
    line = "Llegaste a lo que esperabas recibir.";
  } else if (mt.savings > 0 && page === "home") {
    mood = "happy";
    line = "Apartaste algo este mes. Eso también cuenta.";
  } else {
    const byPage = {
      home: ["calm", "Hoy puedes mirar tu dinero sin apuro."],
      analysis: ["focus", "Te enseño el mes con calma, sin ruido."],
      budget: ["focus", "Los límites cuidan. No regañan."],
      movements: ["calm", "Aquí quedó todo lo que fue pasando."],
      account: ["soft", "Esto vive en tu teléfono. Nadie más lo ve."],
    };
    const pair = byPage[page] || byPage.home;
    mood = pair[0];
    line = pair[1];
  }
  const orb = $("coachOrb");
  const next = mood === "calm" ? "idle" : mood;
  if (orb && orb.dataset.mood !== next) {
    orb.dataset.mood = next;
    orb.classList.add("nilo-pop");
    setTimeout(() => orb.classList.remove("nilo-pop"), 480);
  }
  setMascotMood(next);
  const say = $("niloSay");
  if (say && say.textContent !== line) say.textContent = line;
}
window.__mcfBind = bindEngine;
