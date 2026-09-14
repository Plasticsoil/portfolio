# Hosting — Cloudflare Pages

The whole site is served by **Cloudflare Pages** from `main`: static files
straight out of the repo root, and the two API routes as Pages Functions in
`functions/api/`. **Netlify is not used** — that account's free tier is
spent — so nothing here should be pointed back at it.

## What runs where

| | |
|---|---|
| Static site | the repo root, published as-is (no build step) |
| `/api/leaderboard` | `functions/api/leaderboard.js` — moji's global daily board, in Workers KV |
| `/api/glyph` | `functions/api/glyph.js` — the shop's drawing form |
| KV binding | `LEADERBOARD`, set in the Pages dashboard and in `wrangler.toml` |
| Production branch | `main` — a push to it is a deploy |

Cloudflare Pages serves the static site with **unlimited bandwidth** and
runs the functions on the free tier.

## How it was set up (kept for reference — this is already done)

### 1. Create the Cloudflare account
- Go to https://dash.cloudflare.com/sign-up and sign up (free).

### 2. Connect the GitHub repo
- In the dashboard: **Workers & Pages → Create → Pages → Connect to Git**.
- Pick the `plasticsoil/portfolio` repo.
- Build settings:
  - **Framework preset:** `None`
  - **Build command:** *(leave empty)*
  - **Build output directory:** `/`
  - **Production branch:** `main`
- Click **Save and Deploy**. The site goes live at `something.pages.dev`.

### 3. Create the leaderboard store (Workers KV)
- **Workers & Pages → KV → Create a namespace.**
- Name it e.g. `moji-leaderboard`. Create it.

### 4. Bind the store to the site
- Open your new Pages project → **Settings → Functions → KV namespace bindings → Add binding.**
- **Variable name:** `LEADERBOARD`  ← must be exactly this.
- **KV namespace:** pick `moji-leaderboard`.
- Save, then **Deployments → Retry deployment** (so the binding takes effect).

That's it. Visit `your-site.pages.dev/moji/` and the board under the list
should read **🌍 Global board**.

## Custom domain (optional)
- Pages project → **Custom domains → Set up a domain** → enter your domain
  and follow the DNS steps. Free, includes HTTPS.

## Free limits (plenty for this)
- **Bandwidth:** unlimited.
- **Function/Worker requests:** 100,000 per day.
- **KV:** 100,000 reads/day, 1,000 writes/day, 1 GB storage.
  (One game submission = one write, so ~1,000 finishes/day before any limit.)

## Notes
- The Netlify config (`netlify.toml`, `netlify/functions/`) has been
  removed: the account is out of free quota and nothing was reaching it.
  The leaderboard's route and payloads are unchanged, so the game needed no
  change when it moved.
- KV is eventually consistent, so a brand-new score can take a few seconds
  to show for everyone. Fine for a daily board.
