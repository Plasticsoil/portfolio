/**
 * /<slug> — a case study as a real address.
 *
 * The overlay is still the overlay: this does not render a second copy
 * of the site. It serves index.html and rewrites the handful of tags a
 * link preview reads, so pasting yamliv.net/shltr into WhatsApp shows
 * SHLTR instead of the home page. A hash could never do that — it is
 * never sent to the server — which is why every project link previewed
 * as the same image before this existed.
 *
 * Anything that is not a published project is handed straight back to
 * the asset server, so /contact, /shop, /fun and friends are untouched.
 */

const ESC = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* The published list, read from the same file the page reads, so a
   project hidden on the grid is not quietly reachable by URL. Commented
   lines are what "hidden" means there, so they have to go first. */
async function publishedSlugs(origin) {
  const res = await fetch(new URL('/projects/index.js', origin));
  if (!res.ok) return null;
  const src = (await res.text())
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  const body = src.match(/PROJECTS_ORDER\s*=\s*\[([\s\S]*?)\]/);
  if (!body) return null;
  return (body[1].match(/'([^']+)'|"([^"]+)"/g) || [])
    .map(s => s.slice(1, -1).toLowerCase());
}

/* Only the fields a preview needs. project.json is the studio's own
   output, so a project gains a proper preview the moment it is
   converted; one still written as project.js just keeps the site
   default rather than breaking. */
async function projectMeta(slug, origin) {
  const abs = v => (v ? new URL('/' + String(v).replace(/^\/+/, ''), origin).href : null);

  const json = await fetch(new URL(`/projects/${slug}/project.json`, origin));
  if (json.ok) {
    try {
      const d = await json.json();
      return {
        title: d.title || slug,
        description: d.sub || d.role || '',
        image: abs(d.shareImage || d.thumbnail)
      };
    } catch { /* fall through to the .js below */ }
  }

  /* Not converted yet. Read the three fields off project.js rather than
     generating a project.json for it: a project.json is what the studio
     opens, and one sitting next to an unconverted project.js is an
     invitation to Save over a case study nobody meant to change. A
     regex for three top-level strings is the smaller risk, and a miss
     costs the generic preview, not the page. */
  const js = await fetch(new URL(`/projects/${slug}/project.js`, origin));
  if (!js.ok) return null;
  const src = await js.text();
  const field = name => {
    const m = src.match(new RegExp(name + "\\s*:\\s*'([^']*)'|" + name + '\\s*:\\s*"([^"]*)"'));
    return m ? (m[1] !== undefined ? m[1] : m[2]) : null;
  };
  const title = field('title');
  if (!title) return null;
  return {
    title,
    description: field('sub') || field('role') || '',
    image: abs(field('shareImage') || field('thumbnail'))
  };
}

export async function onRequestGet(context) {
  const { request, params, next } = context;
  const url = new URL(request.url);

  /* One path segment, no trailing slash, nothing that looks like a
     file. Everything else is somebody else's route. */
  const slug = decodeURIComponent(String(params.slug || '')).toLowerCase();
  if (!slug || slug.includes('/') || slug.includes('.')) return next();

  const published = await publishedSlugs(url.origin);
  if (!published || published.indexOf(slug) < 0) return next();

  const page = await fetch(new URL('/index.html', url.origin));
  if (!page.ok) return next();

  const meta = await projectMeta(slug, url.origin);
  if (!meta) {
    /* Published, but no project.json yet: the address works and the
       page opens: only the preview stays generic. */
    return new Response(page.body, page);
  }

  const title = `${meta.title} — Yam Livnat`;
  const canonical = `${url.origin}/${slug}`;

  class Meta {
    constructor(value) { this.value = value; }
    element(el) { el.setAttribute('content', this.value); }
  }
  class Title {
    element(el) { el.setInnerContent(ESC(title), { html: true }); }
  }

  let out = new HTMLRewriter()
    .on('title', new Title())
    .on('meta[property="og:title"]', new Meta(title))
    .on('meta[name="twitter:title"]', new Meta(title))
    .on('meta[property="og:url"]', new Meta(canonical))
    .on('link[rel="canonical"]', { element(el) { el.setAttribute('href', canonical); } });

  if (meta.description) {
    out = out
      .on('meta[property="og:description"]', new Meta(meta.description))
      .on('meta[name="twitter:description"]', new Meta(meta.description))
      .on('meta[name="description"]', new Meta(meta.description));
  }
  if (meta.image) {
    out = out
      .on('meta[property="og:image"]', new Meta(meta.image))
      .on('meta[name="twitter:image"]', new Meta(meta.image));
  }

  const res = out.transform(new Response(page.body, page));
  res.headers.set('content-type', 'text/html; charset=utf-8');
  /* The HTML is per-project now, so it must not be cached as if it
     were the one shared index.html. */
  res.headers.set('cache-control', 'public, max-age=0, must-revalidate');
  return res;
}
