/* ══════════════════════════════════════════════════════════════
   THE LINE — one quiet line at the very bottom of every page.

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

  var line = document.createElement('p');
  line.id = 'site-line';
  line.innerHTML =
    '<span>&copy; ' + YEAR + ' <a href="/">Yam Livnat</a></span>' +
    '<span>all work shown is my own &middot; designed and built by hand</span>';
  document.body.appendChild(line);
})();
