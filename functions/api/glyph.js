// Dots.Mono.001 — proposed glyphs, Cloudflare Pages Function.
//
// The shop's 5x7 editor posts here. Stored in Workers KV, reusing the
// namespace the moji leaderboard already binds (LEADERBOARD) under a
// glyph: prefix, so no new binding is needed in the dashboard.
//
//   POST /api/glyph   form-encoded or JSON  → { ok: true }
//   GET  /api/glyph                          → { count, items:[…] }
//
// GET never returns email addresses. They are stored so she can reply,
// but a listing anyone can fetch should not hand out other people's
// addresses; read those from the Cloudflare KV browser when needed.

const ROWS = 7;
const COLS = 5;
const MAX_BODY = 2048;        // a 5x7 pattern and a short label; nothing else belongs here
const MAX_CHAR = 12;
const LIST_CAP = 1000;

const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    ...extra,
  },
});

/* Seven rows of five, at least one node lit. Anything else is not a
   glyph and does not get a KV write. */
function validPattern(p) {
  if (typeof p !== 'string') return null;
  const rows = p.split('\n').map((r) => r.trim());
  if (rows.length !== ROWS) return null;
  if (!rows.every((r) => r.length === COLS && /^[01]+$/.test(r))) return null;
  if (!rows.some((r) => r.includes('1'))) return null;
  return rows.join('\n');
}

/* The caller's address is never stored, only a short digest of it, and
   only for long enough to space out submissions. */
async function rateKey(ip) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('glyph:' + ip));
  return 'rl:' + [...new Uint8Array(buf)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'content-type',
    },
  });
}

export async function onRequestGet({ env }) {
  const listed = await env.LEADERBOARD.list({ prefix: 'glyph:', limit: LIST_CAP });
  const items = [];
  for (const k of listed.keys) {
    const v = await env.LEADERBOARD.get(k.name, 'json');
    if (!v) continue;
    items.push({ id: k.name.slice('glyph:'.length), character: v.character, pattern: v.pattern, at: v.at });
  }
  // Newest first. The key carries the timestamp, so this is stable.
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return json({ count: items.length, truncated: listed.list_complete === false, items });
}

export async function onRequestPost({ request, env }) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ ok: false, error: 'too large' }, 413);

  let f;
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    try { f = JSON.parse(raw); } catch { return json({ ok: false, error: 'bad json' }, 400); }
  } else {
    f = Object.fromEntries(new URLSearchParams(raw));
  }

  // Honeypot: a real person leaves it empty. Answer ok so a bot learns
  // nothing from the response, and write nothing.
  if ((f['bot-field'] || '').trim()) return json({ ok: true });

  const pattern = validPattern(f.pattern);
  if (!pattern) return json({ ok: false, error: 'pattern must be 7 rows of 5, not empty' }, 400);

  const character = String(f.character || '').trim().slice(0, MAX_CHAR);
  if (!character) return json({ ok: false, error: 'character required' }, 400);

  const email = String(f.email || '').trim().slice(0, 120);
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: 'email looks wrong' }, 400);
  }

  const ip = request.headers.get('cf-connecting-ip') || '0';
  const rk = await rateKey(ip);
  if (await env.LEADERBOARD.get(rk)) return json({ ok: false, error: 'slow down' }, 429);

  const at = new Date().toISOString();
  const key = 'glyph:' + at + ':' + Math.random().toString(36).slice(2, 8);
  await env.LEADERBOARD.put(key, JSON.stringify({ character, email, pattern, at }));
  await env.LEADERBOARD.put(rk, '1', { expirationTtl: 60 });

  return json({ ok: true });
}
