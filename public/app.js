/* Feature flags demo client — vanilla JS, no framework.
   The browser only ever READS /api/state (plus checkout + simulate).
   Every flag decision shown on screen was made by the server. */
const $ = (id) => document.getElementById(id);

const MENU = [
  { id: "tonkotsu", emoji: "🍜", name: "Tonkotsu Ramen", price: 119 },
  { id: "tofu", emoji: "🌶️", name: "Spicy Tofu Bowl", price: 99 },
  { id: "gyoza", emoji: "🥟", name: "Gyoza (6 pcs)", price: 65 },
  { id: "mango", emoji: "🥭", name: "Mango Sticky Rice", price: 55 },
];
const cart = new Map(); // id -> qty
let state = null;
let lens = "ab"; // board lens: "ab" | "roll"
let spinId = null; // visitor id currently coin-flipping

// Stable viewer id — this is "you" in the bucketing universe.
// Default is a fixed demo account whose new-cart bucket is 53: OUT at a 30%
// rollout, IN at 60% — the presenter's own cart flip is guaranteed, not luck.
let you = localStorage.getItem("ff-you-id") || "you-demo";
localStorage.setItem("ff-you-id", you);

/* ── api ── */
const api = {
  async get() { return (await fetch(`/api/state?you=${encodeURIComponent(you)}`)).json(); },
  async flag(name, body) { return (await fetch(`/api/flags/${name}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, you }) })).json(); },
  async simulate() { return (await fetch("/api/visitors", { method: "POST" })).json(); },
  async checkout() { const r = await fetch("/api/checkout", { method: "POST" }); return { status: r.status, body: await r.json() }; },
};

/* ── menu + cart ── */
function renderMenu() {
  $("menu").innerHTML = MENU.map((m) => `
    <div class="dish"><span class="emoji">${m.emoji}</span>
      <span class="info"><div class="name">${m.name}</div><div class="price">${m.price} kr</div></span>
      <button data-add="${m.id}">Add</button></div>`).join("");
  document.querySelectorAll("[data-add]").forEach((b) => b.onclick = () => { cart.set(b.dataset.add, (cart.get(b.dataset.add) || 0) + 1); renderCart(); });
}
function renderCart() {
  const isNew = state?.you.newCartIn;
  const c = $("cart");
  c.classList.toggle("new", !!isNew); c.classList.toggle("old", !isNew);
  $("cart-badge").hidden = !isNew;
  if (cart.size === 0) { $("cart-items").innerHTML = `<p class="empty">Nothing yet — add a bowl.</p>`; }
  else {
    $("cart-items").innerHTML = [...cart].map(([id, q]) => {
      const m = MENU.find((x) => x.id === id);
      return `<div class="cart-item"><span>${m.emoji} ${m.name}</span>
        <span class="qty" style="margin-left:auto">${isNew ? `<button data-dec="${id}">−</button>` : ""}<b>${q}</b>${isNew ? `<button data-inc="${id}">+</button>` : ""}</span>
        <span>${m.price * q} kr</span></div>`;
    }).join("");
    $("cart-items").querySelectorAll("[data-inc]").forEach((b) => b.onclick = () => { cart.set(b.dataset.inc, cart.get(b.dataset.inc) + 1); renderCart(); });
    $("cart-items").querySelectorAll("[data-dec]").forEach((b) => b.onclick = () => { const q = cart.get(b.dataset.dec) - 1; q <= 0 ? cart.delete(b.dataset.dec) : cart.set(b.dataset.dec, q); renderCart(); });
  }
  const total = [...cart].reduce((s, [id, q]) => s + MENU.find((x) => x.id === id).price * q, 0);
  $("total").textContent = `${total} kr`;

  const btn = $("checkout-btn");
  const express = state?.expressBuggy;
  btn.className = "checkout " + (express ? "express" : "normal");
  btn.textContent = express ? "⚡ Express checkout · beta" : "Place order";
}

/* ── console ── */
function renderConsole() {
  $("sw-theme").checked = state.flags["theme-dark"].on;
  $("sw-express").checked = state.flags["express-checkout"].on;
  $("slider").value = state.flags["new-cart"].pct;
  $("pct-badge").textContent = state.flags["new-cart"].pct + "%";

  const log = $("log");
  if (state.log.length === 0) log.innerHTML = `<li class="muted">no flag changes yet</li>`;
  else log.innerHTML = state.log.map((e) => `<li>${e.t.slice(11, 19)} · <b>${e.flag}</b> → ${e.change}</li>`).join("");

  $("deploy-time").textContent = state.deployTime.slice(11, 19);
  $("flips").textContent = state.flips;
  document.title = `Feature Flags — ${state.flags["express-checkout"].on ? "express ON" : "all good"}`;
}

/* ── traffic monitor board ── */
function renderBoard() {
  const vs = [{ id: you, name: "You", emoji: "🧑", newCartIn: state.you.newCartIn, heroVariant: state.you.heroVariant, isYou: true }, ...state.visitors];
  $("board").innerHTML = vs.map((v) => {
    const chip = lens === "ab"
      ? `<span class="chip ${v.heroVariant}">${v.heroVariant}</span>`
      : `<span class="chip ${v.newCartIn ? "I" : ""}">${v.newCartIn ? "IN" : "—"}</span>`;
    return `<div class="vcard ${lens === "roll" && v.newCartIn ? "in" : ""} ${v.isYou ? "you" : ""} ${v.id === spinId ? "spin" : ""}" data-v="${v.id}">
      <div class="face">${v.emoji}</div><div class="nm">${v.name}</div>${chip}${v.isYou ? `<div class="youtag">YOU</div>` : ""}</div>`;
  }).join("");

  const nA = vs.filter((v) => v.heroVariant === "A").length, nB = vs.length - nA;
  const nIn = vs.filter((v) => v.newCartIn).length;
  $("board-stats").textContent = lens === "ab" ? `A ${nA} · B ${nB}` : `${nIn}/${vs.length} seeing the new cart (${state.flags["new-cart"].pct}%)`;
}

/* ── hero (A/B variant of the banner, per visitor) ── */
function renderHero() {
  const v = state.you.heroVariant;
  const hero = $("hero");
  hero.className = "hero hero-" + v;
  $("hero-text").textContent = v === "A" ? "Fresh noodles, cooked daily" : "Student deal — 15% off before 15:00";
  $("hero-chip").textContent = "variant " + v;
}

/* ── everything ── */
function renderAll() { renderConsole(); renderBoard(); renderHero(); renderCart(); applyTheme(); }
function applyTheme() { document.body.classList.toggle("dark", !!state.flags["theme-dark"].on); }

/* ── banners ── */
let bannerTimer, toastTimer;
// sticky: the incident banner STAYS until the kill switch is flipped — the
// two most important beats of the talk must not auto-vanish mid-sentence.
let bannerSticky = false;
function hideBanner() { $("banner").hidden = true; bannerSticky = false; }
function showBanner(html, { ok = false, sticky = false } = {}) {
  const b = $("banner"); b.hidden = false; b.className = "banner" + (ok ? " ok" : ""); b.innerHTML = html;
  clearTimeout(bannerTimer); bannerSticky = sticky;
  if (!sticky) bannerTimer = setTimeout(() => (b.hidden = true), 6000);
}
function showToast(html) {
  const t = $("toast"); t.hidden = false; t.innerHTML = html;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 6500);
}

/* ── wiring ── */
renderMenu();
// Rehearsal convenience: ?seed=1 pre-fills the cart so the checkout story
// is one click away. Same effect as clicking Add twice by hand.
if (new URLSearchParams(location.search).get("seed") === "1") {
  cart.set("tonkotsu", 1);
  cart.set("gyoza", 1);
  renderCart();
}
$("sw-theme").addEventListener("change", async (e) => { state = await api.flag("theme-dark", { on: e.target.checked }); renderAll(); });
$("sw-express").addEventListener("change", async (e) => {
  state = await api.flag("express-checkout", { on: e.target.checked }); renderAll();
  if (!e.target.checked && bannerSticky) { hideBanner(); showToast("🛑 express-checkout OFF — incident over, orders flowing again"); }
});
let slideTimer, sliderTouched = false;
$("slider").addEventListener("input", async (e) => {
  // First drag: jump the board to the Rollout lens so the gold IN cards are
  // visible without hunting for the tiny lens button.
  if (!sliderTouched) { sliderTouched = true; $("lens-roll").click(); }
  clearTimeout(slideTimer);
  slideTimer = setTimeout(async () => { state = await api.flag("new-cart", { pct: Number(e.target.value) }); renderAll(); }, 120);
});
$("lens-ab").onclick = () => { lens = "ab"; $("lens-ab").classList.add("on"); $("lens-roll").classList.remove("on"); renderBoard(); };
$("lens-roll").onclick = () => { lens = "roll"; $("lens-roll").classList.add("on"); $("lens-ab").classList.remove("on"); renderBoard(); };

$("simulate").onclick = async () => {
  const v = await api.simulate();
  spinId = v.id;
  state = await api.get(); renderBoard();
  setTimeout(() => { spinId = null; renderBoard(); }, 500);
};

$("checkout-btn").onclick = async () => {
  if (cart.size === 0) { showBanner("Your cart is empty — add a bowl first."); return; }
  const { status, body } = await api.checkout();
  if (status === 500) {
    showBanner(`❌ ${body.error} — express checkout is <b>breaking orders right now</b>.<small>Every minute here is a lost customer. Fix it without a redeploy…</small>`, { sticky: true });
  } else {
    hideBanner();
    showToast(`✅ Order ${body.orderId} placed — old checkout path, still reliable.`);
  }
};

/* Poll like a real SDK: flags can change on the server at any time.
   (Open the page in a second window and flip flags in the first — both move.) */
(async function init() {
  state = await api.get();
  renderAll();
  setInterval(async () => { const s = await api.get(); const expressChanged = s.expressBuggy !== state.expressBuggy; state = s; renderAll(); if (expressChanged) { if (bannerSticky && !s.expressBuggy) hideBanner(); showToast(s.expressBuggy ? "⚠️ express-checkout turned ON" : "🛑 express-checkout turned OFF — incident over"); } }, 2000);

  // Rehearsal/recording mode: ?autodemo=1 walks the full five-scene story
  // once, at a presenting pace. It presses the same buttons and calls the
  // same flag API as a human presenter — nothing is faked.
  if (new URLSearchParams(location.search).get("autodemo") === "1") {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const flag = (n, b) => api.flag(n, b).then((s) => { state = s; renderAll(); });
    await wait(4500);
    await flag("theme-dark", { on: true });            // scene 1: switch = feature
    await wait(2600);
    await flag("theme-dark", { on: false });           // …and back — a switch, not a one-way door
    await wait(2200);
    await flag("new-cart", { pct: 30 });               // scene 2: gradual rollout
    await wait(2600);
    await flag("new-cart", { pct: 60 });
    await wait(2600);
    for (let i = 0; i < 3; i++) { await $("simulate").click(); await wait(1900); } // scene 3: A/B
    await wait(1200);
    cart.set("tonkotsu", 1); cart.set("gyoza", 1); renderCart();  // scene 4: order dinner
    await wait(2000);
    await $("checkout-btn").click();                   // → incident banner
    await wait(3800);
    await flag("express-checkout", { on: false });     // scene 5: kill switch
    await wait(2600);
    await $("checkout-btn").click();                   // → order ok
  }
})();
