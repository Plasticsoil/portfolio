/* ══════════════════════════════════════════════════════════════
   HERO CONFIG
   Drives the hero ring-cards. Each entry in `cards` becomes one
   ring-card in the hero collage.

   Visual type (pick one):
     model: '*.glb'   → 3D turntable (model-viewer)
     image: '*.png'   → static 2D silhouette
     emoji: '👉'      → emoji silhouette (set sway:true to nudge L↔R)
     sphere: true     → live wireframe sphere (hero/hero-sphere.js)

   Position (pick one):
     position: 'left' | 'right'   → the original mirrored pair
     x, y                         → pixel offset from the hero centre
                                    (tweak these to move an object;
                                     −x = left, −y = up)

   Sizing:
     scale       → emoji size multiplier (1 = 116px glyph)
     sphereOpts  → see hero/hero-sphere.js (lat/lon density, lineWidth,
                   speed, scale = radius vs. the 232×248 stage)
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
    },
    // moji — pointing-hand emoji, sways like the /moji start screen.
    {
      projectId: 'moji',
      emoji: '👉',
      sway: true,
      tooltip: 'See More',
      label: 'moji',
      x: -545, y: -150,
      scale: 0.8
    },
    // sphere — live wireframe sphere: low line density, slightly thicker
    // strokes than the work-card thumbnail, slow auto-rotation.
    {
      projectId: 'sphere',
      sphere: true,
      tooltip: 'See More',
      label: 'Sphere',
      x: 440, y: 170,
      sphereOpts: { lat: 9, lon: 13, lineWidth: 2.2, speed: 0.004, scale: 0.55 }
    }
  ]
};
