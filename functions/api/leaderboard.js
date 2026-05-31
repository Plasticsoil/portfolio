// moji — global daily leaderboard, Cloudflare Pages Function.
// Stored in Workers KV (free tier). Bind a KV namespace named
// LEADERBOARD in the Pages dashboard (Settings → Functions → KV
// namespace bindings). The frontend hits this at /api/leaderboard,
// the exact same path the Netlify version used, so no client change.
//
//   GET  /api/leaderboard?date=YYYY-MM-DD     → { date, top:[…24] }
//   POST /api/leaderboard { name, ms, date }  → { date, top, you }

const TOP = 24;
const MAX_NAME = 14;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
});

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

function topOf(list) {
  return list
    .filter((r) => r && typeof r.ms === 'number')
    .sort((a, b) => a.ms - b.ms)
    .slice(0, TOP);
}

export async function onRequestGet({ request, env }) {
  if (!env.LEADERBOARD) return json({ error: 'no store bound' }, 500);
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  if (!isDate(date)) return json({ error: 'bad date' }, 400);
  const list = (await env.LEADERBOARD.get(date, { type: 'json' })) || [];
  return json({ date, top: topOf(list) });
}

export async function onRequestPost({ request, env }) {
  if (!env.LEADERBOARD) return json({ error: 'no store bound' }, 500);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
  const { name, ms, date } = body || {};
  if (!isDate(date)) return json({ error: 'bad date' }, 400);
  if (typeof ms !== 'number' || !isFinite(ms) || ms < 0 || ms > 86400000) return json({ error: 'bad time' }, 400);

  const clean = String(name || 'Anon').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) || 'Anon';
  const entry = { name: clean, ms: Math.round(ms), ts: Date.now() };

  const list = (await env.LEADERBOARD.get(date, { type: 'json' })) || [];
  list.push(entry);
  const trimmed = topOf(list);
  await env.LEADERBOARD.put(date, JSON.stringify(trimmed));

  return json({ date, top: trimmed, you: entry });
}
