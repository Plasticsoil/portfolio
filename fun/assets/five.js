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

/* ---------- the engine ---------- */

/* What a card ships with before the page asks for anything. There is one
   card on this canvas and it is called `still`: it sets the word and then
   does nothing at all, so what you are looking at is the type, the
   sticker, the palette and the grain, with no motion on top of them.
   The next card gets added here. */
const CARD = {
  still: {},
};

function engine(mode, o = {}) { return piece(mode, { ...CARD[mode], ...o }); }

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
    const words = String(word).toUpperCase().replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
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

  function paintFrame(frame) {
    const s = eng.snapshot(frame);
    if (noise) noise.style.backgroundImage = tiles[frame % tiles.length];
    const seen = new Set();
    /* The snapshot lists back to front, so the index is the stacking order —
       elements are made as they are first needed, which is not that order. */
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
};

/* Exposed so a page can sample the real simulation rather than
   re-implementing it. */
export { engine, mount, STAGE, FPS, CARD };
