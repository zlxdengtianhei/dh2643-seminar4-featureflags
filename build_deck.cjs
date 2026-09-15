// Seminar 4 Feature Flags deck builder. Run: node build_deck.cjs
const pptxgen = require("/Users/lexuanzhang/code/DH2643/seminar4-tdd-demo/node_modules/pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
pres.author = "Group 5";
pres.title = "Feature Flags — DH2643 Seminar 4";

// Palette: the demo page's identity — gold for "flag on", red for the incident,
// blue/green for A/B variants, dark ink console.
const INK = "14181F";
const GREEN = "1E8449";
const RED = "C0392B";
const GOLD = "B7950B";     // darker gold for text (F4D03F is too light on white)
const GOLDBG = "F4D03F";
const BLUE = "1F6FEB";
const PURPLE = "8E44AD";
const TXT_D = "E8EDF4";
const TXT_L = "1B212B";
const MUT_D = "93A1B5";
const MUT_L = "5D6B7E";
const FAINT = "EDF1F6";

const W = 13.33, H = 7.5, M = 0.6;
const FONT = "Arial";
const MONO = "Consolas";

const bu = () => ({ code: "25B8", indent: 12, color: MUT_L });
const shadow = () => ({ type: "outer", color: "000000", blur: 7, offset: 2, angle: 45, opacity: 0.14 });

let pageNo = 0;
function baseSlide(dark) {
  const s = pres.addSlide();
  s.background = { color: dark ? INK : "FFFFFF" };
  pageNo++;
  if (pageNo > 1) {
    s.addText("Feature Flags · Group 5", { x: M, y: H - 0.42, w: 2.8, h: 0.3, fontFace: FONT, fontSize: 10, color: dark ? MUT_D : MUT_L, margin: 0 });
    s.addText(String(pageNo), { x: W - 1.0, y: H - 0.42, w: 0.4, h: 0.3, fontFace: FONT, fontSize: 10, color: dark ? MUT_D : MUT_L, align: "right", margin: 0 });
  }
  return s;
}
function title(s, text, dark) {
  s.addText(text, { x: M, y: 0.42, w: W - 2 * M, h: 0.7, fontFace: FONT, fontSize: 30, bold: true, color: dark ? TXT_D : TXT_L, margin: 0 });
}
function pill(s, x, y, w, text, fill, txtColor, fs = 12) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.34, rectRadius: 0.17, fill: { color: fill }, line: { color: fill, width: 0 } });
  s.addText(text, { x, y, w, h: 0.34, fontFace: FONT, fontSize: fs, bold: true, align: "center", valign: "middle", color: txtColor, margin: 0 });
}

/* ── Slide 1 · Cover (dark) ─────────────────────────────────── */
{
  const s = baseSlide(true);
  s.addShape(pres.shapes.LINE, { x: M, y: 2.14, w: 2.1, h: 0, line: { color: GOLDBG, width: 4 } });
  s.addText("Feature Flags", { x: M, y: 2.3, w: 10.5, h: 1.15, fontFace: FONT, fontSize: 60, bold: true, color: TXT_D, margin: 0 });
  s.addText("Ship code without releasing features", { x: M, y: 3.5, w: 10.5, h: 0.55, fontFace: FONT, fontSize: 24, color: GOLDBG, margin: 0 });
  s.addText([
    { text: "DH2643 Seminar 4 · Group 5 · 18 Sept. 2026", options: { breakLine: true } },
    { text: "Jintong Jiang · Emma Lindblom · Lexuan Zhang", options: { color: MUT_D } },
  ], { x: M, y: 5.9, w: 9, h: 0.75, fontFace: FONT, fontSize: 15, color: TXT_D, paraSpaceAfter: 4, margin: 0 });
  // flag switch motif
  pill(s, W - 3.3, 2.5, 1.25, "flag: ON", GREEN, "FFFFFF", 13);
  pill(s, W - 3.3, 3.0, 1.25, "rollout 30%", BLUE, "FFFFFF", 13);
  pill(s, W - 3.3, 3.5, 1.25, "variant B", PURPLE, "FFFFFF", 13);
}

/* ── Slide 2 · The Friday night problem ─────────────────────── */
{
  const s = baseSlide(false);
  title(s, "Friday, 2 a.m. — the deploy went out. Then…");
  const steps = [
    ["23:40", "Deploy", "new checkout + 5 other features", INK],
    ["02:00", "Bug reports", "checkout is broken for everyone", RED],
    ["02:15", "Your options", "rollback the WHOLE version — or hotfix at 2 a.m.", RED],
  ];
  steps.forEach((st, i) => {
    const x = M + i * 4.2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.7, w: 3.7, h: 1.9, rectRadius: 0.09, fill: { color: FAINT }, line: { color: "D7DEE8", width: 1 }, shadow: shadow() });
    s.addText(st[0], { x: x + 0.28, y: 1.95, w: 2.4, h: 0.35, fontFace: MONO, fontSize: 14, color: MUT_L, margin: 0 });
    s.addText(st[1], { x: x + 0.28, y: 2.32, w: 3.2, h: 0.45, fontFace: FONT, fontSize: 20, bold: true, color: st[3] === RED ? RED : TXT_L, margin: 0 });
    s.addText(st[2], { x: x + 0.28, y: 2.82, w: 3.15, h: 0.65, fontFace: FONT, fontSize: 14, color: MUT_L, margin: 0 });
    if (i < 2) s.addShape(pres.shapes.LINE, { x: x + 3.75, y: 2.65, w: 0.4, h: 0, line: { color: MUT_L, width: 2, endArrowType: "triangle" } });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 4.15, w: W - 2 * M, h: 1.05, rectRadius: 0.09, fill: { color: "FDF2F0" }, line: { color: RED, width: 1.5 } });
  s.addText([
    { text: "Why is this so painful?  ", options: { bold: true, color: RED } },
    { text: "Because in this world, deploying and releasing are the same event — the moment code goes out, users get everything in it.", options: { color: TXT_L } },
  ], { x: M + 0.35, y: 4.15, w: W - 2 * M - 0.7, h: 1.05, fontFace: FONT, fontSize: 17, valign: "middle", margin: 0 });
  s.addText("Every choice after that is damage control.", { x: M, y: 5.55, w: W - 2 * M, h: 0.4, fontFace: FONT, fontSize: 15, italic: true, color: MUT_L, margin: 0 });
}

/* ── Slide 3 · The idea: deploy ≠ release ───────────────────── */
{
  const s = baseSlide(false);
  title(s, "The idea — split the event in two");
  // package with hidden switches
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.65, w: 6.6, h: 2.9, rectRadius: 0.1, fill: { color: INK }, shadow: shadow() });
  s.addText("ONE deploy — the code package", { x: M + 0.3, y: 1.85, w: 6, h: 0.35, fontFace: FONT, fontSize: 15, bold: true, color: TXT_D, margin: 0 });
  const feats = [["old checkout", MUT_D, "D7DEE8"], ["new checkout", GOLDBG, GOLD], ["new home page", GOLDBG, GOLD], ["billing fix", MUT_D, "D7DEE8"]];
  feats.forEach((f, i) => {
    const fx = M + 0.3 + (i % 2) * 3.05, fy = 2.35 + Math.floor(i / 2) * 0.78;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: fx, y: fy, w: 2.85, h: 0.6, rectRadius: 0.08, fill: { color: f[1] === GOLDBG ? "2A2708" : "1B2129" }, line: { color: f[2], width: 1.2 } });
    s.addText((f[1] === GOLDBG ? "(hidden) " : "") + f[0], { x: fx, y: fy, w: 2.85, h: 0.6, fontFace: MONO, fontSize: 13, color: f[1] === GOLDBG ? GOLDBG : TXT_D, align: "center", valign: "middle", margin: 0 });
  });
  s.addText("gold = behind a flag, shipped but not released", { x: M + 0.3, y: 4.0, w: 6, h: 0.3, fontFace: FONT, fontSize: 12, italic: true, color: MUT_D, margin: 0 });

  const defs = [
    ["Deploying", "putting code on the server", BLUE],
    ["Releasing", "turning the flag on — for everyone, 30%, or just your team", GOLD],
  ];
  defs.forEach((d, i) => {
    const y = 1.85 + i * 1.35;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.6, y, w: 5.1, h: 1.1, rectRadius: 0.09, fill: { color: i === 0 ? "EEF4FE" : "FEF9E7" }, line: { color: d[2], width: 1.5 } });
    s.addText(d[0], { x: 7.9, y: y + 0.14, w: 4.5, h: 0.4, fontFace: FONT, fontSize: 19, bold: true, color: d[2] === GOLD ? "8A6D0B" : BLUE, margin: 0 });
    s.addText(d[1], { x: 7.9, y: y + 0.55, w: 4.5, h: 0.45, fontFace: FONT, fontSize: 14, color: MUT_L, margin: 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 5.0, w: W - 2 * M, h: 1.5, rectRadius: 0.1, fill: { color: FAINT }, line: { color: "D7DEE8", width: 1 } });
  s.addText([
    { text: "Two levers, two different days.", options: { bold: true, fontSize: 17, color: TXT_L, breakLine: true } },
    { text: "Ship Friday morning behind a switch. Release Monday 9 a.m. — or never, if the flag stays off. Turning a flag off takes seconds and touches no code.", options: { fontSize: 15, color: MUT_L } },
  ], { x: M + 0.35, y: 5.15, w: W - 2 * M - 0.7, h: 1.2, fontFace: FONT, paraSpaceAfter: 6, margin: 0 });
}

/* ── Slide 4 · What is a feature flag ───────────────────────── */
{
  const s = baseSlide(false);
  title(s, "What is a feature flag?");
  // code box
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.6, w: 7.3, h: 1.5, rectRadius: 0.09, fill: { color: "0D1117" }, shadow: shadow() });
  s.addText([
    { text: "if", options: { color: "FF7B72", breakLine: false } },
    { text: " (flags.isEnabledFor(", options: { color: "E8EDF4", breakLine: false } },
    { text: "'new-cart'", options: { color: "A5D6FF", breakLine: false } },
    { text: ", user))", options: { color: "E8EDF4", breakLine: true } },
    { text: "  renderNewCart();   ", options: { color: "E8EDF4", breakLine: false } },
    { text: "else", options: { color: "FF7B72", breakLine: true } },
    { text: "  renderOldCart();", options: { color: "E8EDF4" } },
  ], { x: M + 0.3, y: 1.72, w: 6.9, h: 1.25, fontFace: MONO, fontSize: 15, paraSpaceAfter: 4, margin: 0 });
  s.addText([
    { text: "The if is trivial — the engineering is where the flag lives", options: { bold: true, breakLine: true } },
    { text: "a config service, evaluated server-side, per user, changeable in seconds without touching code", options: { color: MUT_L } },
  ], { x: M, y: 3.35, w: 7.3, h: 0.85, fontFace: FONT, fontSize: 15, paraSpaceAfter: 4, margin: 0 });

  // three types
  const types = [
    ["on / off", "release toggle · kill switch", RED],
    ["percentage", "gradual rollout · canary", BLUE],
    ["experiment", "A/B variants by bucket", PURPLE],
  ];
  s.addText("Three flag types you'll meet in the wild", { x: M, y: 4.55, w: 7, h: 0.4, fontFace: FONT, fontSize: 17, bold: true, margin: 0 });
  types.forEach((t, i) => {
    const y = 5.05 + i * 0.62;
    s.addShape(pres.shapes.OVAL, { x: M + 0.05, y: y + 0.05, w: 0.4, h: 0.4, fill: { color: t[2] }, line: { color: t[2], width: 0 } });
    s.addText(String(i + 1), { x: M + 0.05, y: y + 0.05, w: 0.4, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText(t[0], { x: M + 0.62, y, w: 1.9, h: 0.5, fontFace: MONO, fontSize: 16, bold: true, color: t[2], valign: "middle", margin: 0 });
    s.addText(t[1], { x: M + 2.55, y, w: 4.4, h: 0.5, fontFace: FONT, fontSize: 14, color: MUT_L, valign: "middle", margin: 0 });
  });

  // right panel: where flags live
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.35, y: 1.6, w: 4.35, h: 4.75, rectRadius: 0.1, fill: { color: INK }, shadow: shadow() });
  s.addText("Where flags live", { x: 8.65, y: 1.85, w: 3.8, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: TXT_D, margin: 0 });
  s.addText([
    { text: "NOT React state in the browser", options: { bold: true, color: "FF9F9F", breakLine: true } },
    { text: "state + bucketing live server-side; pages only consume them", options: { color: MUT_D, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Swap our demo server for LaunchDarkly — the page wouldn't change", options: { color: TXT_D, breakLine: true } },
    { text: " ", options: { fontSize: 8, breakLine: true } },
    { text: "Every decision you saw was made by the server, per user id", options: { color: TXT_D } },
  ], { x: 8.65, y: 2.35, w: 3.75, h: 3.8, fontFace: FONT, fontSize: 14, paraSpaceAfter: 8, margin: 0 });
}

/* ── Slide 5 · Live demo screenshot ─────────────────────────── */
{
  const s = baseSlide(false);
  title(s, "Live demo — Noodle Noodle + a real flag console");
  const iw = 7.7, ih = iw * 1390 / 2560;
  s.addImage({ path: "deliverables/shot-01-live.png", x: M, y: 1.55, w: iw, h: ih, shadow: shadow() });
  s.addText("30% rollout · A/B board · express-checkout ON (the bug)", { x: M, y: 1.55 + ih + 0.12, w: iw, h: 0.35, fontFace: MONO, fontSize: 12, color: MUT_L, margin: 0, charSpacing: 1 });
  const rx = M + iw + 0.45, rw = W - M - rx;
  s.addText([
    { text: "Left: the app customers see", options: { bullet: bu(), breakLine: true } },
    { text: "Right: the console engineers see", options: { bullet: bu(), breakLine: true } },
    { text: "Gold cart = my user fell inside the rollout bucket", options: { bullet: bu(), breakLine: true } },
    { text: "Bottom strip: redeploys 0 · flag flips live count", options: { bullet: bu(), breakLine: true } },
    { text: "One page, five scenes — every change driven by the console", options: { bullet: bu() } },
  ], { x: rx, y: 2.0, w: rw, h: 3.6, fontFace: FONT, fontSize: 16, color: TXT_L, paraSpaceAfter: 16, margin: 0 });
  s.addText("dark theme · canary board · coin-flip visitors · a Friday-night incident · a 5-second rescue", { x: rx, y: 6.2, w: rw, h: 0.8, fontFace: FONT, fontSize: 14, italic: true, color: MUT_L, margin: 0 });
}

/* ── Slide 6 · What just happened ───────────────────────────── */
{
  const s = baseSlide(false);
  title(s, "What just happened?");
  const rows = [
    ["Theme flip", "one switch, instant re-render — the whole primitive in one click", BLUE],
    ["30% rollout", "hash-bucketed users light up; small blast radius, canary release", BLUE],
    ["A/B test", "same hashing primitive, two variants — product decisions from flags", PURPLE],
    ["Incident", "express-checkout breaks orders at 2 a.m. — flag OFF, orders resume, redeploys 0", RED],
  ];
  rows.forEach((r, i) => {
    const y = 1.6 + i * 0.98;
    s.addShape(pres.shapes.OVAL, { x: M, y: y + 0.08, w: 0.4, h: 0.4, fill: { color: r[2] }, line: { color: r[2], width: 0 } });
    s.addText(String(i + 1), { x: M, y: y + 0.08, w: 0.4, h: 0.4, fontFace: FONT, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0 });
    s.addText(r[0], { x: M + 0.6, y, w: 1.85, h: 0.56, fontFace: FONT, fontSize: 17, bold: true, color: r[2], valign: "middle", margin: 0 });
    s.addText(r[1], { x: M + 2.5, y, w: 5.0, h: 0.56, fontFace: FONT, fontSize: 14.5, color: TXT_L, valign: "middle", margin: 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.5, y: 1.6, w: 4.25, h: 3.9, rectRadius: 0.1, fill: { color: INK }, shadow: shadow() });
  s.addText([
    { text: "“Both versions ship together.", options: { color: GOLDBG, breakLine: true } },
    { text: "The flag chooses.”", options: { color: GOLDBG, breakLine: true } },
    { text: " ", options: { fontSize: 10, breakLine: true } },
    { text: "New checkout never replaced the old one — it arrived next to it, hidden. That's why turning the broken one off was instant: the reliable path never left.", options: { color: TXT_D } },
  ], { x: 8.8, y: 1.95, w: 3.65, h: 3.3, fontFace: FONT, fontSize: 17, italic: true, paraSpaceAfter: 6, margin: 0 });
  s.addText("five scenes · zero typing · one localhost command", { x: M, y: 5.85, w: 7.5, h: 0.4, fontFace: FONT, fontSize: 14, italic: true, color: MUT_L, margin: 0 });
}

/* ── Slide 7 · Pull quote ───────────────────────────────────── */
{
  const s = baseSlide(false);
  s.addText("Deploying is not releasing.", { x: M, y: 1.5, w: W - 2 * M, h: 1.0, fontFace: FONT, fontSize: 44, bold: true, italic: true, color: GOLD, margin: 0 });
  s.addText("— the one sentence to remember from today", { x: M, y: 2.6, w: 8, h: 0.4, fontFace: FONT, fontSize: 16, italic: true, color: MUT_L, margin: 0 });
  s.addText([
    { text: "Code can sit in production, hidden, for days", options: { bullet: bu(), breakLine: true } },
    { text: "Releases become reversible decisions, not one-way doors", options: { bullet: bu(), breakLine: true } },
    { text: "The blast radius of any mistake becomes a percentage you choose", options: { bullet: bu(), breakLine: true } },
    { text: "The best rollback button is a light switch", options: { bullet: bu() } },
  ], { x: M + 0.3, y: 3.7, w: 11.6, h: 2.3, fontFace: FONT, fontSize: 18, color: TXT_L, paraSpaceAfter: 14, margin: 0, wrap: true });
}

/* ── Slide 8 · Real world ───────────────────────────────────── */
{
  const s = baseSlide(false);
  title(s, "This is how real software ships");
  const cards = [
    ["LaunchDarkly", "a billion-dollar company built on flag infrastructure", INK],
    ["GitHub", "ships dark features behind flags, flips them on per account", INK],
    ["Netflix", "canary-releases new code to fractions of users first", INK],
  ];
  cards.forEach((c, i) => {
    const x = M + i * 4.2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.7, w: 3.7, h: 1.75, rectRadius: 0.09, fill: { color: FAINT }, line: { color: "D7DEE8", width: 1 }, shadow: shadow() });
    s.addText(c[0], { x: x + 0.28, y: 1.95, w: 3.1, h: 0.45, fontFace: FONT, fontSize: 20, bold: true, color: c[2], margin: 0 });
    s.addText(c[1], { x: x + 0.28, y: 2.45, w: 3.15, h: 0.85, fontFace: FONT, fontSize: 14, color: MUT_L, margin: 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 4.0, w: W - 2 * M, h: 1.3, rectRadius: 0.1, fill: { color: "FEF9E7" }, line: { color: GOLD, width: 1.5 } });
  s.addText([
    { text: "Your phone already works this way.  ", options: { bold: true, color: "8A6D0B" } },
    { text: "The next feature of your favourite app is very likely already downloaded on your device — just not switched on for you yet.", options: { color: TXT_L } },
  ], { x: M + 0.35, y: 4.0, w: W - 2 * M - 0.7, h: 1.3, fontFace: FONT, fontSize: 17, valign: "middle", margin: 0 });
  s.addText("flags: the quiet layer under trunk-based development and continuous delivery", { x: M, y: 5.65, w: W - 2 * M, h: 0.4, fontFace: FONT, fontSize: 14, italic: true, color: MUT_L, margin: 0 });
}

/* ── Slide 9 · The one piece of math ────────────────────────── */
{
  const s = baseSlide(false);
  title(s, "The one piece of math — bucketing");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 1.6, w: 7.6, h: 1.35, rectRadius: 0.09, fill: { color: "0D1117" }, shadow: shadow() });
  s.addText([
    { text: "hash( flagName + \":\" + userId ) % 100", options: { color: "A5D6FF", breakLine: true } },
    { text: "< rolloutPct   →   user is IN", options: { color: "7EE787" } },
  ], { x: M + 0.3, y: 1.74, w: 7.0, h: 1.1, fontFace: MONO, fontSize: 17, paraSpaceAfter: 6, margin: 0 });
  const props = [
    ["Deterministic", "same user + same flag → same bucket, every visit — stable experience", GREEN],
    ["Monotonic", "raising the rollout only ADDS users — nobody flips out mid-experience", BLUE],
    ["~20 lines", "FNV-1a hash at the top of our server.js — same trick LaunchDarkly documents", PURPLE],
  ];
  props.forEach((p, i) => {
    const y = 3.35 + i * 1.0;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: 7.6, h: 0.85, rectRadius: 0.09, fill: { color: FAINT }, line: { color: "D7DEE8", width: 1 } });
    s.addText(p[0], { x: M + 0.3, y: y + 0.08, w: 2.1, h: 0.7, fontFace: FONT, fontSize: 16, bold: true, color: p[2], valign: "middle", margin: 0 });
    s.addText(p[1], { x: M + 2.5, y: y + 0.08, w: 4.9, h: 0.7, fontFace: FONT, fontSize: 13.5, color: MUT_L, valign: "middle", margin: 0 });
  });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.6, y: 1.6, w: 4.15, h: 4.75, rectRadius: 0.1, fill: { color: INK }, shadow: shadow() });
  s.addText("Why hash, not random?", { x: 8.9, y: 1.85, w: 3.6, h: 0.4, fontFace: FONT, fontSize: 16, bold: true, color: TXT_D, margin: 0 });
  s.addText([
    { text: "Random per visit → your dark mode flickers off tomorrow", options: { bullet: { code: "25B8", indent: 12, color: MUT_D }, breakLine: true } },
    { text: "Hash of user id → the user never notices the machinery", options: { bullet: { code: "25B8", indent: 12, color: MUT_D }, breakLine: true } },
    { text: "Different flag name → independent buckets for every experiment", options: { bullet: { code: "25B8", indent: 12, color: MUT_D } } },
  ], { x: 8.9, y: 2.35, w: 3.55, h: 3.6, fontFace: FONT, fontSize: 14.5, color: TXT_D, paraSpaceAfter: 14, margin: 0 });
}

/* ── Slide 10 · Be honest — the costs ───────────────────────── */
{
  const s = baseSlide(false);
  title(s, "Be honest — the costs");
  const cards = [
    ["Flag debt", "flags accumulate; every stale flag is a code path nobody understands — removal is part of the discipline"],
    ["Combinatorics", "4 flags = 16 configurations — you cannot test them all; keep independent and few"],
    ["Ops dependency", "the flag service becomes critical infrastructure — real SDKs cache locally and define safe defaults"],
    ["Not a branch", "flags are not feature branches — long-lived branches that merge badly are the disease flags exist to cure"],
  ];
  const cw = (W - 2 * M - 0.5) / 2, ch = 1.95;
  cards.forEach((c, i) => {
    const x = M + (i % 2) * (cw + 0.5), y = 1.95 + Math.floor(i / 2) * (ch + 0.5);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: ch, rectRadius: 0.1, fill: { color: FAINT }, line: { color: "D7DEE8", width: 1 }, shadow: shadow() });
    s.addText([
      { text: c[0], options: { bold: true, fontSize: 21, color: TXT_L, breakLine: true } },
      { text: c[1], options: { fontSize: 16, color: MUT_L } },
    ], { x: x + 0.35, y: y + 0.25, w: cw - 0.7, h: ch - 0.5, fontFace: FONT, paraSpaceAfter: 10, margin: 0 });
  });
  s.addText("None of these kill the idea — they are the price of the lever, paid in discipline.", { x: M, y: 6.6, w: W - 2 * M, h: 0.4, fontFace: FONT, fontSize: 15, italic: true, align: "center", color: MUT_L, margin: 0 });
}

/* ── Slide 11 · Takeaways + try it (dark) ───────────────────── */
{
  const s = baseSlide(true);
  title(s, "Takeaways", true);
  const lines = [
    ["Deploy ≠ release — split the event, keep the levers", GOLD],
    ["Percentage + hash = gradual, reversible rollouts", BLUE],
    ["The kill switch is your 2 a.m. insurance policy", RED],
    ["Clean up your flags — the lever is rented, not owned", GREEN],
  ];
  lines.forEach((l, i) => {
    const y = 1.55 + i * 0.75;
    s.addShape(pres.shapes.OVAL, { x: M + 0.05, y: y + 0.14, w: 0.16, h: 0.16, fill: { color: l[1] }, line: { color: l[1], width: 0 } });
    s.addText(l[0], { x: M + 0.45, y, w: 7.3, h: 0.55, fontFace: FONT, fontSize: 16, color: TXT_D, valign: "middle", margin: 0, wrap: true });
  });
  s.addText("Try it yourself", { x: 8.3, y: 1.55, w: 4.3, h: 0.45, fontFace: FONT, fontSize: 18, bold: true, color: TXT_D, margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.3, y: 2.1, w: 4.45, h: 1.75, rectRadius: 0.09, fill: { color: "0D1117" }, line: { color: "2A3140", width: 1 } });
  s.addText([
    { text: "npm start", options: { color: "7EE787", breakLine: true } },
    { text: "# → localhost:3000", options: { color: "93A1B5", breakLine: true } },
    { text: "# zlxdengtianhei/dh2643-seminar4-featureflags", options: { color: "93A1B5" } },
  ], { x: 8.55, y: 2.28, w: 4.0, h: 1.4, fontFace: MONO, fontSize: 15, paraSpaceAfter: 8, margin: 0 });
  s.addText([
    { text: "flip flags · drag the rollout · break checkout · rescue it", options: { color: MUT_D } },
  ], { x: 8.3, y: 4.0, w: 4.45, h: 0.4, fontFace: FONT, fontSize: 13, italic: true, margin: 0 });
}

/* ── Slide 12 · References (dark) ───────────────────────────── */
{
  const s = baseSlide(true);
  title(s, "References", true);
  const refs = [
    ["Pete Hodgson — Feature Toggles, Part 1: classification of flag types", "martinfowler.com/articles/feature-toggles.html"],
    ["Martin Fowler — Feature Flags & continuous delivery", "martinfowler.com/blogs/feature-flags.html"],
    ["LaunchDarkly docs — bucketing & percentage rollouts", "docs.launchdarkly.com"],
    ["Node.js test-less demo: our zero-dependency server", "server.js (repo)"],
  ];
  refs.forEach((r, i) => {
    const y = 1.7 + i * 0.95;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: 0.5, h: 0.5, rectRadius: 0.08, fill: { color: "1B2129" }, line: { color: "2A3140", width: 1 } });
    s.addText(String(i + 1), { x: M, y, w: 0.5, h: 0.5, fontFace: FONT, fontSize: 16, bold: true, color: GOLDBG, align: "center", valign: "middle", margin: 0 });
    s.addText([
      { text: r[0], options: { fontSize: 15, color: TXT_D, breakLine: true } },
      { text: r[1], options: { fontSize: 13, color: MUT_D } },
    ], { x: M + 0.75, y: y - 0.05, w: 10.5, h: 0.75, fontFace: FONT, paraSpaceAfter: 3, margin: 0 });
  });
  s.addShape(pres.shapes.LINE, { x: M, y: 5.85, w: W - 2 * M, h: 0, line: { color: "2A3140", width: 1 } });
  s.addText([
    { text: "Demo + slides + script:  ", options: { color: MUT_D } },
    { text: "github.com/zlxdengtianhei/dh2643-seminar4-featureflags", options: { color: GOLDBG, fontFace: MONO, fontSize: 14 } },
  ], { x: M, y: 6.05, w: W - 2 * M, h: 0.45, fontFace: FONT, fontSize: 15, margin: 0 });
  s.addText("Thanks — questions?", { x: M, y: 6.55, w: 8, h: 0.4, fontFace: FONT, fontSize: 16, italic: true, color: TXT_D, margin: 0 });
}

/* ── Slide 13 · Demo recording ───────────────────────────────── */
{
  const s = baseSlide(false);
  title(s, "Demo recording");
  s.addText("All five scenes in one take — real flags, real checkout.", { x: M, y: 1.35, w: 11.5, h: 0.4, fontFace: FONT, fontSize: 16, color: MUT_L, margin: 0 });
  const vw = 9.2, vh = vw * 708 / 1280;
  s.addMedia({ type: "video", path: "deliverables/demo-backup.mp4", x: M, y: 1.95, w: vw, h: vh });
  s.addText([
    { text: "theme flag → rollout 60%", options: { bullet: bu(), breakLine: true } },
    { text: "A/B visitors → cart items", options: { bullet: bu(), breakLine: true } },
    { text: "incident → kill switch", options: { bullet: bu(), breakLine: true } },
    { text: "redeploys: 0", options: { bullet: bu() } },
  ], { x: 10.15, y: 2.1, w: 2.6, h: 3.6, fontFace: FONT, fontSize: 14, color: TXT_L, paraSpaceAfter: 12, margin: 0, wrap: true });
}

pres.writeFile({ fileName: "Seminar4_FeatureFlags_Group5.pptx" }).then(() => console.log("written: Seminar4_FeatureFlags_Group5.pptx"));
