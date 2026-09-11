// Dots.Mono.001 — one proposed glyph as an image.
//
//   GET /api/glyph-image?id=<submission id>   → image/svg+xml
//
// The drawing redrawn the way the typeface is built: 5 across, 7 down,
// white nodes on the product page's black. The thank-you mail links to
// this, so the person who drew it sees their own character in any mail
// client without an attachment. It shows nothing the public feed does
// not already: the pattern, never the address.

const CELL = 60;
const PAD = 60;
const R = 26;

export async function onRequestGet({ request, env }) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[\w.:\-]{1,80}$/.test(id)) return new Response('bad id', { status: 400 });

  const v = await env.LEADERBOARD.get('glyph:' + id, 'json');
  if (!v || typeof v.pattern !== 'string') return new Response('not found', { status: 404 });

  const rows = v.pattern.split('\n');
  const w = PAD * 2 + CELL * 5;
  const h = PAD * 2 + CELL * 7;
  let dots = '';
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      const on = (rows[r] || '').charAt(c) === '1';
      dots += `<circle cx="${PAD + c * CELL + CELL / 2}" cy="${PAD + r * CELL + CELL / 2}" r="${R}" fill="${on ? '#F8F6F3' : '#2A2A2A'}"/>`;
    }
  }
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" rx="24" fill="#111111"/>${dots}</svg>`;

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'access-control-allow-origin': '*',
    },
  });
}
