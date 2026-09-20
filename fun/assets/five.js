/*! FunType (c) 2026 yamliv.net - all rights reserved. Outputs CC BY-NC 4.0 - https://yamliv.net/fun/license */
/* FunType — Collection 05: the plain canvas.

   There is no card here yet. This is the floor the other four collections
   all stand on, pulled out and written down on its own, so the next one
   starts from what the family already agreed rather than from nothing.
   Everything below is either house (the same in every collection, and not
   ours to change) or a dial the lab can turn. Nothing below is a decision
   about Collection 05 — those get made in the lab and written into the
   block at the top, the way Collection 04's were.

   What the house settles, and where it came from:
     stage    1080 x 1080, always. Every collection composes in stage units
              and the page scales the whole thing; nothing is ever laid out
              against the real pixel size
     rate     12 fps stop-motion. Settled in Collection 03 against 8 and 10,
              kept by 04. The picture only updates this often, so the motion
              reads as drawn rather than as computed
     jitter   a couple of px of hand-held wobble per frame, from a hash of
              (element, frame, axis) — so it is the same wobble every time
              the same frame is drawn, which is what lets the export be
              frame-accurate and still look hand-held
     type     Switzer 500, uppercase, -0.02em, Rubik behind it for Hebrew.
              500 was settled in the Collection 04 lab and is the family's
              letter weight
     letter   #4E4B5D slate, on every sticker in the family. The colour
              lives in the sticker, never in the letter
     sticker  Collection 01's letter-cut tile is the default — a circle for
              a round letter, a trapezoid for an A, an X for an X, a box
              with a radius per corner otherwise. The geometry is imported
              from the bundle rather than copied. Capsule (04), chamfer and
              bare are the other readings
     grain    0.5 overlaid on a light ground, 0.10 screened on a dark one —
              overlay multiplies what is already there, so on near-black it
              does nothing and screened noise is used instead. Six noise
              tiles cycled per frame, because iOS Safari drops the SVG
              turbulence filter inside a scaled stage
     colour   four colours named frame, card, ink, anchor. frame is the
              ground; what a card does with the other three is the card's
              own business. A card gets a different ground by being handed
              a different set, never by rotating the set it is given
     engine   one simulation on a virtual clock, two renderers. step(dt)
              advances it, snapshot(frame) says what to paint. The DOM
              renderer drives the studio and the embed; the canvas renderer
              drives the export, frame by frame, deterministically from a
              seed. A card that means to loop reports loopPeriod and the
              export samples whole rounds of it
     export   whole rounds at the speed the site runs them, never under
              four seconds

   Colour: Collection 01's palette, as asked — magenta, gold, orange,
   pink, yellow and white, in the six sets 01 shipped with. Not a decision
   about this collection either; a place to stand while we look.

   Effect contract (studio / embed):  mount(stage, { word, palette, seed }) -> { stop() }
   Export contract:                   scene({ word, palette, seed, grain... }) -> { draw(ctx, size, frame, total), n, grain } */

/* Collection 01's sticker geometry already lives in the bundle, so it is
   imported rather than copied: letterSpec(ch, textWidth, height) describes
   one tile, and the three readers turn it into a CSS radius, a CSS
   clip-path or a canvas path. */
import {
  f as letterSpec, d as specRadius, h as specClip, a as specPath,
} from "./palette-D5fFc6np.js";

/* ---------- house constants: the same in every collection ---------- */

const STAGE = 1080;             // the square every card composes in
const FPS = 12;                 // stop-motion: the picture only updates this often
const JITTER = 2;               // px of hand-held wobble per frame
const WEIGHT = 500;             // Switzer, the family's own letter weight (Rubik for Hebrew)
const LETTER = "#4E4B5D";       // the slate letter, on every sticker in the family
const LETTER_W = 0.8;           // a glyph's size inside a letter-cut sticker
const TILE = 0.84;              // a sticker's height as a share of its row, so the rows keep air
const TILE_W = 1.42;            // a capsule's width as a share of its own height
const TILE_FONT = 0.52;         // ... and the letter's size inside a capsule or a chamfer
const CHAMFER = 0.26;           // how much of the height each cut corner takes
const THREAD = 0.0675;          // a thread's weight as a share of a row (1.4x the house 0.048)
const GRAIN_TILES = 6, GRAIN_TILE = 192, GRAIN_OPACITY = 0.5, GRAIN_DARK = 0.1;
const SIM_DT = 1 / 120;         // the fixed step the export advances the clock by
const EXPORT_LEAST = 4;         // seconds: an exported loop is never shorter than this

/* ---------- the dials this canvas starts with ---------- */

const MARGIN = 12;              // % of the frame kept clear at the edges
const LETTER_SAY = 100;         // the say a card gets over its letter once it knows its room
const FILL = 0.8;               // how much of the frame inside the margin the block fills
const MAX_H = STAGE * FILL / 3; // a row is never taller than this, so one or two letters
                                // sit in the middle instead of being blown up
const MIN_H = 40;               // ... and never smaller than this, or it stops being readable
const FONT = 0.76;              // letter size / row height, when the letter is bare
const GLYPH_W = 0.72;           // roughly how wide a capital sits, as a fraction of its size
const TRACK = 0.06;             // the gap between two letters, as a share of a row
const LEAD = 0.18;              // ... and between two lines
const SHAPE = "letter";         // "letter" (Collection 01's), "capsule", "chamfer" or "none"
const ROUND = 2000;             // ms for one whole loop — a still card still reports one,
                                // so the export knows how much to sample

/* Colour rule: four colours — frame, card, ink, anchor. frame is the
   ground; on this canvas the letters step through the other three, one
   step per letter, so a line runs the palette left to right. Collection
   01's six sets, each one taking its turn as the ground. */
export const p = [
  { frame: "#FA8EFA", card: "#FFFFFF", ink: "#FF7300", anchor: "#FFDD00" },   // pink ground
  { frame: "#FFFFFF", card: "#FFFF66", ink: "#FF42FF", anchor: "#FF7300" },   // white ground
  { frame: "#FFFF66", card: "#FF42FF", ink: "#FFFFFF", anchor: "#FA8EFA" },   // yellow ground
  { frame: "#FFDD00", card: "#FFFFFF", ink: "#FF7300", anchor: "#FF42FF" },   // gold ground
  { frame: "#FF42FF", card: "#FFDD00", ink: "#FFFFFF", anchor: "#FFFF66" },   // magenta ground
  { frame: "#FF7300", card: "#FA8EFA", ink: "#FFFFFF", anchor: "#FFFF66" },   // orange ground
];

/* Every colour Collection 01 used, for a shuffle that still comes from
   the family rather than from nowhere. */
export const POOL = ["#FF42FF", "#FFDD00", "#FF7300", "#FA8EFA", "#FFFF66", "#FFFFFF", "#FF721E"];

/* The four colours are read in the order they are given: nothing here
   rotates them. A card gets its own ground by being handed a different
   set, so what you pick is what you see. */
export function dealPalette(_mode, given) {
  const q = { ...(given || p[0]) };
  return q;
}

/* ---------- small helpers, shared with the other collections ---------- */

/* Seeded RNG (mulberry32). seed 0 -> a fresh random stream. */
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

/* Deterministic hash -> [-1, 1], the same one every collection uses for
   the per-frame wobble: (element, frame, axis) always gives the same nudge,
   which is what lets an export be frame-accurate and still look hand-held. */
function wobble(i, frame, axis) {
  let d = (i * 73856093) ^ (frame * 19349663) ^ (axis * 83492791);
  d = Math.imul(d ^ (d >>> 13), 2246822507);
  d = (d ^ (d >>> 16)) >>> 0;
  return (d / 4294967296) * 2 - 1;
}

/* How light a colour is, 0...1 — the grain is laid on differently over a
   dark field than over a bright one. */
export function lightness(hex) {
  const n = parseInt(String(hex).slice(1), 16) || 0;
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

/* Film grain: overlay does nothing to a near-black field (it multiplies
   what is already there), so over a dark background the noise is screened
   on instead, gently. */
export function grainFor(bg, { opacity, blend, override = false } = {}) {
  const dark = lightness(bg) < 0.3;
  const o = dark
    ? (override && opacity !== undefined ? opacity : GRAIN_DARK)
    : (opacity === undefined ? GRAIN_OPACITY : opacity);
  return { opacity: o, blend: blend || (dark ? "screen" : "overlay") };
}

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

/* ... and on a canvas, for the readings that are not cut to the letter. */
function stickerPath(ctx, cx, cy, w, h, shape) {
  const x = cx - w / 2, y = cy - h / 2;
  ctx.beginPath();
  if (shape === "capsule") {
    const r = Math.min(h / 2, w / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    return;
  }
  if (shape === "chamfer") {
    const c = CHAMFER * h, d = CHAMFER * h;
    ctx.moveTo(x + c, y);
    ctx.lineTo(x + w - c, y);
    ctx.lineTo(x + w, y + d);
    ctx.lineTo(x + w, y + h - d);
    ctx.lineTo(x + w - c, y + h);
    ctx.lineTo(x + c, y + h);
    ctx.lineTo(x, y + h - d);
    ctx.lineTo(x, y + d);
    ctx.closePath();
    return;
  }
  ctx.rect(x, y, w, h);
}

/* How wide a letter really sits at this size and weight — asked at the
   weight the card is set in, so the sticker keeps hugging the letter
   however light it goes. Off a browser there is no canvas to measure
   with, so it is estimated. */
let gauge;
function glyphWidth(ch, size, weight) {
  if (typeof document === "undefined") return size * 0.6;
  gauge = gauge || document.createElement("canvas").getContext("2d");
  gauge.font = `${weight} ${size}px "Switzer","Rubik",system-ui,sans-serif`;
  const m = gauge.measureText(ch);
  const w = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || m.width || size * 0.5);
  return Math.max(w, size * 0.12);
}

/* One letter's sticker, worked out once per character, height and weight.
   The measurement is taken against the real Switzer, so anything that
   measured before the face arrived has to be thrown away — see clearSpecs. */
const specs = new Map();
/* A page that lays out before the webfont has landed measures every tile
   against the fallback. It calls this once the font is in and builds again. */
export function clearSpecs() { specs.clear(); gauge = null; }
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

/* The thread through a run of beads, as an SVG path — a Catmull-Rom
   spline through the points, so it reads as the curve the letters are
   sitting on rather than as a polygon drawn round them. */
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

/* Walk a list of colours: t = 0 is the first, t = 1 the last. */
function ramp(stops, t) {
  const list = stops.filter(Boolean);
  if (list.length < 2) return list[0] || "#FFFFFF";
  const x = Math.max(0, Math.min(1, t)) * (list.length - 1);
  const i = Math.min(list.length - 2, Math.floor(x));
  return mix(list[i], list[i + 1], x - i);
}

/* Mix two hex colours: t = 0 -> a, t = 1 -> b. */
function mix(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(((A >> sh) & 255) * (1 - t) + ((B >> sh) & 255) * t);
  return "#" + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, "0")).join("");
}

/* A slide that overshoots and settles: `rebounds` counts the passes it
   makes over the mark, `amount` is how far the first one goes. It lands
   on exactly 1 at u = 1, so a move always finishes flush. */
export function bounce(rebounds = 1, amount = 0.05) {
  const w = (Math.max(1, Math.round(rebounds)) + 0.5) * Math.PI;
  const d = Math.max(0.5, (-Math.log(Math.min(0.9, Math.max(0.001, amount))) * w) / Math.PI);
  return (u) => 1 - Math.exp(-d * u) * Math.cos(w * u);
}

/* The CSS cubic-bezier easing, so a curve dragged about on a graph can be
   handed straight to the engine. Control points may sit outside 0...1,
   which is how you get anticipation and overshoot. */
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

/* The curves the family has settled on. `sway` is Collection 04's, kept
   here because it is the one the house reaches for first: a slow leave,
   a quick middle, a hair of overshoot at the edge. */
export const CURVES = {
  sway: bezier(0.51, 0, 0.33, 1.01),
  sine: (u) => 0.5 - 0.5 * Math.cos(Math.PI * u),
  smooth: (u) => u * u * u * (u * (u * 6 - 15) + 10),
  deep: (u) => (u < 0.5 ? 16 * u ** 5 : 1 - Math.pow(-2 * u + 2, 5) / 2),
  snap: bounce(1, 0.05),
  spring: bounce(2, 0.05),
  linear: (u) => u,
};
export const shapeOf = (c) => (typeof c === "function" ? c : CURVES[c] || CURVES.sway);

/* ---------- the dot-matrix letter, and the shapes it is built from ---------- */

/* Collection 02's Dots read a letter off a 5 x 7 bitmap and put one circle
   in every lit cell. The letter is not an outline — it is a skeleton one
   cell thick, and the circles are what you actually see. Same font here,
   written out so it can be read and edited. */
/* Collection 02's Dots read a letter off a 5 x 7 bitmap and put one circle
   in every lit cell. This card reads the same shape off DotsMono 001
   instead — the studio's own dot-matrix face, which the site already
   serves and the shop already sells (/shop/?p=dots-mono-001).

   It is the better skeleton for exactly the reason it was drawn: every
   glyph in it IS a grid of dots, five across and seven down, one circle a
   cell, on a 120-unit step in a 1000-unit em. So there is nothing to trace
   and nothing to guess — the cells below were read straight out of the
   font file's own contours. Its capitals and Collection 02's agree almost
   to the cell, which is where 02's came from; what it brings is the other
   half of the character set, the lowercase and the punctuation, and 94
   glyphs where 02 had 48.

   The face carries a weight axis of its own, Thin to Black, and it spends
   it on the size of the dot. This card does not: it leaves the dot alone
   and lays three instances across a stroke where the font lays one, which
   is a different way of getting to black and the one the collection is
   built on. `thick` is that dial, and the font's own reading is thick 1.

   DotsMono 001 is monospaced, so by default a glyph keeps its full five
   cells whether it fills them or not and the letters stack in columns —
   which is what a matrix display does and most of what the face sounds
   like. `mono` off measures each letter to its own ink instead. */
const GLYPH_COLS = 5, GLYPH_ROWS = 7, SPACE_COLS = 2;
const GLYPHS = {
  A   : ["01110","10001","10001","11111","10001","10001","10001"],
  B   : ["11110","10001","10001","11110","10001","10001","11110"],
  C   : ["01110","10001","10000","10000","10000","10001","01110"],
  D   : ["11110","10001","10001","10001","10001","10001","11110"],
  E   : ["11111","10000","10000","11110","10000","10000","11111"],
  F   : ["11111","10000","10000","11110","10000","10000","10000"],
  G   : ["01110","10001","10000","10111","10001","10001","01111"],
  H   : ["10001","10001","10001","11111","10001","10001","10001"],
  I   : ["11111","00100","00100","00100","00100","00100","11111"],
  J   : ["00111","00010","00010","00010","00010","10010","01100"],
  K   : ["10001","10010","10100","11000","10100","10010","10001"],
  L   : ["10000","10000","10000","10000","10000","10000","11111"],
  M   : ["10001","11011","10101","10101","10001","10001","10001"],
  N   : ["10001","11001","10101","10011","10001","10001","10001"],
  O   : ["01110","10001","10001","10001","10001","10001","01110"],
  P   : ["11110","10001","10001","11110","10000","10000","10000"],
  Q   : ["01110","10001","10001","10001","10101","10010","01101"],
  R   : ["11110","10001","10001","11110","10100","10010","10001"],
  S   : ["01111","10000","10000","01110","00001","00001","11110"],
  T   : ["11111","00100","00100","00100","00100","00100","00100"],
  U   : ["10001","10001","10001","10001","10001","10001","01110"],
  V   : ["10001","10001","10001","10001","10001","01010","00100"],
  W   : ["10001","10001","10001","10101","10101","10101","01010"],
  X   : ["10001","10001","01010","00100","01010","10001","10001"],
  Y   : ["10001","10001","01010","00100","00100","00100","00100"],
  Z   : ["11111","00001","00010","00100","01000","10000","11111"],
  a   : ["00000","00000","01110","00001","01111","10001","01110"],
  b   : ["10000","10000","10000","11110","10001","10001","01110"],
  c   : ["00000","00000","01110","10001","10000","10001","01110"],
  d   : ["00001","00001","00001","01111","10001","10001","01110"],
  e   : ["00000","00000","01110","10001","11111","10000","01110"],
  f   : ["00110","01000","01000","11110","01000","01000","01000"],
  g   : ["00000","00000","01110","10001","01111","00001","01110"],
  h   : ["10000","10000","10000","11110","10001","10001","10001"],
  i   : ["00000","00100","00000","01100","00100","00100","01110"],
  j   : ["00010","00000","00110","00010","00010","10010","01100"],
  k   : ["10000","10000","10010","10100","11000","10100","10010"],
  l   : ["01100","00100","00100","00100","00100","00100","01110"],
  m   : ["00000","00000","11010","10101","10101","10101","10101"],
  n   : ["00000","00000","10110","11001","10001","10001","10001"],
  o   : ["00000","00000","01110","10001","10001","10001","01110"],
  p   : ["00000","00000","11110","10001","11110","10000","10000"],
  q   : ["00000","00000","01110","10001","01111","00001","00001"],
  r   : ["00000","00000","10110","11001","10000","10000","10000"],
  s   : ["00000","00000","01111","10000","01110","00001","11110"],
  t   : ["01000","01000","11110","01000","01000","01001","00110"],
  u   : ["00000","00000","10001","10001","10001","10011","01101"],
  v   : ["00000","00000","10001","10001","10001","01010","00100"],
  w   : ["00000","00000","10001","10001","10101","10101","01010"],
  x   : ["00000","00000","10001","01010","00100","01010","10001"],
  y   : ["00000","00000","10001","10001","01111","00001","01110"],
  z   : ["00000","00000","11111","00010","00100","01000","11111"],
  0   : ["01110","10001","10011","10101","11001","10001","01110"],
  1   : ["00100","01100","00100","00100","00100","00100","01110"],
  2   : ["01110","10001","00001","00010","00100","01000","11111"],
  3   : ["11111","00010","00100","00010","00001","10001","01110"],
  4   : ["00010","00110","01010","10010","11111","00010","00010"],
  5   : ["11111","10000","11110","00001","00001","10001","01110"],
  6   : ["00110","01000","10000","11110","10001","10001","01110"],
  7   : ["11111","00001","00010","00100","01000","01000","01000"],
  8   : ["01110","10001","10001","01110","10001","10001","01110"],
  9   : ["01110","10001","10001","01111","00001","00010","01100"],
  "!" : ["00100","00100","00100","00100","00100","00000","00100"],
  "\"": ["01010","01010","01010","00000","00000","00000","00000"],
  "#" : ["00000","01010","11111","01010","11111","01010","00000"],
  "$" : ["00100","01111","10000","01110","00001","11110","00100"],
  "%" : ["11000","11001","00010","00100","01000","10011","00011"],
  "&" : ["01100","10010","10100","01000","10101","10010","01101"],
  "'" : ["00100","00100","00000","00000","00000","00000","00000"],
  "(" : ["00100","01000","01000","01000","01000","01000","00100"],
  ")" : ["00100","00010","00010","00010","00010","00010","00100"],
  "*" : ["00000","01010","00100","11111","00100","01010","00000"],
  "+" : ["00000","00100","00100","11111","00100","00100","00000"],
  "," : ["00000","00000","00000","00000","00000","00100","01000"],
  "-" : ["00000","00000","00000","01110","00000","00000","00000"],
  "." : ["00000","00000","00000","00000","00000","00100","00100"],
  "/" : ["00001","00001","00010","00100","01000","10000","10000"],
  ":" : ["00000","00100","00000","00000","00100","00000","00000"],
  ";" : ["00000","00100","00000","00000","00100","01000","00000"],
  "<" : ["00000","00010","00100","01000","00100","00010","00000"],
  "=" : ["00000","00000","11111","00000","11111","00000","00000"],
  ">" : ["00000","01000","00100","00010","00100","01000","00000"],
  "?" : ["01110","10001","00001","00110","00100","00000","00100"],
  "@" : ["01110","10001","10111","10101","10110","10000","01110"],
  "[" : ["01110","01000","01000","01000","01000","01000","01110"],
  "\\": ["10000","10000","01000","00100","00010","00001","00001"],
  "]" : ["01110","00010","00010","00010","00010","00010","01110"],
  "^" : ["00100","01010","10001","00000","00000","00000","00000"],
  "_" : ["00000","00000","00000","00000","00000","00000","11111"],
  "`" : ["01000","00100","00000","00000","00000","00000","00000"],
  "{" : ["00110","00100","00100","01000","00100","00100","00110"],
  "|" : ["00100","00100","00100","00100","00100","00100","00100"],
  "}" : ["01100","00100","00100","00010","00100","00100","01100"],
  "~" : ["00000","00000","01000","10101","00010","00000","00000"],
  "\u2665": ["00000","01010","11111","11111","01110","00100","00000"],
};

/* A stroke one cell thick is the whole of Collection 02's reading. This
   card wants three, which is not the same as drawing the same skeleton
   with fatter circles: the stroke has to become three instances across.

   So the glyph is redrawn on a finer grid — `thick` cells for every one
   of the original — and then thickened in two steps:

     join    the lit cells are joined to their neighbours on the fine grid
             before anything is thickened. Blowing the bitmap up on its own
             turns every diagonal into a staircase of blocks; joining the
             centres first keeps a diagonal a diagonal, so the A and the W
             come out as strokes rather than as steps.
     spread  then every cell of that skeleton claims its neighbours out to
             a radius of (thick - 1) / 2 — which is what makes the stroke
             `thick` instances across, evenly, whichever way it runs.

   `wide` stretches the letter sideways before any of that. A thick stroke
   eats a letter's counters — the hole in an O, the gap in an A — and past
   three the 5-wide bitmap has nothing left to give, so the letter is given
   the room instead of the stroke being taken away. */
const matrices = new Map();

/* Two ways to get from one instance across a stroke to three, and they are
   not the same picture.

   grid   the font's own grid, kept. The glyph is widened in whole cells if
          it is asked for, and then every lit cell simply claims its
          neighbours out to (thick - 1) / 2 — on the same lattice, at the
          same step. A 5 x 7 letter becomes 7 x 9. Every instance still
          stands on a cell of the grid the face was drawn on, a diagonal is
          still the staircase the face drew, and a letter is still countable
          in dots. What it costs is the counters: a thick stroke eats into
          the hole in an O, which is what `wide` is for.

   fine   the glyph is redrawn on a grid `thick` times finer, its cells
          joined to their neighbours before anything is thickened, and the
          skeleton then spread. This keeps diagonals running true and
          counters open, but the instances no longer sit on the face's grid
          — they sit on a subdivision of it, and the letter reads as a
          texture poured into a letter shape rather than as a grid of dots.

   `wide` stretches the letter sideways first, in both. On the grid reading
   it is whole cells, because a cell is the unit and half a cell does not
   exist there. */
function matrix(ch, thick, wide, mode = "block") {
  const key = `${ch}/${thick}/${wide}/${mode}`;
  let m = matrices.get(key);
  if (m) return m;
  const rows = GLYPHS[ch];
  const t = Math.max(1, Math.round(thick));
  const rad = (t - 1) / 2;
  if (!rows) {
    m = { cells: [], w: 0, x0: 0, full: GLYPH_COLS, h: GLYPH_ROWS };
    matrices.set(key, m);
    return m;
  }

  /* The disc a cell claims when the stroke thickens. */
  const disc = [];
  const lim = (rad + 0.5) ** 2;
  for (let dy = -Math.ceil(rad); dy <= Math.ceil(rad); dy++) {
    for (let dx = -Math.ceil(rad); dx <= Math.ceil(rad); dx++) {
      if (dx * dx + dy * dy <= lim) disc.push([dx, dy]);
    }
  }

  const lit = [];
  for (let r = 0; r < GLYPH_ROWS; r++) {
    for (let c = 0; c < GLYPH_COLS; c++) if (rows[r][c] === "1") lit.push([c, r]);
  }
  const on = new Set();
  const mark = (x, y) => on.add(`${x},${y}`);
  let cols, gridH, pad;

  if (mode === "block") {
    /* The most literal reading, and the one that keeps the face intact:
       where DotsMono puts one instance, put `thick` of them across and
       `thick` down. The grid is not left — it is read at `thick` times the
       resolution, and every instance lands on a cell of it. A stroke is
       three instances thick, a diagonal keeps exactly the staircase the
       face drew, and the letter is still the letter, because nothing has
       been joined, smoothed or spread into its counters. */
    const sx = Math.max(1, Math.round(t * wide)), sy = t;
    for (const [c, r] of lit) {
      for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) mark(c * sx + i, r * sy + j);
    }
    cols = GLYPH_COLS * sx; gridH = GLYPH_ROWS * sy; pad = 0;
  } else if (mode === "fine") {
    const sx = Math.max(1, Math.round(t * wide)), sy = t;
    const fx = (c) => c * sx + ((sx - 1) >> 1);
    const fy = (r) => r * sy + ((sy - 1) >> 1);
    const joinTo = (aa, bb) => {
      const x0 = fx(aa[0]), y0 = fy(aa[1]), x1 = fx(bb[0]), y1 = fy(bb[1]);
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) {
        mark(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n));
      }
    };
    const isLit = (c, r) => c >= 0 && c < GLYPH_COLS && r >= 0 && r < GLYPH_ROWS && rows[r][c] === "1";
    for (const [c, r] of lit) {
      mark(fx(c), fy(r));
      for (const [dc, dr] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
        if (isLit(c + dc, r + dr)) joinTo([c, r], [c + dc, r + dr]);
      }
    }
    cols = GLYPH_COLS * sx; gridH = GLYPH_ROWS * sy; pad = 0;
  } else {
    /* The grid reading. Widen in whole cells: an original column becomes a
       run of columns, so a horizontal stroke stays joined and every
       instance still lands on a cell. */
    cols = Math.max(GLYPH_COLS, Math.round(GLYPH_COLS * wide));
    for (const [c, r] of lit) {
      const from = Math.floor((c * cols) / GLYPH_COLS);
      const to = Math.floor(((c + 1) * cols) / GLYPH_COLS) - 1;
      for (let x = from; x <= to; x++) mark(x, r);
    }
    gridH = GLYPH_ROWS; pad = Math.ceil(rad);
  }

  /* Spread. On the grid reading the letter grows outwards by the radius,
     so the cells are nudged clear of the edge and the box grows with them. */
  const out = new Set();
  if (mode === "block") {
    for (const k of on) out.add(k);                  // already `thick` across
  } else {
    for (const k of on) {
      const [x, y] = k.split(",").map(Number);
      for (const [dx, dy] of disc) out.add(`${x + dx + pad},${y + dy + pad}`);
    }
  }

  let minX = Infinity, maxX = -Infinity;
  const cells = [];
  for (const k of out) {
    const [x, y] = k.split(",").map(Number);
    cells.push([x, y]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  const full = cols + 2 * pad;
  if (!cells.length) {
    m = { cells: [], w: 0, x0: 0, full, h: gridH + 2 * pad };
    matrices.set(key, m);
    return m;
  }
  /* Both readings are kept, and the card picks: `full` is the face's own
     advance, which is what keeps a monospaced font monospaced; `w` and `x0`
     are the letter measured to its own ink, for setting it tight. */
  m = { cells, w: maxX - minX + 1, x0: minX, full, h: gridH + 2 * pad };
  matrices.set(key, m);
  return m;
}

/* The instances. Collection 02 put a circle in every cell; this card puts
   one of these, picked per cell off the seeded stream, so a word is the
   same confetti every time it is drawn and a new seed reshuffles it.

   Each is written as a path relative to its own middle, so a cell is one
   move plus a body that was worked out once — the same string feeds an SVG
   in the studio and a Path2D on the export canvas. */
const n1 = (v) => (Math.round(v * 10) / 10).toString();
function polyBody(pts) {
  let d = `m${n1(pts[0][0])},${n1(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += `l${n1(pts[i][0] - pts[i - 1][0])},${n1(pts[i][1] - pts[i - 1][1])}`;
  return d + "z";
}
const spokes = (n, r, turn = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => {
    const a = turn + (i * 2 * Math.PI) / n;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });

export const PRIMS = {
  circle: (r) => `m${n1(-r)},0a${n1(r)},${n1(r)} 0 1,0 ${n1(2 * r)},0a${n1(r)},${n1(r)} 0 1,0 ${n1(-2 * r)},0z`,
  /* A ring is the circle with the middle taken back out — the inner arc is
     wound the other way, so under the default fill rule it reads as a hole
     even when every shape on the card is one long path. */
  ring: (r) => {
    const i = r * 0.54;
    return PRIMS.circle(r) + `m${n1(r - i)},0a${n1(i)},${n1(i)} 0 1,1 ${n1(2 * i)},0a${n1(i)},${n1(i)} 0 1,1 ${n1(-2 * i)},0z`;
  },
  square: (r) => { const s = r * 0.9; return polyBody([[-s, -s], [s, -s], [s, s], [-s, s]]); },
  rounded: (r) => {
    const s = r * 0.92, k = s * 0.44, m = 2 * (s - k);
    return `m${n1(-s + k)},${n1(-s)}l${n1(m)},0a${n1(k)},${n1(k)} 0 0,1 ${n1(k)},${n1(k)}`
         + `l0,${n1(m)}a${n1(k)},${n1(k)} 0 0,1 ${n1(-k)},${n1(k)}`
         + `l${n1(-m)},0a${n1(k)},${n1(k)} 0 0,1 ${n1(-k)},${n1(-k)}`
         + `l0,${n1(-m)}a${n1(k)},${n1(k)} 0 0,1 ${n1(k)},${n1(-k)}z`;
  },
  triangle: (r) => polyBody(spokes(3, r * 1.12)),
  diamond: (r) => polyBody(spokes(4, r * 1.08)),
  hexagon: (r) => polyBody(spokes(6, r * 1.02)),
  star: (r) => {
    const out = spokes(5, r * 1.15), inn = spokes(5, r * 0.5, -Math.PI / 2 + Math.PI / 5);
    const pts = [];
    for (let i = 0; i < 5; i++) { pts.push(out[i]); pts.push(inn[i]); }
    return polyBody(pts);
  },
  /* A cross, which is the one shape here that is not convex — it keeps the
     confetti from reading as all one family of blobs. */
  plus: (r) => {
    const s = r * 0.98, a = r * 0.34;
    return polyBody([
      [-a, -s], [a, -s], [a, -a], [s, -a], [s, a], [a, a],
      [a, s], [-a, s], [-a, a], [-s, a], [-s, -a], [-a, -a],
    ]);
  },
};
export const PRIM_NAMES = Object.keys(PRIMS);

/* ---------- Collection 05, card one: the dot-matrix letter in shapes ---------- */

/* Collection 02's Dots, taken two steps on. The letter is still read off
   the 5 x 7 bitmap and still drawn as instances rather than as an outline,
   but the stroke is three instances across instead of one, and the
   instance is no longer always a circle: every cell takes one of the
   primitives, picked off the seeded stream.

   Nothing moves yet. This is the structure — what the letters are made of
   and how they sit — with the house wobble on top so it is not dead.

   Every cell of every letter is one path, and the paths are handed over
   grouped by colour: three or four long strings for a card, rather than a
   thousand elements. That is what keeps it cheap in the DOM and identical
   on the export canvas, which takes the same strings through Path2D. */
function dotsPiece({
  word = "", palette, seed = 0,
  margin = MARGIN, thick = 3, wide = 1, track = 1, lead = 1.4,
  size = 0.82, prims = PRIM_NAMES, colour = "letter",
  jitter = JITTER, round = ROUND, lines: linesOpt = 0,
  mono = true, caps = "type", grid = "block",
} = {}) {
  const pal = dealPalette("dots", palette || p[0]);
  const rand = rng(seed);
  const bag = (Array.isArray(prims) ? prims : String(prims).split(","))
    .map((k) => String(k).trim()).filter((k) => PRIMS[k]);
  const pool = bag.length ? bag : ["circle"];

  /* DotsMono has both cases and the punctuation, so the card sets what was
     typed unless it is told otherwise — the house uppercase rule belongs to
     the sticker cards, which have one case to work with. */
  const typed = caps === "upper" ? String(word).toUpperCase()
              : caps === "lower" ? String(word).toLowerCase()
              : String(word);
  const words = typed.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const empty = !words.length;

  const t = Math.max(1, Math.round(thick));
  const sx = Math.max(1, Math.round(t * wide)), sy = t;
  const trackCells = Math.max(0, Math.round(track * sx));
  const spaceCells = SPACE_COLS * sx;
  const glyphH = matrix("A", t, wide, grid).h;
  const gapCells = Math.max(0, Math.round(lead * sy));

  const pad = STAGE * (margin / 100);
  const room = STAGE - pad * 2;

  /* What one letter takes up: the face's own five cells while it is set
     monospaced, or just its ink when it is not. */
  const advance = (m) => (mono ? m.full : m.w);

  /* How wide a run of text sits, in fine cells. */
  const runWidth = (text) => {
    const cs = [...text];
    let w = 0;
    cs.forEach((ch, i) => {
      w += ch === " " ? spaceCells : advance(matrix(ch, t, wide, grid));
      if (i < cs.length - 1) w += trackCells;
    });
    return w;
  };
  /* Split the words into n lines, as evenly as their lengths allow. */
  const split = (n) => {
    if (n <= 1) return [words.join(" ")];
    /* One word has nowhere to break, and a single line of it is always
       wider than it is tall — so in a square frame it sets small and the
       instances go to specks, which is the one thing this card cannot
       afford. A matrix display breaks a word across its rows, so this one
       does too, by letter. */
    if (words.length === 1) {
      const cs = [...words[0]];
      const per = Math.ceil(cs.length / n);
      const out = [];
      for (let i = 0; i < cs.length; i += per) out.push(cs.slice(i, i + per).join(""));
      return out;
    }
    const out = Array.from({ length: n }, () => []);
    const total = words.reduce((a, w) => a + w.length + 1, 0);
    let i = 0, acc = 0;
    for (const w of words) {
      out[i].push(w);
      acc += w.length + 1;
      if (i < n - 1 && acc >= (total * (i + 1)) / n) i++;
    }
    return out.filter((g) => g.length).map((g) => g.join(" "));
  };

  /* Try every number of lines the word could take and keep whichever fills
     the frame best — a long word laid across one line sets tiny, and the
     same word over three lines sets large. The card decides; the margin
     says how much room it is deciding inside. */
  let lines = [], cell = 0;
  if (!empty) {
    /* How many lines are even on the table: one per word, or — for a
       single word — one per letter. */
    const most = Math.min(6, words.length > 1 ? words.length : [...words[0]].length);
    let bestU = 0, best = [];
    for (let n = 1; n <= most; n++) {
      const set = split(n);
      if (!set.length) continue;
      const W = Math.max(...set.map(runWidth));
      const H = set.length * glyphH + (set.length - 1) * gapCells;
      if (!W || !H) continue;
      const u = Math.min(room / W, room / H);
      if (u > bestU) { bestU = u; best = set; }
      if (linesOpt && set.length === linesOpt) { lines = set; cell = u; }
    }
    /* A line count can be asked for that the text cannot make — four
       letters will not sit on five rows. Rather than draw nothing, the
       card falls back to the arrangement that fills the frame best. */
    if (!lines.length) { lines = best; cell = bestU; }
  }

  /* Place every cell of every letter. The shape it takes and the colour it
     wears are settled here, once, off the seeded stream — so the confetti
     is the same every time the card is drawn, and a new seed reshuffles it
     without touching the letters. */
  const spots = [];
  if (!empty) {
    const W = Math.max(...lines.map(runWidth));
    const H = lines.length * glyphH + (lines.length - 1) * gapCells;
    const x0 = STAGE / 2 - (W * cell) / 2;
    const y0 = STAGE / 2 - (H * cell) / 2;
    const stops = [pal.card, pal.ink, pal.anchor];
    let letterN = 0, wordN = 0;
    const inkLetters = lines.join("").replace(/ /g, "").length;

    lines.forEach((text, li) => {
      const cs = [...text];
      const lineW = runWidth(text);
      let cx = x0 + ((W - lineW) * cell) / 2;      // each line centred in the block
      const cy = y0 + li * (glyphH + gapCells) * cell;
      cs.forEach((ch, i) => {
        if (ch === " ") { cx += (spaceCells + trackCells) * cell; wordN++; return; }
        const m = matrix(ch, t, wide, grid);
        const shift = mono ? 0 : m.x0;
        const tone = colour === "ramp" ? ramp(stops, inkLetters > 1 ? letterN / (inkLetters - 1) : 0)
                   : colour === "word" ? stops[wordN % stops.length]
                   : colour === "flat" ? stops[0]
                   : stops[letterN % stops.length];                // "letter", and the default
        for (const [gx, gy] of m.cells) {
          spots.push({
            x: cx + (gx - shift + 0.5) * cell,
            y: cy + (gy + 0.5) * cell,
            prim: pool[(rand() * pool.length) | 0],
            tone: colour === "mix" ? stops[(rand() * stops.length) | 0] : tone,
          });
        }
        letterN++;
        cx += (advance(m) + trackCells) * cell;
      });
    });
  }

  /* One body per primitive, worked out once: a cell is then a move plus
     that body, which is the whole of the per-frame cost. */
  const r = (cell * size) / 2;
  const bodies = {};
  for (const k of pool) bodies[k] = PRIMS[k](r);

  let now = 0;
  function stepClock(dt) { now += dt * 1000; }

  function snapshot(frame) {
    const byTone = new Map();
    spots.forEach((s, i) => {
      const x = s.x + wobble(i, frame, 0) * jitter;
      const y = s.y + wobble(i, frame, 1) * jitter;
      let d = byTone.get(s.tone);
      if (!d) { d = []; byTone.set(s.tone, d); }
      d.push(`M${x.toFixed(1)},${y.toFixed(1)}${bodies[s.prim]}`);
    });
    const tiles = [];
    for (const [tone, parts] of byTone) {
      tiles.push({ kind: "paths", id: `p${tone}`, d: parts.join(""), colour: tone, alpha: 1 });
    }
    return { bg: pal.frame, tiles };
  }

  return {
    step: stepClock, snapshot, pal, empty,
    loopPeriod: round,
    get now() { return now; },
    measure: { lines: lines.length, rowH: cell, letters: spots.length },
  };
}

/* ---------- the engine ---------- */

/* What a card ships with before the page asks for anything. There is one
   card on this canvas and it is called `still`: it sets the word and then
   does nothing at all, so what you are looking at is the type, the
   sticker, the palette and the grain, with no motion on top of them.
   The next card gets added here. */
const CARD = {
  still: {},
  /* Three instances across, and every primitive in the bag. */
  dots: { thick: 3, wide: 1, track: 1, lead: 1.4, size: 0.82, margin: 10, colour: "letter", mono: true, grid: "block" },
};

function engine(mode, o = {}) {
  const opts = { ...CARD[mode], ...o };
  return mode === "dots" ? dotsPiece(opts) : piece(mode, opts);
}

/* Runs the piece on a virtual clock. step(dt) advances it; snapshot(frame)
   describes what to paint for stop-motion frame `frame`. */
function piece(mode, {
  word = "", palette, seed = 0,
  margin = MARGIN, letter = LETTER_SAY, font = FONT, track = TRACK, lead = LEAD,
  shape = SHAPE, weight = WEIGHT, tile = TILE,
  thread = false, threadScale = 1,
  jitter = JITTER, round = ROUND, colour = "ramp",
} = {}) {
  const pal = dealPalette(mode, palette || p[0]);
  const rand = rng(seed);
  const chars = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  const empty = chars.length === 0;

  /* The room the drawing has: the square inside the margin. A margin is
     not a scale — it says what the edge keeps clear, and the block is
     fitted into what is left. */
  const pad = STAGE * (margin / 100);
  const room = STAGE - pad * 2;

  /* Break the word into lines that read across. One line while it fits;
     past that, as many as it takes to keep the letters big enough to be
     read, broken at the spaces where there are any. */
  function linesFor(n) {
    /* DotsMono has both cases and the punctuation, so the card sets what was
     typed unless it is told otherwise — the house uppercase rule belongs to
     the sticker cards, which have one case to work with. */
  const typed = caps === "upper" ? String(word).toUpperCase()
              : caps === "lower" ? String(word).toLowerCase()
              : String(word);
  const words = typed.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    if (!words.length) return [];
    if (n <= 1) return [words.join(" ")];
    const per = Math.ceil(words.length / n);
    const out = [];
    for (let i = 0; i < words.length; i += per) out.push(words.slice(i, i + per).join(" "));
    return out;
  }

  /* Try one line, then two, then three... and keep the first arrangement
     whose letters clear MIN_H. The row height is whatever makes the widest
     line fit the room across, capped so a two-letter word is not blown up. */
  let lines = [], rowH = MIN_H;
  const widestAt = (text, h) => {
    let w = 0;
    const cs = [...text];
    for (let i = 0; i < cs.length; i++) {
      w += cs[i] === " " ? h * 0.32 : widthOf(cs[i], h);
      if (i < cs.length - 1) w += h * track;
    }
    return w;
  };
  function widthOf(ch, h) {
    if (shape === "letter") return stickerFor(ch, h * tile, weight).W;
    if (shape === "capsule" || shape === "chamfer") return h * tile * TILE_W;
    return glyphWidth(ch, h * font * (letter / 100), weight);
  }
  if (!empty) {
    for (let n = 1; n <= 8; n++) {
      const set = linesFor(n);
      if (!set.length) break;
      /* The height a line of this many rows can stand at, and the height
         the widest of them can be and still fit across. */
      const byHeight = (room - (set.length - 1) * 0 ) / (set.length + (set.length - 1) * lead);
      let h = Math.min(MAX_H, byHeight);
      for (let k = 0; k < 24; k++) {
        const widest = Math.max(...set.map((t) => widestAt(t, h)));
        if (widest <= room || widest === 0) break;
        h *= room / widest;
      }
      lines = set; rowH = h;
      if (h >= MIN_H || n === 8) break;
    }
    rowH = Math.max(MIN_H, rowH);
  }

  /* Lay the letters out. Every letter keeps its home (cx, cy) and its own
     size; a card moves them from there. A space is a real gap and carries
     no bead, so a thread runs straight through it. */
  const letters = [];
  const step = rowH * (1 + lead);
  const blockH = lines.length ? rowH + (lines.length - 1) * step : 0;
  const top = STAGE / 2 - blockH / 2 + rowH / 2;
  let id = 0, ink = 0, inkTotal = 0;
  for (const text of lines) for (const ch of text) if (ch !== " ") inkTotal++;
  lines.forEach((text, r) => {
    const cs = [...text];
    const w = widestAt(text, rowH);
    let x = STAGE / 2 - w / 2;
    const cy = top + r * step;
    cs.forEach((ch, i) => {
      const cw = ch === " " ? rowH * 0.32 : widthOf(ch, rowH);
      if (ch !== " ") {
        const spec = shape === "letter" ? stickerFor(ch, rowH * tile, weight) : null;
        letters.push({
          id: id++, ch, group: r, blank: false,
          cx: x + cw / 2, cy, w: cw, h: rowH * tile, spec,
          t: inkTotal > 1 ? ink / (inkTotal - 1) : 0,
          size: shape === "letter" ? spec.size * (letter / 100)
              : shape === "none" ? rowH * font * (letter / 100)
              : rowH * tile * TILE_FONT * (letter / 100),
          r: rand(),
        });
        ink++;
      } else {
        letters.push({ id: id++, ch, group: r, blank: true, cx: x + cw / 2, cy, w: cw, h: rowH * tile });
      }
      x += cw + rowH * track;
    });
  });

  /* Where the colour goes. The ground is the frame; the letters step
     through the other three, one step per letter, so a line runs the
     palette left to right. A card that wants a different rule writes one. */
  const stops = [pal.card, pal.ink, pal.anchor];
  const toneOf = (L) => (colour === "ramp" ? ramp(stops, L.t)
                       : colour === "cycle" ? stops[L.id % stops.length]
                       : stops[0]);

  let now = 0;
  function stepClock(dt) { now += dt * 1000; }

  /* What to paint for stop-motion frame `frame`. Nothing here moves yet —
     the letters sit at home, with the house wobble on top so the picture
     is hand-held rather than dead. */
  function snapshot(frame) {
    const tiles = [];
    const shaped = shape !== "none";
    const cut = shape === "letter";
    const place = (L) => ({
      x: L.cx + wobble(L.id, frame, 0) * jitter,
      y: L.cy + wobble(L.id, frame, 1) * jitter,
    });
    /* A line's thread, laid down before its own beads so it sits under them. */
    if (thread) {
      let run = [], g = -1, tone = null;
      const flush = () => {
        if (run.length > 1) {
          tiles.push({
            kind: "thread", id: `t${g}`, d: threadPath(run, false),
            colour: tone, width: rowH * THREAD * threadScale, alpha: 1,
          });
        }
        run = [];
      };
      for (const L of letters) {
        if (L.blank) continue;
        if (L.group !== g) { flush(); g = L.group; }
        const q = place(L);
        tone = toneOf(L);
        run.push([q.x, q.y]);
      }
      flush();
    }
    for (const L of letters) {
      if (L.blank) continue;
      const q = place(L);
      const tone = toneOf(L);
      tiles.push({
        kind: "tile", id: L.id, ch: L.ch, p: 0.5,
        shape: shaped ? shape : null, spec: L.spec,
        w: L.w, h: L.h, size: L.size, weight,
        fill: shaped ? tone : null,     // the sticker
        ink: shaped ? LETTER : tone,    // the letter on it
        x: q.x, y: q.y, rot: 0, alpha: 1,
      });
    }
    return { bg: pal.frame, tiles };
  }

  return {
    step: stepClock, snapshot, pal, empty,
    loopPeriod: round,
    get now() { return now; },
    /* Handed out so the lab can report what the layout actually decided. */
    measure: { lines: lines.length, rowH, letters: letters.filter((L) => !L.blank).length },
  };
}

/* ---------- DOM renderer (studio, embed, lab) ---------- */

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
  if (eng.empty) return { stop() {}, eng };

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
  const SVG_NS = "http://www.w3.org/2000/svg";
  /* Two kinds of vector reach here: a "thread" is one stroked line through
     a run of letters, and "paths" is every instance of one colour on a
     dot-matrix card, concatenated into a single filled path. Both are one
     SVG with one <path> in it — which is the point, since the second kind
     would otherwise be a thousand elements. */
  function paintVector(t, depth) {
    let el = els.get(t.id);
    if (!el) {
      el = document.createElementNS(SVG_NS, "svg");
      el.setAttribute("viewBox", `0 0 ${STAGE} ${STAGE}`);
      el.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;";
      const line = document.createElementNS(SVG_NS, "path");
      if (t.kind === "thread") {
        line.setAttribute("fill", "none");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("stroke-linejoin", "round");
      } else {
        line.setAttribute("stroke", "none");
      }
      el.appendChild(line);
      layer.appendChild(el);
      els.set(t.id, el);
    }
    el.style.zIndex = depth;
    const line = el.firstChild;
    line.setAttribute("d", t.d);
    if (t.kind === "thread") {
      line.setAttribute("stroke", t.colour);
      line.setAttribute("stroke-width", t.width.toFixed(1));
    } else {
      line.setAttribute("fill", t.colour);
    }
    line.setAttribute("opacity", t.alpha.toFixed(3));
  }

  function paintFrame(frame) {
    const s = eng.snapshot(frame);
    if (noise) noise.style.backgroundImage = tiles[frame % tiles.length];
    const seen = new Set();
    /* The snapshot lists back to front, so the index is the stacking order —
       elements are made as they are first needed, which is not that order. */
    let depth = 0;
    for (const t of s.tiles) {
      seen.add(t.id);
      if (t.kind === "thread" || t.kind === "paths") { paintVector(t, depth++); continue; }
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
      el.style.zIndex = depth++;
      el.style.opacity = t.alpha;
      el.style.transform = `translate(${(t.x - t.w / 2).toFixed(2)}px, ${(t.y - t.h / 2).toFixed(2)}px)${t.rot ? ` rotate(${t.rot}rad)` : ""}`;
    }
    for (const [key, el] of els) if (!seen.has(key)) { el.remove(); els.delete(key); }
  }

  /* The virtual clock, driven in real time — but the picture is only
     repainted FPS times a second, which is what makes it stop-motion. */
  let raf = 0, last = performance.now(), acc = 0, frame = 0, running = true;
  paintFrame(0);
  function tick(t) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.1, (t - last) / 1000);
    last = t;
    if (!running) return;
    eng.step(dt);
    acc += dt;
    if (acc >= 1 / fps) { acc %= 1 / fps; paintFrame(++frame); }
  }
  raf = requestAnimationFrame(tick);

  return {
    stop() { cancelAnimationFrame(raf); },
    /* The lab drives these; the studio and the embed never touch them. */
    pause() { running = false; },
    play() { running = true; last = performance.now(); },
    get running() { return running; },
    seek(f) { frame = f; paintFrame(frame); },
    get frame() { return frame; },
    eng,
  };
}

export const still = (stage, opts) => mount(stage, "still", opts);

/* ---------- canvas renderer (export page, and anything else) ---------- */

/* Paint one snapshot into a canvas `size` px square. */
export function paint(ctx, s, size) {
  const k = size / STAGE;
  ctx.save();
  ctx.fillStyle = s.bg;
  ctx.fillRect(0, 0, size, size);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  for (const t of s.tiles) {
    ctx.globalAlpha = t.alpha;
    if (t.kind === "thread" || t.kind === "paths") {
      ctx.save();
      ctx.scale(k, k);
      if (t.kind === "thread") {
        ctx.strokeStyle = t.colour;
        ctx.lineWidth = t.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke(new Path2D(t.d));
      } else {
        ctx.fillStyle = t.colour;
        ctx.fill(new Path2D(t.d));
      }
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
    const m = ctx.measureText(t.ch);
    ctx.fillText(t.ch, -(m.width || 0) / 2, 0);
    ctx.restore();
  }
  ctx.restore();
}

/* ---------- the export page's own scene ---------- */

const EXPORT_SEED = 20260920;

/* Build every frame of the loop up front on a fixed step, so the export is
   deterministic and joins up. */
function scene(mode, { word = "", palette, seed, grain = true, grainOpacity, grainScale = 1.2 } = {}) {
  const opts = { word, palette, seed: seed === undefined ? EXPORT_SEED : seed };
  const pal = dealPalette(mode, palette || p[0]);
  let frames = null, cachedTotal = 0;
  function build(total) {
    const e = engine(mode, opts);
    const period = e.empty ? EXPORT_LEAST : e.loopPeriod / 1000;
    frames = [];
    let simT = 0;
    /* Fit a whole number of periods into the export's own running time, so
       the loop joins up AND plays at very nearly the speed it plays on the site. */
    const dur = period * Math.max(1, Math.round(total / FPS / period));
    for (let i = 0; i < total; i++) {
      const target = (i / total) * dur;
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
  const probe = engine(mode, opts);
  const period = probe.empty ? EXPORT_LEAST : probe.loopPeriod / 1000;
  const seconds = period * Math.max(1, Math.ceil(EXPORT_LEAST / period));
  return {
    draw, seconds, n: Math.round(seconds * FPS), pal,
    grain: grain ? { opacity: g.opacity, blend: g.blend, scale: grainScale, animated: true } : null,
  };
}

export const x = {
  "five-still": (o) => scene("still", o),
  "five-dots": (o) => scene("dots", o),
};

/* Exposed so a page can sample the real simulation rather than
   re-implementing it. */
export { engine, mount, matrix, STAGE, FPS, CARD };
