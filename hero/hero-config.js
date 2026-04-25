/* ══════════════════════════════════════════════════════════════
   HERO CONFIG
   Drives the hero ring-cards. Each entry in `cards` becomes one
   ring-card on the hero. Use `model: '*.glb'` for a 3D turntable
   or `image: '*.png'` for a static 2D silhouette. `position` is
   either 'left' or 'right' (mirror of left).
════════════════════════════════════════════════════════════════ */

window.HERO_CONFIG = {
  cards: [
    // Left: SHLTR — 3D GLB turntable
    {
      projectId: 'shltr',
      model: 'projects/shltr/assets/Anthem 3D.glb',
      tooltip: 'See More',
      label: 'SHLTR',
      position: 'left'
    },
    // Right: Radiant — static mascot image
    {
      projectId: 'radiant',
      image: 'projects/radiant/assets/Project cover/Mascot.png',
      tooltip: 'See More',
      label: 'Radiant',
      position: 'right'
    }
  ]
};
