/* ══════════════════════════════════════════════════════════════
   BLOCK RENDERER v2

   window.Blocks.render(blocks, ctx) → HTML string

   The v1 renderer (/blocks.js) had 22 block types because layout
   and media were welded together. Here they're separate:

     LAYOUT   9 primitives — title, text, media, grid, rows,
              panel, marquee, hotspots, quote
     MEDIA    1 polymorphic atom — img | video | lottie | glb | embed

   So "four 3D models across" and "four phone mockups across" and
   "four Lotties across" are all the same block:

     { type:'grid', cols:4, items:[ {glb:'a.glb'}, {img:'b.png'} ] }

   Old type names still work — see LEGACY at the bottom. Existing
   project.js files keep rendering while they're migrated one at
   a time.

   Self-contained on purpose: no dependency on index.html's
   globals, so /work, /tools and /shop can each use it alone.
════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Escaping ───────────────────────────────────────────────
     Everything author-supplied goes through one of these. `html`
     for text nodes, `attr` for attribute values, `url` for src.  */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* Block a `src` that would execute script. Anything that isn't a
     plain relative/absolute path or http(s) URL is dropped.

     project.js files write their asset paths relative to the site
     root ('projects/shltr/assets/…') because they were only ever
     loaded by the root index.html. Resolving those from the site
     root here means a case study renders identically at /v5/work/
     or anywhere else, without needing a <base> tag — which would
     break in-page anchors like #contact. */
  function url(s) {
    var v = String(s == null ? '' : s).trim();
    if (!v) return '';
    if (/^(javascript|vbscript):/i.test(v)) return '';
    if (/^(https?:|data:|blob:|\/|#)/i.test(v)) return esc(v);
    return esc('/' + v.replace(/^\.\//, ''));
  }

  /* Turn '460/320' | '16/9' | 1.5 into a CSS aspect-ratio value. */
  function ratio(r) {
    if (r == null) return null;
    if (typeof r === 'number') return isFinite(r) && r > 0 ? String(r) : null;
    var m = String(r).match(/^\s*(\d+(?:\.\d+)?)\s*[\/:]\s*(\d+(?:\.\d+)?)\s*$/);
    if (m) return m[1] + ' / ' + m[2];
    return /^\s*\d+(\.\d+)?\s*$/.test(r) ? String(r).trim() : null;
  }

  /* Build a style="" from an object, skipping empty values. */
  function style(pairs) {
    var out = Object.keys(pairs)
      .filter(function (k) { return pairs[k] !== null && pairs[k] !== undefined && pairs[k] !== ''; })
      .map(function (k) { return k + ':' + pairs[k]; })
      .join(';');
    return out ? ' style="' + esc(out) + '"' : '';
  }

  function tip(t) {
    return t ? ' data-cursor-tooltip="' + esc(t) + '"' : '';
  }

  /* Column counts. `cols` is the desktop count; the tablet and
     phone counts fall back to sensible collapses instead of
     forcing every caller to spell all three out.
       4 → 2 → 1     3 → 2 → 1     2 → 2 → 1     1 → 1 → 1     */
  function colVars(b, dflt) {
    var c  = Math.max(1, Math.min(6, parseInt(b.cols, 10) || dflt || 2));
    var md = parseInt(b.colsMd, 10) || (c >= 3 ? 2 : c);
    var sm = parseInt(b.colsSm, 10) || 1;
    return { '--cols': c, '--cols-md': md, '--cols-sm': sm };
  }

  /* ── MEDIA ATOM ─────────────────────────────────────────────
     One box that can hold any kind of media. This is the piece
     that collapses six old grid types into one.

     m = { img|video|lottie|glb|embed, ratio, fit, label, caption,
           tooltip, frame, plain, natural, hoverPlay, poster, alt } */

  var BADGE_3D =
    '<span class="blk-m-3d" data-cursor-tooltip="Interactive 3D — drag to rotate" aria-hidden="true">' +
    '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="32" height="32" rx="16" fill="#A3A09B" fill-opacity="0.2"/>' +
    '<path d="M9.5 12L16 15.5M16 15.5L22.5 12M16 15.5V23M15.76 8.63l-6 3.23a.3.3 0 0 0-.26.27v7.4c0 .18.1.35.26.44l6 3.23c.15.08.33.08.47 0l6-3.23a.5.5 0 0 0 .26-.44v-7.4a.5.5 0 0 0-.26-.44l-6-3.23a.5.5 0 0 0-.47 0Z" stroke="#A3A09B"/>' +
    '</svg></span>';

  function media(m) {
    if (!m) return '';

    var inner = '', badge = '', extraCls = '';

    if (m.img) {
      inner = '<img src="' + url(m.img) + '" alt="' + esc(m.alt || m.label || '') + '" loading="lazy" decoding="async">';

    } else if (m.video) {
      // hoverPlay: static until the pointer arrives, then plays.
      // The ping-pong reverse is wired up by enhance() below.
      var v = m.hoverPlay
        ? ' data-hover-play muted playsinline preload="metadata" data-cursor-action'
        : ' muted playsinline loop autoplay preload="metadata"';
      inner = '<video src="' + url(m.video) + '"' + v +
              (m.poster ? ' poster="' + url(m.poster) + '"' : '') + '></video>';

    } else if (m.lottie) {
      inner = '<lottie-player src="' + url(m.lottie) + '" autoplay loop ' +
              'background="transparent" speed="1" renderer="svg"></lottie-player>';

    } else if (m.glb) {
      inner = '<model-viewer src="' + url(m.glb) + '" camera-controls touch-action="pan-y" ' +
              'interaction-prompt="none" shadow-intensity="0" exposure="1" ' +
              'environment-image="neutral" min-field-of-view="5deg" max-field-of-view="70deg" ' +
              'camera-orbit="0deg 78deg 75%"></model-viewer>';
      badge = BADGE_3D;

    } else if (m.embed) {
      inner = '<iframe src="' + url(m.embed) + '" title="' + esc(m.label || 'Embedded content') +
              '" loading="lazy" allowfullscreen></iframe>';

    } else {
      // Nothing supplied — render the empty frame rather than
      // collapsing the grid. Makes a missing asset obvious.
      extraCls += ' blk-m--empty';
    }

    var cls = 'blk-m' + extraCls +
      (m.plain   ? ' blk-m--plain'   : '') +
      (m.natural ? ' blk-m--natural' : '') +
      (m.frame   ? ' blk-m--framed'  : '') +
      (m.fit === 'contain' ? ' blk-m--contain' : '');

    var st = style({
      '--ratio': ratio(m.ratio),
      '--fit':   m.fit === 'cover' || m.fit === 'contain' ? m.fit : null,
      'background': m.bg ? esc(m.bg) : null
    });

    var label = m.label ? '<span class="blk-tag"><span>/</span>' + esc(m.label) + '</span>' : '';

    return '<div class="' + cls + '"' + st + tip(m.tooltip) + '>' + label + inner + badge + '</div>';
  }

  /* A media atom plus its optional caption underneath. */
  function mediaWithCaption(m) {
    var cap = m && m.caption ? '<p class="blk-caption">' + esc(m.caption) + '</p>' : '';
    return media(m) + cap;
  }

  /* ── LAYOUT BLOCKS ──────────────────────────────────────────*/

  function b_title(b, ctx) {
    var t = b.text || (ctx && ctx.title) || '';
    return '<h1 class="blk-title">' + esc(t) + '</h1>';
  }

  function b_text(b) {
    var head = b.heading
      ? '<h3 class="blk-head"><span class="blk-head-slash">/</span>' + esc(b.heading) + '</h3>'
      : '';

    var list = b.cols || (b.text ? [b.text] : []);
    var cols = list.map(function (c) {
      // A column is either a plain string or { heading, text }.
      if (c && typeof c === 'object') {
        return '<div class="blk-text-col">' +
               (c.heading ? '<h4 class="blk-text-col-head"><span class="blk-head-slash">/</span>' + esc(c.heading) + '</h4>' : '') +
               '<p>' + esc(c.text || '') + '</p></div>';
      }
      return '<div class="blk-text-col"><p>' + esc(c) + '</p></div>';
    }).join('');

    // Default column count follows the content, not a guess.
    var vars = colVars(b, Math.min(list.length || 1, 3));
    return '<section class="blk blk-text">' + head +
           '<div class="blk-text-cols"' + style(vars) + '>' + cols + '</div></section>';
  }

  function b_media(b) {
    var head = b.heading
      ? '<h3 class="blk-head"><span class="blk-head-slash">/</span>' + esc(b.heading) + '</h3>'
      : '';
    var cls = 'blk blk-media' + (b.bleed ? ' blk--bleed' : '');
    return '<section class="' + cls + '" aria-label="' + esc(b.heading || 'Media') + '">' +
           head + mediaWithCaption(b) + '</section>';
  }

  function b_grid(b) {
    var head = b.heading
      ? '<h3 class="blk-head"><span class="blk-head-slash">/</span>' + esc(b.heading) + '</h3>'
      : '';
    var items = (b.items || []).map(function (m) {
      // Per-item ratio falls back to the grid's, so a whole row of
      // phone mockups is one `ratio` on the grid, not four.
      if (m && m.ratio == null && b.ratio != null) m = Object.assign({}, m, { ratio: b.ratio });
      return '<div class="blk-grid-item">' + mediaWithCaption(m) + '</div>';
    }).join('');
    var vars = colVars(b, Math.min((b.items || []).length || 2, 4));
    return '<section class="blk blk-grid-wrap" aria-label="' + esc(b.heading || 'Gallery') + '">' +
           head + '<div class="blk-grid"' + style(vars) + '>' + items + '</div></section>';
  }

  function b_rows(b) {
    var rows = (b.items || []).map(function (r, i) {
      var flip = (i % 2 === 1) ? ' blk-row--flip' : '';
      return '<div class="blk-row' + flip + '">' +
               '<div class="blk-row-media">' + media(r) + '</div>' +
               '<div class="blk-row-text">' +
                 (r.title ? '<h4 class="blk-row-title">' + esc(r.title) + '</h4>' : '') +
                 (r.desc  ? '<p class="blk-row-desc">'  + esc(r.desc)  + '</p>' : '') +
               '</div>' +
             '</div>';
    }).join('');
    return '<section class="blk blk-rows" aria-label="' + esc(b.heading || 'Features') + '">' + rows + '</section>';
  }

  function b_panel(b) {
    var cards = (b.cards || []).map(function (c) {
      var icon = (c.lottie || c.img)
        ? '<div class="blk-panel-card-icon">' + (c.lottie
            ? '<lottie-player src="' + url(c.lottie) + '" autoplay loop background="transparent" speed="1" renderer="svg"></lottie-player>'
            : '<img src="' + url(c.img) + '" alt="" loading="lazy">') + '</div>'
        : '';
      return '<div class="blk-panel-card">' + icon +
             (c.title ? '<h4 class="blk-panel-card-title">' + esc(c.title) + '</h4>' : '') +
             (c.desc  ? '<p class="blk-panel-card-desc">'  + esc(c.desc)  + '</p>' : '') +
             '</div>';
    }).join('');
    var vars = colVars(b, 2);
    return '<section class="blk blk-panel" aria-label="' + esc(b.heading || 'Highlights') + '">' +
             '<div class="blk-panel-head">' +
               (b.heading ? '<h2 class="blk-panel-title">' + esc(b.heading) + '</h2>' : '') +
               (b.sub ? '<p class="blk-panel-sub">' + esc(b.sub) + '</p>' : '') +
             '</div>' +
             '<div class="blk-panel-grid"' + style(vars) + '>' + cards + '</div>' +
           '</section>';
  }

  function b_marquee(b) {
    var list = b.items || [];
    var set = list.map(function (m) {
      var el = m.lottie
        ? '<lottie-player src="' + url(m.lottie) + '" autoplay loop background="transparent" speed="1" renderer="svg"></lottie-player>'
        : m.img ? '<img src="' + url(m.img) + '" alt="' + esc(m.label || '') + '" loading="lazy">' : '';
      return '<div class="blk-marquee-item"' + tip(m.tooltip || m.label) + '>' + el + '</div>';
    }).join('');
    // Duration scales with the item count so per-item speed is constant
    // regardless of how many icons there are.
    var dur = b.durationSec || Math.max(20, list.length * 2.5);
    return '<section class="blk blk-marquee" aria-label="' + esc(b.heading || 'Icon strip') + '">' +
             '<div class="blk-marquee-track" style="animation-duration:' + Number(dur) + 's">' +
               set + set +   // duplicated so -50% wraps seamlessly
             '</div>' +
           '</section>';
  }

  function b_hotspots(b) {
    if (!b.img) return '';
    var vw = (b.viewBox && b.viewBox[0]) || 960;
    var vh = (b.viewBox && b.viewBox[1]) || 474;
    var pct = function (n, total) { return (n / total * 100) + '%'; };

    var hits = (b.hits || []).map(function (h) {
      return '<div class="blk-hotspot-hit"' + style({
        left: pct(h.x, vw), top: pct(h.y, vh),
        width: pct(h.w, vw), height: pct(h.h, vh)
      }) + '></div>';
    }).join('');

    var spots = (b.spots || []).map(function (s) {
      var el = s.lottie
        ? '<lottie-player src="' + url(s.lottie) + '" autoplay loop background="transparent" speed="1" renderer="svg"></lottie-player>'
        : s.img ? '<img src="' + url(s.img) + '" alt="" loading="lazy">' : '';
      return '<div class="blk-hotspot"' + style({
        left: pct(s.cx, vw), top: pct(s.cy, vh),
        width: pct(s.size, vw), 'aspect-ratio': '1'
      }) + '>' + el + '</div>';
    }).join('');

    return '<section class="blk" aria-label="' + esc(b.heading || 'Interface') + '">' +
             '<div class="blk-hotspots"' + style({ 'aspect-ratio': vw + ' / ' + vh }) + '>' +
               '<img class="blk-hotspots-bg" src="' + url(b.img) + '" alt="" loading="lazy">' +
               hits + spots +
             '</div>' +
           '</section>';
  }

  function b_quote(b) {
    return '<section class="blk blk-quote">' +
             '<p class="blk-quote-text">' + esc(b.text || '') + '</p>' +
             (b.cite ? '<p class="blk-quote-cite">' + esc(b.cite) + '</p>' : '') +
           '</section>';
  }

  function b_backToTop() {
    return '<button type="button" class="blk-back-to-top" data-back-to-top ' +
           'data-cursor-tooltip="Scroll to top">Back to top</button>';
  }

  function b_spacer(b) {
    return '<div class="blk-spacer" aria-hidden="true"' +
           style({ height: 'var(--space-' + (b.size || 'xl') + ')' }) + '></div>';
  }

  /* Escape hatch. Raw HTML, trusted — only ever authored by us in
     a project.js, never from user input. */
  function b_custom(b) {
    return '<section class="blk blk-custom">' + (b.html || '') + '</section>';
  }

  /* ── REGISTRY ───────────────────────────────────────────────*/

  var REGISTRY = {
    'title':       b_title,
    'text':        b_text,
    'media':       b_media,
    'grid':        b_grid,
    'rows':        b_rows,
    'panel':       b_panel,
    'marquee':     b_marquee,
    'hotspots':    b_hotspots,
    'quote':       b_quote,
    'back-to-top': b_backToTop,
    'spacer':      b_spacer,
    'custom':      b_custom
  };

  /* ── LEGACY ─────────────────────────────────────────────────
     v1 type names, rewritten into v2 shapes at render time. Lets
     shltr/project.js and radiant/project.js keep working untouched
     while we migrate them. Delete an entry once nothing uses it.  */

  var LEGACY = {
    'twoCol': function (b) {
      return { type: 'text', heading: b.heading, cols: b.cols };
    },
    'twoCol-subheads': function (b) {
      return { type: 'text', cols: b.cols };
    },
    'grid4-3d': function (b) {
      return { type: 'grid', cols: 2, items: (b.tiles || []).map(function (t) {
        return { glb: t.glb, img: t.img, label: t.label, tooltip: t.tooltip };
      }) };
    },
    'grid4-lottie': function (b) {
      return { type: 'grid', cols: 2, items: (b.tiles || []).map(function (t) {
        return { lottie: t.src, label: t.label, caption: t.caption,
                 tooltip: t.tooltip, frame: !!b.framed };
      }) };
    },
    'grid4-phones': function (b) {
      // Phone mockups are portrait and stay 2-across on tablet.
      return { type: 'grid', cols: 4, colsMd: 2, colsSm: 2, ratio: '9/19',
               items: (b.items || []).map(function (it, i) {
                 return { glb: it.glb, img: it.img, label: String(it.num || i + 1), fit: 'contain' };
               }) };
    },
    'grid4-videos-ppong': function (b) {
      return { type: 'grid', cols: 4, colsMd: 2, colsSm: 2, ratio: '9/16',
               items: (b.videos || []).map(function (src) {
                 return { video: src, hoverPlay: true };
               }) };
    },
    'grid2x2-videos': function (b) {
      return { type: 'grid', cols: 2, items: (b.videos || []).map(function (src) {
        return { video: src };
      }) };
    },
    'grid2-images': function (b) {
      return { type: 'grid', cols: 2, items: (b.images || []).map(function (src) {
        return { img: src };
      }) };
    },
    'composite-image': function (b) {
      return { type: 'media', img: b.src, natural: !!b.natural, plain: true };
    },
    'wide-video': function (b) {
      return { type: 'media', video: b.src, tooltip: b.tooltip, ratio: '960/440' };
    },
    'outro-video': function (b) {
      var isVid = /\.(mp4|webm|ogg)(\?.*)?$/i.test(b.src || '');
      var out = { type: 'media', natural: true, plain: true, tooltip: b.tooltip };
      out[isVid ? 'video' : 'img'] = b.src;
      return out;
    },
    'lottie-single': function (b) {
      return { type: 'media', lottie: b.src, heading: b.heading,
               tooltip: b.tooltip, plain: !b.variant, ratio: '16/9' };
    },
    'lottie-strip': function (b) {
      return { type: 'marquee', heading: b.heading,
               items: (b.items || []).map(function (it) {
                 return { lottie: it.src, label: it.label };
               }) };
    },
    'icon-library': function (b) {
      return { type: 'marquee', durationSec: b.durationSec,
               items: (b.icons || []).map(function (i) {
                 return { lottie: i.src, tooltip: i.tooltip };
               }) };
    },
    'panel-cards': function (b) {
      return { type: 'panel', heading: b.heading, sub: b.sub,
               cards: (b.cards || []).map(function (c) {
                 return { lottie: c.src, title: c.title, desc: c.desc };
               }) };
    },
    'feature-row-lottie': function (b) {
      return { type: 'rows', heading: b.heading,
               items: (b.rows || []).map(function (r) {
                 return { lottie: r.src, title: r.title, desc: r.desc, plain: true };
               }) };
    },
    'solution-nav-bar': function (b) {
      return { type: 'hotspots', img: b.src, viewBox: b.viewBox,
               spots: (b.icons || []).map(function (i) {
                 return { lottie: i.src, cx: i.cx, cy: i.cy, size: i.size };
               }), hits: b.hits };
    },
    'sketch-logo': function (b) {
      return { type: 'grid', cols: 2, items: [
        { img: b.sketch,  label: b.sketchLabel || 'Sketch', ratio: '502/525', fit: 'contain' },
        { img: b.logoEvo, ratio: '217/330', fit: 'contain', plain: true }
      ] };
    },
    'globe-code': function (b) {
      return { type: 'media', embed: b.src, ratio: '16/10' };
    }
  };

  /* ── PUBLIC API ─────────────────────────────────────────────*/

  function renderBlock(block, ctx) {
    if (!block || !block.type) return '';

    var b = block;
    if (LEGACY[b.type]) {
      var mapped = LEGACY[b.type](b);
      // Carry the original type through for debugging in devtools.
      b = Object.assign({}, mapped, { _legacyType: block.type });
    }

    var fn = REGISTRY[b.type];
    if (!fn) {
      console.warn('[blocks] unknown block type:', b.type);
      return '<!-- unknown block: ' + esc(b.type) + ' -->';
    }
    return fn(b, ctx);
  }

  function render(blocks, ctx) {
    if (!Array.isArray(blocks)) return '';
    return '<div class="blk-canvas">' +
      blocks.map(function (b) { return renderBlock(b, ctx); }).join('\n') +
      '</div>';
  }

  /* ── ENHANCE ────────────────────────────────────────────────
     Behaviour that can't be expressed in markup. Call once after
     inserting rendered HTML into the DOM. Safe to call repeatedly
     — every handler it attaches is marked so it isn't doubled.   */

  function enhance(root) {
    var scope = root || document;

    // Hover-to-play videos, with a ping-pong reverse on the way out.
    scope.querySelectorAll('video[data-hover-play]:not([data-enhanced])').forEach(function (v) {
      v.setAttribute('data-enhanced', '');
      var raf = null;

      function forward() {
        cancelAnimationFrame(raf);
        v.playbackRate = 1;
        v.play().catch(function () { /* autoplay policy — ignore */ });
      }
      // <video> can't play backwards natively; step currentTime instead.
      function rewind() {
        v.pause();
        (function tick() {
          if (v.currentTime <= 0.02) { v.currentTime = 0; return; }
          v.currentTime = Math.max(0, v.currentTime - 1 / 30);
          raf = requestAnimationFrame(tick);
        })();
      }

      v.addEventListener('pointerenter', forward);
      v.addEventListener('pointerleave', rewind);
    });

    scope.querySelectorAll('[data-back-to-top]:not([data-enhanced])').forEach(function (btn) {
      btn.setAttribute('data-enhanced', '');
      btn.addEventListener('click', function () {
        // Scroll the nearest scrollable ancestor (the overlay panel)
        // if there is one, otherwise the window.
        var sc = btn.closest('[data-scroll-root]') || window;
        sc.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  window.Blocks = {
    render:      render,
    renderBlock: renderBlock,
    media:       media,
    enhance:     enhance,
    types:       Object.keys(REGISTRY),
    legacyTypes: Object.keys(LEGACY)
  };

  /* v1 call sites in index.html expect these two globals. Keeping
     them pointed at v2 means the live overlay switches over with
     no edit to index.html at all. */
  window.renderBlock  = renderBlock;
  window.renderBlocks = render;

})();
