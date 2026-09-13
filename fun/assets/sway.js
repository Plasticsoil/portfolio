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

   Settled so far, from the lab (September 2026):
     motion   cubic-bezier(0.51, 0, 0.33, 1.01) — a slow leave, a quick
              middle, a hair of overshoot at the edge
     timing   1300 ms a slide, 380 ms standing at each end, 112 ms
              between one letter and the next (scaled down past 13 letters)
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
     open     the card is called Sway for now (Slide, Drift, Comb and Lag
              were the other names on the table)

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
                                // so the text never hugs the sides of the frame
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

const ROT = { sway: 0 };
function dealPalette(mode, given) {
  const quad = [given.frame, given.card, given.ink, given.anchor];
  const rot = ROT[mode] || 0;
  return { frame: quad[rot], card: quad[(rot + 1) % 4], ink: quad[(rot + 2) % 4], anchor: quad[(rot + 3) % 4] };
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
  for (let c = 1; c <= MAX_COLS; c++) {
    const rows = Math.ceil(n / c);
    const h = Math.min(MAX_H, usable / rows);
    const w = h * font * GLYPH_W;
    const lane = STAGE / c;
    if (h >= MIN_H && w * 1.9 <= lane) return { cols: c, rows, h, w, lane };
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
                        shape = SHAPE, thread = true, weight = WEIGHT } = {}) {
  const pal = dealPalette(mode, palette || p[0]);
  const chars = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  const empty = !chars.filter((c) => c !== " ").length;
  const rtl = /[֐-׿؀-ۿ]/.test(chars.join(""));
  const L = layout(Math.max(1, chars.length), font);
  const shaped = shape !== "none";
  const cut = shape === "letter";           // … and cut to the letter, rather than one box
  const tileH = L.h * TILE, tileW = tileH * TILE_W;

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
  const halfFor = (w) => (L.lane / 2 - LANE_PAD - (shaped ? w / 2 : 0)) / (1 + 2 * over);
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

  function build() {
    letters = [];
    if (empty) return;
    chars.forEach((ch, i) => {
      const col = Math.floor(i / L.rows);
      const row = i % L.rows;
      const inCol = Math.min(L.rows, chars.length - col * L.rows);
      const lane = rtl ? L.cols - 1 - col : col;
      const cx = L.lane * (lane + 0.5);
      const cy = (STAGE - inCol * L.h) / 2 + L.h / 2 + row * L.h;
      letters.push({
        id: i, ch, blank: ch === " ", col,
        /* Only used when the copies are faded rather than coloured. */
        fill: colour === "cycle" ? stops[i % stops.length]
          : ramp(stops, chars.length > 1 ? i / (chars.length - 1) : 0),
        /* A negative delay just turns the wave around: the bottom letter
           leads and the top one follows. */
        cx, cy, t0: BEAT + (stagger < 0 ? chars.length - 1 - i : i) * Math.abs(stagger),
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

  /* Where one letter's rank-k sticker sits, and how wide it is. The
     hand-held wobble is the letter's own, shared by its copies, so at rest
     they stack exactly. */
  function place(Lt, k, frame) {
    const p = align(Lt, now - k * echoDelay);
    const spec = cut ? stickerFor(Lt.ch, tileH, weight) : null;
    const w = cut ? spec.W : shaped ? tileW : L.w;
    return {
      p, spec, w,
      x: Lt.cx + (p * 2 - 1) * halfFor(w) + wobble(Lt.id, frame, 0) * JITTER,
      y: Lt.cy + wobble(Lt.id, frame, 1) * JITTER,
    };
  }

  function snapshot(frame) {
    const tiles = [];
    const solid = colour === "spectrum" || colour === "trail";
    /* Rank by rank, the furthest copy first: the whole trail paints behind
       the whole word rather than letter by letter, and since every copy is
       the same glyph at the same size, one that has caught up with its
       letter disappears under it. */
    for (let k = echoes; k >= 0; k--) {
      const alpha = solid || k === 0 ? 1 : (echoAlpha * (echoes - k + 1)) / echoes;
      /* The thread this rank is strung on — one run per column, laid down
         before its own beads. A space breaks nothing: the thread simply
         carries on to the next letter. */
      if (thread) {
        let run = [], col = -1, tone = null;
        const flush = () => {
          if (run.length > 1) tiles.push({ kind: "thread", id: `t${k}-${col}`, points: run, colour: tone, width: L.h * THREAD, alpha });
          run = [];
        };
        for (const Lt of letters) {
          if (Lt.blank) continue;
          if (Lt.col !== col) { flush(); col = Lt.col; }
          const q = place(Lt, k, frame);
          tone = toneOf(Lt, k);
          run.push([q.x, q.y]);
        }
        flush();
      }
      for (const Lt of letters) {
        if (Lt.blank) continue;
        const q = place(Lt, k, frame);
        const tone = toneOf(Lt, k);
        tiles.push({
          kind: "tile", id: Lt.id * 16 + k, ch: Lt.ch, p: shaped ? 0.5 : q.p,
          shape: shaped ? shape : null, spec: q.spec,
          w: q.w, h: shaped ? tileH : L.h,
          size: cut ? q.spec.size : shaped ? tileH * TILE_FONT : L.h * font,
          weight,
          fill: shaped ? tone : null,      // the sticker
          ink: shaped ? LETTER : tone,     // the letter on it
          x: q.x, y: q.y, alpha,
        });
      }
    }
    return { bg: pal.frame, tiles };
  }

  build();
  return {
    step, snapshot, restart, pal, empty,
    get loops() { return loops; },
    get now() { return now; },
    /* One seamless loop of the steady state: from the moment the last
       letter starts sliding, two passes long (left and back). */
    get loopStart() { return (chars.length - 1) * Math.abs(stagger) + BEAT + passGap; },
    get loopPeriod() { return 2 * passGap; },
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
  function paintThread(t) {
    let el = els.get(t.id);
    if (!el) {
      el = document.createElementNS(SVG_NS, "svg");
      el.setAttribute("viewBox", `0 0 ${STAGE} ${STAGE}`);
      el.style.cssText = "position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;";
      const line = document.createElementNS(SVG_NS, "polyline");
      line.setAttribute("fill", "none");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("stroke-linejoin", "round");
      el.appendChild(line);
      layer.appendChild(el);
      els.set(t.id, el);
    }
    const line = el.firstChild;
    line.setAttribute("points", t.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" "));
    line.setAttribute("stroke", t.colour);
    line.setAttribute("stroke-width", t.width.toFixed(1));
    line.setAttribute("opacity", t.alpha.toFixed(3));
  }

  function paint(frame) {
    const s = eng.snapshot(frame);
    if (noise) noise.style.backgroundImage = tiles[frame % tiles.length];
    const seen = new Set();
    for (const t of s.tiles) {
      seen.add(t.id);
      if (t.kind === "thread") { paintThread(t); continue; }
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
      el.style.transform = `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) translate(${(-t.p * 100).toFixed(2)}%, -50%)`;
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

/* ---------- canvas renderer (export page) ---------- */

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
    const k = size / STAGE;
    const s = frames[Math.max(0, Math.min(frames.length - 1, frame | 0))];
    ctx.save();
    ctx.fillStyle = s.bg;
    ctx.fillRect(0, 0, size, size);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (const t of s.tiles) {
      ctx.globalAlpha = t.alpha;
      if (t.kind === "thread") {
        ctx.strokeStyle = t.colour;
        ctx.lineWidth = t.width * k;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        t.points.forEach(([x, y], i) => (i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k)));
        ctx.stroke();
        continue;
      }
      if (t.shape === "letter") {
        ctx.save();
        ctx.translate(t.x * k - (t.w * k) / 2, t.y * k - (t.h * k) / 2);
        ctx.scale(k, k);
        ctx.fillStyle = t.fill;
        specPath(ctx, t.spec);
        ctx.fill();
        ctx.restore();
      } else if (t.shape) {
        ctx.fillStyle = t.fill;
        stickerPath(ctx, t.x * k, t.y * k, t.w * k, t.h * k, t.shape);
        ctx.fill();
      }
      ctx.fillStyle = t.ink;
      ctx.font = `${t.weight} ${t.size * k}px "Switzer","Rubik",system-ui,sans-serif`;
      ctx.fillText(t.ch, t.x * k - t.p * ctx.measureText(t.ch).width, t.y * k);
    }
    ctx.restore();
  }
  const g = grainFor(pal.frame, { opacity: grainOpacity });
  return { draw, n: 90, pal, grain: grain ? { opacity: g.opacity, blend: g.blend, scale: grainScale, animated: true } : null };
}
export const x = { sway: (o) => scene("sway", o) };

/* Exposed so the export page can sample a single still frame (SVG) straight
   off the real simulation instead of re-implementing it. */
export { engine };
