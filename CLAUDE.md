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
- Outputs of FunType are CC BY-NC 4.0, the tool is all rights reserved;
  the credit line, footer and metadata live in the export bundle and
  `fun/license.html`. Keep them when touching exports.
