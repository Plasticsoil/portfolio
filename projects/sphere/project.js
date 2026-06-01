/* Sphere — vibecoded experiment. Lives at /sphere as its own page;
   the card links out instead of opening an in-page case study. */
window.__PROJECTS__['sphere'] = {
  id: 'sphere',
  title: 'Sphere',
  tags: ['Vibecoding', 'Experimental'],
  overlayTags: ['Vibecoding', 'Experimental'],

  // Live, slowly-rotating, hover-responsive wireframe sphere (see sphere-card.js).
  // The static PNG stays as a fallback poster if WebGL is unavailable.
  liveSphere: true,
  thumbnail: 'projects/sphere/assets/thumb.png',

  // Clicking the card navigates to the page where it lives
  link: '/sphere/',
  linkBg: '#0a0a0a',          // grow-to-fullscreen transition colour (matches /sphere)
  // Hover cursor hint (instead of the default "See More")
  cursorTooltip: 'Visit',
  // Dark card → render the cursor tooltip in white so it's visible
  cursorLight: true
};
