/* ══════════════════════════════════════════════════════════════
   THE LINE — one quiet line at the very bottom of every page,
   and THE DOT — the site's cursor: a small, solid white circle.

   Fixed to the bottom edge, under everything: the copyright on the
   left, the credit on the right. Blended by difference, so it reads
   dark on the cream pages and light on the black ones without a
   style per page. Add it to a page with

     <script defer src="/shared/line.js"></script>

   before </body>. Pages that keep their own content at the bottom
   edge leave room for it (about 20px).
════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var YEAR = new Date().getFullYear();

  var css =
    '#site-line { position: fixed; z-index: 90; left: 10px; right: 10px; bottom: 4px; margin: 0;' +
    ' display: flex; justify-content: space-between; gap: 16px;' +
    ' font: 300 10px/1.4 "Archivo", "Switzer", "Helvetica Neue", Helvetica, Arial, sans-serif; letter-spacing: 0.02em;' +
    ' color: #fff; opacity: 0.45; mix-blend-mode: difference; pointer-events: none; white-space: nowrap; }' +
    '#site-line a { color: inherit; text-decoration: none; pointer-events: auto; }' +
    '#site-line a:hover { text-decoration: underline; text-underline-offset: 3px; }' +
    '@media (max-width: 560px) { #site-line span:last-child { display: none; } }';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* The cursor. A small solid white dot follows the pointer in place of the
     system arrow, blended by difference so it stays visible on the cream
     pages too. Pages with the older bracket cursor keep its tooltips but
     drop the brackets, so the dot is the one cursor everywhere. Not on
     touch screens, which have no pointer to replace. */
  if (!window.matchMedia('(hover: none)').matches) {
    var dotCss =
      'html, html * { cursor: none !important; }' +
      '#site-dot { position: fixed; z-index: 100000; left: 0; top: 0; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%;' +
      ' background: #fff; mix-blend-mode: difference; pointer-events: none; opacity: 0; transition: opacity 0.2s, width 0.15s, height 0.15s, margin 0.15s; }' +
      '#site-dot.down { width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; }' +
      '#cursor-idle { display: none !important; }';
    var dotStyle = document.createElement('style');
    dotStyle.textContent = dotCss;
    document.head.appendChild(dotStyle);
    var dot = document.createElement('div');
    dot.id = 'site-dot';
    document.body.appendChild(dot);
    document.addEventListener('mousemove', function (e) {
      dot.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      dot.style.opacity = '1';
    }, { passive: true });
    document.addEventListener('mouseleave', function () { dot.style.opacity = '0'; });
    document.addEventListener('mousedown', function () { dot.classList.add('down'); });
    document.addEventListener('mouseup', function () { dot.classList.remove('down'); });
  }

  var line = document.createElement('p');
  line.id = 'site-line';
  line.innerHTML =
    '<span>&copy; ' + YEAR + ' <a href="/">Yam Livnat</a></span>' +
    '<span>all work shown is my own &middot; designed and built by hand</span>';
  document.body.appendChild(line);
})();
