/* ══════════════════════════════════════════════════════════════
   Floating share widget — bottom-right, fixed on every page.
   Clicking a platform logo copies the CURRENT page's URL,
   pre-tagged with that platform's ?utm_source=… so the
   Cloudflare Web Analytics "Referrers" view can tell channels
   apart. Built mainly for the site owner to grab tagged links,
   but visitors can use it too.

   Self-contained: injects its own CSS + DOM, hard-codes the
   palette (inner pages don't share index.html's :root tokens),
   and guards against double-injection. Included via
   <script defer src="/share-widget.js"> on each page.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__ylShareWidget) return;        // guard against double-load
  window.__ylShareWidget = true;

  // hex (#rgb or #rrggbb) → rgba string at the given alpha
  function rgba(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // ── Platforms (order = top → bottom when expanded) ──────────────
  // hue = brand colour shown on hover. id 'copy' = clean untagged link.
  var PLATFORMS = [
    { id: 'linkedin',  label: 'LinkedIn',  hue: '#0A66C2' },
    { id: 'instagram', label: 'Instagram', hue: '#E1306C' },
    { id: 'x',         label: 'X',         hue: '#111111' },
    { id: 'whatsapp',  label: 'WhatsApp',  hue: '#25D366' },
    { id: 'email',     label: 'Email',     hue: '#68645E' },
    { id: 'copy',      label: 'Link',      hue: '#26251E' }
  ];

  // ── Inline brand glyphs (currentColor) ──────────────────────────
  var ICONS = {
    linkedin:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.76-2.05C20.2 8.65 22 10.6 22 14.25V21h-4v-6c0-1.43-.03-3.27-2-3.27-2 0-2.3 1.56-2.3 3.17V21H9z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg>',
    x:         '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.3 3h3.3l-7.2 8.23L21.8 21h-6.6l-5.18-6.78L4.1 21H.8l7.7-8.8L2.2 3h6.77l4.68 6.19zM16.16 19h1.83L7.93 4.9H5.97z"/></svg>',
    whatsapp:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.9.9-2.8-.2-.3A8 8 0 1 1 12 20zm4.4-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.7.9-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.3 7.3 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.3v-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3A2.8 2.8 0 0 0 7 8.5a4.9 4.9 0 0 0 1 2.6 11 11 0 0 0 4.3 3.8c.6.3 1.1.4 1.5.5a3.4 3.4 0 0 0 1.5.1 2.5 2.5 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3z"/></svg>',
    email:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>',
    copy:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>'
  };
  var SHARE_GLYPH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>';
  var CLOSE_GLYPH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  // ── Styles ──────────────────────────────────────────────────────
  var css = [
    '#yl-share{position:fixed;right:16px;bottom:16px;z-index:9500;',
      "font-family:'Nimbus Sans','Helvetica Neue',Helvetica,Arial,sans-serif;",
      'opacity:0;transform:translateY(10px);transition:opacity .5s ease,transform .5s cubic-bezier(0.34,1.2,0.64,1);}',
    '#yl-share.yl-ready{opacity:1;transform:none;}',

    /* round buttons share a look — light, soft, low hierarchy */
    '#yl-share button{margin:0;padding:0;border:1px solid rgba(163,160,155,.16);border-radius:50%;',
      'background:#FBFAF9;color:#A3A09B;display:flex;align-items:center;justify-content:center;',
      'box-shadow:0 2px 8px rgba(38,37,30,.05);cursor:pointer;-webkit-tap-highlight-color:transparent;',
      'transition:transform .35s cubic-bezier(0.34,1.2,0.64,1),background .25s ease,box-shadow .35s ease,color .25s ease,border-color .25s ease,opacity .35s ease;}',
    '#yl-share button svg{width:44%;height:44%;display:block;}',

    /* main toggle */
    '.yl-share-fab{width:40px;height:40px;position:relative;}',
    '.yl-share-fab:hover{box-shadow:0 3px 12px rgba(38,37,30,.08);transform:translateY(-1px);}',
    '.yl-share-fab .yl-ic{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transition:opacity .3s ease,transform .35s cubic-bezier(0.34,1.2,0.64,1);}',
    '.yl-share-fab .yl-ic svg{width:17px;height:17px;}',
    '.yl-share-fab .yl-ic-close{opacity:0;transform:rotate(-90deg) scale(.6);}',
    '#yl-share[data-open="true"] .yl-share-fab{box-shadow:0 3px 12px rgba(38,37,30,.08);}',
    '#yl-share[data-open="true"] .yl-ic-share{opacity:0;transform:rotate(90deg) scale(.6);}',
    '#yl-share[data-open="true"] .yl-ic-close{opacity:1;transform:none;}',

    /* soft gradient accent ring on the fab when open / hovered */
    '.yl-share-fab::after{content:"";position:absolute;inset:-1.5px;border-radius:50%;padding:1.5px;',
      'background:linear-gradient(90deg,#FF6EFD,#F8FF7B,#60FBFF);opacity:0;transition:opacity .3s ease;',
      '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);',
      '-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;}',
    '.yl-share-fab:hover::after,#yl-share[data-open="true"] .yl-share-fab::after{opacity:.45;}',

    /* expanding stack */
    '.yl-share-items{position:absolute;right:4px;bottom:48px;display:flex;flex-direction:column;align-items:center;gap:9px;}',
    '.yl-share-item{width:32px;height:32px;opacity:0;transform:translateY(12px) scale(.5);pointer-events:none;}',
    '.yl-share-item svg{width:14px;height:14px;}',
    '#yl-share[data-open="true"] .yl-share-item{opacity:1;transform:none;pointer-events:auto;}',
    '.yl-share-item:hover{transform:scale(1.08);box-shadow:0 3px 10px rgba(38,37,30,.08);}',

    /* hover label pill */
    '.yl-share-item .yl-tip{position:absolute;right:42px;white-space:nowrap;background:#FBFAF9;color:#68645E;',
      'border:1px solid rgba(163,160,155,.16);font-size:11.5px;line-height:1;letter-spacing:.01em;',
      'padding:6px 9px;border-radius:7px;box-shadow:0 2px 8px rgba(38,37,30,.05);opacity:0;',
      'transform:translateX(6px);transition:opacity .2s ease,transform .2s ease;pointer-events:none;}',
    '.yl-share-item:hover .yl-tip{opacity:1;transform:none;}',

    /* toast confirmation — soft, light */
    '.yl-share-toast{position:absolute;right:0;bottom:48px;background:#FBFAF9;color:#68645E;font-size:12px;',
      'border:1px solid rgba(163,160,155,.16);letter-spacing:.01em;padding:8px 12px;border-radius:9px;',
      'box-shadow:0 3px 12px rgba(38,37,30,.08);white-space:nowrap;opacity:0;transform:translateY(8px);',
      'pointer-events:none;transition:opacity .3s ease,transform .3s cubic-bezier(0.34,1.2,0.64,1);}',
    '#yl-share[data-open="true"] .yl-share-toast{bottom:auto;top:-44px;}', /* sit above the open stack */
    '.yl-share-toast.yl-show{opacity:1;transform:none;}',

    /* left-anchored variant (used on the fun page so it clears the mobile menu) */
    '#yl-share.yl-left{left:16px;right:auto;}',
    '#yl-share.yl-left .yl-share-items{left:4px;right:auto;}',
    '#yl-share.yl-left .yl-tip{right:auto;left:42px;transform:translateX(-6px);}',
    '#yl-share.yl-left .yl-share-item:hover .yl-tip{transform:none;}',
    '#yl-share.yl-left .yl-share-toast{right:auto;left:0;}',

    '@media (max-width:600px){#yl-share{right:13px;bottom:13px;}#yl-share.yl-left{left:13px;right:auto;}}'
  ].join('');

  // ── Build DOM ───────────────────────────────────────────────────
  function build() {
    if (document.getElementById('yl-share')) return;

    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var root = document.createElement('div');
    root.id = 'yl-share';
    root.setAttribute('data-open', 'false');
    // On the fun page the bottom-right corner collides with the mobile menu,
    // so anchor the widget bottom-left there instead.
    if (/^\/fun(\/|$|\/index\.html$)/.test(window.location.pathname)) {
      root.classList.add('yl-left');
    }

    var items = document.createElement('div');
    items.className = 'yl-share-items';
    PLATFORMS.forEach(function (p, i) {
      var b = document.createElement('button');
      b.className = 'yl-share-item';
      b.type = 'button';
      b.setAttribute('aria-label', 'Copy ' + p.label + ' link');
      b.style.transitionDelay = (i * 35) + 'ms';                 // open stagger
      b.innerHTML = '<span class="yl-tip">' + p.label + '</span>' + ICONS[p.id];
      // hover = soft, light tint of the brand colour (not a bold fill)
      b.addEventListener('mouseenter', function () {
        b.style.background = rgba(p.hue, 0.10);
        b.style.borderColor = rgba(p.hue, 0.28);
        b.style.color = '#68645E';
      });
      b.addEventListener('mouseleave', function () {
        b.style.background = '';
        b.style.borderColor = '';
        b.style.color = '';
      });
      b.addEventListener('click', function (e) { e.stopPropagation(); grab(p); });
      items.appendChild(b);
    });

    var fab = document.createElement('button');
    fab.className = 'yl-share-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Share this page');
    fab.innerHTML = '<span class="yl-ic yl-ic-share">' + SHARE_GLYPH + '</span>' +
                    '<span class="yl-ic yl-ic-close">' + CLOSE_GLYPH + '</span>';
    fab.addEventListener('click', function (e) { e.stopPropagation(); toggle(); });

    var toast = document.createElement('div');
    toast.className = 'yl-share-toast';
    toast.setAttribute('role', 'status');

    root.appendChild(items);
    root.appendChild(fab);
    root.appendChild(toast);
    document.body.appendChild(root);

    // gentle entrance
    requestAnimationFrame(function () {
      setTimeout(function () { root.classList.add('yl-ready'); }, 350);
    });

    // close when clicking elsewhere / pressing Escape
    document.addEventListener('click', function (e) {
      if (root.getAttribute('data-open') === 'true' && !root.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });

    window.__ylShareRoot = root;
  }

  // ── Behaviour ───────────────────────────────────────────────────
  function setOpen(open) {
    var root = window.__ylShareRoot;
    if (!root) return;
    // reverse the stagger when closing so it collapses top-down
    var btns = root.querySelectorAll('.yl-share-item');
    btns.forEach(function (b, i) {
      b.style.transitionDelay = (open ? i * 35 : (btns.length - 1 - i) * 25) + 'ms';
    });
    root.setAttribute('data-open', open ? 'true' : 'false');
  }
  function toggle() { setOpen(window.__ylShareRoot.getAttribute('data-open') !== 'true'); }

  // current page URL, stripped of any existing utm_*/hash, then re-tagged
  function taggedUrl(source) {
    var u = new URL(window.location.href);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      u.searchParams.delete(k);
    });
    u.hash = '';
    if (source !== 'copy') u.searchParams.set('utm_source', source);
    return u.toString();
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (err) { reject(err); }
    });
  }

  var toastTimer;
  function showToast(msg) {
    var root = window.__ylShareRoot;
    var t = root.querySelector('.yl-share-toast');
    t.textContent = msg;
    t.classList.add('yl-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('yl-show'); }, 1900);
  }

  function grab(p) {
    var url = taggedUrl(p.id);
    copyText(url).then(function () {
      showToast((p.id === 'copy' ? 'Link' : p.label) + ' link copied  ✓');
    }).catch(function () {
      showToast('Copy failed — ' + url);
    });
  }

  // ── Init ────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
