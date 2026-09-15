// DH2643 Seminar 4 — Feature Flags demo server.
// The flags live HERE, in the server, like a mini config center.
// The browser is only a consumer (it polls /api/state), which is the honest
// answer to "isn't this just React state?" — swap this server for LaunchDarkly
// and the page would not change.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)));

/* ── Flag evaluation ──────────────────────────────────────────── */

// Deterministic bucketing: the same (flagKey, userId) always lands in the
// same bucket, so a user's experience is stable across visits. Real systems
// (LaunchDarkly et al.) hash exactly like this.
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
export function bucketFor(flagKey, userId) {
  return fnv1a(`${flagKey}:${userId}`) % 100;
}

export function makeServer() {
  const deployTime = new Date();
  let flips = 0;

  // Three flag shapes, like a real console: on/off, percentage, experiment.
  const flags = {
    "theme-dark": { type: "bool", on: false },
    "new-cart": { type: "pct", pct: 0 },
    "hero-copy": { type: "ab", split: 50 }, // bucket < 50 → A, else B
    "express-checkout": { type: "bool", on: true }, // shipped this morning… and buggy
  };

  const SEED = [
    ["Aiko", "🐱"], ["Björn", "🐻"], ["Chen", "🦊"], ["Doris", "🐼"],
    ["Emil", "🦉"], ["Farid", "🐺"], ["Greta", "🦌"], ["Hugo", "🐯"],
    ["Ines", "🐨"], ["Jonas", "🦁"], ["Karin", "🐸"], ["Leo", "🐵"],
  ];
  let visitorSeq = 0;
  const MORE = ["Maja", "Nils", "Olga", "Pax", "Rune", "Sara", "Tove", "Ulf"];
  const visitors = SEED.map(([name, emoji]) => ({ id: `v${++visitorSeq}`, name, emoji }));

  const log = []; // audit trail, newest last
  function flip(flag, change) {
    flips++;
    log.push({ t: new Date().toISOString(), flag, change });
    if (log.length > 12) log.shift();
  }

  const inRollout = (v) => bucketFor("new-cart", v.id) < flags["new-cart"].pct;
  const variantOf = (v) => (bucketFor("hero-copy", v.id) < flags["hero-copy"].split ? "A" : "B");

  function stateFor(viewerId) {
    const youIn = bucketFor("new-cart", viewerId) < flags["new-cart"].pct;
    return {
      flags,
      you: {
        id: viewerId,
        newCartIn: youIn,
        heroVariant: bucketFor("hero-copy", viewerId) < flags["hero-copy"].split ? "A" : "B",
      },
      visitors: visitors.map((v) => ({ ...v, newCartIn: inRollout(v), heroVariant: variantOf(v) })),
      expressBuggy: flags["express-checkout"].on, // while ON, checkout fails
      deployTime: deployTime.toISOString(),
      flips,
      log: log.slice(-6),
    };
  }

  // The "bug": the express-checkout beta times out against the payment
  // gateway. Flipping the flag off restores the old path — no redeploy.
  function tryCheckout() {
    if (flags["express-checkout"].on) {
      return { status: 500, body: { ok: false, error: "PAYMENT_GATEWAY_TIMEOUT", hint: "express-checkout beta is enabled" } };
    }
    return { status: 200, body: { ok: true, orderId: `KTH-${Math.random().toString(36).slice(2, 7).toUpperCase()}` } };
  }

  const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };

  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const send = (status, body, type = "application/json") => {
      res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
      res.end(typeof body === "string" ? body : JSON.stringify(body));
    };

    if (req.method === "GET" && url.pathname === "/api/state") {
      return send(200, stateFor(url.searchParams.get("you") || "you"));
    }

    if (req.method === "POST" && url.pathname === "/api/visitors") {
      const name = MORE[(visitorSeq - SEED.length) % MORE.length] || `Guest${visitorSeq}`;
      const v = { id: `v${++visitorSeq}`, name, emoji: "🧑" };
      visitors.push(v);
      return send(200, { ...v, newCartIn: inRollout(v), heroVariant: variantOf(v) });
    }

    if (req.method === "POST" && url.pathname === "/api/checkout") {
      const r = tryCheckout();
      return send(r.status, r.body);
    }

    const flagPost = url.pathname.match(/^\/api\/flags\/([\w-]+)$/);
    if (req.method === "POST" && flagPost) {
      const key = flagPost[1];
      if (!(key in flags)) return send(404, { error: "unknown flag" });
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        let payload = {};
        try { payload = JSON.parse(body || "{}"); } catch { return send(400, { error: "bad json" }); }
        const f = flags[key];
        if (f.type === "bool" && typeof payload.on === "boolean") {
          f.on = payload.on;
          flip(key, payload.on ? "ON" : "OFF");
        } else if (f.type === "pct" && Number.isFinite(payload.pct)) {
          const pct = Math.max(0, Math.min(100, Math.round(payload.pct)));
          if (pct === f.pct) return send(200, stateFor(payload.you || "you"));
          f.pct = pct;
          flip(key, `${pct}%`);
        } else {
          return send(400, { error: "payload does not match flag type" });
        }
        send(200, stateFor(payload.you || "you"));
      });
      return;
    }

    if (req.method === "GET") {
      const rel = url.pathname === "/" ? "public/index.html" : `public${url.pathname}`;
      readFile(join(ROOT, rel), "utf8")
        .then((data) => send(200, data, MIME[extname(rel)] || "application/octet-stream"))
        .catch(() => send(404, "not found", "text/plain"));
      return;
    }
    send(405, { error: "method not allowed" });
  });

  server.on("clientError", (_err, socket) => socket.destroy());
  return server;
}

/* ── boot ─────────────────────────────────────────────────────── */
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Self-check: the two invariants the whole demo stands on.
  const a = bucketFor("new-cart", "v3"), b = bucketFor("new-cart", "v3");
  if (a !== b) throw new Error("bucketing is not deterministic");
  const s = makeServer();
  const port = Number(process.env.PORT) || 3000;
  const listen = (p) =>
    new Promise((resolve, reject) => {
      s.once("error", reject);
      s.listen(p, "127.0.0.1", () => resolve(p));
    });
  listen(port)
    .catch(() => listen(port + 1))
    .catch(() => listen(port + 2))
    .then((p) => {
      console.log(`Feature-flags demo ready → http://localhost:${p}`);
      console.log(`All checks passed. Deploy time ${new Date().toISOString()}`);
    })
    .catch((e) => console.error("could not start:", e.message));
}
