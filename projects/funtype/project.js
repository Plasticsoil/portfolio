/* FunType — interactive kinetic-typography studio (Vite build).
   Lives at /funtype/ as its own page; the card grows into the page on
   click after a gentle password gate (requirePassword). The check is
   client-side only — a soft barrier, not real protection. */
window.__PROJECTS__['funtype'] = {
  id: 'funtype',
  title: 'FunType',
  tags: ['Kinetic Typography', 'Vibecoding'],
  overlayTags: ['Kinetic Typography', 'Vibecoding'],

  // Custom in-page thumbnail (built in buildCard): cream card with serif
  // "FunType" wordmark + small lock indicator.
  funtypeThumb: true,

  // Card opens the built FunType app (Vite output copied to /fun/).
  link: '/fun/',
  linkBg: '#F8F6F3',           // grow-to-fullscreen transition colour (matches FunType bg + site bg)
  cursorTooltip: 'Unlock',

  // Gentle gate — JS prompts for this password before navigating. Once entered
  // correctly, sessionStorage('funtype-ok') keeps the gate open for this tab.
  requirePassword: 'funfunfun'
};
