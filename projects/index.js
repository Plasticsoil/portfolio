/* ══════════════════════════════════════════════════════════════
   PROJECTS INDEX
   The order of slugs below = the order cards appear in the grid
   on the home page. Each slug must match a folder under /projects.

   Each project.js is loaded via <script> from index.html — it
   pushes itself onto window.__PROJECTS__, keyed by its id.
════════════════════════════════════════════════════════════════ */

window.PROJECTS_ORDER = [
  'shltr',
  'radiant',
  'globe',
  // ── Hidden until built ─────────────────────────────────────────
  // Re-add a slug below to make that project appear on the home grid.
  // 'sourcix',
  // 'achalta',
  // 'h1',
  // 'cinnabun',
  // 'neon',
  // '3d-type-system',
  // 'sculptural-calligraphy',
  // 'madre',
  // 'sunny-side',
  // 'katze-ve-robi',
  // 'greengrocer',
  // 'geula',
  // 'knockings',
  // 'room-2704',
  // 'ae-scripts',
  // 'wiply',
  // 'practitest'
];

// Registry each project.js appends to (don't touch — used by index.html)
window.__PROJECTS__ = window.__PROJECTS__ || {};
