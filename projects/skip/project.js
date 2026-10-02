/* Skip — a collection of stone sculptures, carved and shown live in the
   browser. Lives at /skip as its own page; the card links out instead of
   opening an in-page case study. */
window.__PROJECTS__['skip'] = {
  id: 'skip',
  title: 'Skip',
  tags: ['Vibecoding', '3D', 'Experimental'],
  overlayTags: ['Vibecoding', '3D', 'Experimental'],

  // Static thumbnail: the winged horse on black.
  thumbnail: 'projects/skip/assets/thumb.png',

  // Clicking the card navigates to the page where it lives
  link: '/skip/',
  linkBg: '#000000',          // grow-to-fullscreen transition colour (matches /skip)
  // Hover cursor hint (instead of the default "See More")
  cursorTooltip: 'Visit',
  // Dark card → render the cursor tooltip in white so it's visible
  cursorLight: true
};
