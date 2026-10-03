// The collection. Each piece is a set of strokes: [x, y, z, radius] control
// points that a spline runs through. Edit the numbers, reload, and the piece
// is re-carved. Units are arbitrary; a piece is roughly 2-7 units across.
//
// `blend` is how softly a stroke melts into what is already there. A large
// value fuses two strokes into one mass; a tiny one leaves a visible seam, as
// between two stones pressed together.

// --- the logo ------------------------------------------------------------------
// Positions are pixels on 01_Reference/SKIP_ref_07_logo-target.webp
// (1264 x 619), converted here: [x, y, depth, radius]. The numbers were fitted
// to the silhouette of that render by 03_Tools/fit-logo.py; re-run it after
// changing the reference or adding strokes.
const px = (x, y, z, r) => [(x - 632) / 180, (310 - y) / 180, z, r / 180];
// Boulders meet in a seam rather than melting together.
const SEAM = 0.035;

const logo = {
  id: 'logo-coded', title: 'Skip, built in code',
  lump: 0.05,
  strokes: [
    // S — one continuous stroke, ending in the curled tail at lower left
    { pts: [
      px(410, 187.5, 0.03, 71.5),
      px(338.5, 164, 0.03, 62.5),
      px(227.5, 183.5, 0.03, 44),
      px(208.5, 271, 0.03, 58.5),
      px(259, 328, 0.03, 44),
      px(343.5, 391, 0.03, 79.5),
      px(291, 459.5, 0.03, 50),
      px(226, 485, 0.03, 41),
      px(200, 495.5, 0.03, 38),
      px(131.5, 466, 0.03, 62),
      px(118.5, 433.5, 0.03, 52),
    ] },
    { blend: SEAM, pts: [px(568, 134, 0.06, 52), px(490.5, 212, 0.06, 57.5)] }, // top of the K
    { blend: SEAM, pts: [px(469, 357, 0.1, 57), px(529.5, 327, 0.1, 80.5)] }, // boulder at the S / K joint
    { blend: SEAM, pts: [px(385, 473, 0.02, 78), px(403.5, 451, 0.02, 76)] }, // low boulder tucked under the S
    { blend: SEAM, pts: [px(621.5, 277.5, 0.07, 34), px(727.5, 201, 0.07, 68)] }, // K arm, the long diagonal club
    { blend: SEAM, pts: [px(821.5, 178.5, 0, 48), px(869.5, 150.5, 0, 51)] }, // small top boulder
    { blend: SEAM, pts: [px(787.5, 283.5, 0.09, 61.5), px(745, 355.5, 0.09, 52)] }, // the I
    { blend: SEAM, pts: [px(608.5, 459.5, 0.04, 60.5), px(600, 456.5, 0.04, 80.5)] }, // bottom row, left
    { blend: SEAM, pts: [px(690.5, 464.5, 0.08, 76), px(736, 451, 0.08, 66)] }, // bottom row, middle
    { blend: SEAM, pts: [px(875.5, 462.5, 0.03, 71.5), px(837.5, 475.5, 0.03, 58.5)] }, // bottom row, right
    { blend: SEAM, pts: [px(913, 362.5, 0.08, 62), px(955, 322, 0.08, 61)] }, // P, the boulder under the bowl
    // P — the bowl, a closed ring around the hole
    { blend: SEAM, closed: true, pts: [
      px(953, 188, 0.03, 55.5),
      px(1023.5, 146, 0.03, 42),
      px(1100, 168, 0.03, 41),
      px(1137.5, 191.5, 0.03, 62.5),
      px(1168.5, 252.5, 0.03, 34),
      px(1117.5, 302, 0.03, 52.5),
      px(1048, 325, 0.03, 34.5),
      px(952, 312, 0.03, 46.5),
      px(952, 249.5, 0.03, 36),
    ] },
  ],
};

// --- studies -------------------------------------------------------------------
// Placeholders: they exist to prove the grid and the material on other kinds
// of form. Replace with the real pieces.
const ring = {
  id: 'ring', title: 'Ring',
  lump: 0.04,
  blend: 0.22,
  strokes: [
    { closed: true, sub: 6, pts: Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2;
      return [Math.cos(a) * 1.25, Math.sin(a) * 1.25, Math.sin(a * 3) * 0.12, i % 2 ? 0.34 : 0.46];
    }) },
  ],
};

const totem = {
  id: 'totem', title: 'Totem',
  lump: 0.04,
  blend: 0.3,
  strokes: [
    { pts: [
      [0, -1.5, 0, 0.62],
      [0.06, -0.8, 0, 0.42],
      [-0.05, -0.2, 0.05, 0.56],
      [0.05, 0.45, 0, 0.36],
      [0, 1.0, 0, 0.48],
      [0, 1.55, 0, 0.3],
    ] },
    { pts: [[-0.3, -0.15, 0.05, 0.3], [-0.95, 0.1, 0.1, 0.3], [-1.2, 0.7, 0.05, 0.26]] },
    { pts: [[0.3, -0.15, 0.05, 0.3], [0.95, 0.1, 0.1, 0.3], [1.2, 0.7, 0.05, 0.26]] },
  ],
};

const arch = {
  id: 'arch', title: 'Arch',
  lump: 0.04,
  strokes: [
    { pts: [[-0.95, -1.1, 0, 0.46], [-1.0, 0.1, 0.05, 0.38], [0, 1.05, 0.1, 0.44], [1.0, 0.1, 0.05, 0.38], [0.95, -1.1, 0, 0.46]] },
  ],
};

const knot = {
  id: 'knot', title: 'Knot',
  lump: 0.04,
  blend: 0.1,
  strokes: [
    { closed: true, sub: 6, pts: Array.from({ length: 10 }, (_, i) => {
      const a = (i / 10) * Math.PI * 2;
      return [Math.sin(a) * 1.4, Math.sin(a * 2) * 0.8, Math.cos(a) * 0.32, 0.3 + 0.05 * Math.cos(a * 2)];
    }) },
  ],
};

const spiral = {
  id: 'spiral', title: 'Spiral',
  lump: 0.04,
  blend: 0.06,
  strokes: [
    { sub: 6, pts: Array.from({ length: 11 }, (_, i) => {
      const a = i * 0.85, R = 0.2 + i * 0.125;
      return [Math.cos(a) * R, Math.sin(a) * R, i * 0.02, 0.2 + i * 0.016];
    }) },
  ],
};

const cairn = {
  id: 'cairn', title: 'Cairn',
  lump: 0.04,
  strokes: [
    [0, -0.9, 0, 0.72], [-0.75, -0.2, 0.1, 0.5], [0.7, -0.1, -0.05, 0.56], [0.05, 0.55, 0.05, 0.5], [0.1, 1.25, 0, 0.34],
  ].map(([x, y, z, r]) => ({ blend: SEAM, pts: [[x - 0.03, y, z, r], [x + 0.03, y, z, r]] })),
};

// --- 01 ---------------------------------------------------------------------
// Three horned heads, one above the other. Geometric: each head is a crescent
// (the horns) with a tapered block set into its middle (the skull), deep from
// front to back. Every head stands a step forward of the one below it, and a
// slanted neck behind ties each to the next.
const horned = (() => {
  const solids = [], STEP_Y = 1.32, STEP_Z = 0.55;
  for (let k = 0; k < 3; k++) {
    const y = (1 - k) * STEP_Y, z = (1 - k) * STEP_Z;   // k = 0 is the top head, furthest forward
    solids.push({ type: 'lune', c: [0, y - 0.38, z], width: 4.1, rise: 1.36, thick: 0.7, hz: 0.42, bevel: 0.12 });
    solids.push({ type: 'box', c: [0, y - 0.4, z + 0.16], half: [0.47, 0.62, 0.5], taper: 0.62, taperZ: 0.7, bevel: 0.11 });
    if (k < 2) solids.push({ type: 'box', c: [0, y - STEP_Y / 2 - 0.35, z - STEP_Z / 2 - 0.2], half: [0.2, 0.75, 0.24], bevel: 0.07 });
  }
  return { id: 'horned', title: 'Horned heads', lump: 0, solids, carve: { facetSize: 0.16, chip: 0.006, grain: 0.002 } };
})();

// --- 02 ---------------------------------------------------------------------
// Ram's head. Soft forms: a skull running forward and down into the muzzle, a
// broad neck, two ears, and two horns that leave the top of the head, sweep out
// and down, and curl into a spiral, thinning as they go.
const ram = (() => {
  const horn = (side) => {
    const pts = [], N = 12;
    for (let i = 0; i <= N; i++) {
      const u = i / N, th = (150 - u * 500) * Math.PI / 180, R = 0.95 - u * 0.72;
      pts.push([side * (1.12 + Math.cos(th) * R), 0.02 + Math.sin(th) * R, -0.2 + u * 0.5, 0.36 - u * 0.2]);
    }
    return { blend: 0.07, sub: 4, pts };
  };
  return {
    id: 'ram', title: 'Ram',
    lump: 0.03,
    blend: 0.14,
    strokes: [
      // skull to muzzle
      { pts: [[0, 0.5, -0.4, 0.6], [0, 0.42, 0.2, 0.58], [0, 0.02, 0.72, 0.43], [0, -0.3, 1.0, 0.33]] },
      // jaw, under the muzzle
      { pts: [[0, -0.35, 0.35, 0.4], [0, -0.5, 0.82, 0.26]] },
      // neck
      { pts: [[0, -0.1, -0.3, 0.62], [0, -0.75, -0.3, 0.68], [0, -1.25, -0.3, 0.8]] },
      horn(1), horn(-1),
      // ears
      { blend: 0.05, pts: [[0.62, 0.12, 0.2, 0.17], [0.95, 0.04, 0.3, 0.14], [1.1, 0.0, 0.34, 0.08]] },
      { blend: 0.05, pts: [[-0.62, 0.12, 0.2, 0.17], [-0.95, 0.04, 0.3, 0.14], [-1.1, 0.0, 0.34, 0.08]] },
      // nose
      { blend: 0.06, pts: [[-0.1, -0.22, 1.2, 0.17], [0.1, -0.22, 1.2, 0.17]] },
    ],
  };
})();

// --- 03 ---------------------------------------------------------------------
// An old jug, fallen on its side, mouth a little lower than its foot. Liquid
// runs out of the mouth and spreads into a small pool on the floor. Built from
// a description, not from a reference image.
const jug = (() => {
  const TILT = -0.16, c = Math.cos(TILT), sn = Math.sin(TILT);
  // a point along the jug's axis, `up` off the axis, `side` toward the viewer
  const at = (along, up, side, r) => [along * c - up * sn, along * sn + up * c, side, r];
  const FLOOR = -0.93;
  const handle = (side) => ({ blend: 0.05, pts: [at(-0.05, 0.1, side * 0.52, 0.09), at(0.25, 0.1, side * 0.74, 0.085), at(0.62, 0.05, side * 0.6, 0.08), at(0.7, 0.0, side * 0.3, 0.085)] });
  return {
    id: 'jug', title: 'Fallen jug',
    lump: 0.025,
    strokes: [
      // the body, foot to lip: one stroke whose radius is the jug's profile
      { sub: 6, pts: [at(-1.45, 0, 0, 0.3), at(-1.3, 0, 0, 0.5), at(-0.75, 0, 0, 0.8), at(-0.2, 0, 0, 0.74), at(0.3, 0, 0, 0.42), at(0.62, 0, 0, 0.25), at(0.85, 0, 0, 0.27), at(0.98, 0, 0, 0.36)] },
      handle(1), handle(-1),
      // the liquid leaving the mouth and falling to the floor
      { blend: 0.1, pts: [at(0.95, -0.12, 0.02, 0.2), [1.3, -0.6, 0.06, 0.17], [1.55, FLOOR + 0.1, 0.1, 0.16]] },
    ],
    solids: [
      { type: 'blob', blend: 0.14, c: [1.95, FLOOR, 0.15], r: [0.85, 0.11, 0.6] },
      { type: 'blob', blend: 0.14, c: [2.5, FLOOR, -0.25], r: [0.42, 0.09, 0.36] },
      { type: 'blob', blend: 0.1, c: [1.35, FLOOR, 0.6], r: [0.3, 0.08, 0.24] },
      { type: 'blob', blend: 0.05, c: [3.1, FLOOR, 0.2], r: [0.13, 0.06, 0.11] },
    ],
  };
})();

// --- 04 ---------------------------------------------------------------------
// Galloping horse, from two views (side and front). Head down and to the left,
// neck arched high, forelegs tucked, one hind leg driving back and the other
// reaching forward under the belly, tail flying. Legs on the near side sit at
// +z, on the far side at -z.
const horse = {
  id: 'horse', title: 'Horse',
  lump: 0.035,
  blend: 0.16,
  strokes: [
    // barrel: chest to rump
    { pts: [[-1.0, 0.25, 0, 0.62], [0.05, 0.3, 0, 0.6], [1.15, 0.35, 0, 0.58]] },
    // neck, arching up from the withers, then the head hanging down
    { pts: [[-0.75, 0.75, 0, 0.46], [-1.36, 1.6, 0, 0.36], [-2.1, 1.3, 0, 0.3], [-2.45, 0.65, 0, 0.26], [-2.62, 0.05, 0, 0.2]] },
    // mane along the crest
    { blend: 0.08, pts: [[-0.8, 1.2, 0, 0.16], [-1.35, 1.95, 0, 0.18], [-2.0, 1.62, 0, 0.14]] },
    // ears
    { blend: 0.04, pts: [[-2.25, 1.4, 0.14, 0.08], [-2.4, 1.7, 0.17, 0.05]] },
    { blend: 0.04, pts: [[-2.25, 1.4, -0.14, 0.08], [-2.4, 1.7, -0.17, 0.05]] },
    // forelegs, both tucked
    { blend: 0.1, pts: [[-1.0, -0.1, 0.3, 0.3], [-1.45, -0.75, 0.32, 0.17], [-0.9, -1.05, 0.3, 0.13], [-0.7, -1.15, 0.3, 0.15]] },
    { blend: 0.1, pts: [[-0.8, -0.2, -0.3, 0.3], [-0.95, -0.9, -0.32, 0.17], [-0.55, -1.05, -0.3, 0.13], [-0.42, -1.1, -0.3, 0.15]] },
    // hind leg driving back
    { blend: 0.12, pts: [[1.3, 0.0, 0.32, 0.4], [1.6, -0.5, 0.34, 0.28], [2.05, -0.95, 0.34, 0.17], [2.4, -1.5, 0.34, 0.13], [2.6, -1.72, 0.34, 0.16]] },
    // hind leg reaching forward
    { blend: 0.12, pts: [[1.0, -0.3, -0.32, 0.38], [0.5, -0.9, -0.34, 0.24], [0.2, -1.15, -0.34, 0.16], [-0.2, -1.6, -0.34, 0.13], [-0.38, -1.8, -0.34, 0.16]] },
    // tail
    { blend: 0.1, pts: [[1.5, 0.75, 0, 0.2], [1.78, 1.25, 0.05, 0.25], [2.3, 1.2, 0.1, 0.3], [2.8, 0.85, 0.12, 0.2]] },
  ],
};

// --- 05, 06, 07 -------------------------------------------------------------
// Three standing jugs, each a different build. A jug is one upright stroke
// whose radius, read from foot to lip, is its profile; handles and spout are
// thin strokes added on.
const profile = (pairs) => pairs.map(([y, r]) => [0, y, 0, r]);

// tall, narrow foot, high shoulder, long neck, two handles
const amphora = {
  id: 'amphora', title: 'Amphora',
  lump: 0.02,
  strokes: [
    { sub: 6, pts: profile([[-1.55, 0.26], [-1.4, 0.3], [-0.65, 0.6], [0.1, 0.8], [0.55, 0.6], [0.85, 0.28], [1.35, 0.24], [1.56, 0.37]]) },
    ...[-1, 1].map((sd) => ({ blend: 0.05, pts: [[sd * 0.22, 1.3, 0, 0.09], [sd * 0.62, 1.32, 0, 0.09], [sd * 0.82, 0.95, 0, 0.09], [sd * 0.62, 0.5, 0, 0.1]] })),
  ],
};

// squat and round, wide mouth, heavy rim, two small lugs
const pot = {
  id: 'pot', title: 'Pot',
  lump: 0.025,
  strokes: [
    { sub: 6, pts: profile([[-0.95, 0.5], [-0.8, 0.72], [-0.2, 1.05], [0.35, 0.96], [0.7, 0.62], [0.86, 0.56], [1.0, 0.7]]) },
    ...[-1, 1].map((sd) => ({ blend: 0.06, pts: [[sd * 0.95, 0.35, 0, 0.12], [sd * 1.22, 0.42, 0, 0.11], [sd * 1.05, 0.62, 0, 0.1]] })),
  ],
};

// slender pitcher: straight body, one big handle, a spout
const ewer = {
  id: 'ewer', title: 'Ewer',
  lump: 0.02,
  strokes: [
    { sub: 6, pts: profile([[-1.5, 0.44], [-1.36, 0.5], [-0.7, 0.58], [0.0, 0.5], [0.6, 0.3], [1.1, 0.26], [1.45, 0.34]]) },
    { blend: 0.05, pts: [[0.24, 1.3, 0, 0.09], [0.72, 1.28, 0, 0.09], [0.86, 0.7, 0, 0.09], [0.62, 0.1, 0, 0.1]] },
    { blend: 0.05, pts: [[-0.22, 1.42, 0, 0.14], [-0.5, 1.6, 0, 0.1]] },
  ],
};

// --- from 3D models -------------------------------------------------------------
// These are not built here. Each one is a model file in 04_Models, carved ahead
// of time into 02_Web/models/<id>.bin by:
//   node 03_Tools/bake-model.mjs 04_Models/<file>.glb <id>
// `real` is the longest side of the thing itself in metres, as it would be in
// the world: a hand is small, a horse is large, a tree larger still. The grid
// sizes the pieces from it (see layout in 05_main.js).
const model01 = { id: 'model-01', title: 'Model 01', baked: 'models/model-01.bin' };
const model02 = { id: 'model-02', title: 'Rayed figure', real: 1.75, baked: 'models/model-02.bin' };
const model03 = { id: 'model-03', title: 'Model 03', baked: 'models/model-03.bin' };
const model04 = { id: 'model-04', title: 'Model 04', baked: 'models/model-04.bin' };
const model05 = { id: 'model-05', title: 'Three bulls', real: 1.5, baked: 'models/model-05.bin' };
const model06 = { id: 'model-06', title: 'Eared figure', real: 1.75, baked: 'models/model-06.bin' };
const model07 = { id: 'model-07', title: 'Big cat', real: 1.8, baked: 'models/model-07.bin' };
const model08 = { id: 'model-08', title: 'Sun', real: 2.6, baked: 'models/model-08.bin' };
const model09 = { id: 'model-09', title: 'Horse', real: 2.4, baked: 'models/model-09.bin' };
const model10 = { id: 'model-10', title: 'Tree', real: 6.0, baked: 'models/model-10.bin' };
const model11 = { id: 'model-11', title: 'Lotus', real: 0.9, baked: 'models/model-11.bin' };
const model12 = { id: 'model-12', title: 'Sphinx', real: 3.5, baked: 'models/model-12.bin' };
const model13 = { id: 'model-13', title: 'Snake', real: 0.6, baked: 'models/model-13.bin' };
const model14 = { id: 'model-14', title: 'Flower', real: 0.45, baked: 'models/model-14.bin' };
const model15 = { id: 'model-15', title: 'Sprout', real: 0.4, baked: 'models/model-15.bin' };
const model16 = { id: 'model-16', title: 'Bull head', real: 0.8, baked: 'models/model-16.bin' };
const model17 = { id: 'model-17', title: 'Mace', real: 0.7, baked: 'models/model-17.bin' };
const model18 = { id: 'model-18', title: 'Axe', real: 0.8, baked: 'models/model-18.bin' };
const model19 = { id: 'model-19', title: 'Beast', real: 1.7, baked: 'models/model-19.bin' };
const model20 = { id: 'model-20', title: 'Idol', real: 1.2, baked: 'models/model-20.bin' };
const model22 = { id: 'model-22', title: 'Moon', real: 2.4, baked: 'models/model-22.bin' };
const model23 = { id: 'model-23', title: 'Loop', real: 0.9, baked: 'models/model-23.bin' };
const model24 = { id: 'model-24', title: 'Winged horse', real: 2.4, baked: 'models/model-24.bin' };
const model25 = { id: 'model-25', title: 'Scarab', real: 0.6, baked: 'models/model-25.bin' };
const model27 = { id: 'model-27', title: 'Amphora', real: 1.1, baked: 'models/model-27.bin' };
// The word at the top of the page is a model too (04_Models/06_sam3d_logo.glb,
// baked with --logo). The version built in code is kept in the archive.
const logoModel = { id: 'logo', title: 'Skip', baked: 'models/logo.bin' };
export const LOGO = logoModel;

// The grid, in order.
export const STUDIES = [model27, model25, model24, model23, model22, model20, model19, model18, model17, model16, model15, model13, model12, model11, model10, model09, model08, model07, model06, model05, model02];
// Archive: built earlier, not shown and not carved. Move one into STUDIES to
// bring it back.
export const ARCHIVE = [model14, model01, model03, model04, amphora, pot, ewer, logo, horse, jug, ram, horned, ring, totem, arch, knot, spiral, cairn];
export const byId = (id) => [LOGO, ...STUDIES, ...ARCHIVE].find((s) => s.id === id);
