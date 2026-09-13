/* FunType — Collection 04: Sway.

   Behind every letter trail a few copies of it, each showing where the
   letter was a moment ago. The letters are one colour and the ground
   another; the copies are solid steps down a gradient between the last
   two colours, the spectrum cut into as many steps as there are copies,
   and every rank is strung on a thread of its own colour running down the
   column, so each one reads as a string of beads. They cost
   nothing to place: a copy is just the same letter sampled at an earlier
   time, so the faster the letter travels the further apart they spread,
   and the instant it stops they all fall exactly behind it and vanish.

   The text stands in a column down the middle of the frame, one big
   bold letter per row: a short word sits in the middle, a longer one
   fills four fifths of the frame's height, and past that the letters
   scale down to keep it so. A wave runs through the column: every
   letter slides to the left, then to the right, a beat behind the
   letter above it, easing in and out of every stop. Nothing enters and
   nothing leaves — the word is there from the first frame and the wave
   just keeps going, so the piece can sit on a wall and stay.

   Same architecture as Collection 03: one engine on a virtual clock
   (step(dt) advances it, snapshot(frame) says what to paint for
   stop-motion frame `frame`), a DOM renderer for the studio and the
   embed page, a canvas renderer for the export page. A letter's slide
   repeats every two passes, so the export samples exactly one of those
   periods and the exported loop is seamless.

   Collection 04's sticker is a capsule — rounded right through at both
   ends, a little wider than tall, so a column of them reads as a stack of
   sliders (02 used circles, 03 sharp squares). The letter inside is the
   family's slate, as it is on every other card; the colour lives in the
   sticker, and so do the copies. A cut-corner sticker and a no-sticker
   reading are there as options.

   Settled, from the lab (September 2026) — everything below is decided:
     motion   cubic-bezier(0.51, 0, 0.33, 1.01) — a slow leave, a quick
              middle, a hair of overshoot at the edge
     timing   1300 ms a slide, 380 ms standing at each end, 112 ms
              between one letter and the next (scaled down past 13 letters)
     rings    the letters spread round the ring and strung on the arcs
              between them — how it travels is still open, and the copies
              are off until it is settled
     colour   blue · orange · pink · white, each taking a turn as the
              background; the sticker one colour, the copies solid steps
              along a gradient between the other two, letters always slate
     echo     six copies, 120 ms apart
     type     Switzer 500 slate on a sticker cut to the letter (Collection
              01's), the sticker 0.84 of its row, the column four fifths of
              the frame's height, 95 px clear of the sides
     grain    0.28 overlaid on a light ground, 0.10 screened on a dark one
     weight   Switzer 500, settled
     rate     12 fps, the house stop-motion — settled against 8 and 10
     name     Sway (Slide, Drift, Comb and Lag were the other names on
              the table)

   Effect contract (studio / embed):  mount(stage, { word, palette, seed }) → { stop() }
   Export contract:                   scene({ word, palette, seed, grain… }) → { draw(ctx, size, frame, total), n, grain } */

/* Collection 01's sticker: a tile cut to the letter's own shape — a circle
   for a round letter, a trapezoid for an A, an X for an X, otherwise a box
   with a radius per corner. The geometry already lives in the bundle, so
   it is imported rather than copied: letterSpec(ch, textWidth, height) describes one, and the three
   readers turn it into a CSS radius, a CSS clip-path or a canvas path. */
import {
  f as letterSpec, d as specRadius, h as specClip, a as specPath,
} from "./palette-D5fFc6np.js";

const STAGE = 1080;
const FILL = 0.8;               // a full column stands this tall in the frame
const MAX_H = STAGE * FILL / 4; // a row is never taller than a quarter of a full
                                // column, so one to three letters sit in the middle
                                // instead of being blown up; four already fill it…
const MIN_H = 40;               // … and past this the text takes a second column
                                // rather than setting too small to read
const MAX_COLS = 8;             // … up to this many columns; past that the letters just get small
const FONT = 0.76;              // letter size / row height: a capital is ~0.72 em, so this
                                // leaves nearly a whole cap height of air between the rows
const GLYPH_W = 0.72;           // roughly how wide a capital sits, as a fraction of its size
const LANE_PAD = 95;            // a lane keeps this much clear of its edges at the end of a slide,
                                // so the text never hugs the sides of the frame — a narrow lane
                                // (several columns) gets a share of it rather than all of it
const FPS = 12;                 // stop-motion: the picture only updates this often
const JITTER = 2;               // px of hand-held wobble per frame — small, because the
                                // letters line up on their edges and that should read
const STAGGER = 112;            // ms between one letter's beat and the next letter's — negative
                                // runs the wave up the column instead of down…
const STAGGER_SPAN = 1456;      // … squeezed so the whole wave never takes much longer than about
                                // a second and a half to pass through (112 ms holds up to 13 letters)
const STAGGER_MIN = 0;
const BEAT = 200;               // the word stands still this long before the wave starts
const MOVE_MS = 1300;           // one slide, edge to edge
const HOLD_MS = 380;            // … and the pause at the end of it
const CURVE = "sway";           // … and how it gets there (see CURVES)
const WEIGHT = 500;             // Switzer, the family's own letter weight (Rubik for Hebrew)
const LETTER = "#4E4B5D";       // Stickers' slate letter colour, on every sticker in the family
const SHAPE = "letter";         // the sticker under the letter: "letter" (Collection 01's, cut to
                                // the letter's own shape), "capsule", "chamfer" or "none"
const LETTER_W = 0.8;           // "letter": the glyph's size inside its sticker
const THREAD = 0.09;            // the thread a rank is strung on, as a share of a row
const TILE = 0.84;              // a sticker's height as a share of its row, so the rows keep air
const TILE_W = 1.42;            // … and its width as a share of its own height
const TILE_FONT = 0.52;         // … and the letter's size inside it
const CHAMFER = 0.26;           // "chamfer": how much of the height each cut corner takes
const ECHOES = 6;               // how many copies trail behind each letter…
const ECHO_MS = 120;            // … each one showing where the letter was this long ago…
const ECHO_ALPHA = 0.5;         // … at this opacity, when the copies are set by opacity at all
/* Rings */
const RING_GAP = 1.8;           // the step from one ring to the next, in sticker heights
const RING_LEAD = 600;          // the word stands still this long before it sets off
const RING_MOTION = "stride";   // how it travels: "steady", "stride" or "swing"
const RING_TURN = 9000;         // "steady": ms for one turn of the ring
const RING_STEPS = 6;           // "stride": strides to the turn…
const RING_MOVE = 700;          // … one stride…
const RING_HOLD = 800;          // … and the rest after it
const RING_SWING = 0.9;         // "swing": how far it rocks, as a share of a letter-gap
const RING_LAG = 90;            // each letter sets off this long after the one in front
/* Eights */
const EIGHT_TURN = 7000;        // ms to travel the whole eight once
const EIGHT_FLIP = 2;           // … and the figure turns over once every this many rounds
/* Volume */
const VOL_BEAT = 5400;          // ms for the slowest bar to rise and fall once
const VOL_FLOOR = 70;           // the floor sits this far off the bottom of the frame

const COLOUR = "spectrum";      // how the palette is spent. "spectrum": the letters take one
                                // colour, the background the second, and the copies are solid steps
                                // along a gradient between the last two — one step per copy.
                                // "trail": every rank of copies takes the next palette colour.
                                // "ramp" / "cycle": colour by letter, with the copies faded out

/* Colour rule: four colours — frame, card, ink, anchor. The first is the
   background; the letters step through the other three, one step per
   letter, so a column runs the whole palette top to bottom. The first
   four sets are this collection's own four colours, each one taking its
   turn as the background; then white on black; then Collection 01's,
   02's and 03's palettes, read the same way. */
export const p = [
  { frame: "#7E9CFC", card: "#FF8F5E", ink: "#FFBEF8", anchor: "#FFFFFF" },   // blue ground
  { frame: "#FF8F5E", card: "#FFBEF8", ink: "#FFFFFF", anchor: "#7E9CFC" },   // orange ground
  { frame: "#FFBEF8", card: "#FFFFFF", ink: "#7E9CFC", anchor: "#FF8F5E" },   // pink ground
  { frame: "#FFFFFF", card: "#7E9CFC", ink: "#FF8F5E", anchor: "#FFBEF8" },   // white ground
  { frame: "#0D0D0F", card: "#FFFFFF", ink: "#FFFFFF", anchor: "#FFFFFF" },   // white on black — not quite
                                                                             // pure, so the grain still lives
  { frame: "#49C7FD", card: "#FA8EFA", ink: "#FFFF66", anchor: "#FFFFFF" },   // blue · pink · yellow
  { frame: "#A9FF67", card: "#FFFFFF", ink: "#5BE03A", anchor: "#49C7FD" },
  { frame: "#49C7FD", card: "#FFFFFF", ink: "#5BE03A", anchor: "#A9FF67" },
  { frame: "#FFFFFF", card: "#49C7FD", ink: "#5BE03A", anchor: "#D9FF93" },
  { frame: "#5BE03A", card: "#49C7FD", ink: "#B9F1FA", anchor: "#A9FF67" },
  { frame: "#B9F1FA", card: "#A9FF67", ink: "#D9FF93", anchor: "#49C7FD" },
  { frame: "#D9FF93", card: "#5BE03A", ink: "#FFFFFF", anchor: "#49C7FD" },
  { frame: "#FA8EFA", card: "#FFFFFF", ink: "#FF7300", anchor: "#FFDD00" },   // Collection 01, from here down
  { frame: "#FFFFFF", card: "#FFFF66", ink: "#FF42FF", anchor: "#FF7300" },
  { frame: "#FFFF66", card: "#FF42FF", ink: "#FFFFFF", anchor: "#FA8EFA" },
  { frame: "#FFDD00", card: "#FFFFFF", ink: "#FF7300", anchor: "#FF42FF" },
  { frame: "#FF42FF", card: "#FFDD00", ink: "#FFFFFF", anchor: "#FFFF66" },
  { frame: "#FF7300", card: "#FA8EFA", ink: "#FFFFFF", anchor: "#FFFF66" },   // orange · pink · white · yellow
];
/* Every colour FunType has used, collection by collection — the lab
   shuffles a card out of this, so a new set can still come from the
   family rather than from nowhere. */
export const POOL = [
  "#7E9CFC", "#FF8F5E", "#FFBEF8", "#FFFFFF", "#0D0D0F",                  // Collection 04
  "#49C7FD", "#FA8EFA", "#FFFF66",                                        // 03
  "#A9FF67", "#5BE03A", "#D9FF93", "#B9F1FA",                             // 02
  "#FF42FF", "#FFDD00", "#FF7300", "#FF721E",                             // 01
];

/* The four colours are read in the order they are given: the first is the
   ground, the second the sticker, and the copies run between the last two.
   A card gets its own ground by being handed a different one of the sets
   above, not by rotating the set it is given — so what you pick is what
   you see. */
function dealPalette(_mode, given) {
  return { frame: given.frame, card: given.card, ink: given.ink, anchor: given.anchor };
}

/* ---------- small helpers ---------- */

/* Seeded RNG (mulberry32). seed 0 → a fresh random stream. */
function rng(seed) {
  let a = (seed >>> 0) || (Math.random() * 2 ** 32) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* Deterministic hash → [-1, 1], the same one the other collections use
   for the per-frame wobble: (element, frame, axis) always gives the
   same nudge. */
function wobble(i, frame, axis) {
  let d = (i * 73856093) ^ (frame * 19349663) ^ (axis * 83492791);
  d = Math.imul(d ^ (d >>> 13), 2246822507);
  d = (d ^ (d >>> 16)) >>> 0;
  return (d / 4294967296) * 2 - 1;
}
const GRAIN_TILES = 6, GRAIN_TILE = 192, GRAIN_OPACITY = 0.28, GRAIN_DARK = 0.1;

/* The sticker's outline, in CSS. */
function shapeCss(t) {
  if (t.shape === "letter") return `border-radius:${specRadius(t.spec)};clip-path:${specClip(t.spec)};`;
  if (t.shape === "capsule") return `border-radius:${t.h / 2}px;`;
  if (t.shape === "chamfer") {
    const c = (CHAMFER * t.h * 100) / t.w, d = CHAMFER * 100;
    return `clip-path:polygon(${c.toFixed(2)}% 0, ${(100 - c).toFixed(2)}% 0, 100% ${d.toFixed(2)}%, 100% ${(100 - d).toFixed(2)}%, ${(100 - c).toFixed(2)}% 100%, ${c.toFixed(2)}% 100%, 0 ${(100 - d).toFixed(2)}%, 0 ${d.toFixed(2)}%);`;
  }
  return "";
}

/* How light a colour is, 0…1 — the grain is laid on differently over a
   dark field than over a bright one, and the lab keeps a shuffled set
   from landing a letter on a ground of the same weight. */
export function lightness(hex) {
  const n = parseInt(String(hex).slice(1), 16) || 0;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}
/* Film grain: overlay does nothing to a near-black field (it multiplies
   what is already there), so over a dark background the noise is screened
   on instead, gently. */
export function grainFor(bg, { opacity, blend, override = false } = {}) {
  const dark = lightness(bg) < 0.3;
  /* Over a dark field the house 0.5 would wash the black out to grey, so a
     figure asked for from outside only counts when it is deliberate — the
     export page hands every effect the same 0.5 without knowing the card. */
  const o = dark
    ? (override && opacity !== undefined ? opacity : GRAIN_DARK)
    : (opacity === undefined ? GRAIN_OPACITY : opacity);
  return { opacity: o, blend: blend || (dark ? "screen" : "overlay") };
}

/* How wide a letter really sits at this size and weight. Collection 01
   measures at its own weight; this one asks for the weight the card is
   set in, so the sticker keeps hugging the letter however light it goes.
   Off a browser there is no canvas to measure with, so it is estimated —
   only the node checks ever land there. */
let gauge;
function glyphWidth(ch, size, weight) {
  if (typeof document === "undefined") return size * 0.6;
  gauge = gauge || document.createElement("canvas").getContext("2d");
  gauge.font = `${weight} ${size}px "Switzer","Rubik",system-ui,sans-serif`;
  const m = gauge.measureText(ch);
  const w = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width || size * 0.5);
  return Math.max(w, size * 0.12);
}

/* One letter's sticker, worked out once per character, height and weight. */
const specs = new Map();
function stickerFor(ch, h, weight) {
  const key = `${ch}@${h.toFixed(1)}/${weight}`;
  let spec = specs.get(key);
  if (!spec) {
    const size = h * LETTER_W;
    spec = letterSpec(ch, glyphWidth(ch, size, weight), h);
    spec.size = size;
    specs.set(key, spec);
  }
  return spec;
}

/* The thread through a run of beads, as an SVG path. Straight lines between
   the letters would read as a polygon; a Catmull-Rom spline through the same
   points reads as the curve they are sitting on — a real ring, a real eight —
   and closes into a bracelet when the run comes back to where it started. */
function threadPath(pts, closed) {
  const n = pts.length;
  if (n < 2) return "";
  if (n === 2) return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}L${pts[1][0].toFixed(1)},${pts[1][1].toFixed(1)}`;
  const at = (i) => pts[closed ? (i + n) % n : Math.min(n - 1, Math.max(0, i))];
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return closed ? d + "Z" : d;
}

/* A ring's thread, as the arcs from one bead to the next rather than a
   circle drawn round all of them: each point carries the angle it sits at,
   and each arc takes the short way from one to the next along the circle
   they share. A ring that is still filling then shows only the arcs it has
   letters for. */
function arcPath(pts, cx, cy) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x, y, a, dir] = pts[i];
    const r = Math.hypot(x - cx, y - cy);
    /* Always back along the way the ring travels, from a letter to the one
       behind it — never the short way across, which would cut the chord as
       soon as two letters drifted more than half a turn apart. */
    let da = (a - pts[i - 1][2]) * (dir || 1);
    while (da > 0) da -= 2 * Math.PI;
    while (da < -2 * Math.PI) da += 2 * Math.PI;
    const sweep = (dir || 1) > 0 ? 0 : 1;
    d += `A${r.toFixed(1)},${r.toFixed(1)} 0 ${Math.abs(da) > Math.PI ? 1 : 0},${sweep} ${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

/* Walk a list of colours: t = 0 is the first, t = 1 the last. */
function ramp(stops, t) {
  const list = stops.filter(Boolean);
  if (list.length < 2) return list[0] || "#FFFFFF";
  const x = Math.max(0, Math.min(1, t)) * (list.length - 1);
  const i = Math.min(list.length - 2, Math.floor(x));
  return mix(list[i], list[i + 1], x - i);
}

/* Mix two hex colours: t = 0 → a, t = 1 → b. */
function mix(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(((A >> sh) & 255) * (1 - t) + ((B >> sh) & 255) * t);
  return "#" + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, "0")).join("");
}
/* The shape of one slide: u = 0…1 of the way through it, out = 0…1 of the
   way across. All five start and end exactly where they should, so a
   slide always lands flush; the last two overshoot a little on the way,
   which is what LANE_PAD leaves room for.
     sine    — a plain cosine. Its speed is zero at each end and picks up
               again immediately, so with no pause the passes join into
               one continuous wave and nothing ever stops.
     smooth  — smootherstep: dead still at both ends, a real stop.
     deep    — quintic: a long, slow leave and arrival, quick through the middle.
     snap    — leaves fast, arrives with one small rebound.
     spring  — arrives and wobbles itself to rest. */
/* A slide that overshoots and settles: `rebounds` counts the passes it
   makes over the mark, `amount` is how far the first one goes, as a
   fraction of the whole travel. It lands on exactly 1 at u = 1, whatever
   the numbers, so a slide still finishes flush. */
export function bounce(rebounds = 1, amount = 0.05) {
  const w = (Math.max(1, Math.round(rebounds)) + 0.5) * Math.PI;
  const d = Math.max(0.5, (-Math.log(Math.min(0.9, Math.max(0.001, amount))) * w) / Math.PI);
  return (u) => 1 - Math.exp(-d * u) * Math.cos(w * u);
}
/* The CSS cubic-bezier easing, so a curve dragged about on a graph can be
   handed straight to the engine. Control points may sit outside 0…1, which
   is how you get anticipation and overshoot. */
export function bezier(x1, y1, x2, y2) {
  const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, C = (a) => 3 * a;
  const at = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
  const slope = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + C(a);
  return (u) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    let t = u;
    for (let i = 0; i < 8; i++) {
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - (at(t, x1, x2) - u) / d));
    }
    return at(t, y1, y2);
  };
}
export const CURVES = {
  /* The one this card runs: it leaves slowly, crosses quickly, and arrives
     with a hair of overshoot at the far edge. */
  sway: bezier(0.51, 0, 0.33, 1.01),
  sine: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  smooth: (u) => u * u * u * (u * (u * 6 - 15) + 10),
  deep: (u) => (u < 0.5 ? 16 * u ** 5 : 1 - Math.pow(-2 * u + 2, 5) / 2),
  snap: bounce(1, 0.05),
  spring: bounce(2, 0.05),
};
/* A curve can be given by name or handed in as a function of its own. */
const shapeOf = (c) => (typeof c === "function" ? c : CURVES[c] || CURVES[CURVE]);

/* How to typeset `n` letters: one column if they fit, otherwise as many
   columns as it takes to keep the letters big enough to read. Each
   column gets its own lane of the stage to slide inside, so columns
   never cross. */
function layout(n, font = FONT) {
  const usable = STAGE * FILL;
  /* Whichever reading is on, a row is this wide at most: a capsule is the
     widest of the stickers, and a bare letter is narrower than all of them. */
  const widest = (h) => Math.max(h * TILE * TILE_W, h * font * GLYPH_W);
  for (let c = 1; c <= MAX_COLS; c++) {
    const rows = Math.ceil(n / c);
    const h = Math.min(MAX_H, usable / rows);
    const lane = STAGE / c;
    if (h >= MIN_H && widest(h) * 1.6 <= lane) return { cols: c, rows, h, w: h * font * GLYPH_W, lane };
  }
  const rows = Math.ceil(n / MAX_COLS);
  const h = Math.min(MAX_H, usable / rows);
  return { cols: MAX_COLS, rows, h, w: h * font * GLYPH_W, lane: STAGE / MAX_COLS };
}

/* ---------- the engine ---------- */

/* Runs the piece on a virtual clock. step(dt) advances it; snapshot(frame)
   describes what to paint for stop-motion frame `frame`. The word is on
   screen from the first frame and nothing ever ends: once the wave has
   reached the last letter, every letter is oscillating with the same
   period (loopPeriod), a stagger apart. */
function engine(mode, { word = "", palette, seed = 0, stagger: staggerOpt, move = MOVE_MS, hold = HOLD_MS,
                        curve = CURVE, font = FONT, echoes = ECHOES,
                        echoDelay = ECHO_MS, echoAlpha = ECHO_ALPHA, colour = COLOUR,
                        shape = SHAPE, thread = true, weight = WEIGHT,
                        /* Rings */
                        ringFace = false, ringOne = false, ringMotion = RING_MOTION,
                        ringSteps = RING_STEPS, ringLag = RING_LAG,
                        /* Eights */
                        eightOne = false, eightFlip = EIGHT_FLIP, eightLie = false,
                        /* Volume */
                        volTight = false, volOrder = "free", volThread = "both", volBounce = false } = {}) {
  const pal = dealPalette(mode, palette || p[0]);
  const chars = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  const empty = !chars.filter((c) => c !== " ").length;
  /* Hebrew and Arabic, written out in escapes so the module survives being
     read as anything but UTF-8. */
  const rtl = /[\u0590-\u05FF\u0600-\u06FF]/.test(chars.join(""));
  const L = layout(Math.max(1, chars.length), font);
  const card = mode;
  const shaped = shape !== "none";
  const cut = shape === "letter";           // … and cut to the letter, rather than one box
  /* A row's height: the column's own on Sway, whatever the card worked out
     for itself on the others. */
  let tileSize = L.h, tileH = L.h * TILE, tileW = tileH * TILE_W;
  let rings = 1, ringStart = 0;             // how many rings the text made, and when they start turning
  const syncTile = () => { tileH = tileSize * TILE; tileW = tileH * TILE_W; };

  /* How far a lane's flush edges sit from its middle. A curve that
     overshoots would carry the letters past those edges, so the travel is
     pulled in by however far it overshoots — the letters still line up
     with each other, and the overshoot lands inside the frame. */
  const over = (() => {
    let m = 0;
    for (let i = 0; i <= 100; i++) { const v = shapeOf(curve)(i / 100); m = Math.max(m, v - 1, -v); }
    return Math.max(0, m);
  })();
  /* Without a sticker each letter hangs off the flush edge by its own
     width, which only the renderers know; a sticker is a box the engine
     can measure, so it places the middle itself — and a letter-cut
     sticker is a different width per letter, which is exactly what makes
     a wide W and a narrow I still end flush. */
  const pad = Math.min(LANE_PAD, L.lane * 0.18);
  const halfFor = (w) => Math.max(0, (L.lane / 2 - pad - (shaped ? w / 2 : 0)) / (1 + 2 * over));
  const stagger = staggerOpt === undefined
    ? Math.max(STAGGER_MIN, Math.min(STAGGER, STAGGER_SPAN / Math.max(1, chars.length)))
    : staggerOpt;
  const passGap = move + hold;
  const ease = shapeOf(curve);

  let rand = rng(seed);
  let now = 0;                  // virtual ms
  let letters = [];
  let loops = 0;

  /* Everything but the background, in order. */
  const stops = [pal.card, pal.ink, pal.anchor];

  /* The text as words, each one a list of positions in `chars` — a word is
     what every card past Sway groups by: a ring, an eight, a bar. */
  function words() {
    const out = [];
    let run = [];
    chars.forEach((ch, i) => {
      if (ch === " ") { if (run.length) out.push(run); run = []; return; }
      run.push(i);
    });
    if (run.length) out.push(run);
    return out;
  }
  const tone = (i) => (colour === "cycle" ? stops[i % stops.length]
    : ramp(stops, chars.length > 1 ? i / (chars.length - 1) : 0));
  /* How wide a sticker is on this card, before any letter is known. */
  const boxW = (h) => (cut ? h * TILE_W * 0.8 : shaped ? h * TILE_W : h * GLYPH_W);

  function build() {
    letters = [];
    tileSize = L.h;
    if (empty) return;
    if (card === "rings") { buildRings(); return syncTile(); }
    if (card === "eight") { buildEights(); return syncTile(); }
    if (card === "volume") { buildVolume(); return syncTile(); }
    chars.forEach((ch, i) => {
      const col = Math.floor(i / L.rows);
      const row = i % L.rows;
      const inCol = Math.min(L.rows, chars.length - col * L.rows);
      const lane = rtl ? L.cols - 1 - col : col;
      const cx = L.lane * (lane + 0.5);
      const cy = (STAGE - inCol * L.h) / 2 + L.h / 2 + row * L.h;
      letters.push({
        id: i, ch, blank: ch === " ", group: col, fill: tone(i),
        /* A negative delay just turns the wave around: the bottom letter
           leads and the top one follows. */
        cx, cy, t0: BEAT + (stagger < 0 ? chars.length - 1 - i : i) * Math.abs(stagger),
      });
    });
    syncTile();
  }

  /* Rings — a word to a ring, the first word outermost, its letters spread
     evenly round the circumference and strung on the arcs between them.
     How it travels is the card's own question, and there are three answers
     in here: "steady" simply turns; "stride" walks it round a stride at a
     time, the first letter setting off and the rest following a beat behind
     one another before they all come to rest together; "swing" rocks it one
     way and back instead of going round. Every one of them is built out of
     whole turns or whole strides, so the round always closes on itself. */
  function buildRings() {
    const ws = ringOne ? [words().flat()] : words();
    rings = ws.length;
    /* The letters are spread round the whole circumference, so what has to
       fit is the gap between two of them. */
    let h = MAX_H;
    for (; h > 14; h -= 2) {
      const w = boxW(h);
      const r0 = STAGE / 2 - LANE_PAD / 2 - w / 2;
      const inner = (i) => r0 - i * h * RING_GAP;
      if (inner(ws.length - 1) < h * 0.9) continue;
      if (ws.every((wd, i) => (2 * Math.PI * inner(i)) / wd.length >= w * 1.15)) break;
    }
    tileSize = h;
    const r0 = STAGE / 2 - LANE_PAD / 2 - boxW(h) / 2;
    ringStart = RING_LEAD;
    ws.forEach((wd, ri) => {
      const r = r0 - ri * h * RING_GAP;
      const dir = ri % 2 ? -1 : 1;                 // every ring inside turns against the one outside it
      const gap = (dir * 2 * Math.PI) / wd.length; // one letter-gap, in radians
      wd.forEach((i, j) => {
        letters.push({
          id: i, ch: chars[i], blank: false, group: ri, fill: tone(i), ed: echoDelay,
          cx: STAGE / 2, cy: STAGE / 2, r, ring: ri, dir, gap,
          step: (dir * 2 * Math.PI) / ringSteps,
          a0: -Math.PI / 2 + j * gap,
          off: RING_LEAD + j * ringLag,
        });
      });
    });
  }

  /* Eights — a word to a figure of eight, side by side, the letters strung
     evenly along it. The whole figure turns over as it goes. */
  function buildEights() {
    const ws = eightOne ? [words().flat()] : words();
    const span = (STAGE - 2 * LANE_PAD) / ws.length;
    const longest = Math.max(...ws.map((w) => w.length));
    /* The figure turns over, so what has to fit in the frame is the circle
       it sweeps, not the eight itself: with these proportions the furthest
       a letter ever gets from the middle is exactly that circle. The
       letters then have to fit along the path with room between them, so
       the size comes down until they do. */
    const reach = (h) => Math.min(span / 2, STAGE * 0.42) - boxW(h) / 2 - 10;
    let h = MAX_H;
    for (; h > 12; h -= 2) {
      const R = reach(h);
      if (R < h * 0.9) continue;
      if ((4.4 * R) / longest >= boxW(h) * 1.25) break;
    }
    tileSize = h;
    const R = reach(h), A = eightLie ? R * 2 : R * 1.15, B = eightLie ? R * 1.15 : R * 2;
    ws.forEach((wd, wi) => {
      const col = rtl ? ws.length - 1 - wi : wi;
      const cx = LANE_PAD + span * (col + 0.5);
      wd.forEach((i, j) => {
        letters.push({
          id: i, ch: chars[i], blank: false, group: wi, closed: wd.length > 2, fill: tone(i),
          cx, cy: STAGE / 2, A, B,
          a0: (2 * Math.PI * j) / wd.length,
          t0: 0,
        });
      });
    });
  }

  /* Volume — a word to a bar standing on the floor, the bars rising and
     sinking at their own rates, so their tops draw a moving horizon. */
  function buildVolume() {
    const ws = words();
    const span = (STAGE - 2 * LANE_PAD) / ws.length;
    const longest = Math.max(...ws.map((w) => w.length));
    const floor = STAGE - VOL_FLOOR;
    const h = Math.max(14, Math.min(MAX_H, (floor - VOL_FLOOR) / Math.max(2, longest), span / 1.15));
    tileSize = h;
    /* Tight packs the bars against each other, so the tops read as one
       skyline rather than separate towers. */
    const pitch = volTight ? boxW(h) * 1.02 : span;
    const x0 = volTight ? (STAGE - pitch * ws.length) / 2 : LANE_PAD;
    ws.forEach((wd, wi) => {
      const col = rtl ? ws.length - 1 - wi : wi;
      const cx = x0 + pitch * (col + 0.5);
      const rise = wd.length * h + h;
      wd.forEach((i, j) => {
        letters.push({
          id: i, ch: chars[i], blank: false, group: wi, top: j === 0, fill: tone(i),
          cx, cy: floor - h / 2 - (wd.length - 1 - j) * h,
          rise, floor,
          beat: (volOrder === "wave" ? 1 : 1 + (wi % 3)) * ((2 * Math.PI) / VOL_BEAT),
          phase: volOrder === "wave" ? (-2 * Math.PI * col) / ws.length : rand() * Math.PI * 2,
          t0: 0,
        });
      });
    });
  }

  /* Where a letter sits in its lane right now, as one number: 0 is flush
     against the lane's left edge, 1 is flush against its right edge, and
     0.5 is centred. Pass k runs from `from` to `to` over MOVE_MS and then
     waits out HOLD_MS; pass 0 leaves the middle, and from there it is
     left, right, left, right, for as long as the page is open.

     Because it is the same number for every letter, a wide W and a narrow
     I end up flush with each other at both ends — the column is
     left-aligned on the left and right-aligned on the right, and the
     letters' own widths never come into it. */
  function align(Lt, t = now) {
    const local = t - Lt.t0;
    if (local < 0) return 0.5;
    const k = Math.floor(local / passGap);
    const u = Math.min(1, (local - k * passGap) / move);
    const to = k % 2 === 0 ? 0 : 1;
    const from = k === 0 ? 0.5 : k % 2 === 1 ? 0 : 1;
    return from + (to - from) * ease(u);
  }

  /* Every restart (loop or click) reshuffles the hand-made offsets from a
     brand-new random seed — the first run still honours the seed it was
     given, so a shared link or an export replays identically. */
  function restart() { loops++; rand = rng((Math.random() * 4294967296) >>> 0); now = 0; build(); }

  function step(dt) { now += dt * 1000; }

  /* The colour a rank is drawn in: 0 is the letter itself. */
  function toneOf(Lt, k) {
    if (colour === "spectrum") {
      return k === 0 ? stops[0] : ramp([stops[1], stops[2]], echoes > 1 ? (k - 1) / (echoes - 1) : 0);
    }
    if (colour === "trail") return stops[k % stops.length];
    return Lt.fill;
  }

  /* Where a letter is at time t, whichever card this is. Everything else —
     the copies, the threads, the stickers — is drawn from this one answer,
     which is why a new card is only ever a new line here. */
  function posAt(Lt, t, w, k) {
    if (card === "rings") {
      /* Whichever way the ring travels, a letter waits out its own delay
         first — so the first letter leads and the rest follow it. */
      const local = t - Lt.off;
      let a = Lt.a0;
      if (local > 0) {
        if (ringMotion === "steady") {
          a += ((Lt.dir * 2 * Math.PI) / RING_TURN) * local;
        } else if (ringMotion === "swing") {
          /* Out and back, one letter-gap's worth, resting at both ends. */
          const pulse = RING_MOVE + RING_HOLD;
          const k = Math.floor(local / pulse);
          const u = ease(Math.min(1, (local - k * pulse) / RING_MOVE));
          const from = k % 2 === 0 ? 0 : 1, to = k % 2 === 0 ? 1 : 0;
          a += Lt.gap * RING_SWING * (from + (to - from) * u);
        } else {
          /* A stride at a time: move, rest, move again. */
          const pulse = RING_MOVE + RING_HOLD;
          const k = Math.floor(local / pulse);
          a += Lt.step * (k + ease(Math.min(1, (local - k * pulse) / RING_MOVE)));
        }
      }
      return {
        x: Lt.cx + Math.cos(a) * Lt.r, y: Lt.cy + Math.sin(a) * Lt.r,
        a, out: true, rot: ringFace ? a + Math.PI / 2 : 0,
      };
    }
    if (card === "eight") {
      const th = Lt.a0 + (2 * Math.PI * t) / EIGHT_TURN;
      const dx = (Lt.A / 2) * Math.sin(2 * th), dy = -(Lt.B / 2) * Math.cos(th);
      if (!eightFlip) return { x: Lt.cx + dx, y: Lt.cy + dy };
      const f = (2 * Math.PI * t) / (EIGHT_TURN * eightFlip), c = Math.cos(f), s2 = Math.sin(f);
      return { x: Lt.cx + dx * c - dy * s2, y: Lt.cy + dx * s2 + dy * c };
    }
    if (card === "volume") {
      const th = Lt.beat * t + Lt.phase;
      let v = 0.5 - 0.5 * Math.cos(th);
      /* A kick at the top of the rise, without breaking the round. */
      if (volBounce) v += 0.07 * Math.sin(2 * th) * Math.max(0, Math.sin(th));
      return { x: Lt.cx, y: Lt.cy + (1 - v) * Lt.rise };
    }
    return { x: Lt.cx + (align(Lt, t) * 2 - 1) * halfFor(w), y: Lt.cy };
  }

  /* Where one letter's rank-k sticker sits, and how wide it is. The
     hand-held wobble is the letter's own, shared by its copies, so at rest
     they stack exactly. */
  function place(Lt, k, frame) {
    const t = now - k * (Lt.ed || echoDelay);
    const spec = cut ? stickerFor(Lt.ch, tileH, weight) : null;
    const w = cut ? spec.W : shaped ? tileW : L.w;
    const at = posAt(Lt, t, w, k);
    return {
      p: card === "sway" ? align(Lt, t) : 0.5, spec, w, rot: at.rot || 0,
      a: at.a, out: at.out !== false,
      x: at.x + wobble(Lt.id, frame, 0) * JITTER,
      y: at.y + wobble(Lt.id, frame, 1) * JITTER,
    };
  }

  function snapshot(frame) {
    const tiles = [];
    const solid = colour === "spectrum" || colour === "trail";
    /* A ring's thread is the arcs from one letter to the next, laid down
       before the beads: it stretches while the word is striding and gathers
       back up as it rests, and it never draws a circle the word has not
       walked. */
    if (thread && card === "rings") {
      for (let k = 0; k >= 0; k--) {
        let run = [], g = -1, tone = null;
        const flush = () => {
          if (run.length > 1) tiles.push({ kind: "thread", id: `ring${k}-${g}`, d: arcPath(run, STAGE / 2, STAGE / 2), colour: tone, width: tileSize * THREAD, alpha: 1 });
          run = [];
        };
        for (const Lt of letters) {
          if (Lt.group !== g) { flush(); g = Lt.group; }
          const q = place(Lt, k, frame);
          if (!q.out) continue;
          tone = toneOf(Lt, k);
          run.push([q.x, q.y, q.a, Lt.dir]);
        }
        flush();
      }
    }
    for (let k = echoes; k >= 0; k--) {
      const alpha = solid || k === 0 ? 1 : (echoAlpha * (echoes - k + 1)) / echoes;
      /* The thread this rank is strung on — one run per column, laid down
         before its own beads. A space breaks nothing: the thread simply
         carries on to the next letter. */
      /* A run is one group — a column, an eight, a bar. The rings are the
         exception: their thread is the ring itself and is already down. */
      if (thread && card !== "rings") {
        let run = [], g = -1, tone = null, closed = false;
        const flush = () => {
          if (run.length > 1) {
            tiles.push({ kind: "thread", id: `t${k}-${g}`, d: threadPath(run, closed), colour: tone, width: tileSize * THREAD, alpha });
          }
          run = [];
        };
        for (const Lt of letters) {
          if (Lt.blank) continue;
          if (card === "volume" && volThread === "horizon") break;
          if (Lt.group !== g) { flush(); g = Lt.group; closed = !!Lt.closed; }
          const q = place(Lt, k, frame);
          tone = toneOf(Lt, k);
          run.push([q.x, q.y]);
        }
        flush();
        /* Volume also strings the tops of the bars together: that line is
           the horizon the card is named for. */
        if (card === "volume" && volThread !== "bars") {
          const ridge = letters.filter((Lt) => Lt.top).map((Lt) => { const q = place(Lt, k, frame); return [q.x, q.y]; });
          if (ridge.length > 1) tiles.push({ kind: "thread", id: `h${k}`, d: threadPath(ridge, false), colour: toneOf(letters[0], k), width: tileSize * THREAD, alpha });
        }
      }
      for (const Lt of letters) {
        if (Lt.blank) continue;
        const q = place(Lt, k, frame);
        if (!q.out) continue;              // not on the ring yet
        const tone = toneOf(Lt, k);
        tiles.push({
          kind: "tile", id: Lt.id * 16 + k, ch: Lt.ch, p: shaped ? 0.5 : q.p,
          shape: shaped ? shape : null, spec: q.spec,
          w: q.w, h: shaped ? tileH : tileSize,
          size: cut ? q.spec.size : shaped ? tileH * TILE_FONT : tileSize * font,
          weight,
          fill: shaped ? tone : null,      // the sticker
          ink: shaped ? LETTER : tone,     // the letter on it
          x: q.x, y: q.y, rot: q.rot, alpha,
        });
      }
    }
    return { bg: pal.frame, tiles, clipBelow: card === "volume" ? STAGE - VOL_FLOOR : null };
  }

  build();
  return {
    step, snapshot, restart, pal, empty,
    get loops() { return loops; },
    get now() { return now; },
    /* One seamless loop of the steady state. Sway settles once the wave has
       reached the last letter and repeats every two passes; the rings have
       to push out of the middle first and then come round a whole number of
       turns; the eights and the bars are in their stride from the first
       frame. */
    get loopStart() {
      if (card === "rings") return ringStart;
      if (card === "eight" || card === "volume") return 0;
      return (chars.length - 1) * Math.abs(stagger) + BEAT + passGap;
    },
    get loopPeriod() {
      if (card === "rings") {
        if (ringMotion === "steady") return RING_TURN;
        if (ringMotion === "swing") return 2 * (RING_MOVE + RING_HOLD);
        return ringSteps * (RING_MOVE + RING_HOLD);
      }
      if (card === "eight") return EIGHT_TURN * Math.max(1, eightFlip);
      if (card === "volume") return VOL_BEAT;
      return 2 * passGap;
    },
  };
}

/* ---------- DOM renderer (studio, embed) ---------- */

let grainTiles;
function makeGrainTiles() {
  if (grainTiles) return grainTiles;
  grainTiles = [];
  const c = document.createElement("canvas");
  c.width = c.height = GRAIN_TILE;
  const g = c.getContext("2d");
  for (let t = 0; t < GRAIN_TILES; t++) {
    const img = g.createImageData(GRAIN_TILE, GRAIN_TILE);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    grainTiles.push(`url(${c.toDataURL()})`);
  }
  return grainTiles;
}

function mount(stage, mode, opts = {}) {
  const eng = engine(mode, opts);
  const fps = opts.fps || FPS;
  const pal = eng.pal;
  stage.innerHTML = "";
  stage.style.cssText = `position:relative;width:${STAGE}px;height:${STAGE}px;overflow:hidden;isolation:isolate;background:${pal.frame};`;
  if (eng.empty) return { stop() {} };

  const layer = document.createElement("div");
  layer.style.cssText = "position:absolute;inset:0;";
  stage.appendChild(layer);
  /* Film grain: a few noise tiles cycled per frame (iOS Safari often
     skips the SVG turbulence filter inside a scaled stage). */
  const g = grainFor(pal.frame, { opacity: opts.grainOpacity, blend: opts.grainBlend, override: true });
  const tiles = opts.grain === false ? null : makeGrainTiles();
  let noise = null;
  if (tiles) {
    noise = document.createElement("div");
    noise.style.cssText = `position:absolute;inset:0;pointer-events:none;mix-blend-mode:${g.blend};opacity:${g.opacity};z-index:9;background-size:${GRAIN_TILE}px ${GRAIN_TILE}px;background-image:${tiles[0]};`;
    stage.appendChild(noise);
  }

  const els = new Map();
  /* A rank's thread: one SVG polyline, created in the order the snapshot
     lists it so it sits under its own beads and over the rank behind. */
  const SVG_NS = "http://www.w3.org/2000/svg";
  function paintThread(t, depth) {
    let el = els.get(t.id);
    if (!el) {
      el = document.createElementNS(SVG_NS, "svg");
      el.setAttribute("viewBox", `0 0 ${STAGE} ${STAGE}`);
      el.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;";
      const line = document.createElementNS(SVG_NS, "path");
      line.setAttribute("fill", "none");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("stroke-linejoin", "round");
      el.appendChild(line);
      layer.appendChild(el);
      els.set(t.id, el);
    }
    el.style.zIndex = depth;
    const line = el.firstChild;
    line.setAttribute("d", t.d);
    line.setAttribute("stroke", t.colour);
    line.setAttribute("stroke-width", t.width.toFixed(1));
    line.setAttribute("opacity", t.alpha.toFixed(3));
  }

  function paint(frame) {
    const s = eng.snapshot(frame);
    if (noise) noise.style.backgroundImage = tiles[frame % tiles.length];
    /* Volume's bars sink out of sight under the floor. */
    layer.style.clipPath = s.clipBelow ? `inset(0 0 ${(STAGE - s.clipBelow).toFixed(1)}px 0)` : "";
    const seen = new Set();
    /* Elements are made as they are first needed, so on a card where the
       letters arrive over time the order they sit in the layer is the order
       they turned up, not the order they should be painted in. The snapshot
       lists them back to front, so that index is the stacking order. */
    let depth = 0;
    for (const t of s.tiles) {
      seen.add(t.id);
      if (t.kind === "thread") { paintThread(t, depth++); continue; }
      let el = els.get(t.id);
      if (!el) {
        el = document.createElement("div");
        const type = `font-family:"Switzer","Rubik",system-ui,sans-serif;font-weight:${t.weight};font-size:${t.size}px;line-height:1;text-transform:uppercase;letter-spacing:-0.02em;white-space:pre;`;
        if (t.shape) {
          el.style.cssText = `position:absolute;left:0;top:0;width:${t.w}px;height:${t.h}px;${type}will-change:transform;`;
          const skin = document.createElement("div");
          skin.style.cssText = `position:absolute;inset:0;background:${t.fill};${shapeCss(t)}`;
          const glyph = document.createElement("div");
          glyph.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:${t.ink};`;
          glyph.textContent = t.ch;
          el.append(skin, glyph);
        } else {
          el.style.cssText = `position:absolute;left:0;top:0;color:${t.ink};${type}will-change:transform;`;
          el.textContent = t.ch;
        }
        layer.appendChild(el);
        els.set(t.id, el);
      }
      /* translate(-50%, -50%) centres the letter on its spot, whatever it is. */
      /* A percentage translate is a share of the element's own width, which
         is exactly the letter's width — so the edges land where they should. */
      el.style.zIndex = depth++;
      el.style.transform = `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) translate(${(-t.p * 100).toFixed(2)}%, -50%)` +
        (t.rot ? ` rotate(${t.rot.toFixed(4)}rad)` : "");
      if (t.alpha < 1) el.style.opacity = t.alpha.toFixed(3);
    }
    for (const [id, el] of els) if (!seen.has(id)) { el.remove(); els.delete(id); }
  }

  let raf = 0, last = 0, acc = 0, frame = 0;
  function tick(t) {
    if (!last) last = t;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    eng.step(dt);
    acc += dt;
    if (acc >= 1 / fps) { acc = 0; frame++; paint(frame); }
    raf = requestAnimationFrame(tick);
  }
  const onClick = () => eng.restart();
  stage.addEventListener("click", onClick);
  paint(0);
  raf = requestAnimationFrame(tick);
  return { stop() { cancelAnimationFrame(raf); stage.removeEventListener("click", onClick); } };
}

export const s = (stage, opts) => mount(stage, "sway", opts);
export const r = (stage, opts) => mount(stage, "rings", opts);
export const e = (stage, opts) => mount(stage, "eight", opts);
export const v = (stage, opts) => mount(stage, "volume", opts);

/* ---------- canvas renderer (export page, and anything else) ---------- */

/* Paint one snapshot into a canvas `size` px square. The export page draws
   through this, and so can any page that wants the cards on a canvas
   rather than in the DOM. */
export function paint(ctx, s, size) {
  const k = size / STAGE;
  ctx.save();
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, size, size);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  if (s.clipBelow) {
    ctx.beginPath();
    ctx.rect(0, 0, size, s.clipBelow * k);
    ctx.clip();
  }
  for (const t of s.tiles) {
    ctx.globalAlpha = t.alpha;
    if (t.kind === "thread") {
      ctx.save();
      ctx.scale(k, k);
      ctx.strokeStyle = t.colour;
      ctx.lineWidth = t.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(new Path2D(t.d));
      ctx.restore();
      continue;
    }
    ctx.save();
    ctx.translate(t.x * k, t.y * k);
    if (t.rot) ctx.rotate(t.rot);
    if (t.shape === "letter") {
      ctx.save();
      ctx.scale(k, k);
      ctx.translate(-t.w / 2, -t.h / 2);
      ctx.fillStyle = t.fill;
      specPath(ctx, t.spec);
      ctx.fill();
      ctx.restore();
    } else if (t.shape) {
      ctx.fillStyle = t.fill;
      stickerPath(ctx, 0, 0, t.w * k, t.h * k, t.shape);
      ctx.fill();
    }
    ctx.fillStyle = t.ink;
    ctx.font = `${t.weight} ${t.size * k}px "Switzer","Rubik",system-ui,sans-serif`;
    ctx.fillText(t.ch, -t.p * ctx.measureText(t.ch).width, 0);
    ctx.restore();
  }
  ctx.restore();
}

/* ---------- the export page's own scene ---------- */

/* The export page plays a fixed loop (7.5 s at 12 fps); it asks for frame
   i of `total`. Sway never ends, so instead of one round we sample one
   period of the steady state — from the moment every letter is sliding,
   two passes long — which joins back onto itself exactly. */
const EXPORT_SEED = 20260912, SIM_DT = 1 / 120;

/* The same outline on a canvas, around (cx, cy). */
function stickerPath(ctx, cx, cy, w, h, shape) {
  const x = cx - w / 2, y = cy - h / 2;
  ctx.beginPath();
  if (shape === "chamfer") {
    const c = CHAMFER * h;
    ctx.moveTo(x + c, y);
    ctx.lineTo(x + w - c, y);
    ctx.lineTo(x + w, y + c);
    ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h);
    ctx.lineTo(x + c, y + h);
    ctx.lineTo(x, y + h - c);
    ctx.lineTo(x, y + c);
    ctx.closePath();
    return;
  }
  const r = h / 2;
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function scene(mode, { word = "", palette, seed, grain = true, grainOpacity, grainScale = 1.2 } = {}) {
  const opts = { word, palette, seed: (seed | 0) || EXPORT_SEED };
  const pal = dealPalette(mode, palette || p[0]);
  let frames = null, cachedTotal = 0;
  function build(total) {
    const e = engine(mode, opts);
    frames = [];
    let simT = 0;
    const start = e.empty ? 0 : e.loopStart / 1000, period = e.loopPeriod / 1000;
    /* Fit a whole number of periods into the export's own running time
       (total frames at FPS), so the loop joins up AND plays at very
       nearly the speed it plays on the site. */
    const dur = period * Math.max(1, Math.round(total / FPS / period));
    for (let i = 0; i < total; i++) {
      const target = start + (i / total) * dur;
      while (simT + SIM_DT <= target + 1e-9) { e.step(SIM_DT); simT += SIM_DT; }
      frames.push(e.snapshot(i));
    }
    cachedTotal = total;
  }
  function draw(ctx, size, frame, total) {
    if (!frames || cachedTotal !== total) build(total);
    paint(ctx, frames[Math.max(0, Math.min(frames.length - 1, frame | 0))], size);
  }
  const g = grainFor(pal.frame, { opacity: grainOpacity });
  return { draw, n: 90, pal, grain: grain ? { opacity: g.opacity, blend: g.blend, scale: grainScale, animated: true } : null };
}
export const x = {
  sway: (o) => scene("sway", o),
  "sway-rings": (o) => scene("rings", o),
  "sway-eight": (o) => scene("eight", o),
  "sway-volume": (o) => scene("volume", o),
};

/* Exposed so the export page can sample a single still frame (SVG) straight
   off the real simulation instead of re-implementing it. */
export { engine };
