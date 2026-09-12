/* FunType — Collection 04: Sway.

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

   Collection 04's colour idea: no sticker behind the letter — the
   letters themselves carry the colour, stepping through a gradient
   down the column, one step per letter.

   Effect contract (studio / embed):  mount(stage, { word, palette, seed }) → { stop() }
   Export contract:                   scene({ word, palette, seed, grain… }) → { draw(ctx, size, frame, total), n, grain } */

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
const LANE_PAD = 40;            // a lane keeps this much clear of its edges at the end of a slide —
                                // enough that the curves which overshoot still stay in the frame
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
const WEIGHT = 700;             // Switzer bold (Rubik bold for Hebrew)

/* Colour rule: four colours — frame, card, ink, anchor — and each card
   rotates them by one slot, taking the first as the background and the
   next two as a gradient the letters step through, one step per letter.
   The first set is the collection's own; the rest are Collection 01's,
   02's and 03's palettes, read the same way. */
export const p = [
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
const GRAIN_TILES = 6, GRAIN_TILE = 192, GRAIN_OPACITY = 0.5, GRAIN_DARK = 0.12;

/* How light a colour is, 0…1 — the grain is laid on differently over a
   dark field than over a bright one. */
function lightness(hex) {
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
                        curve = CURVE, font = FONT } = {}) {
  const pal = dealPalette(mode, palette || p[0]);
  const chars = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  const empty = !chars.filter((c) => c !== " ").length;
  const rtl = /[֐-׿؀-ۿ]/.test(chars.join(""));
  const L = layout(Math.max(1, chars.length), font);
  /* How far a lane's flush edges sit from its middle. A curve that
     overshoots would carry the letters past those edges, so the travel is
     pulled in by however far it overshoots — the letters still line up
     with each other, and the overshoot lands inside the frame. */
  const over = (() => {
    let m = 0;
    for (let i = 0; i <= 100; i++) { const v = shapeOf(curve)(i / 100); m = Math.max(m, v - 1, -v); }
    return Math.max(0, m);
  })();
  const half = (L.lane / 2 - LANE_PAD) / (1 + 2 * over);
  const stagger = staggerOpt === undefined
    ? Math.max(STAGGER_MIN, Math.min(STAGGER, STAGGER_SPAN / Math.max(1, chars.length)))
    : staggerOpt;
  const passGap = move + hold;
  const ease = shapeOf(curve);

  let rand = rng(seed);
  let now = 0;                  // virtual ms
  let letters = [];
  let loops = 0;

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
        id: i, ch, blank: ch === " ",
        fill: mix(pal.card, pal.ink, chars.length > 1 ? i / (chars.length - 1) : 0),
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
  function align(Lt) {
    const local = now - Lt.t0;
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

  function snapshot(frame) {
    const tiles = [];
    for (const Lt of letters) {
      if (Lt.blank) continue;
      /* No entrance: the word is simply there, at full size, from the
         first frame — only the wave moves. */
      const jx = wobble(Lt.id, frame, 0) * JITTER;
      const jy = wobble(Lt.id, frame, 1) * JITTER;
      /* `p` is where the letter's own box hangs off `x`: 0 pins its left
         edge there, 1 its right edge, 0.5 centres it. The renderers know
         the letter's real width, so none of them has to guess. */
      const p = align(Lt);
      tiles.push({
        id: Lt.id, ch: Lt.ch, fill: Lt.fill, w: L.w, h: L.h, size: L.h * font, p,
        x: Lt.cx + (p * 2 - 1) * half + jx, y: Lt.cy + jy, alpha: 1,
      });
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
  function paint(frame) {
    const s = eng.snapshot(frame);
    if (noise) noise.style.backgroundImage = tiles[frame % tiles.length];
    const seen = new Set();
    for (const t of s.tiles) {
      seen.add(t.id);
      let el = els.get(t.id);
      if (!el) {
        el = document.createElement("div");
        el.style.cssText = `position:absolute;left:0;top:0;font-family:"Switzer","Rubik",system-ui,sans-serif;font-weight:${WEIGHT};font-size:${t.size}px;line-height:1;color:${t.fill};text-transform:uppercase;letter-spacing:-0.02em;white-space:pre;will-change:transform;`;
        el.textContent = t.ch;
        layer.appendChild(el);
        els.set(t.id, el);
      }
      /* translate(-50%, -50%) centres the letter on its spot, whatever it is. */
      /* A percentage translate is a share of the element's own width, which
         is exactly the letter's width — so the edges land where they should. */
      el.style.transform = `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) translate(${(-t.p * 100).toFixed(2)}%, -50%)`;
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
      ctx.fillStyle = t.fill;
      ctx.font = `${WEIGHT} ${t.size * k}px "Switzer","Rubik",system-ui,sans-serif`;
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
