// The page: one canvas behind everything. The logo sits in the first screen,
// the other pieces float below it in a loose grid, and scrolling moves the
// camera down past them. Drag turns the piece under the pointer. The light is
// fixed: it never follows the pointer.

import * as THREE from 'three';
import { LOGO, STUDIES } from './02_sculptures.js';
import { createStone, createPoints, createLines, createStroke, createHull, createFill } from './04_stone.js';

// a touch screen: the phone's own word for it, or failing that, touch points and a narrow screen
const coarse = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && Math.min(innerWidth, innerHeight) < 900);

// The material, locked (Yam, 2026-10-02). There is no panel for these any
// more; change a value here and reload. `carve: true` values shape the
// geometry in the worker, the rest are shader uniforms. min / max are the
// sensible range for each.
const SETTINGS = [
  { key: 'cell', label: 'Detail', min: 0.02, max: 0.07, step: 0.002, value: coarse ? 0.04 : 0.02, carve: true, invert: true },
  { key: 'wireEdge', label: 'Wireframe detail', min: 0.12, max: 0.8, step: 0.01, value: 0.36, carve: true, invert: true },
  { key: 'facetSize', label: 'Facet size', min: 0.06, max: 0.5, step: 0.01, value: 0.5, carve: true },
  { key: 'facetDepth', label: 'Facet depth', min: 0, max: 1, step: 0.01, value: 0.34, carve: true },
  { key: 'chip', label: 'Chipping', min: 0, max: 0.05, step: 0.001, value: 0.032, carve: true },
  { key: 'grain', label: 'Grain', min: 0, max: 0.02, step: 0.0005, value: 0.004, carve: true },
  { key: 'uFlat', label: 'Facet crispness', min: 0, max: 1, step: 0.01, value: 0.51 },
  { key: 'uMicro', label: 'Micro relief', min: 0, max: 1, step: 0.01, value: 0.24 },
  { key: 'uMicroScale', label: 'Micro scale', min: 8, max: 90, step: 1, value: 60 },
  { key: 'uPits', label: 'Pores', min: 0, max: 1, step: 0.01, value: 0.68 },
  { key: 'uShadow', label: 'Shadows', min: 0, max: 1, step: 0.01, value: 1 },
  { key: 'uAo', label: 'Occlusion', min: 0, max: 1, step: 0.01, value: 0.72 },
  { key: 'uRim', label: 'Rim light', min: 0, max: 1.5, step: 0.01, value: 0.45 },
  { key: 'uExposure', label: 'Exposure', min: 0.4, max: 2, step: 0.01, value: 0.81 },
];
const state = Object.fromEntries(SETTINGS.map((s) => [s.key, s.value]));
const carveParams = () => Object.fromEntries(SETTINGS.filter((s) => s.carve).map((s) => [s.key, state[s.key]]));

// --- view modes ------------------------------------------------------------------
// Every piece carries three things that can be drawn: its stone surface, its
// skeleton lines, and its particles.
// Changing mode happens everywhere at once, with no direction: over
// TRANSITION seconds the old mode thins out and the new one comes up through
// it, easing in and out.
const MODES = {
  stone: { label: 'Stone' },
  wire: { label: 'Wireframe' },
  points: { label: 'Particles' },
  stroke: { label: 'Stroke' },
};
let mode = 'stone';
let fromMode = 'stone', wipeStart = -1e9;
const TRANSITION = 1.3;
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const LAYER_OF = { stone: 'stone', wire: 'lines', points: 'points', stroke: 'stroke' };
// The skeleton is a soft, see-through white rather than full white.
const WIRE_WHITE = 0.5;
// Stroke look — live-tunable from the widget, then locked to these values.
//   levels:   how many contour lines run over the form (long, connected lines
//             where the surface has turned a set amount from the eye)
//   facet:    how much the chiselled facets bend those lines (0 = smooth)
//   linePx:   their width in pixels
//   hatch:    how dark the hatching in the shade gets (0 = none); gap: how many
//             hatch lines run around the form
//   minAngle: on top of them, mesh creases sharper than this (degrees); 180 = none
//   minChain: a chain of creases must add up to this length or it is a speck
//   outline:  width of the silhouette outline, in pixels
//   white / alpha: the lines' tone; fill: how solid the black fill is
const STROKE = { levels: 0, facet: 0, linePx: 1.7, hatch: 1, gap: 6, minAngle: 102, minChain: 1.5, outline: 1.1, white: 0.62, alpha: 1, fill: 1 };

// Every edge of a mesh, with how sharp a crease it is, its length, and the
// length of the chain of creases it belongs to. Built once per piece; the
// Stroke shader then picks lines by threshold, live.
function buildStrokeGeometry(hi) {
  const P = hi.getAttribute('position').array, I = hi.getIndex().array, nt = I.length / 3;
  // face normals
  const fn = new Float32Array(nt * 3);
  for (let t = 0; t < nt; t++) {
    const a = I[t * 3] * 3, b = I[t * 3 + 1] * 3, c = I[t * 3 + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    fn[t * 3] = nx / l; fn[t * 3 + 1] = ny / l; fn[t * 3 + 2] = nz / l;
  }
  // edges -> the two faces on either side
  const edges = new Map();
  for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) {
    const a = I[t * 3 + k], b = I[t * 3 + (k + 1) % 3];
    const key = a < b ? a * 4294967296 + b : b * 4294967296 + a;
    const e = edges.get(key);
    if (e) e.push(t); else edges.set(key, [t]);
  }
  const n = edges.size, pos = new Float32Array(n * 6), angle = new Float32Array(n * 2), len = new Float32Array(n * 2);
  const va = new Uint32Array(n), vb = new Uint32Array(n);
  let i = 0;
  for (const [key, faces] of edges) {
    const a = Math.floor(key / 4294967296), b = key % 4294967296;
    let deg = 180;
    if (faces.length >= 2) {
      const f = faces[0] * 3, g = faces[1] * 3;
      deg = Math.acos(Math.max(-1, Math.min(1, fn[f] * fn[g] + fn[f + 1] * fn[g + 1] + fn[f + 2] * fn[g + 2]))) * 180 / Math.PI;
    }
    const L = Math.hypot(P[a * 3] - P[b * 3], P[a * 3 + 1] - P[b * 3 + 1], P[a * 3 + 2] - P[b * 3 + 2]);
    pos.set([P[a * 3], P[a * 3 + 1], P[a * 3 + 2], P[b * 3], P[b * 3 + 1], P[b * 3 + 2]], i * 6);
    angle[i * 2] = angle[i * 2 + 1] = deg;
    len[i * 2] = len[i * 2 + 1] = L;
    va[i] = a; vb[i] = b;
    i++;
  }
  // chains: creases (edges over 20 degrees) joined end to end; each edge
  // learns the total length of its chain, so lonely specks can be dropped
  const CREASE = 20, nv = P.length / 3, parent = new Int32Array(nv).map((_, k) => k);
  const find = (v) => { while (parent[v] !== v) { parent[v] = parent[parent[v]]; v = parent[v]; } return v; };
  for (let e = 0; e < n; e++) if (angle[e * 2] >= CREASE) parent[find(va[e])] = find(vb[e]);
  const total = new Float32Array(nv);
  for (let e = 0; e < n; e++) if (angle[e * 2] >= CREASE) total[find(va[e])] += len[e * 2];
  const chain = new Float32Array(n * 2);
  for (let e = 0; e < n; e++) chain[e * 2] = chain[e * 2 + 1] = angle[e * 2] >= CREASE ? total[find(va[e])] : 0;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aAngle', new THREE.BufferAttribute(angle, 1));
  g.setAttribute('aLen', new THREE.BufferAttribute(len, 1));
  g.setAttribute('aChain', new THREE.BufferAttribute(chain, 1));
  // the large form's normals: the mesh normals averaged over the neighbourhood
  // many times, so the chiselled bumps vanish and only the body's turning
  // remains. The Stroke view's lines follow these.
  const N = hi.getAttribute('normal').array;
  const nbr = new Int32Array(n * 2);
  for (let e = 0; e < n; e++) { nbr[e * 2] = va[e]; nbr[e * 2 + 1] = vb[e]; }
  let cur = new Float32Array(N), nxt = new Float32Array(nv * 3);
  for (let it = 0; it < 24; it++) {
    nxt.set(cur);
    for (let e = 0; e < n; e++) {
      const a = nbr[e * 2] * 3, b = nbr[e * 2 + 1] * 3;
      nxt[a] += cur[b]; nxt[a + 1] += cur[b + 1]; nxt[a + 2] += cur[b + 2];
      nxt[b] += cur[a]; nxt[b + 1] += cur[a + 1]; nxt[b + 2] += cur[a + 2];
    }
    for (let v = 0; v < nv * 3; v += 3) {
      const l = Math.hypot(nxt[v], nxt[v + 1], nxt[v + 2]) || 1;
      nxt[v] /= l; nxt[v + 1] /= l; nxt[v + 2] /= l;
    }
    [cur, nxt] = [nxt, cur];
  }
  hi.setAttribute('aSmooth', new THREE.BufferAttribute(cur, 3));
  return g;
}

// --- scene -------------------------------------------------------------------
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setClearColor(0x000000, 1);
const scene = new THREE.Scene();
const FOV = 26;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);

// A deterministic 0..1 number per piece and purpose, so the "loose" in the
// loose grid is the same on every visit.
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

function makeItem(piece, i) {
  const holder = new THREE.Group();   // position in the layout, drift, rotation
  const body = new THREE.Group();     // re-centres the carved geometry
  holder.add(body);
  holder.visible = false;
  scene.add(holder);
  const stone = createStone(), points = createPoints();
  const layers = {
    stone: new THREE.Mesh(undefined, stone),
    points: new THREE.Points(undefined, points),
    // The bare skeleton: white quad outlines of the coarse mesh, nothing
    // filled in, so the far side shows through.
    lines: new THREE.LineSegments(undefined, createLines()),
    // Stroke, in three passes: the outline (the piece inside out, pushed out
    // a few pixels), a black fill of the front over it, and the crease lines
    // on top. The fill hides the far side's lines and the inside of the hull.
    hull: new THREE.Mesh(undefined, createHull()),
    strokeMask: new THREE.Mesh(undefined, createFill()),
    stroke: new THREE.LineSegments(undefined, createStroke()),
  };
  layers.lines.renderOrder = 1;
  layers.points.renderOrder = 2;
  layers.hull.renderOrder = 0;
  layers.strokeMask.renderOrder = 1;
  layers.stroke.renderOrder = 3;
  body.add(...Object.values(layers));
  return {
    piece, holder, body, layers, stone, points,
    size: new THREE.Vector3(1, 1, 1), scale: 1, home: new THREE.Vector3(), drift: 0,
    carved: false, born: 0, reveal: 0, tris: 0, hover: 0,
    turn: { yaw: 0, pitch: 0, vy: 0, vp: 0 },
    // Each piece moves on its own slow clock.
    seed: Array.from({ length: 8 }, (_, k) => rnd(i + 1, k)),
  };
}
const logo = makeItem(LOGO, 0);
const studies = STUDIES.map((p, i) => makeItem(p, i + 1));
// The Mix section at the bottom: one hybrid at a time, grown from three of the
// baked pieces above, shown alone in the middle of its own framed stage. It is
// an ordinary item: same stone, same view modes, same hover.
const MIX_COUNT = 1;
const mixes = Array.from({ length: MIX_COUNT }, (_, i) => makeItem({ id: `mix-${i}`, title: 'Mix' }, 20 + i));
const items = [logo, ...studies, ...mixes];
for (const s of SETTINGS) if (!s.carve) for (const it of items) it.stone.uniforms[s.key].value = s.value;

function applyMode() {
  for (const b of modes.children) b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false');
}
function setMode(m) {
  if (!MODES[m] || m === mode) return;
  fromMode = mode; mode = m; wipeStart = last;
  applyMode();
}

// Particles shown per pixel of surface facing the eye (before the outline boost).
const GRAINS_PER_PX = 0.04;

// --- layout ------------------------------------------------------------------
// World units. The camera distance is chosen so the logo fills the width of
// the first screen; everything below is placed relative to what is visible.
const view = { w: 1, h: 1, scrollSpan: 0 };
// a new order on every visit
const shuffled = studies.map((it) => [Math.random(), it]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
const spec = document.getElementById('spec');
const mixUi = document.getElementById('mix'), viewsUi = document.getElementById('views'), storyUi = document.getElementById('story');
const MIX_CELL = 0.045;
// The stage of the Mix section: a hairline frame and a fainter grid inside it,
// drawn behind the piece. Built one unit square and stretched in layout().
const stage = new THREE.Group();
{
  const lines = (pts, color) => new THREE.LineSegments(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)),
    new THREE.LineBasicMaterial({ color, depthTest: false, depthWrite: false }));
  const grid = [], N = 12, M = 8;
  for (let i = 1; i < N; i++) grid.push(i / N - 0.5, -0.5, 0, i / N - 0.5, 0.5, 0);
  for (let j = 1; j < M; j++) grid.push(-0.5, j / M - 0.5, 0, 0.5, j / M - 0.5, 0);
  stage.add(lines(grid, 0x090909), lines([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, -0.5, -0.5, 0], 0x1d1c1a));
  // drawn first and in the plane of the page (not set back in depth), so the
  // views column and the controls can be lined up with it exactly
  stage.traverse((o) => { o.renderOrder = -1; });
  scene.add(stage);
}
const spacer = document.getElementById('spacer');
function layout() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const wide = camera.aspect >= 1;

  // The logo is small in its frame on purpose: the air around it matters.
  const LOGO_SCALE = 0.65;
  const lw = (logo.carved ? logo.size.x : 6.4) * LOGO_SCALE, lh = (logo.carved ? logo.size.y : 2.8) * LOGO_SCALE;
  const dist = Math.max(lw / (wide ? 0.52 : 0.72) / (2 * TAN * camera.aspect), lh / 0.32 / (2 * TAN));
  view.h = 2 * dist * TAN;
  view.w = view.h * camera.aspect;
  camera.position.z = dist;
  camera.updateProjectionMatrix();

  if (coarse) { layoutMap(w, h); return; }

  // First screen: the logo, with the tops of the first row showing at the
  // bottom edge, as an invitation to scroll.
  const heroH = view.h * (wide ? 0.64 : 0.5);
  const top = view.h / 2;
  logo.scale = LOGO_SCALE;
  logo.drift = lh * 0.05;

  // Below: three columns (two on narrow screens) on an even pitch, with the
  // middle column lifted by a good third of a step, so no two neighbours sit
  // side by side. Nothing is placed outside these columns.
  const cols = wide ? 3 : 2;
  const colW = view.w * (wide ? 0.26 : 0.44), rowH = colW, LIFT = 0.38;
  const rows = Math.ceil(studies.length / cols);
  // The logo sits in the middle of the empty black above the grid: halfway
  // between the top of the screen and the top of the highest piece.
  logo.home.set(0, top - (heroH + rowH * 0.25) / 2, 0);
  // The order in the grid is shuffled afresh on every visit. Size follows what the thing is in the
  // real world: a hand is small, a person is middling, a horse is large, a tree
  // larger still. The true ratios are far too wide to show (a tree is thirty
  // hands), so they are compressed: enough to feel right, never so much that
  // the small pieces disappear.
  const worldSize = (it) => THREE.MathUtils.clamp(((it.piece.real || 1.75) / 1.75) ** 0.4, 0.5, 1.45);
  shuffled.forEach((it, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    it.home.set(
      (col - (cols - 1) / 2) * colW,
      top - heroH - rowH * (row + 0.5 + LIFT) + (col % 2 ? rowH * LIFT : 0),
      0,
    );
    // measured by its longest side in any direction, so a piece that is deep
    // front to back does not come out larger than it should as it turns
    it.scale = colW * 0.46 * worldSize(it) / Math.max(it.size.x, it.size.y, it.size.z);
    it.drift = colW * 0.05;
  });
  // Then the Mix section: a framed stage with a faint grid behind it, set apart
  // from the collection, one mixed piece in its middle, and its controls on a
  // line underneath.
  const mixTop = (rows + LIFT + 0.6) * rowH;             // below the top of the grid, in scene units
  const stageW = Math.min(view.w * (wide ? 0.5 : 0.86), view.h * 0.9), stageH = stageW * (wide ? 0.72 : 1);
  const stageY = top - heroH - mixTop - stageH / 2;
  stage.position.set(0, stageY, 0);
  stage.scale.set(stageW, stageH, 1);
  const mixIt = mixes[0];
  mixIt.home.set(0, stageY, 0);
  mixIt.scale = stageH * 0.56 / Math.max(mixIt.size.x, mixIt.size.y, mixIt.size.z);
  mixIt.drift = stageH * 0.02;
  mixUi.style.top = `${((heroH + mixTop + stageH) / view.h) * h + 18}px`;
  // the four views: a column of squares against the left side of the stage,
  // together exactly as tall as it is
  const stagePx = { w: (stageW / view.h) * h, h: (stageH / view.h) * h, top: ((heroH + mixTop) / view.h) * h };
  const cell = stagePx.h / VIEWS.length;
  viewsUi.style.top = `${stagePx.top}px`;
  viewsUi.style.left = `${w / 2 - stagePx.w / 2 - cell}px`;
  viewsUi.style.width = `${cell}px`;
  viewsUi.style.height = `${stagePx.h}px`;
  viewsUi.hidden = w / 2 - stagePx.w / 2 - cell < 70;      // no room beside the stage on narrow screens
  if (Math.abs(cell - viewsCell) > 1) { viewsCell = cell; drawViews(); }

  const total = heroH + mixTop + stageH + rowH * 0.55;
  view.mixTopPx = ((heroH + mixTop) / view.h) * h;
  view.scrollSpan = Math.max(0, total - view.h);
  spacer.style.height = `${(total / view.h) * 100}vh`;

  // One rule for how crowded the particles look, whatever the piece: the same
  // number of grains per area of screen. A piece that is drawn small, or was
  // carved finely, has its points packed closer together on screen, so a
  // smaller share of them is shown.
  const pxPerUnit = h / view.h;
  for (const it of items) {
    it.points.uniforms.uPx.value = 1.3 * renderer.getPixelRatio();
    const spacing = (it === logo ? 0.02 : it.piece.baked ? 0.03 : MIX_CELL) * it.scale * pxPerUnit;   // screen distance between neighbouring points
    it.points.uniforms.uDensity.value = Math.min(1, GRAINS_PER_PX * spacing * spacing);
  }
}
new ResizeObserver(layout).observe(canvas);

// --- the map (touch screens) --------------------------------------------------
// On a phone the collection is not a page to scroll but a field, wider than
// the screen, that the finger pans in any direction: the logo at the top, the
// pieces under it on a loose grid four across, and the Mix stage at the
// bottom. The page itself does not scroll.
const map = { x: 0, y: 0, vx: 0, vy: 0, halfX: 0, top: 0, bottom: 0, stageY: 0, stageH: 1, dragging: false, lastX: 0, lastY: 0, lastT: 0 };
function layoutMap(w, h) {
  const LOGO_SCALE = 0.65;
  const lw = (logo.carved ? logo.size.x : 6.4) * LOGO_SCALE, lh = (logo.carved ? logo.size.y : 2.8) * LOGO_SCALE;
  // the logo is a screen's width less a margin; the cell of the map is set
  // from that, so the pieces around it come out big
  const dist = Math.max(lw / 0.82 / (2 * TAN * camera.aspect), lh / 0.3 / (2 * TAN));
  view.h = 2 * dist * TAN;
  view.w = view.h * camera.aspect;
  camera.position.z = dist;
  camera.updateProjectionMatrix();
  logo.scale = LOGO_SCALE;
  logo.drift = lh * 0.05;
  logo.home.set(0, 0, 0);

  // The logo at the top, and under it the field of pieces: four to a row,
  // a loose grid wider than the screen. The cell is narrower than the screen,
  // so neighbours always peek in at the sides, the hint that there is more.
  const cell = view.w * 0.55;
  const cols = 4, rows = Math.ceil(studies.length / cols);
  const topY = view.h * 0.5;                        // the top edge of the field
  logo.home.set(0, topY - view.h * 0.3, 0);
  const firstRow = topY - view.h * 0.62 - cell * 0.5;
  const worldSize = (it) => THREE.MathUtils.clamp(((it.piece.real || 1.75) / 1.75) ** 0.4, 0.5, 1.45);
  shuffled.forEach((it, k) => {
    const col = k % cols, row = Math.floor(k / cols);
    // a loose grid: every piece a little off its cell's centre, the same way on every visit
    const jx = (it.seed[6] - 0.5) * cell * 0.3, jy = (it.seed[7] - 0.5) * cell * 0.3;
    it.home.set((col - (cols - 1) / 2) * cell + jx, firstRow - row * cell + jy, 0);
    it.scale = cell * 0.6 * worldSize(it) / Math.max(it.size.x, it.size.y, it.size.z);
    it.drift = cell * 0.04;
  });
  // Under the last row, set apart: the Mix stage, as on the large screen,
  // with its controls on a line beneath it (they follow the stage as the map
  // moves; see the frame loop).
  const stageW = view.w * 0.86, stageH = stageW;
  const stageY = firstRow - (rows - 1) * cell - cell * 0.5 - view.h * 0.12 - stageH / 2;
  stage.position.set(0, stageY, 0);
  stage.scale.set(stageW, stageH, 1);
  const mixIt = mixes[0];
  mixIt.home.set(0, stageY, 0);
  mixIt.scale = stageH * 0.56 / Math.max(mixIt.size.x, mixIt.size.y, mixIt.size.z);
  mixIt.drift = stageH * 0.02;
  map.stageY = stageY; map.stageH = stageH;
  viewsUi.hidden = true;
  mixUi.hidden = false;
  // how far the finger can go: sideways to the outer columns, down past the stage
  map.halfX = (cols - 1) / 2 * cell;
  map.top = 0;
  map.bottom = stageY + stageH / 2 - view.h * 0.38;   // at the end, the stage sits high on the screen
  if (!map.placed) { map.placed = true; map.x = 0; map.y = 0; }
  view.mixTopPx = 1e9;
  view.scrollSpan = 0;
  spacer.style.height = '100vh';
  const pxPerUnit = h / view.h;
  for (const it of items) {
    it.points.uniforms.uPx.value = 1.3 * renderer.getPixelRatio();
    const spacing = (it === logo ? 0.02 : it.piece.baked ? 0.03 : MIX_CELL) * it.scale * pxPerUnit;
    it.points.uniforms.uDensity.value = Math.min(1, GRAINS_PER_PX * spacing * spacing);
  }
}
if (coarse) {
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', (e) => {
    map.dragging = true; map.vx = map.vy = 0;
    map.lastX = e.clientX; map.lastY = e.clientY; map.lastT = performance.now();
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!map.dragging) return;
    const k = view.h / canvas.clientHeight;          // scene units per pixel
    const dx = (e.clientX - map.lastX) * k, dy = (e.clientY - map.lastY) * k;
    const now = performance.now(), dt = Math.max(1, now - map.lastT) / 1000;
    map.x -= dx; map.y += dy;
    // the glide speed, smoothed over the last few moves and capped
    const cap = view.w * 3;
    map.vx = THREE.MathUtils.clamp(map.vx * 0.5 - dx / dt * 0.5, -cap, cap);
    map.vy = THREE.MathUtils.clamp(map.vy * 0.5 + dy / dt * 0.5, -cap, cap);
    map.lastX = e.clientX; map.lastY = e.clientY; map.lastT = now;
  });
  const up = () => { map.dragging = false; };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
}

// --- carving -----------------------------------------------------------------
// One piece at a time, logo first. Changing a carve setting starts the queue
// again from the top.
const worker = new Worker(new URL('./03_carve.worker.js', import.meta.url), { type: 'module' });
const status = document.getElementById('status');
let job = 0, queue = [], carveMs = 0, prepared = false;

// Two passes: a quick rough carving of everything so the page is never empty,
// then the full detail, piece by piece.
function carveAll() {
  const coded = items.filter((it) => it.piece.strokes || it.piece.solids);
  queue = [...coded.map((it) => [it, true]), ...coded.map((it) => [it, false])];
  carveMs = 0;
  next();
}
function next() {
  const entry = queue.shift();
  if (!entry) return;
  const [it, rough] = entry;
  job++;
  const params = carveParams();
  // The pieces in the grid are drawn small, so they are carved a step coarser
  // and their wireframe is built from far fewer, larger triangles.
  if (it !== logo) { params.cell *= 1.5; params.wireEdge *= 1.6; }
  if (rough) params.cell = Math.max(params.cell, 0.055);
  worker.postMessage({ job, id: it.piece.id, params });
}
worker.onmessage = (e) => {
  const m = e.data;
  if (m.kind === 'mix') { mixArrived(m); return; }
  if (m.job !== job) return;
  install(items.find((it) => it.piece.id === m.id), m);
  carveMs += m.ms;
  status.hidden = true;
  next();
};
worker.onerror = (e) => { status.hidden = false; status.textContent = 'Could not carve: ' + e.message; };

// Pieces that came from a 3D model were carved ahead of time by
// 03_Tools/bake-model.mjs. Their file is the same data the worker returns,
// packed small: a length, a JSON header, then the arrays.
async function loadBaked(it, fetched) {
  const buf = await (fetched || fetch(it.piece.baked).then((r) => r.arrayBuffer()));
  const headLen = new DataView(buf).getUint32(0, true);
  const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, headLen)));
  const TYPES = { Float32Array, Uint32Array, Uint16Array, Int8Array, Uint8Array };
  const part = (name) => { const p = head.parts[name]; return new TYPES[p.type](buf, 4 + headLen + p.offset, p.length); };
  install(it, {
    position: part('position'), normal: part('normal'), ao: part('ao'), shadeP: part('shadeP'), shadeN: part('shadeN'),
    index: part('index'), low: { position: part('wirePosition'), edges: part('wireEdges') },
    min: head.min, max: head.max, packed: true,
  });
}

function install(it, m) {
  const hi = new THREE.BufferGeometry();
  // Baked files store normals and shading as bytes; `packed` tells three.js
  // to read them back as -1..1 and 0..1.
  hi.setAttribute('position', new THREE.BufferAttribute(m.position, 3));
  hi.setAttribute('normal', new THREE.BufferAttribute(m.normal, 3, !!m.packed));
  hi.setAttribute('ao', new THREE.BufferAttribute(m.ao, 1, !!m.packed));
  hi.setAttribute('shadeP', new THREE.BufferAttribute(m.shadeP, 3, !!m.packed));
  hi.setAttribute('shadeN', new THREE.BufferAttribute(m.shadeN, 3, !!m.packed));
  hi.setIndex(new THREE.BufferAttribute(m.index, 1));
  const lines = new THREE.BufferGeometry()
    .setAttribute('position', new THREE.BufferAttribute(m.low.position, 3))
    .setIndex(new THREE.BufferAttribute(m.low.edges, 1));

  const L = it.layers;
  for (const obj of [L.stone, L.lines, L.stroke]) obj.geometry?.dispose();
  L.stone.geometry = L.points.geometry = L.strokeMask.geometry = L.hull.geometry = hi;
  L.lines.geometry = lines;
  // Every edge of the finished mesh, with its crease angle and chain length;
  // the Stroke shader chooses among them live.
  L.stroke.geometry = buildStrokeGeometry(hi);
  applyStroke();

  const min = new THREE.Vector3().fromArray(m.min), max = new THREE.Vector3().fromArray(m.max);
  it.body.position.copy(min).add(max).multiplyScalar(-0.5);
  it.size.copy(max).sub(min);
  it.tris = m.index.length / 3;
  if (!it.carved) it.born = performance.now();
  it.carved = true;
  it.holder.visible = true;
  layout();
  // Prepare every view mode once, with the first piece. Otherwise the first
  // switch to a mode stalls for a moment while it is prepared, and its
  // transition seems to jump. (All pieces share the same shaders.)
  if (!prepared) {
    prepared = true;
    const shown = Object.values(L).map((obj) => obj.visible);
    for (const obj of Object.values(L)) obj.visible = true;
    renderer.compile(scene, camera);
    Object.values(L).forEach((obj, i) => { obj.visible = shown[i]; });
  }
}

// --- mix ------------------------------------------------------------------------
// Mix draws three new pieces: one gives the bottom, one the middle, one the
// top (see mixPiece in the worker for how they are fitted together). Cut
// slides the two joins up or down; Melt widens the bands in which one piece
// runs into the next.
const mixCut = document.getElementById('mix-cut'), mixMelt = document.getElementById('mix-melt');

// The three views beside the stage: the mixed piece seen from above, from the
// side, and from a three-quarter angle, each as a flat grey shape in its own
// frame. Clicking one turns the piece on the stage to that view and holds it
// there; clicking it again, or Mix, lets it turn freely again.
const VIEWS = [
  { name: 'Top', yaw: 0, pitch: Math.PI / 2 },
  { name: 'Side', yaw: -Math.PI / 2, pitch: 0 },
  { name: 'Angle', yaw: -Math.PI / 4, pitch: 0.6 },
];
let held_view = -1, viewsCell = 0;
VIEWS.forEach((v, i) => {
  const b = document.createElement('button');
  b.title = v.name;
  b.setAttribute('aria-label', `${v.name} view`);
  b.append(document.createElement('canvas'));
  b.addEventListener('click', () => { held_view = held_view === i ? -1 : i; markView(); });
  viewsUi.append(b);
});
function markView() {
  [...viewsUi.children].forEach((b, i) => b.setAttribute('aria-pressed', i === held_view ? 'true' : 'false'));
  mixes[0].lock = held_view < 0 ? null : VIEWS[held_view];
}
// The thumbnails are drawn cheaply: every vertex of the piece, turned to the
// view, becomes a small grey square. (Filling all the triangles on a 2D canvas
// was slow enough to make the whole page stutter.)
function drawViews() {
  const geo = mixes[0].layers.stone.geometry, pos = geo.getAttribute('position');
  if (!pos || viewsUi.hidden) return;
  const P = pos.array, off = mixes[0].body.position, size = mixes[0].size;
  const dpr = Math.min(devicePixelRatio, 2), px = Math.round(viewsUi.clientWidth * dpr);
  if (px < 8) return;
  const sc = (px * 0.5) / Math.max(size.x, size.y, size.z);        // one scale for all, small in its frame
  const dot = Math.max(1, Math.ceil(MIX_CELL * sc * 0.8));
  [...viewsUi.children].forEach((b, n) => {
    const c = b.firstChild, g = c.getContext('2d'), v = VIEWS[n];
    const cy = Math.cos(v.yaw), sy = Math.sin(v.yaw), cp = Math.cos(v.pitch), sp = Math.sin(v.pitch);
    c.width = c.height = px;
    const img = g.createImageData(px, px), d = img.data;
    for (let i = 0; i < P.length; i += 3) {
      const x = P[i] + off.x, y = P[i + 1] + off.y, z = P[i + 2] + off.z;
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y1 = y * cp - z1 * sp;
      const u = Math.round(px / 2 + x1 * sc), w = Math.round(px / 2 - y1 * sc);
      for (let dy = -dot; dy <= dot; dy++) for (let dx = -dot; dx <= dot; dx++) {
        const X = u + dx, Y = w + dy;
        if (X < 0 || Y < 0 || X >= px || Y >= px) continue;
        const q = (X + Y * px) * 4;
        d[q] = d[q + 1] = d[q + 2] = 107; d[q + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  });
}
const fieldIds = [];
const MIX_DIRS = [[0, 1, 0], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];
let mixSeed = 1, mixGen = 0, mixPending = [], mixBusy = false, mixTimer = 0, mixFresh = true;

function recipeFor(slot) {
  const r = (k) => rnd(mixSeed * 7.3 + slot * 3.1, k);
  // three different pieces, drawn without repeats
  const pool = [...fieldIds], pick = [];
  for (let k = 0; k < 3; k++) pick.push(pool.splice(Math.floor(r(k + 1) * pool.length), 1)[0]);
  return {
    a: pick[0], b: pick[1], c: pick[2],     // one end, middle, other end
    // Each piece is cut along a direction of its own, drawn at random from its
    // six main directions (up, down, left, right, front, back; up counts twice).
    // Cuts at any odd angle were tried and gave shapeless lumps: along a main
    // direction a cut still takes a readable part, a head, a flank, a front.
    dirs: [0, 1, 2].map((k) => MIX_DIRS[Math.floor(r(10 + k) * MIX_DIRS.length)]),
    cut: +mixCut.value,
    melt: +mixMelt.value,
  };
}
function remix() {
  if (fieldIds.length < 3) return;
  mixGen++;
  mixPending = mixes.map((_, slot) => slot);
  if (!mixBusy) mixNext();
}
function mixNext() {
  const slot = mixPending.shift();
  if (slot === undefined) { mixBusy = false; return; }
  mixBusy = true;
  const recipe = recipeFor(slot);
  const title = (id) => items.find((it) => it.piece.id === id).piece.title;
  mixes[slot].piece.title = `${title(recipe.a)} x ${title(recipe.b)} x ${title(recipe.c)}`;
  // the readout in the corner of the stage: what went in, cut along which axis
  const axis = (d) => (d[0] ? (d[0] > 0 ? '+x' : '-x') : d[1] ? (d[1] > 0 ? '+y' : '-y') : d[2] > 0 ? '+z' : '-z');
  const row = (tag, id, d) => `<i>${tag}</i><span>${title(id).toLowerCase()}</span><span>${id}</span><span>${axis(d)}</span>`;
  spec.innerHTML = `<b>mix ${String(mixSeed).padStart(4, '0')}</b>`
    + row('a', recipe.a, recipe.dirs[0]) + row('b', recipe.b, recipe.dirs[1]) + row('c', recipe.c, recipe.dirs[2])
    + `<b>cut ${recipe.cut >= 0 ? '+' : ''}${recipe.cut.toFixed(2)} &nbsp; melt ${recipe.melt.toFixed(2)} &nbsp; cell ${MIX_CELL}</b>`;
  worker.postMessage({ type: 'mix', gen: mixGen, slot, recipe, params: { ...carveParams(), cell: MIX_CELL, wireEdge: 0.44 } });
}
function mixArrived(m) {
  if (m.gen === mixGen) {
    install(mixes[m.slot], m);
    drawViews();
    // A new mix arrives as dust: a loose cloud of grains that settles onto
    // the shape, and the stone then sets through it. Only for a fresh draw
    // (Mix), not while a slider is being dragged.
    if (mixFresh) { mixes[m.slot].arrive = performance.now(); mixFresh = false; }
  }
  mixNext();
}
document.getElementById('mix-go').addEventListener('click', () => { mixSeed++; held_view = -1; markView(); mixFresh = true; remix(); });
for (const el of [mixCut, mixMelt]) el.addEventListener('input', () => { clearTimeout(mixTimer); mixTimer = setTimeout(remix, 180); });

// The small distance fields of the baked pieces, fetched once everything
// above is on screen, then the first mixes are grown.
async function loadFields() {
  for (const it of studies) {
    if (!it.piece.baked) continue;
    const res = await fetch(it.piece.baked.replace('.bin', '.field.bin'));
    if (!res.ok) continue;
    const data = new Int8Array(await res.arrayBuffer());
    await wait(40);
    worker.postMessage({ type: 'field', id: it.piece.id, data }, [data.buffer]);
    fieldIds.push(it.piece.id);
  }
  remix();
}

// --- interaction ---------------------------------------------------------------
const v3 = new THREE.Vector3();
let held = null, lastX = 0, lastY = 0;
// Hover: the piece under the pointer swells a little and its name follows the
// pointer. The logo can be dragged but has no label.
let hovered = null, pointerX = -1, pointerY = -1;
const tip = document.getElementById('tip');
// In wireframe view the hovered piece also gets a transform box, like a
// selection in a design tool: a hairline rectangle around it with handles.
const box = document.getElementById('box');
const corner = new THREE.Vector3();
const HOVER_BUMP = 0.15;
const ARRIVE_MS = 1500;
// The pointer as a magnet for the particles: the line from the eye through
// the pointer, eased so the grains follow smoothly, and how strongly it acts.
const rayDir = new THREE.Vector3(0, 0, -1), rayTo = new THREE.Vector3();
let magnet = 0;

// The piece under the pointer, judged by its centre and size on screen.
function pick(x, y) {
  let best = null, bestD = Infinity;
  for (const it of items) {
    if (!it.carved) continue;
    v3.copy(it.holder.position).project(camera);
    const sx = (v3.x * 0.5 + 0.5) * innerWidth, sy = (-v3.y * 0.5 + 0.5) * innerHeight;
    const pxPerUnit = innerHeight / view.h;
    const rx = it.size.x * it.scale * pxPerUnit * 0.55, ry = it.size.y * it.scale * pxPerUnit * 0.6;
    const d = ((x - sx) / rx) ** 2 + ((y - sy) / ry) ** 2;
    if (d < 1 && d < bestD) { best = it; bestD = d; }
  }
  return best;
}
// On a phone there is no pointer to hover with, so the piece nearest the
// middle of the screen plays the hovered one as the page scrolls: it gets the
// bump and its name, written under it. Only a piece near the middle counts.
const centred = { x: 0, y: 0, ry: 0 };
function pickCentre() {
  let best = null, bestD = Infinity;
  const cx = innerWidth / 2, cy = innerHeight * 0.42;
  for (const it of items) {
    if (!it.carved || it === logo) continue;
    v3.copy(it.holder.position).project(camera);
    const sx = (v3.x * 0.5 + 0.5) * innerWidth, sy = (-v3.y * 0.5 + 0.5) * innerHeight;
    const d = Math.hypot(sx - cx, (sy - cy) * 1.6);
    if (d < innerHeight * 0.3 && d < bestD) {
      best = it; bestD = d;
      centred.x = sx; centred.y = sy;
      centred.ry = it.size.y * it.scale * (innerHeight / view.h) * 0.6;
    }
  }
  return best;
}
canvas.addEventListener('pointerdown', (e) => {
  if (coarse) return;                         // on the map the finger pans, nothing is grabbed
  held = pick(e.clientX, e.clientY);
  if (!held) return;
  // in the Particles view a click is a shape-shift: the dust rushes into the
  // point under the pointer, churns, and bursts back out into the piece
  if (mode === 'points' && performance.now() - wipeStart > TRANSITION * 1000 && !held.shift) {
    held.shift = performance.now();
    held.points.uniforms.uShuffle.value = Math.random() * 100;
    // the point under the pointer, at the depth of the piece
    v3.set((e.clientX / innerWidth) * 2 - 1, 1 - (e.clientY / innerHeight) * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    const t = (held.holder.position.z - camera.position.z) / v3.z;
    held.points.uniforms.uGatherPoint.value.copy(camera.position).addScaledVector(v3, t);
  }
  canvas.setPointerCapture(e.pointerId);
  lastX = e.clientX; lastY = e.clientY;
});
canvas.addEventListener('pointermove', (e) => {
  pointerX = e.clientX; pointerY = e.clientY;
  if (!held) return;
  const k = 4.2 / Math.min(innerWidth, innerHeight);
  held.turn.vy = (e.clientX - lastX) * k; held.turn.vp = (e.clientY - lastY) * k;
  held.turn.yaw += held.turn.vy; held.turn.pitch += held.turn.vp;
  lastX = e.clientX; lastY = e.clientY;
});
const release = () => { held = null; };
canvas.addEventListener('pointerleave', () => { pointerX = pointerY = -1; });
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);

// --- view mode toggle ----------------------------------------------------------
const modes = document.getElementById('modes');
Object.entries(MODES).forEach(([key, m], i) => {
  const b = document.createElement('button');
  b.dataset.mode = key;
  b.textContent = m.label;
  b.title = `${m.label} (${i + 1})`;
  b.addEventListener('click', () => setMode(key));
  modes.append(b);
});
addEventListener('keydown', (e) => {
  if (e.target.matches && e.target.matches('input')) return;
  const keys = Object.keys(MODES);
  if (e.key === ' ') {                       // space: the next mode, in order, round and round
    e.preventDefault();
    setMode(keys[(keys.indexOf(mode) + 1) % keys.length]);
  } else if (keys[+e.key - 1]) setMode(keys[+e.key - 1]);
});
applyMode();

// The Stroke look is locked in STROKE; this pushes it into every piece's shaders.
function applyStroke() {
  for (const it of items) {
    const u = it.layers.stroke.material.uniforms, f = it.layers.strokeMask.material.uniforms;
    u.uMinAngle.value = STROKE.minAngle; u.uMinChain.value = STROKE.minChain;
    f.uLevels.value = STROKE.levels; f.uFacet.value = STROKE.facet; f.uLinePx.value = STROKE.linePx;
    f.uHatch.value = STROKE.hatch; f.uGap.value = STROKE.gap;
    it.layers.hull.material.uniforms.uPx.value = STROKE.outline;
  }
}

// --- loop ----------------------------------------------------------------------
const m4 = new THREE.Matrix4();
let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = now / 1000;

  // The tags and the story step aside once the Mix stage is well into view.
  if (!coarse) {
    const away = scrollY + innerHeight * 0.72 > view.mixTopPx;
    modes.classList.toggle('away', away);
    storyUi.classList.toggle('away', away);
  }

  if (coarse) {
    // the finger pans the map; let go and it glides to a stop, and it cannot
    // leave the field
    if (!map.dragging) {
      map.x += map.vx * dt; map.y += map.vy * dt;
      const damp = Math.exp(-dt * 5);
      map.vx *= damp; map.vy *= damp;
    }
    map.x = THREE.MathUtils.clamp(map.x, -map.halfX, map.halfX);
    map.y = THREE.MathUtils.clamp(map.y, map.bottom, map.top);
    camera.position.x = map.x;
    camera.position.y = map.y;
    // the Mix controls hang under the stage wherever it is on screen
    const stageBottom = (0.5 - (map.stageY - map.stageH / 2 - map.y) / view.h) * innerHeight;
    mixUi.style.top = `${stageBottom + 18}px`;
    mixUi.style.visibility = stageBottom < innerHeight + 60 && stageBottom > -60 ? '' : 'hidden';
    // the words and the story step aside once the stage is well into view
    const stageTop = (0.5 - (map.stageY + map.stageH / 2 - map.y) / view.h) * innerHeight;
    modes.classList.toggle('away', stageTop < innerHeight * 0.55);
    storyUi.classList.toggle('away', stageTop < innerHeight * 0.55);
  } else {
    // Scrolling moves the camera down the page.
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    camera.position.y = maxScroll > 0 ? -(scrollY / maxScroll) * view.scrollSpan : 0;
  }

  const turn = Math.max(0, Math.min(1, (now - wipeStart) / 1000 / TRANSITION)), wiping = turn < 1;
  const mix = wiping ? ease(turn) : 1;
  const old = wiping ? fromMode : mode;

  // The readout sits just inside the top right corner of the Mix stage.
  v3.set(stage.scale.x / 2, stage.position.y + stage.scale.y / 2, 0).project(camera);
  const sx = (v3.x * 0.5 + 0.5) * innerWidth, sy = (-v3.y * 0.5 + 0.5) * innerHeight;
  spec.style.right = `${innerWidth - sx + 10}px`;
  spec.style.top = `${sy + 8}px`;
  spec.hidden = !spec.textContent || sy > innerHeight + 40 || sy < -200;

  // What is under the pointer is worked out every frame, so it stays right
  // while the page scrolls or the pieces drift under a still pointer.
  hovered = held || (coarse ? pickCentre() : pointerX >= 0 ? pick(pointerX, pointerY) : null);
  canvas.style.cursor = held ? 'grabbing' : hovered ? 'grab' : '';
  const label = hovered && hovered !== logo && !held ? hovered.piece.title : '';
  tip.hidden = !label;
  if (label) {
    tip.textContent = label;
    if (coarse) tip.style.transform = `translate(calc(${centred.x}px - 50%), ${centred.y + centred.ry + 10}px)`;
    else tip.style.transform = `translate(${pointerX + 14}px, ${pointerY + 14}px)`;
  }

  const present = pointerX >= 0 && !coarse;
  if (present) {
    rayTo.set((pointerX / innerWidth) * 2 - 1, 1 - (pointerY / innerHeight) * 2, 0.5).unproject(camera).sub(camera.position).normalize();
    rayDir.lerp(rayTo, 1 - Math.exp(-dt * 9)).normalize();
  }
  magnet += ((present ? 1 : 0) - magnet) * (1 - Math.exp(-dt * 5));

  for (const it of items) {
    if (!it.carved) continue;
    const s = it.seed, tr = it.turn, isLogo = it === logo;
    it.points.uniforms.uRayDir.value.copy(rayDir);
    it.points.uniforms.uMagnet.value = magnet;
    it.points.uniforms.uReach.value = view.h * 0.085;
    it.hover += ((it === hovered && !isLogo ? 1 : 0) - it.hover) * (1 - Math.exp(-dt * 12));
    it.holder.scale.setScalar(it.scale * (1 + HOVER_BUMP * it.hover));

    // What the hand did: keeps a little momentum, then eases back to rest.
    if (it !== held) {
      tr.yaw += tr.vy; tr.pitch += tr.vp;
      const damp = Math.exp(-dt * 4);
      tr.vy *= damp; tr.vp *= damp;
      const back = Math.exp(-dt * 0.35);
      tr.yaw *= back; tr.pitch *= back;
    }
    tr.pitch = THREE.MathUtils.clamp(tr.pitch, -1.2, 1.2);

    // Floating: a slow drift, each piece on its own rhythm. The pieces in the
    // grid also turn slowly about themselves, each at its own speed and
    // leaning its own way; the logo only sways, so it stays readable.
    const f = 0.16 + s[3] * 0.14;
    it.holder.position.set(
      it.home.x + Math.sin(t * f * 0.7 + s[4] * 6.28) * it.drift * 0.55,
      it.home.y + (Math.sin(t * f * 1.2 + s[5] * 6.28) + 0.35 * Math.sin(t * f * 2.3 + s[6] * 6.28)) * it.drift,
      0,
    );
    if (it.lock) {
      // held on one of the four views: turn there the short way, quickly
      const cur = it.holder.rotation, e = 1 - Math.exp(-dt * 14);
      const to = it.lock.yaw + tr.yaw, dy = Math.atan2(Math.sin(to - cur.y), Math.cos(to - cur.y));
      it.holder.rotation.set(cur.x + (it.lock.pitch + tr.pitch - cur.x) * e, cur.y + dy * e, cur.z * (1 - e), 'XYZ');
    } else if (isLogo) {
      it.holder.rotation.set(tr.pitch + Math.sin(t * f + s[7] * 6.28) * 0.03, tr.yaw + Math.sin(t * f * 0.9 + s[6] * 6.28) * 0.09, 0);
    } else {
      // All turn the same way, each at its own pace, but not at a steady
      // speed: a piece lingers while its front is toward the viewer and swings
      // quickly through the part of the turn that shows its back. Each starts
      // at a different point of the turn, so at any moment most are showing
      // their front and they are practically never all turned away together.
      const pace = (0.07 + s[3] * 0.09) * 1.7;
      const turnAt = t * pace + (studies.includes(it) ? studies.indexOf(it) / studies.length : s[7]) * 6.2832;
      const facing = turnAt - 0.88 * Math.sin(turnAt);
      it.holder.rotation.set(
        tr.pitch + (s[6] - 0.5) * 0.5 + Math.sin(t * f + s[7] * 6.28) * 0.08,
        tr.yaw + facing,
        (s[5] - 0.5) * 0.4,
        'ZXY',
      );
    }
    it.holder.updateMatrixWorld();

    // Fade in from the moment it was first carved (by the clock, not by frames).
    it.reveal = 1 - Math.exp(-(now - it.born) / 500);
    it.stone.uniforms.uRot.value.setFromMatrix4(m4.extractRotation(it.body.matrixWorld));
    it.points.uniforms.uTime.value = t + s[4] * 40;

    for (const name of ['stone', 'lines', 'points', 'stroke', 'hull', 'strokeMask']) {
      const u = it.layers[name].material.uniforms;
      u.uMix.value = mix;
      u.uShowL.value = LAYER_OF[mode] === name ? 1 : 0;
      u.uShowR.value = LAYER_OF[old] === name ? 1 : 0;
      it.layers[name].visible = u.uShowL.value + u.uShowR.value > 0;
    }
    // the outline and the fill belong to the stroke lines; the hull needs the
    // screen size to keep its width in pixels
    for (const name of ['hull', 'strokeMask']) {
      const u = it.layers[name].material.uniforms;
      u.uShowL.value = it.layers.stroke.material.uniforms.uShowL.value;
      u.uShowR.value = it.layers.stroke.material.uniforms.uShowR.value;
      it.layers[name].visible = it.layers.stroke.visible;
    }
    it.layers.hull.material.uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
    it.layers.hull.material.uniforms.uWhite.value = it.reveal * STROKE.white;
    it.layers.hull.material.uniforms.uAlpha.value = STROKE.alpha;
    it.layers.strokeMask.material.uniforms.uAlpha.value = it.reveal * STROKE.fill;
    it.layers.strokeMask.material.uniforms.uWhite.value = it.reveal * STROKE.white;
    it.layers.strokeMask.material.uniforms.uRot.value.copy(it.stone.uniforms.uRot.value);
    it.stone.uniforms.uReveal.value = it.points.uniforms.uReveal.value = it.reveal;
    // the arrival of a new mix: dust first, settling, then the piece itself
    const arriving = it.arrive ? Math.min(1, (now - it.arrive) / ARRIVE_MS) : 1;
    let scatter = arriving < 1 ? (1 - arriving) ** 2 * 1.6 : 0;
    // the shape-shift, in three beats: gather (0.35s), churn (0.25s), rebuild (0.8s)
    const pu = it.points.uniforms;
    if (it.shift) {
      const ts = (now - it.shift) / 1000;
      const size = Math.max(it.size.x, it.size.y, it.size.z) * it.scale;
      if (ts < 0.35) {
        const g = ts / 0.35;
        pu.uGather.value = g * g * g;
        pu.uShuffleAmt.value = size * 0.08; pu.uPulse.value = 0;
      } else if (ts < 0.6) {
        const c = (ts - 0.35) / 0.25, bump = Math.sin(Math.PI * c);
        pu.uGather.value = 1;
        pu.uShuffleAmt.value = size * (0.08 + 0.22 * bump);
        pu.uPulse.value = 1.2 * bump;
      } else if (ts < 1.4) {
        const u = (ts - 0.6) / 0.8;
        pu.uGather.value = 1 - ease(Math.min(1, u * 2.2));
        pu.uShuffleAmt.value = size * 0.08;
        pu.uPulse.value = 0;
        scatter = Math.max(scatter, 1.2 * (1 - u) ** 2);
      } else {
        it.shift = 0;
        pu.uGather.value = 0; pu.uShuffleAmt.value = 0; pu.uPulse.value = 0;
      }
    }
    pu.uScatter.value = scatter;
    if (arriving < 1 && !wiping) {
      const settle = ease(Math.max(0, (arriving - 0.45) / 0.55));     // the piece sets during the second half
      const L = it.layers, own = LAYER_OF[mode];
      L.points.visible = true;
      L.points.material.uniforms.uShowR.value = 1;
      L.points.material.uniforms.uShowL.value = own === 'points' ? 1 : 0;
      L.points.material.uniforms.uMix.value = settle;
      for (const name of ['stone', 'lines', 'stroke']) {
        const u = L[name].material.uniforms;
        u.uShowR.value = 0; u.uShowL.value = own === name ? 1 : 0; u.uMix.value = settle;
        L[name].visible = own === name && settle > 0;
      }
      L.strokeMask.visible = L.stroke.visible;
    }
    it.layers.lines.material.uniforms.uWhite.value = it.reveal * WIRE_WHITE;
    it.layers.stroke.material.uniforms.uWhite.value = it.reveal * STROKE.white;
    it.layers.stroke.material.uniforms.uAlpha.value = STROKE.alpha;
  }

  // The transform box. Its size is fixed for each piece: wide and tall enough
  // to hold the piece at any point of its turn, with room to spare, so it
  // never changes shape or touches the piece. It only follows the piece as it
  // floats.
  const boxed = mode === 'wire' && hovered && hovered.carved ? hovered : null;
  box.hidden = !boxed;
  if (boxed) {
    const px = (innerHeight / view.h) * boxed.scale * (1 + HOVER_BUMP);
    const across = Math.hypot(boxed.size.x, boxed.size.z);
    const w = across * px * 1.12 + 28, hgt = (boxed.size.y + across * 0.35) * px * 1.08 + 28;
    corner.copy(boxed.holder.position).project(camera);
    const cx = (corner.x * 0.5 + 0.5) * innerWidth, cy = (-corner.y * 0.5 + 0.5) * innerHeight;
    box.style.transform = `translate(${cx - w / 2}px, ${cy - hgt / 2}px)`;
    box.style.width = `${w}px`;
    box.style.height = `${hgt}px`;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

layout();
// Loading, so the page never locks up. Nothing is fetched until it is needed:
// the logo first, then each piece when the visitor is getting near it, one at
// a time with a breath in between. With nothing nearby left to fetch, the rest
// trickle in slowly in page order. The material for the Mix section is
// fetched last, when the visitor approaches the bottom or everything else is
// in. A small "Loading" in the corner shows while something is on its way.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function loadEverything() {
  const todo = [logo, ...shuffled].filter((it) => it.piece.baked);
  const near = (it) => it === logo || (Math.abs(it.home.y - camera.position.y) < view.h * 1.3 && Math.abs(it.home.x - camera.position.x) < view.w * 2.2);
  let idle = 0;
  while (todo.length) {
    let i = todo.findIndex(near);
    if (i < 0) {
      status.hidden = true;
      await wait(300);
      if (++idle < 4) continue;                // nothing close: every ~1.2s, bring in the next one anyway
      i = 0;
    }
    idle = 0;
    const it = todo.splice(i, 1)[0];
    status.hidden = false;
    try { await loadBaked(it); } catch (e) { console.warn(`Could not load ${it.piece.title}: ${e.message}`); }
    await wait(80);
  }
  status.hidden = false;
  await loadFields();
  status.hidden = true;
}
carveAll();
loadEverything();
requestAnimationFrame(frame);

// Handy from the console while tuning: skip.state, skip.items, skip.setMode('wire')
window.skip = { state, items, setMode, carveAll, renderer, scene, camera, layout };
