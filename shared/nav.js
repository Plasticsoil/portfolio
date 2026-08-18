/* ══════════════════════════════════════════════════════════════
   NAVBAR for the sub-pages (/tools, /shop).

   The markup below is copied from index.html's navbar, with the
   in-page anchors (#work, #contact) rewritten to point back home.
   Same SVG wordmarks, same pill, same gradient hover glow — the
   sub-pages get the real navbar, not a lookalike.

   ── This deploy ───────────────────────────────────────────────
   Only /shop ships here. Work points at the home page's #work
   section rather than /work/, and Tools is left out entirely,
   because neither of those pages exists on the live site yet.
   Regenerating this file from index.html will restore both.

   ── Note ──────────────────────────────────────────────────────
   index.html still has its own inline copy of this navbar. That is
   deliberate: rewiring the home page to inject its navbar from here
   would mean touching the one page that must not change right now.
   The cost is that a navbar edit has to be made in both places
   until the sub-pages have real content and it is worth
   consolidating. This file is generated, so regenerating it after
   an index.html nav change is the safe way to keep them in step.
════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var NAV = `  <nav class="navbar">
    <div class="navbar-inner">

      <!-- Logo — scrolls to top on click.
           Was an SVG outline of the wordmark; it is live text now, set in
           the same face as every other nav item (Figma: Nimbus Sans L
           italic 16 / -0.01em / capitalize). -->
      <a class="nav-logo" href="/" aria-label="Yam Livnat — home">
        <span class="nav-title">Yam Livnat</span>
      </a>

      <!-- Links right -->
      <div class="nav-links">
        <a class="nav-link" href="/#work"><span class="nav-title">Work</span></a>
        <a class="nav-link" href="/shop/"><span class="nav-title">Shop</span></a>
        <a class="nav-link" href="#contact"><span class="nav-title">Get In Touch</span></a>
      </div>
    </div>
  </nav>`;

  function init() {
    document.body.insertAdjacentHTML('afterbegin', NAV);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
