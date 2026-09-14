# Portfolio — notes for Claude

- Static site, no build step. Hosted on **Cloudflare Pages**; merging to
  `main` deploys to yamliv.net. Netlify is dormant (account out of quota):
  never add Netlify config or functions. Server-side code goes in
  `functions/api/` (Cloudflare Pages Functions).
- `fun/` is FunType, a minified Vite build with no source in the repo.
  Effects are added by editing the bundles in place (see
  `fun/assets/bounce.js` for the readable Collection 03 module and the
  registration points in `main-*.js`, `embed-*.js`, `export-*.js`).
- Outputs of FunType are CC BY-NC 4.0, the tool is all rights reserved;
  the credit line, footer and metadata live in the export bundle and
  `fun/license.html`. Keep them when touching exports.
