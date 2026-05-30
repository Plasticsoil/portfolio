// moji — global daily leaderboard, stored in Netlify Blobs (free, built in).
// GET  /api/leaderboard?date=YYYY-MM-DD        → top 24 for that day
// POST /api/leaderboard  { name, ms, date }    → add a score, returns top 24
import { getStore } from '@netlify/blobs';

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

export default async (req) => {
  const store = getStore('moji-leaderboard');
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const date = url.searchParams.get('date');
    if (!isDate(date)) return json({ error: 'bad date' }, 400);
    const list = (await store.get(date, { type: 'json' })) || [];
    return json({ date, top: topOf(list) });
  }

  if (req.method === 'POST') {
    let body;
    try { body = await req.json(); } catch (e) { return json({ error: 'bad json' }, 400); }
    const { name, ms, date } = body || {};
    if (!isDate(date)) return json({ error: 'bad date' }, 400);
    if (typeof ms !== 'number' || !isFinite(ms) || ms < 0 || ms > 86400000) return json({ error: 'bad time' }, 400);

    const clean = String(name || 'Anon').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) || 'Anon';
    const entry = { name: clean, ms: Math.round(ms), ts: Date.now() };

    // Read-modify-write the day's list.
    const list = (await store.get(date, { type: 'json' })) || [];
    list.push(entry);
    const trimmed = topOf(list);
    await store.setJSON(date, trimmed);

    return json({ date, top: trimmed, you: entry });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/leaderboard' };
