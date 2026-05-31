# Hosting moji (and the whole site) on Cloudflare Pages — free

Cloudflare Pages serves the static site with **unlimited bandwidth** and
runs the leaderboard as a free Pages Function backed by **Workers KV**.
Nothing in the game changes: it still calls `/api/leaderboard`, which is
now handled by `functions/api/leaderboard.js`.

## One-time setup (about 5 minutes, all free, no card)

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
- The old Netlify files (`netlify.toml`, `netlify/`) are left in the repo,
  dormant. They don't affect Cloudflare. Delete them later if you like.
- KV is eventually consistent, so a brand-new score can take a few seconds
  to show for everyone. Fine for a daily board.
