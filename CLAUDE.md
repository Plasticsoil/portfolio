# Portfolio — notes for Claude

- Static site, no build step. Hosted on **Cloudflare Pages**; merging to
  `main` deploys to yamliv.net. Netlify is out of quota and its config has
  been removed: never add Netlify config or functions. Server-side code
  goes in `functions/api/` (Cloudflare Pages Functions). `HOSTING.md` says
  what runs where.
- `fun/` is FunType, a minified Vite build with no source in the repo.
  Effects are added by editing the bundles in place (see
  `fun/assets/bounce.js` for the readable Collection 03 module and the
  registration points in `main-*.js`, `embed-*.js`, `export-*.js`).
  Because they are edited rather than rebuilt, their hashed names no longer
  promise a file never changes — `_headers` holds `/fun/assets/*` to a
  minute so a deploy reaches people who have the page open.
  `fun/assets/sway.js` is Collection 04 — Flower, Sway and Grow — and is
  written to be read: the block at the top of it says what is settled and
  why, for the collection as well as for each card.
- The studio page runs its cards through the **card gate** at the top of
  `fun/assets/main-*.js` — a card is built just before it reaches the
  viewport, draws only while it is on screen and the tab is visible, and
  is given back when it has been away a while or when more than
  `MOUNT_CAP` are built. Twelve of them at once is what used to kill the
  tab on a phone, and the cost that did it is memory, not the loops: a
  card is a 1080x1080 stage, and between the stage, the grain blended
  over it and the full-frame overlays the effects draw into, each one is
  about four surfaces of that size — twelve came to 163MB of compositor
  memory, past what iOS lets a tab hold. Keep the cap low; if a new
  collection adds full-stage layers, measure before raising it.
- A new effect needs nothing to be gated: the gate wraps
  `requestAnimationFrame`, so anything animating on rAF is gated by the
  fact that it does. Two things it must not do. Do not hold your own wall
  clock (`performance.now()`, `Date.now()`) — read time from the rAF
  timestamp, which is the one the gate can stop. And do not assume
  `stop()` is the only teardown: the gate retires a card by replacing its
  stage element, so listeners on the stage go with the node. Anything
  hung on `window` or `document` would not, and must be removed in
  `stop()`.
- Outputs of FunType are CC BY-NC 4.0, the tool is all rights reserved;
  the credit line, footer and metadata live in the export bundle and
  `fun/license.html`. Keep them when touching exports.
