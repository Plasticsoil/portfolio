/* FunType — Collection 04: Sway, Flower.

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
     colour   lime · pink · orange · yellow, each taking a turn as the
              background; the sticker one colour, the copies solid steps
              along a gradient between the other two, letters always slate.
              The lime never pairs with the orange or with the pink as the
              two ends of that gradient — both go grey in the middle — and
              a set that asks for it has the sticker swapped in instead
     echo     six copies, 120 ms apart
     type     Switzer 500 slate on a sticker cut to the letter (Collection
              01's), the sticker 0.84 of its row, the column four fifths of
              the frame's height, 95 px clear of the sides
     grain    0.5 overlaid on a light ground — the house value, the same as
              every other collection; 0.10 screened on a dark one, since
              screened noise reads far stronger than overlaid
     weight   Switzer 500, settled
     rate     12 fps, the house stop-motion — settled against 8 and 10
     name     Sway (Slide, Drift, Comb and Lag were the other names on
              the table)

   Card two, Flower, settled the same way (September 2026):
     motion   the word is a loading bar bent round a ring. Its head goes
              round for ever, surging and easing off but never stopping,
              and every letter behind it is that same head a moment
              earlier — so the tail is always chasing the head, and the
              word strings out and gathers up as the head pulls away and
              eases. Six surges to a round of 16 s, on Sway's own curve
     spread   the letters take the whole ring, packed and spread alike:
              the chase is in the pace, not in the width
     copies   seven, 435 ms apart, each stepping 11% inside the ring the
              last one was on, turned 61° back round it and drawn 7%
              smaller — which is what makes the flower
     thread   none: the copies are the drawing
     colour   the pink ground, orange sticker, the copies stepping from
              the lime to the yellow
     word     Flower power
     type     as Sway: Switzer 500 slate on Collection 01's letter-cut
              sticker, the grain, 12 fps
     name     Flower (it was Rings while it was still being drawn)

   And the collection itself, settled across the three (September 2026):
     order    Flower, Sway, Volume — the lime ground in the middle of the
              pink and the orange
     grounds  Flower on the pink, Sway on the lime, Volume on the orange;
              each one's sticker and gradient follow from that
     words    Flower power · Make it sway · Grow slowly
     thread   one weight for every thread the collection draws — 0.0675 of
              a row — and Flower bare, its copies being the drawing
     copies   each card keeps its own: six 120 ms apart, seven 435 apart,
              four 205 apart. They read differently on each card
     export   whole rounds at the speed the site runs them: Sway 6.72 s,
              Flower 16 s, Volume 4.1 s

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
const THREAD = 0.0675;          // every thread the collection draws, as a share of a row
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
const RING_BAR_TURN = 16000;    // ms for the word to travel once round the ring
const RING_BAR_BEATS = 6;       // … how many surges it makes in that round…
const RING_BAR_TIGHT = 0.8;     // … how close the letters pack, in letter-widths…
const RING_BAR_SQUEEZE = 1;     // … how far it pulls in, which is also what sets the letter
                                //   size on the ring…
const RING_BAR_SPREAD = 1;      // … and how much of it the spread bar takes
const RING_BAR_EASE = "sway";   // … the curve it surges on…
const RING_BAR_CHASE = 1;       // … and how far behind the head the tail runs it, as a share
                                //   of the longest lag the round can carry
/* Eights */
const EIGHT_TURN = 7000;        // ms to travel the whole eight once
const EIGHT_FLIP = 2;           // … and the figure turns over once every this many rounds
/* Volume */
/* Volume — every letter is a stem growing out of a base line along the
   bottom of the frame, rising and sinking back. A word is a row: the same
   base, a lower reach than the row before it, so the whole thing stands
   like a shrub. */
const VOL_BEAT = 4100;          // ms for a letter to rise and sink back once
const VOL_OFFSET = -105;        // … and this long after the letter beside it
const VOL_FLOOR = 9;            // the stems start this far off the bottom, in hundredths…
const VOL_TOP = 78;             // … the first row reaches this far up it…
const VOL_CEIL = 90;            // … and nothing ever gets past this, however the wander falls
const VOL_FALL = 2;             // … the row at the back reaches this share of it, the rows in
                                //   between spread evenly down from one to the other
const VOL_LOW = 16;             // a letter never sinks below this share of its own reach
const VOL_ARCH = 40;            // how much higher the middle of a row stands than its ends
const VOL_JITTER = 11;          // … and how far each letter wanders off that, as a share of the
                                //   front row's reach, so a low row is as uneven as a tall one
const VOL_SIZE = 138;           // the letters, as a share of the size the rows can carry
const VOL_STEM = 100;           // the stems, at that same weight…
const VOL_LEAN = 100;           // … and how far they lean in to meet in the middle on the way down
const VOL_INSET = 14;           // every row behind draws in this much from the sides
const VOL_EASE = "sway";        // the curve a letter rises and sinks on

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
  { frame: "#D9FF7E", card: "#FFBECA", ink: "#FF8F5E", anchor: "#FFFF85" },   // lime ground — Sway
  { frame: "#FFBECA", card: "#FF8F5E", ink: "#D9FF7E", anchor: "#FFFF85" },   // pink ground — Flower
  { frame: "#FF8F5E", card: "#FFBECA", ink: "#D9FF7E", anchor: "#FFFF85" },   // orange ground — Volume
  { frame: "#FFFF85", card: "#D9FF7E", ink: "#FF8F5E", anchor: "#FFBECA" },   // yellow ground
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
  "#D9FF7E", "#FFBECA", "#FF8F5E", "#FFFF85", "#0D0D0F",                  // Collection 04
  "#49C7FD", "#FA8EFA", "#FFFF66",                                        // 03
  "#A9FF67", "#5BE03A", "#D9FF93", "#B9F1FA",                             // 02
  "#FF42FF", "#FFDD00", "#FF7300", "#FF721E",                             // 01
];

/* Two of the collection's colours must never be the two ends of the copies'
   gradient: the lime with the orange, and the lime with the pink. Both of
   those cross through grey in the middle, and a rank of grey copies is not
   a colour anyone chose. Every other pairing is fine. */
const FEUD = [["#D9FF7E", "#FF8F5E"], ["#D9FF7E", "#FFBECA"]];
const atOdds = (a, b) => {
  const x = String(a).toUpperCase(), y = String(b).toUpperCase();
  return FEUD.some(([m, n]) => (x === m && y === n) || (x === n && y === m));
};

/* The four colours are read in the order they are given: the first is the
   ground, the second the sticker, and the copies run between the last two.
   A card gets its own ground by being handed a different one of the sets
   above, not by rotating the set it is given — so what you pick is what
   you see, with one exception: if the two ends of the gradient are a pair
   that would go grey between them, the sticker takes one of their places.
   With four colours there is always a way round. */
function dealPalette(_mode, given) {
  let { frame, card, ink, anchor } = given;
  if (atOdds(ink, anchor)) {
    if (!atOdds(ink, card)) [card, anchor] = [anchor, card];
    else if (!atOdds(card, anchor)) [card, ink] = [ink, card];
  }
  return { frame, card, ink, anchor };
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
const GRAIN_TILES = 6, GRAIN_TILE = 192, GRAIN_OPACITY = 0.5, GRAIN_DARK = 0.1;

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

/* What a card ships with, before anything the page asks for. Sway takes the
   bare defaults; Flower is the settled set from the lab. */
const CARD = {
  flower: { echoes: 7, echoDelay: 435, echoIn: 0.11, echoTurn: -61, echoShrink: 0.07, thread: false, scale: 0.75 },
  volume: { echoes: 4, echoDelay: 205, seed: 67138, scale: 0.75 },
};

/* Runs the piece on a virtual clock. step(dt) advances it; snapshot(frame)
   describes what to paint for stop-motion frame `frame`. The word is on
   screen from the first frame and nothing ever ends: once the wave has
   reached the last letter, every letter is oscillating with the same
   period (loopPeriod), a stagger apart. */
function engine(mode, o = {}) { return piece(mode, { ...CARD[mode], ...o }); }
function piece(mode, { word = "", palette, seed = 0, stagger: staggerOpt, move = MOVE_MS, hold = HOLD_MS,
                        curve = CURVE, font = FONT, echoes = ECHOES,
                        echoDelay = ECHO_MS, echoAlpha = ECHO_ALPHA, colour = COLOUR,
                        shape = SHAPE, thread = true, threadScale = 1, weight = WEIGHT, scale = 1,
                        /* Rings */
                        ringFace = false, ringOne = false,
                        barTurn = RING_BAR_TURN, barBeats = RING_BAR_BEATS, barTight = RING_BAR_TIGHT,
                        barSqueeze = RING_BAR_SQUEEZE, barSpread = RING_BAR_SPREAD, barEase = RING_BAR_EASE,
                        barChase = RING_BAR_CHASE,
                        ringThread = "ring",
                        /* … and what the copies do with the ring, which is where the mandala comes from */
                        echoIn = 0, echoTurn = 0, echoShrink = 0,
                        /* Eights */
                        eightOne = false, eightFlip = EIGHT_FLIP, eightLie = false,
                        /* Volume */
                        volRate = VOL_BEAT, volOffset = VOL_OFFSET, volFloor = VOL_FLOOR,
                        volTop = VOL_TOP, volFall = VOL_FALL, volLow = VOL_LOW,
                        volArch = VOL_ARCH, volJitter = VOL_JITTER, volSize = VOL_SIZE,
                        volStem = VOL_STEM, volStems = "one", volNest = true,
                        volInset = VOL_INSET, volEase = VOL_EASE, volLean = VOL_LEAN } = {}) {
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
  let barInfo = null;                       // what the bar actually managed, for a page that wants to say so
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
  /* The bar packs and spreads on a curve of its own — a plain cosine unless
     told otherwise — and how steep that curve is decides how far the word
     may close up before an end would have to swing backwards. */
  const swellEase = shapeOf(barEase);
  const riseEase = shapeOf(volEase);
  /* The head's pace, as a wiggle either side of its steady rate: one
     surge per swell, shaped by the curve, and never a stop — the whole
     word is strung out behind it on a time lag, so every letter repeats
     what the head did a moment ago and the tail is always chasing it. */
  const chase = Math.min(1, Math.max(0.05, barChase));
  const wiggle = (x) => {
    const f = ((x % 1) + 1) % 1;
    return 2 * swellEase(f < 0.5 ? f * 2 : 2 - f * 2) - 1;
  };
  const swellSlope = (() => {
    let m = 0, prev = swellEase(0);
    for (let i = 1; i <= 200; i++) { const v = swellEase(i / 200); m = Math.max(m, Math.abs(v - prev) * 200); prev = v; }
    return m || Math.PI / 2;
  })();
  /* How far the word opens for one unit of wiggle, given how far behind
     the tail is running: the difference between what the head is doing now
     and what the tail is still doing. */
  const chaseReach = (() => {
    let m = 0;
    for (let i = 0; i < 400; i++) {
      const x = i / 400;
      m = Math.max(m, Math.abs(wiggle(x) - wiggle(x - chase / 2)));
    }
    return m || 1;
  })();

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
    if (card === "flower") { buildFlower(); return syncTile(); }
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
  function buildFlower() {
    const ws = ringOne ? [words().flat()] : words();
    rings = ws.length;
    /* The letters are spread round the whole circumference, so what has to
       fit is the gap between two of them. */
    /* What one letter needs of the circumference: room to stand beside the
       next when the word is spread round the whole ring — and, when it is a
       bar, twice that and more, since the packed bar may only take its own
       share of the ring and the letters have to come down to fit. */
    const claim = barTight / barSqueeze;
    let h = MAX_H;
    for (; h > 14; h -= 2) {
      const w = boxW(h);
      const r0 = STAGE / 2 - LANE_PAD / 2 - w / 2;
      const inner = (i) => r0 - i * h * RING_GAP;
      if (inner(ws.length - 1) < h * 0.9) continue;
      if (ws.every((wd, i) => (2 * Math.PI * inner(i)) / wd.length >= w * claim)) break;
    }
    tileSize = h;
    const r0 = STAGE / 2 - LANE_PAD / 2 - boxW(h) / 2;
    ringStart = RING_LEAD;
    ws.forEach((wd, ri) => {
      const r = r0 - ri * h * RING_GAP;
      /* Every ring inside turns against the one outside it. The bar runs
         the other way about, so that the word still reads round the ring
         the way a word on a ring reads — with its first letter in front. */
      const dir = ri % 2 ? 1 : -1;
      const gap = (dir * 2 * Math.PI) / wd.length; // one letter-gap, in radians
      /* The bar's two ends: at its widest the letters are spread round the
         whole ring, at its tightest they are shoulder to shoulder. */
      const wide = ((2 * Math.PI) / wd.length) * barSpread;
      let tight = Math.min(wide, (boxW(h) * barTight) / r);
      /* However tightly the letters would pack, the word may only close up
         by as much as the ends can make up by running faster: past that the
         head would have to swing backwards to let the word shrink, and the
         whole thing stops reading as one bar travelling. */
      const n = wd.length, beats = Math.max(1, barBeats);
      if (n > 1) {
        const most = (Math.PI * chaseReach * 0.9) / ((n - 1) * beats * swellSlope);
        tight = Math.max(tight, wide - most);
      }
      /* The tail runs the head's own path, this long after it. Half a surge
         behind is as far as it is worth being — any further and the tail is
         doing what the head did a whole surge ago, which reads as a second
         word rather than as this one's tail. */
      const lag = n > 1 ? chase / (2 * beats * (n - 1)) : 0;
      /* What is left of the standing gap once the lag itself has spaced the
         letters out, and how hard the head has to surge to open the word
         from its packed width to its spread one. */
      const gap0 = Math.max(0, (wide + tight) / 2 - 2 * Math.PI * lag);
      const amp = n > 1 ? ((n - 1) * (wide - tight)) / (2 * chaseReach) : 0;
      /* What the word ends up taking of the ring at each end, and how far
         behind the head the tail is running — the outermost ring speaks for
         the card. */
      if (!ri) barInfo = { packed: (tight * (n - 1)) / (2 * Math.PI), spread: (wide * (n - 1)) / (2 * Math.PI), tail: lag * (n - 1) * barTurn };
      wd.forEach((i, j) => {
        letters.push({
          id: i, ch: chars[i], blank: false, group: ri, fill: tone(i), ed: echoDelay,
          cx: STAGE / 2, cy: STAGE / 2, r, ring: ri, dir,
          slot: j, n, lag, gap0, amp, off: RING_LEAD,
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
    const floor = STAGE * (1 - volFloor / 100);
    /* All the room there is to grow into, and the ceiling nothing may pass:
       the tallest letter's own top stops at VOL_CEIL per cent of the frame,
       whichever way the wander falls. */
    const reach = floor - LANE_PAD / 2;
    const usable = STAGE - 2 * LANE_PAD;
    const longest = Math.max(...ws.map((w) => w.length));
    /* The letters come down until a row of them fits across the frame with
       room to breathe, and then take whatever share of that the size asks
       for. */
    let h = MAX_H;
    for (; h > 12; h -= 2) if (usable / longest >= boxW(h) * 1.06) break;
    tileSize = Math.max(10, h * (volSize / 100));
    /* The rise is seeded, so the same seed always grows the same plant and
       a new one is a new shrub. */
    const r = rng(seed);
    const ceiling = Math.max(tileSize, floor - tileSize - STAGE * (1 - VOL_CEIL / 100));
    ws.forEach((wd, wi) => {
      const n = wd.length;
      /* Every row behind draws in from the sides, so the rows read one
         inside the other and the whole thing tapers like a shrub. Like the
         reaches, the drawing-in is spread evenly from the front row to the
         back one rather than taken again off each row in turn — otherwise
         the third row of anything is a heap. */
      const tuck = ws.length > 1 ? (volInset / 100) * (wi / (ws.length - 1)) : 0;
      const wide = usable * Math.max(0.25, 1 - tuck);
      const left = LANE_PAD + (usable - wide) / 2;
      const step = wide / n;
      /* Every row starts at the same base and reaches less far than the one
         in front, and sits half a step across from it so the rows nest
         rather than stack. The reaches are spread evenly between the front
         row's and the back row's — 80, 50, 20 rather than 80, 40, 20 — so
         a row at the back is lower but still has a plant's worth of room
         to be uneven in. */
      const far = volTop / 100, near = far * (volFall / 100);
      const top = reach * (ws.length > 1 ? far - (far - near) * (wi / (ws.length - 1)) : far);
      const shift = volNest && wi % 2 ? step / 2 : 0;
      wd.forEach((i, j) => {
        const col = rtl ? n - 1 - j : j;
        /* Sine across the row — the middle stands higher than the ends —
           and then a seeded wander off it, so no two are quite alike. */
        const arch = 1 - volArch / 100 + (volArch / 100) * Math.sin((Math.PI * (j + 0.5)) / n);
        /* The wander is measured off the front row's reach, not off each
           row's own: a row at the back is lower, but just as uneven as the
           one in front rather than flattened along with it. */
        const wander = reach * far * (volJitter / 100) * (r() * 2 - 1);
        letters.push({
          id: i, ch: chars[i], blank: false, group: wi, top: j === 0, fill: tone(i),
          cx: Math.min(STAGE - LANE_PAD, Math.max(LANE_PAD, left + step * (col + 0.5) + shift)),
          cy: floor, floor,
          rise: Math.min(ceiling, Math.max(tileSize, top * arch + wander)),
          low: volLow / 100,
          beat: (2 * Math.PI) / volRate,
          phase: (-2 * Math.PI * (col * volOffset + wi * volOffset * 2)) / volRate,
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

  /* How big rank k is drawn: the copies can step down in size as they step
     inside the ring, which is the other half of the mandala. */
  function rankScale(k) { return k ? Math.max(0.15, 1 - k * echoShrink) : 1; }

  /* Where a letter is at time t, whichever card this is. Everything else —
     the copies, the threads, the stickers — is drawn from this one answer,
     which is why a new card is only ever a new line here. */
  function posAt(Lt, t, w, k) {
    if (card === "flower") {
      /* Whichever way the ring travels, a letter waits out its own delay
         first — so the first letter leads and the rest follow it. */
      const local = t - Lt.off;
      let rad = Lt.r;
        /* A loading bar bent round the ring, and the tail chasing the head.
           The head goes round for ever, surging and easing off but never
           stopping; every letter behind it is the same head a moment
           earlier, so when it pulls away the word strings out and when it
           eases the word gathers back up. A whole turn and whole surges to
           the round, so it closes on itself. */
      const u = Math.max(0, local) / barTurn - Lt.slot * Lt.lag;
      const head = 2 * Math.PI * u + Lt.amp * wiggle(barBeats * u);
      let a = -Math.PI / 2 + Lt.dir * (head - Lt.slot * Lt.gap0);
      /* Where the mandala comes from: a copy can step inside the ring and
         be turned a little further round it than the letter it follows. */
      if (k) {
        rad *= Math.max(0.1, 1 - k * echoIn);
        a += (Lt.dir * k * echoTurn * Math.PI) / 180;
      }
      return {
        x: Lt.cx + Math.cos(a) * rad, y: Lt.cy + Math.sin(a) * rad,
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
      /* Up and back down for ever: nothing enters, nothing leaves, and a
         letter never sinks quite into the base it grew out of. The climb
         and the fall are the same curve read forwards and backwards, so
         whatever the curve the round still closes on itself. */
      const turn = (((Lt.beat * t + Lt.phase) / (2 * Math.PI)) % 1 + 1) % 1;
      const v = Math.min(1, Math.max(0, riseEase(turn < 0.5 ? turn * 2 : 2 - turn * 2)));
      const climb = Lt.low + (1 - Lt.low) * v;
      return { x: Lt.cx, y: Lt.floor - tileSize / 2 - climb * Lt.rise };
    }
    return { x: Lt.cx + (align(Lt, t) * 2 - 1) * halfFor(w), y: Lt.cy };
  }

  /* Where one letter's rank-k sticker sits, and how wide it is. The
     hand-held wobble is the letter's own, shared by its copies, so at rest
     they stack exactly. */
  function place(Lt, k, frame) {
    const t = now - k * (Lt.ed || echoDelay);
    /* A copy may be drawn smaller than the letter it follows, so its
       sticker is cut at its own size rather than shrunk afterwards. */
    const sc = rankScale(k);
    const spec = cut ? stickerFor(Lt.ch, tileH * sc, weight) : null;
    const w = cut ? spec.W : (shaped ? tileW : L.w) * sc;
    const at = posAt(Lt, t, w, k);
    return {
      p: card === "sway" ? align(Lt, t) : 0.5, spec, w, sc, rot: at.rot || 0,
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
    if (thread && card === "flower" && ringThread !== "ring" && echoes) {
      /* The other way to string a mandala: not round each ring but across
         them — one thread down the radius from a letter through its own
         copies, so the word reads as spokes rather than as circles. */
      for (const Lt of letters) {
        if (Lt.blank) continue;
        const spoke = [];
        for (let k = 0; k <= echoes; k++) {
          const q = place(Lt, k, frame);
          if (q.out) spoke.push([q.x, q.y]);
        }
        if (spoke.length > 1) {
          tiles.push({ kind: "thread", id: `spoke${Lt.id}`, d: threadPath(spoke, false), colour: toneOf(Lt, 0), width: tileSize * THREAD * threadScale, alpha: 1 });
        }
      }
    }
    if (thread && card === "flower" && ringThread !== "spoke") {
      /* Only the letters' own ring is strung, unless the copies have rings
         of their own to be strung on — which is the mandala. */
      for (let k = echoIn || echoTurn ? echoes : 0; k >= 0; k--) {
        let run = [], g = -1, tone = null;
        const flush = () => {
          if (run.length > 1) tiles.push({ kind: "thread", id: `ring${k}-${g}`, d: arcPath(run, STAGE / 2, STAGE / 2), colour: tone, width: tileSize * THREAD * threadScale * rankScale(k), alpha: 1 });
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
    /* Volume's thread is the plant itself: one base line along the bottom,
       and a stem from it up to every letter. The copies need no stem of
       their own — they are the letter on its way up, so they already sit
       on it like beads. */
    if (thread && card === "volume") {
      /* A stem runs from the letter straight down and off the bottom of the
         frame — well past the square the piece is drawn in, so a taller
         frame simply gets a longer stem while the letters stay where they
         are. There is no base line: the bottom of the frame is the base. */
      const w = tileSize * THREAD * threadScale * (volStem / 100);
      const foot = (STAGE * 2.5).toFixed(1);
      const lean = Math.min(1, Math.max(0, volLean / 100));
      for (let k = volStems === "all" ? echoes : 0; k >= 0; k--) {
        for (const Lt of letters) {
          if (Lt.blank) continue;
          const q = place(Lt, k, frame);
          /* A stem can drop straight down from its letter, or lean in to
             meet the others at the middle of the bottom edge, or anywhere
             between — and from wherever it lands it runs on straight down
             and out of the frame. */
          const root = (Lt.cx + (STAGE / 2 - Lt.cx) * lean).toFixed(1);
          tiles.push({
            kind: "thread", id: `stem${Lt.id}-${k}`,
            d: `M${q.x.toFixed(1)},${q.y.toFixed(1)}L${root},${STAGE}L${root},${foot}`,
            colour: toneOf(Lt, k), width: w * rankScale(k), alpha: 1,
          });
        }
      }
    }
    for (let k = echoes; k >= 0; k--) {
      const alpha = solid || k === 0 ? 1 : (echoAlpha * (echoes - k + 1)) / echoes;
      /* The thread this rank is strung on — one run per column, laid down
         before its own beads. A space breaks nothing: the thread simply
         carries on to the next letter. */
      /* A run is one group — a column, an eight, a bar. The rings are the
         exception: their thread is the ring itself and is already down. */
      if (thread && card !== "flower" && card !== "volume") {
        let run = [], g = -1, tone = null, closed = false;
        const flush = () => {
          if (run.length > 1) {
            tiles.push({ kind: "thread", id: `t${k}-${g}`, d: threadPath(run, closed), colour: tone, width: tileSize * THREAD * threadScale, alpha });
          }
          run = [];
        };
        for (const Lt of letters) {
          if (Lt.blank) continue;
          if (Lt.group !== g) { flush(); g = Lt.group; closed = !!Lt.closed; }
          const q = place(Lt, k, frame);
          tone = toneOf(Lt, k);
          run.push([q.x, q.y]);
        }
        flush();
      }
      for (const Lt of letters) {
        if (Lt.blank) continue;
        const q = place(Lt, k, frame);
        if (!q.out) continue;              // not on the ring yet
        const tone = toneOf(Lt, k);
        tiles.push({
          kind: "tile", id: Lt.id * 16 + k, ch: Lt.ch, p: shaped ? 0.5 : q.p,
          shape: shaped ? shape : null, spec: q.spec,
          w: q.w, h: (shaped ? tileH : tileSize) * q.sc,
          size: cut ? q.spec.size : (shaped ? tileH * TILE_FONT : tileSize * font) * q.sc,
          weight,
          fill: shaped ? tone : null,      // the sticker
          ink: shaped ? LETTER : tone,     // the letter on it
          x: q.x, y: q.y, rot: q.rot, alpha,
        });
      }
    }
    /* How big the card's own drawing sits in the frame — the ground and
       the grain still fill it, everything else is scaled about the middle. */
    return { bg: pal.frame, tiles, scale };
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
    get bar() { return barInfo; },
    get loopStart() {
      if (card === "flower") return ringStart;
      if (card === "eight" || card === "volume") return 0;
      return (chars.length - 1) * Math.abs(stagger) + BEAT + passGap;
    },
    get loopPeriod() {
      if (card === "flower") return barTurn;
      if (card === "eight") return EIGHT_TURN * Math.max(1, eightFlip);
      if (card === "volume") return volRate;
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
  if (opts.scale && opts.scale !== 1) {
    layer.style.transform = `scale(${opts.scale})`;
    layer.style.transformOrigin = "50% 50%";
  }
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
  /* A page that rebuilds the piece while it is running — the lab, changing a
     number under it — hands back the clock it was on, so the new one picks
     the motion up where the old one left it instead of starting again. */
  if (opts.startAt > 0) {
    eng.step(opts.startAt / 1000);
    frame = Math.round((opts.startAt / 1000) * fps);
  }
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
  paint(frame);
  raf = requestAnimationFrame(tick);
  return {
    stop() { cancelAnimationFrame(raf); stage.removeEventListener("click", onClick); },
    get now() { return eng.now; },
    get bar() { return eng.bar; },
  };
}

export const s = (stage, opts) => mount(stage, "sway", opts);
export const f = (stage, opts) => mount(stage, "flower", opts);
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
  if (s.scale && s.scale !== 1) {
    ctx.translate(size / 2, size / 2);
    ctx.scale(s.scale, s.scale);
    ctx.translate(-size / 2, -size / 2);
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
const EXPORT_SEED = 20260912, SIM_DT = 1 / 120, EXPORT_LEAST = 4;

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
  /* How long the exported loop has to be for the card to play at the speed
     it plays on the site: whole rounds, and as few of them as gets past a
     few seconds — a round of its own is plenty for a card that takes its
     time, and half the file. Flower's round is 16 s, so squeezing it into
     the page's own 7.5 s would run it at more than twice the speed. */
  const probe = engine(mode, opts);
  const period = probe.empty ? EXPORT_LEAST : probe.loopPeriod / 1000;
  const seconds = period * Math.max(1, Math.ceil(EXPORT_LEAST / period));
  return {
    draw, seconds, n: Math.round(seconds * FPS), pal,
    grain: grain ? { opacity: g.opacity, blend: g.blend, scale: grainScale, animated: true } : null,
  };
}
export const x = {
  sway: (o) => scene("sway", o),
  "sway-flower": (o) => scene("flower", o),
  /* Eight is built but not registered anywhere yet — the card is still
     an idea rather than a decision, so the site does not offer it. */
  "sway-volume": (o) => scene("volume", o),
};

/* Exposed so the export page can sample a single still frame (SVG) straight
   off the real simulation instead of re-implementing it. */
export { engine };
