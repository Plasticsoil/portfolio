/* ══════════════════════════════════════════════════════════════
   SECONDARY FOOTER — the compact one, used on every sub-page.

   The home page keeps its full contact section (About, bio, resume,
   the big "Get in touch" CTA). Repeating all of that at the bottom
   of Work, Tools and Shop would blunt it, so those pages close with
   this instead: name, the ways to reach you, back to top, and the
   same accent strip the site already ends on.

   Markup only — every class is styled in shared/pages.css, using
   the palette and type variables that already exist in site.css.
════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var EMAIL = 'yamlivnat95@gmail.com';
  var PHONE = '+972528229418';
  var PHONE_LABEL = '+972-52-822-9418';

  /* The pill-button markup the contact section already uses, so these
     inherit the site's gradient hover glow with no new CSS. */
  function btn(href, label, tooltip, external) {
    return '<a class="contact-btn" href="' + href + '"' +
           (external ? ' target="_blank" rel="noopener"' : '') +
           ' data-cursor-tooltip="' + tooltip + '">' +
           '<span class="btn-label">' + label + '</span></a>';
  }

  /* The home page already ends with the full contact section, so it sets
     window.SITE_FOOTER_SKIP_CONTACT and this footer drops its own email
     and phone column — the visitor gets the wayfinding and the back-to-top
     without being handed the same two links twice on one screen. */
  var skipContact = !!window.SITE_FOOTER_SKIP_CONTACT;

  /* Only claim id="contact" where nothing else does. On the home page the
     contact section owns it, and two elements sharing an id would break
     the navbar's "Get in touch" anchor. */
  var id = skipContact ? '' : ' id="contact"';

  /* The page closes on one large line, the way a case study closes on
     "Back to top" — a piece of display type you land on, rather than a
     grid of columns to read. The links sit under it as a quiet row. */
  var HTML =
    '<footer class="foot2"' + id + '>' +

      '<div class="foot2-cta">' +
        '<a class="foot2-big" href="mailto:' + EMAIL + '"' +
           ' data-cursor-tooltip="mailto // ' + EMAIL + '">Get in touch</a>' +
        '<p class="foot2-sub">Let’s create something meaningful together</p>' +
      '</div>' +

      '<div class="foot2-row">' +
        (skipContact ? '' :
          btn('mailto:' + EMAIL, 'Email', 'mailto // ' + EMAIL) +
          btn('tel:' + PHONE, 'Phone', 'tel // ' + PHONE_LABEL)) +
        btn('https://www.linkedin.com/in/yam-livnat-baa9242a6', 'LinkedIn',
            'https // linkedin.com / in / yam-livnat', true) +
        btn('https://www.behance.net/yamlivnat', 'Behance',
            'https // behance.net / yamlivnat', true) +
        btn('/cv', 'Resume', '/ yamlivnat-resume.pdf', true) +
      '</div>' +

      '<div class="foot2-legal">' +
        '<span>© ' + new Date().getFullYear() + ' Yam Livnat</span>' +
        '<a class="foot2-top" href="#top">Back to top</a>' +
      '</div>' +

      '<div class="foot2-strip" aria-hidden="true"></div>' +
    '</footer>';

  function init() {
    document.body.insertAdjacentHTML('beforeend', HTML);

    var top = document.querySelector('.foot2-top');
    if (top) {
      top.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
