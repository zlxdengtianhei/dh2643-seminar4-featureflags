# Feature Flags Live Demo — DH2643 Seminar 4, Group 5

A 12-minute demo-driven presentation on **feature flags**, built around a small
food-ordering app (Noodle Noodle) and a real flag console next to it: flip a
switch, drag a rollout, run an A/B experiment, break checkout, and rescue it
with a kill switch — `redeploys: 0` the whole time.

Runs on Node.js 20+:

```sh
npm start     # → http://localhost:3000
npm test      # flag lifecycle, bucketing invariants, rollout, kill switch
```

## What the demo shows

| Scene | Action | Audience sees |
|---|---|---|
| 1 Switch = feature | flip `theme-dark` | the app re-themes instantly |
| 2 Gradual rollout | drag `new-cart` 0→30→60% | visitor avatars light up (canary release) |
| 3 A/B experiment | `🪙 Simulate new visitor` ×3 | coin-flip buckets, A/B split counter |
| 4 The incident | add items → ⚡ Express checkout | red banner: `PAYMENT_GATEWAY_TIMEOUT` |
| 5 Kill switch | flip `express-checkout` OFF → Place order | order goes through, `redeploys: 0` |

The flags live **server-side** (`GET/POST /api/flags/*`); the page only polls
`/api/state` like a real SDK would — open the page in two windows and flipping
a flag in one updates the other within two seconds.

Bucketing is the same one-liner real systems use:

```
hash( flagName + ":" + userId ) % 100  <  rolloutPct   →  user is IN
```

Deterministic (stable per user), monotonic (raising the rollout only adds users).
Four flags, three shapes — on/off, percentage, A/B experiment.

## Tips

- `?seed=1` pre-fills the cart with two items.
- `?autodemo=1` walks all five scenes once at a presenting pace (same buttons,
  same flag API — nothing faked).

## Layout

- `server.js` — flag state, FNV-1a bucketing, visitor board, incident logic
- `public/` — the single-page UI (app + console)
- `Seminar4_FeatureFlags_Group5.pptx` — the slide deck (last slide embeds a recording of the full demo)
- `build_deck.cjs` + `patch_video_timing.py` — regenerate the deck
- `test/server.test.js` — the test suite
