import { test } from "node:test";
import assert from "node:assert/strict";
import { makeServer, bucketFor } from "../server.js";

function start() {
  const server = makeServer();
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` })));
}
const json = (r) => r.json();
const post = (base, path, body) => fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

test("flag lifecycle over real HTTP: toggles persist, audit log and flip counter grow", async (t) => {
  const { server, base } = await start();
  t.after(() => new Promise((r) => { server.close(r); server.closeAllConnections(); }));
  const st0 = await fetch(base + "/api/state?you=t1").then(json);
  assert.equal(st0.flags["theme-dark"].on, false);
  assert.equal(st0.flags["express-checkout"].on, true);
  assert.equal(st0.flags["new-cart"].pct, 0);
  assert.equal(st0.flips, 0);

  const st1 = await post(base, "/api/flags/theme-dark", { on: true, you: "t1" }).then(json);
  assert.equal(st1.flags["theme-dark"].on, true);
  assert.equal(st1.flips, 1);
  assert.equal(st1.log.at(-1).flag, "theme-dark");
  assert.equal(st1.log.at(-1).change, "ON");

  // bad payloads fail closed
  const bad = await post(base, "/api/flags/theme-dark", { pct: 50 });
  assert.equal(bad.status, 400);
  const unknown = await post(base, "/api/flags/nope", { on: true });
  assert.equal(unknown.status, 404);
});

test("bucketing invariants: deterministic, boundary-exact, monotonic in pct", () => {
  const ids = Array.from({ length: 50 }, (_, i) => `u${i}`);
  for (const id of ids) {
    const a = bucketFor("new-cart", id), b = bucketFor("new-cart", id);
    assert.equal(a, b, "same input must give same bucket");
    assert.ok(a >= 0 && a < 100);
  }
  // distinct salt (flag key) → independent bucket universe
  assert.notDeepEqual(
    ids.map((i) => bucketFor("new-cart", i)),
    ids.map((i) => bucketFor("hero-copy", i))
  );
  const inAt = (ids, pct) => ids.filter((i) => bucketFor("new-cart", i) < pct);
  assert.equal(inAt(ids, 0).length, 0);
  assert.equal(inAt(ids, 100).length, ids.length);
  // monotonicity: raising the rollout never drops a user who was already in
  for (let pct = 5; pct <= 100; pct += 5) {
    const prev = new Set(inAt(ids, pct - 5)), now = new Set(inAt(ids, pct));
    for (const u of prev) assert.ok(now.has(u), `user ${u} dropped when raising to ${pct}%`);
  }
});

test("rollout over HTTP: server-computed board matches the bucket rule", async (t) => {
  const { server, base } = await start();
  t.after(() => new Promise((r) => { server.close(r); server.closeAllConnections(); }));
  const st = await post(base, "/api/flags/new-cart", { pct: 30, you: "t2" }).then(json);
  assert.equal(st.flags["new-cart"].pct, 30);
  for (const v of st.visitors) {
    assert.equal(v.newCartIn, bucketFor("new-cart", v.id) < 30);
    assert.ok(["A", "B"].includes(v.heroVariant));
  }
  // pct is clamped and rounded
  const st2 = await post(base, "/api/flags/new-cart", { pct: 250 }).then(json);
  assert.equal(st2.flags["new-cart"].pct, 100);
});

test("kill switch: buggy beta fails, flag OFF restores checkout, deploy time never changes", async (t) => {
  const { server, base } = await start();
  t.after(() => new Promise((r) => { server.close(r); server.closeAllConnections(); }));
  const deploy = (await fetch(base + "/api/state").then(json)).deployTime;

  const boom = await post(base, "/api/checkout", { items: ["ramen"] });
  assert.equal(boom.status, 500);
  assert.equal((await boom.json()).error, "PAYMENT_GATEWAY_TIMEOUT");

  await post(base, "/api/flags/express-checkout", { on: false });
  const ok = await post(base, "/api/checkout", { items: ["ramen"] });
  assert.equal(ok.status, 200);
  assert.match((await ok.json()).orderId, /^KTH-/);

  const after = await fetch(base + "/api/state").then(json);
  assert.equal(after.deployTime, deploy, "no redeploy happened — only the flag moved");
  assert.equal(after.flips, 1);
});

test("simulated visitors join the board with server-side bucket assignments", async (t) => {
  const { server, base } = await start();
  t.after(() => new Promise((r) => { server.close(r); server.closeAllConnections(); }));
  const st0 = await fetch(base + "/api/state").then(json);
  assert.equal(st0.visitors.length, 12);
  const v = await fetch(base + "/api/visitors", { method: "POST" }).then(json);
  assert.match(v.id, /^v\d+$/);
  assert.equal(v.newCartIn, false); // rollout starts at 0% → nobody in
  assert.equal(v.newCartIn, bucketFor("new-cart", v.id) < 0);
  const st1 = await fetch(base + "/api/state").then(json);
  assert.equal(st1.visitors.length, 13);
});
