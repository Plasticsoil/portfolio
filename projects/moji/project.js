/* moji — vibecoded daily emoji-cryptic game. Lives at /moji as its own
   page; the card links out instead of opening an in-page case study. */
window.__PROJECTS__['moji'] = {
  id: 'moji',
  title: 'moji',
  tags: ['Vibecoding', 'Experimental'],
  overlayTags: ['Vibecoding', 'Experimental'],

  // Interactive thumbnail (built in buildCard): "Read between the [EMOJI]" with
  // emoji stickers; on hover they slide to the edges and the EMOJI cells cascade green.
  mojiThumb: true,

  // Clicking the card navigates to the page where it lives
  link: '/moji/',
  linkBg: '#F8F6F3',          // grow-to-fullscreen transition colour (matches /moji)
  // Hover cursor hint (instead of the default "See More")
  cursorTooltip: 'Visit'
};
