/* FunType — Collection 04: Sway.

   The text stands in a column down the middle of the frame, one big
   bold letter per row. A wave runs through it: every letter slides to
   the left, then to the right, a beat behind the letter above it,
   easing in and out of every stop. It never finishes — the wave just
   keeps going, so the piece can sit on a wall and stay.

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
const PAD = 40;                 // the column keeps this clear of the top and bottom
const MAX_H = 190;              // a row is never taller than this…
const MIN_H = 44;               // … and we add a column rather than go below this
const MAX_COLS = 8;             // … up to this many columns; past that the letters just get small
const FONT = 1.3;               // letter size / row height — the caps nearly fill the row
const GLYPH_W = 0.72;           // roughly how wide a capital sits, as a fraction of its size
const LANE_PAD = 34;            // a lane keeps this much clear of its edges at the end of a slide
const FPS = 12;                 // stop-motion: the picture only updates this often
const JITTER = 3;               // px of hand-held wobble per frame
const OFFSET = 8;               // px: each letter sits a little off its true spot, fixed for its life
const STAGGER = 110;            // ms between one letter's beat and the next letter's…
const STAGGER_SPAN = 900;       // … squeezed so the whole wave never takes longer than this to pass through
const STAGGER_MIN = 18;
const POP_MS = 300;             // a letter pops in from small to full size
const BEAT = 200;               // … and stands still this long before it starts sliding
const MOVE_MS = 900;            // one slide, wall to wall
const HOLD_MS = 260;            // … and the pause at the end of it
const SQUASH = 0.1;             // how much a letter presses into its leading edge when it stops
const SQUASH_MS = 300;
const STRETCH = 0.07;           // … and how much it draws out at full speed
const WEIGHT = 700;             // Switzer bold (Rubik bold for Hebrew)

/* Colour rule: four colours — frame, card, ink, anchor — and each card
   rotates them by one slot, taking the first as the background and the
   next two as a gradient the letters step through, one step per letter.
   The first set is the collection's own; the rest are Collection 01's,
   02's and 03's palettes, read the same way. */
export const p = [
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
/* Mix two hex colours: t = 0 → a, t = 1 → b. */
function mix(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(((A >> sh) & 255) * (1 - t) + ((B >> sh) & 255) * t);
  return "#" + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, "0")).join("");
}
/* Smootherstep: dead still at both ends, so every stop is a real stop.
   ease() is the position, dEase() its slope (for the motion stretch);
   the slope peaks at 1.875× the average. */
const ease = (u) => u * u * u * (u * (u * 6 - 15) + 10);
const dEase = (u) => 30 * u * u * (1 - u) * (1 - u);
const EASE_PEAK = 1.875;

/* How to typeset `n` letters: one column if they fit, otherwise as many
   columns as it takes to keep the letters big enough to read. Each
   column gets its own lane of the stage to slide inside, so columns
   never cross. */
function layout(n) {
  const usable = STAGE - 2 * PAD;
  for (let c = 1; c <= MAX_COLS; c++) {
    const rows = Math.ceil(n / c);
    const h = Math.min(MAX_H, usable / rows);
    const w = h * FONT * GLYPH_W;
    const lane = STAGE / c;
    if (h >= MIN_H && w * 1.9 <= lane) return { cols: c, rows, h, w, lane };
  }
  const rows = Math.ceil(n / MAX_COLS);
  const h = Math.min(MAX_H, usable / rows);
  return { cols: MAX_COLS, rows, h, w: h * FONT * GLYPH_W, lane: STAGE / MAX_COLS };
}

/* ---------- the engine ---------- */

/* Runs the piece on a virtual clock. step(dt) advances it; snapshot(frame)
   describes what to paint for stop-motion frame `frame`. Nothing ever ends:
   after the letters have popped in, every one of them is oscillating with
   the same period (loopPeriod), a stagger apart. */
function engine(mode, { word = "", palette, seed = 0, stagger: staggerOpt } = {}) {
  const pal = dealPalette(mode, palette || p[0]);
  const chars = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  const empty = !chars.filter((c) => c !== " ").length;
  const rtl = /[֐-׿؀-ۿ]/.test(chars.join(""));
  const L = layout(Math.max(1, chars.length));
  const stagger = staggerOpt || Math.max(STAGGER_MIN, Math.min(STAGGER, STAGGER_SPAN / Math.max(1, chars.length)));
  const passGap = MOVE_MS + HOLD_MS;
  const amp = Math.max(10, (L.lane - L.w) / 2 - LANE_PAD);

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
        cx, cy, born: i * stagger, t0: i * stagger + POP_MS + BEAT,
        ox: (rand() * 2 - 1) * OFFSET, oy: (rand() * 2 - 1) * OFFSET,
      });
    });
  }

  /* Where a letter is right now. Pass k runs from `from` to `to` over
     MOVE_MS and then waits out HOLD_MS; pass 0 leaves the middle, and
     from there it is left, right, left, right, for as long as the page
     is open. */
  function state(Lt) {
    const local = now - Lt.t0;
    if (local < 0) return { x: 0, v: 0, arriveAt: -1e9, arriveDir: 1 };
    const k = Math.floor(local / passGap);
    const u = Math.min(1, (local - k * passGap) / MOVE_MS);
    const to = k % 2 === 0 ? -amp : amp;
    const from = k === 0 ? 0 : k % 2 === 1 ? -amp : amp;
    const dist = to - from;
    /* The last time this letter came to a stop, for the press into its
       leading edge — this pass if it is already holding, else the one before. */
    const holding = u >= 1;
    const arriveAt = holding ? Lt.t0 + k * passGap + MOVE_MS : Lt.t0 + (k - 1) * passGap + MOVE_MS;
    const arriveDir = holding ? Math.sign(dist) : -Math.sign(dist);
    return { x: from + dist * ease(u), v: holding ? 0 : (dist * dEase(u)) / (MOVE_MS / 1000), arriveAt, arriveDir };
  }

  /* Every restart (loop or click) reshuffles the hand-made offsets from a
     brand-new random seed — the first run still honours the seed it was
     given, so a shared link or an export replays identically. */
  function restart() { loops++; rand = rng((Math.random() * 4294967296) >>> 0); now = 0; build(); }

  function step(dt) { now += dt * 1000; }

  function snapshot(frame) {
    const tiles = [];
    const vmax = (EASE_PEAK * amp) / (MOVE_MS / 1000);
    for (const Lt of letters) {
      if (now < Lt.born || Lt.blank) continue;
      const s = state(Lt);
      let jx = Lt.ox + wobble(Lt.id, frame, 0) * JITTER;
      let jy = Lt.oy + wobble(Lt.id, frame, 1) * JITTER;
      /* Drawn out at speed, pressed into the leading edge at every stop. */
      const k = Math.min(1, Math.abs(s.v) / vmax);
      let sx = 1 + STRETCH * k, sy = 1 - 0.6 * STRETCH * k;
      const th = (now - s.arriveAt) / SQUASH_MS;
      if (th >= 0 && th < 1) {
        const q = Math.sin(th * Math.PI) * SQUASH;
        sx -= q; sy += q;
        jx += q * (L.w / 2) * s.arriveDir;
      }
      /* Pop-in on birth. */
      const tb = (now - Lt.born) / POP_MS;
      if (tb < 1) {
        const pop = 0.4 + 0.6 * (1 + 1.8 * Math.pow(tb - 1, 3) + 0.8 * Math.pow(tb - 1, 2));
        sx *= pop; sy *= pop;
      }
      tiles.push({
        id: Lt.id, ch: Lt.ch, fill: Lt.fill, w: L.w, h: L.h, size: L.h * FONT,
        x: Lt.cx + s.x + jx, y: Lt.cy + jy, sx, sy, alpha: 1,
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
    get loopStart() { return (chars.length - 1) * stagger + POP_MS + BEAT + passGap; },
    get loopPeriod() { return 2 * passGap; },
  };
}

/* ---------- DOM renderer (studio, embed) ---------- */

const GRAIN_TILES = 6, GRAIN_TILE = 192, GRAIN_OPACITY = 0.5;
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
  const pal = eng.pal;
  stage.innerHTML = "";
  stage.style.cssText = `position:relative;width:${STAGE}px;height:${STAGE}px;overflow:hidden;isolation:isolate;background:${pal.frame};`;
  if (eng.empty) return { stop() {} };

  const layer = document.createElement("div");
  layer.style.cssText = "position:absolute;inset:0;";
  stage.appendChild(layer);
  /* Film grain: a few noise tiles cycled per frame (iOS Safari often
     skips the SVG turbulence filter inside a scaled stage). */
  const tiles = makeGrainTiles();
  const noise = document.createElement("div");
  noise.style.cssText = `position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;opacity:${GRAIN_OPACITY};z-index:9;background-size:${GRAIN_TILE}px ${GRAIN_TILE}px;background-image:${tiles[0]};`;
  stage.appendChild(noise);

  const els = new Map();
  function paint(frame) {
    const s = eng.snapshot(frame);
    noise.style.backgroundImage = tiles[frame % tiles.length];
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
      el.style.transform = `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) translate(-50%, -50%) scale(${t.sx.toFixed(3)}, ${t.sy.toFixed(3)})`;
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
    if (acc >= 1 / FPS) { acc = 0; frame++; paint(frame); }
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
function scene(mode, { word = "", palette, seed, grain = true, grainOpacity = 0.5, grainScale = 1.2 } = {}) {
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
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const t of s.tiles) {
      ctx.save();
      ctx.translate(t.x * k, t.y * k);
      ctx.scale(t.sx, t.sy);
      ctx.fillStyle = t.fill;
      ctx.font = `${WEIGHT} ${t.size * k}px "Switzer","Rubik",system-ui,sans-serif`;
      ctx.fillText(t.ch, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }
  return { draw, n: 90, pal, grain: grain ? { opacity: grainOpacity, scale: grainScale, animated: true } : null };
}
export const x = { sway: (o) => scene("sway", o) };

/* Exposed so the export page can sample a single still frame (SVG) straight
   off the real simulation instead of re-implementing it. */
export { engine };
