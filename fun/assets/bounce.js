/* FunType — Collection 03 / "Bounce" (Snake + Chaos)
   The first letter of the word sits in a rounded sticker square, drops
   in at the middle of the stage, picks a random direction and travels
   in a straight line at constant speed. When the square touches a wall
   it reflects off it (angle in = angle out, speed unchanged).

   The rest of the word arrives one letter per wall hit: the newest
   square is the "spawner"; the first time it touches a wall, the next
   letter appears a beat later and becomes the new spawner. The newest
   square is always painted on top. A space is a silent beat — a wall
   hit that spawns nothing — so words stay apart.

   Two flavours:
     Snake — the new letter pops out of the collision point on exactly
             the spawner's heading, so every letter follows the first
             one's path with a delay: one long snake. The text repeats
             (space-separated) to fill 50 beats.
     Chaos — the new letter starts from the centre in a fresh random
             direction. The text repeats to 80 beats, until the stage
             is properly full.

   Tower — letters drop from random points along the top, fall under
           gravity, land on the floor and on each other, and pile up.
           The newest tile's first contact drops the next letter.

   Each flavour also has a "frame" version: the tile carries an inner
   square in a nearby shade, and the frame around it gets a little
   thinner at every wall touch — a tally of its bounces.

   Once the sequence is complete, after a short hold, the walls "open":
   each square leaves through the next wall it touches, and once the
   stage is empty the word starts over.

   Look: Collection 02's sticker language (card / ink / anchor fills,
   slate letter at weight 500) on squares, with the house
   hand-made finish: 12 fps stop-motion, animated grain, ±2px jitter,
   squash-and-stretch on impact and a pop when a letter is born.
   Every new letter nudges the speed of the whole group up a notch, so
   the snake stays one snake while the pace builds.

   Written as a plain, readable ES module (the rest of FunType is a
   minified Vite build); it plugs into the same effect contract:
     mount(stageEl, { word, palette, seed }) -> { stop() } */

const STAGE = 1080;
const SIZE = 150;               // sticker square side, in stage units
const CORNER = 0;               // its corner radius (sharp)
const FONT_SIZE = 72;           // letter size inside the square
const SPEED = 640;              // px / second, in stage units
const SPEED_STEP = 12;          // every new letter makes everything this much faster
const SPAWN_DELAY = 230;        // ms between a wall hit and the next letter (≈120px along the path)
const SLOTS_SNAKE = 50;         // the word repeats (space-separated) to fill this many beats
const SLOTS_CHAOS = 80;         // Chaos keeps going until the stage is properly full
const SLOTS_TOWER = 45;         // Tower stacks this many beats
const HOLD_MS = 1600;           // pause once the sequence is complete, before the walls open
const GRAVITY = 2200;           // Tower: px / s², in stage units
const FALL0 = 420;              // Tower: a letter's speed as it enters from the top
const REST = 0.28;              // Tower: how much bounce is left after a landing
const BAND = 300;               // Tower: letters drop within ± this of the centre, so they pile up
const FPS = 12;                 // stop-motion: the picture only updates this often
const JITTER = 2;               // px of hand-held wobble per frame
const SQUASH = 0.28;            // how much a square flattens against the wall on impact
const SQUASH_MS = 320;          // and how long the squash-and-spring lasts
const POP_MS = 260;             // a new letter pops in from small to full size
const TILT = 0;                 // ± degrees, a fixed tilt per square (off)
const LETTER = "#4E4B5D";       // Stickers' slate letter colour
const FRAME0 = 40;              // frame variant: frame thickness at birth (px)
const FRAME_STEP = 6;           // … thinner by this much at every wall touch
const FRAME_MIN = 5;            // … but never thinner than this
const INNER_MIX = 0.22;         // inner square = tile colour mixed this far toward the background

/* Collection 02's palettes (same values as Dots / Stickers / Loop).
   frame = background; squares cycle card → ink → anchor, so two
   neighbouring letters never share a colour. */
export const p = [
  { frame: "#A9FF67", card: "#FFFFFF", ink: "#5BE03A", anchor: "#49C7FD" },
  { frame: "#49C7FD", card: "#FFFFFF", ink: "#5BE03A", anchor: "#A9FF67" },
  { frame: "#FFFFFF", card: "#49C7FD", ink: "#5BE03A", anchor: "#D9FF93" },
  { frame: "#5BE03A", card: "#49C7FD", ink: "#B9F1FA", anchor: "#A9FF67" },
  { frame: "#B9F1FA", card: "#A9FF67", ink: "#D9FF93", anchor: "#49C7FD" },
  { frame: "#D9FF93", card: "#5BE03A", ink: "#FFFFFF", anchor: "#49C7FD" },
];
const ROLES = ["card", "ink", "anchor"];

/* Small seeded RNG (mulberry32) so a `seed` gives a repeatable launch. */
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

/* Deterministic hash → [-1, 1], the same one the other effects use for
   per-frame wobble: (element, frame, axis) always gives the same nudge. */
function wobble(i, frame, axis) {
  let d = (i * 73856093) ^ (frame * 19349663) ^ (axis * 83492791);
  d = Math.imul(d ^ (d >>> 13), 2246822507);
  d = (d ^ (d >>> 16)) >>> 0;
  return (d / 4294967296) * 2 - 1;
}

/* A random heading that stays clear of the axes, so a square never
   crawls along a wall or ping-pongs straight up and down. */
function heading(rand) {
  const quadrant = Math.floor(rand() * 4);
  const a = (20 + rand() * 50) * (Math.PI / 180);   // 20°–70°
  return quadrant * (Math.PI / 2) + a;
}

/* Film grain. The other collections use an SVG feTurbulence filter,
   which iOS Safari often refuses to paint inside a scaled stage — so
   this one rasterises a few noise tiles once on a canvas and cycles
   them as a blended background, one tile per stop-motion frame. */
const GRAIN_TILES = 6, GRAIN_TILE = 192, GRAIN_OPACITY = 0.6;
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
function grain(stage) {
  const tiles = makeGrainTiles();
  const el = document.createElement("div");
  el.style.cssText = `position:absolute;inset:0;pointer-events:none;mix-blend-mode:overlay;opacity:${GRAIN_OPACITY};z-index:9;background-size:${GRAIN_TILE}px ${GRAIN_TILE}px;background-image:${tiles[0]};`;
  stage.appendChild(el);
  return { roll(frame) { el.style.backgroundImage = tiles[frame % tiles.length]; } };
}

/* Mix two hex colours: t = 0 → a, t = 1 → b. */
function mix(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(((A >> sh) & 255) * (1 - t) + ((B >> sh) & 255) * t);
  return "#" + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, "0")).join("");
}

export const m = (stage, opts) => mount(stage, { ...opts, mode: "snake" });
export const c = (stage, opts) => mount(stage, { ...opts, mode: "chaos" });
export const f = (stage, opts) => mount(stage, { ...opts, mode: "snake", frame: true });
export const g = (stage, opts) => mount(stage, { ...opts, mode: "chaos", frame: true });
export const t = (stage, opts) => mount(stage, { ...opts, mode: "tower" });

function mount(stage, { word = "", palette, seed = 0, mode = "snake", frame: framed = false } = {}) {
  const snake = mode === "snake", tower = mode === "tower";
  const pal = palette || p[0];
  stage.innerHTML = "";
  stage.style.cssText = `position:relative;width:${STAGE}px;height:${STAGE}px;overflow:hidden;isolation:isolate;background:${pal.frame};`;

  /* Build the beat sequence: the typed text, uppercased, with runs of
     whitespace collapsed to one space, repeated (with a space between
     repeats) until it fills the mode's beat count. */
  const base = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  if (!base.filter((c) => c !== " ").length) return { stop() {} };
  const seq = [];
  const slots = snake ? SLOTS_SNAKE : tower ? SLOTS_TOWER : SLOTS_CHAOS;
  while (seq.length < slots) {
    if (seq.length) seq.push(" ");
    for (const c of base) { if (seq.length < slots) seq.push(c); }
  }

  const layer = document.createElement("div");
  layer.style.cssText = "position:absolute;inset:0;";
  stage.appendChild(layer);
  const noise = grain(stage);

  const rand = rng(seed);
  let letters = [];          // in spawn order; the last one is on top
  let timers = [];
  let raf = 0, last = 0;
  let cursor = 0;            // next beat in seq
  let count = 0;             // squares spawned so far (colour cycling, wobble id)
  let phase = "fill";        // fill → hold → drain → (restart)
  let acc = 0, frame = 0;    // stop-motion clock
  let speed = SPEED;         // current pace, shared by every square

  /* Set everyone to the current pace, keeping their headings. */
  function repace() {
    for (const L of letters) {
      const k = speed / Math.hypot(L.vx, L.vy);
      L.vx *= k; L.vy *= k;
    }
  }

  /* Squares are tracked by their centre. A tilted square is wider than
     SIZE on the axes, so each keeps its own half-extent for the walls:
     the real shape touches the wall, corners included. */
  function makeLetter(ch, cx, cy, vx, vy) {
    const el = document.createElement("div");
    const fill = pal[ROLES[count % ROLES.length]];
    const tilt = (rand() * 2 - 1) * TILT;
    const rad = (tilt * Math.PI) / 180;
    const half = (SIZE / 2) * (Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad)));
    el.style.cssText = `position:absolute;left:${-SIZE / 2}px;top:${-SIZE / 2}px;width:${SIZE}px;height:${SIZE}px;border-radius:${CORNER}px;background:${fill};display:flex;align-items:center;justify-content:center;will-change:transform;`;
    /* Frame variant: an inner square in a nearby shade; the frame
       around it (the tile's own colour) thins at every wall touch. */
    let inner = null;
    if (framed) {
      inner = document.createElement("div");
      inner.style.cssText = `position:absolute;inset:${FRAME0}px;background:${mix(fill, pal.frame, INNER_MIX)};`;
      el.appendChild(inner);
    }
    /* The letter is its own element so the tile can squash and pop
       around it while the glyph itself stays rigid. */
    const glyph = document.createElement("span");
    glyph.style.cssText = `position:relative;font-family:"Switzer","Rubik",system-ui,sans-serif;font-weight:500;font-size:${FONT_SIZE}px;line-height:1;color:${LETTER};text-transform:uppercase;letter-spacing:-0.02em;will-change:transform;`;
    glyph.textContent = ch;
    el.appendChild(glyph);
    layer.appendChild(el);                         // newest on top
    const L = { el, glyph, inner, hits: 0, id: count++, cx, cy, vx, vy, tilt, half, spawned: false,
                born: performance.now(), hitAt: -1e9, hitAxis: "x" };
    letters.push(L);
    if (!tower) { speed = SPEED + SPEED_STEP * (count - 1); repace(); }
    place(L, performance.now());
    return L;
  }

  /* Bounce feel, on top of the straight-line physics:
     - impact: the square squashes along the wall's normal and stretches
       along the wall, then springs back (a half-sine over SQUASH_MS);
     - birth: a new square pops in from 40% with a little overshoot. */
  function place(L, now) {
    const jx = wobble(L.id, frame, 0) * JITTER, jy = wobble(L.id, frame, 1) * JITTER;
    let sx = 1, sy = 1;
    const th = (now - L.hitAt) / SQUASH_MS;
    if (th >= 0 && th < 1) {
      const k = Math.sin(th * Math.PI) * SQUASH;
      if (L.hitAxis === "x") { sx = 1 - k; sy = 1 + k; } else { sx = 1 + k; sy = 1 - k; }
    }
    const tb = (now - L.born) / POP_MS;
    if (tb < 1) {
      const pop = 0.4 + 0.6 * (1 + 1.8 * Math.pow(tb - 1, 3) + 0.8 * Math.pow(tb - 1, 2)); // ease-out-back
      sx *= pop; sy *= pop;
    }
    L.el.style.transform = `translate(${(L.cx + jx).toFixed(1)}px, ${(L.cy + jy).toFixed(1)}px) rotate(${L.tilt.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    /* Undo the tile's scale on the glyph so only the frame bounces. */
    L.glyph.style.transform = sx === 1 && sy === 1 ? "" : `scale(${(1 / sx).toFixed(3)}, ${(1 / sy).toFixed(3)})`;
  }

  function finish() {
    phase = "hold";
    timers.push(setTimeout(() => { phase = "drain"; }, HOLD_MS));
  }

  /* The spawner touched a wall: consume one beat. A space is silent
     (the spawner keeps its role and will try again at the next wall);
     a letter appears a beat later and becomes the new spawner.
     Snake: out of the collision point, on the spawner's exact heading,
     so it rides the same path a beat behind. Chaos: from the centre,
     in a fresh random direction. */
  /* Tower: the next letter drops from a random point along the top,
     a beat after the newest one first touches anything. A space is a
     silent beat here too — one extra beat of waiting. */
  function dropNext() {
    if (cursor >= seq.length) { finish(); return; }
    const ch = seq[cursor++];
    timers.push(setTimeout(() => {
      if (ch === " ") { dropNext(); return; }
      const x = STAGE / 2 + (rand() * 2 - 1) * BAND;
      makeLetter(ch, x, -SIZE / 2, 0, FALL0);
      if (cursor >= seq.length) finish();
    }, SPAWN_DELAY));
  }

  function onSpawnerHit(L) {
    if (tower) { L.spawned = true; dropNext(); return; }
    if (cursor >= seq.length) { finish(); return; }
    const ch = seq[cursor++];
    if (ch === " ") return;
    L.spawned = true;
    const cx = snake ? L.cx : STAGE / 2, cy = snake ? L.cy : STAGE / 2;
    const ang = snake ? Math.atan2(L.vy, L.vx) : heading(rand);
    const vx = Math.cos(ang) * speed, vy = Math.sin(ang) * speed;
    timers.push(setTimeout(() => {
      makeLetter(ch, cx, cy, vx, vy);
      if (cursor >= seq.length) finish();
    }, SPAWN_DELAY));
  }

  function start() {
    timers.forEach(clearTimeout);
    timers = [];
    letters.forEach((L) => L.el.remove());
    letters = [];
    cursor = 0;
    count = 0;
    phase = "fill";
    if (tower) {
      makeLetter(seq[cursor++], STAGE / 2 + (rand() * 2 - 1) * BAND, -SIZE / 2, 0, FALL0);
      return;
    }
    const ang = heading(rand);
    makeLetter(seq[cursor++], STAGE / 2, STAGE / 2, Math.cos(ang) * SPEED, Math.sin(ang) * SPEED);
  }

  function tick(now) {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const spawner = letters[letters.length - 1];
    if (tower) { tickTower(dt, now, spawner); raf = requestAnimationFrame(tick); return; }
    for (const L of letters) {
      L.cx += L.vx * dt;
      L.cy += L.vy * dt;
      if (phase === "drain") {
        /* Walls are open: mark the square gone once fully outside. */
        if (L.cx + L.half < 0 || L.cx - L.half > STAGE || L.cy + L.half < 0 || L.cy - L.half > STAGE) L.gone = true;
      } else {
        /* Perfect elastic reflection off each wall. */
        const lo = L.half, hi = STAGE - L.half;
        let hit = false;
        if (L.cx < lo) { L.cx = 2 * lo - L.cx; L.vx = Math.abs(L.vx); hit = "x"; }
        else if (L.cx > hi) { L.cx = 2 * hi - L.cx; L.vx = -Math.abs(L.vx); hit = "x"; }
        if (L.cy < lo) { L.cy = 2 * lo - L.cy; L.vy = Math.abs(L.vy); hit = "y"; }
        else if (L.cy > hi) { L.cy = 2 * hi - L.cy; L.vy = -Math.abs(L.vy); hit = "y"; }
        if (hit) {
          L.hitAt = now; L.hitAxis = hit; L.hits++;
          if (L.inner) L.inner.style.inset = Math.max(FRAME_MIN, FRAME0 - FRAME_STEP * L.hits) + "px";
        }
        if (hit && phase === "fill" && L === spawner && !L.spawned) onSpawnerHit(L);
      }
    }
    if (phase === "drain") {
      letters.filter((L) => L.gone).forEach((L) => L.el.remove());
      letters = letters.filter((L) => !L.gone);
      if (!letters.length) start();
    }
    /* Stop-motion: the simulation runs smoothly, the picture updates
       at FPS — and each new frame re-rolls the grain and the wobble. */
    acc += dt;
    if (acc >= 1 / FPS) {
      acc = 0;
      frame++;
      noise.roll(frame);
      letters.forEach((L) => place(L, now));
    }
    raf = requestAnimationFrame(tick);
  }

  /* Tower physics: gravity, side walls, a floor (unless the walls are
     open), and square-on-square contact resolved along the shallower
     overlap. A landing squashes the tile; the newest tile's first
     contact with anything drops the next letter. */
  function touch(L, axis, speedAlong) {
    if (Math.abs(speedAlong) > 90) { L.hitAt = now_; L.hitAxis = axis; L.hits++;
      if (L.inner) L.inner.style.inset = Math.max(FRAME_MIN, FRAME0 - FRAME_STEP * L.hits) + "px"; }
    if (L === spawner_ && !L.spawned && phase === "fill") onSpawnerHit(L);
  }
  let now_ = 0, spawner_ = null;
  function tickTower(dt, now, spawner) {
    now_ = now; spawner_ = spawner;
    const half = SIZE / 2, floor = STAGE - half;
    for (const L of letters) {
      L.vy += GRAVITY * dt;
      L.vx *= Math.max(0, 1 - 2 * dt);              // a little air drag sideways
      L.cx += L.vx * dt;
      L.cy += L.vy * dt;
      if (L.cx < half) { L.cx = half; L.vx = -L.vx * 0.4; }
      else if (L.cx > STAGE - half) { L.cx = STAGE - half; L.vx = -L.vx * 0.4; }
      if (phase === "drain") { if (L.cy - half > STAGE) L.gone = true; continue; }
      if (L.cy > floor) {
        const v = L.vy;
        L.cy = floor;
        L.vy = v > 90 ? -v * REST : 0;
        touch(L, "y", v);
      }
    }
    if (phase !== "drain") {
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < letters.length; i++) for (let j = i + 1; j < letters.length; j++) {
          const A = letters[i], B = letters[j];
          const dx = B.cx - A.cx, dy = B.cy - A.cy;
          const ox = SIZE - Math.abs(dx), oy = SIZE - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          if (ox < oy) {
            const sgn = dx < 0 ? -1 : 1;
            A.cx -= (ox / 2) * sgn; B.cx += (ox / 2) * sgn;
            const rel = (B.vx - A.vx) * sgn;
            if (rel < 0) { const k = rel * 0.5; A.vx += k * sgn; B.vx -= k * sgn; }
            if (pass === 0) { touch(A, "x", rel); touch(B, "x", rel); }
          } else {
            const top = dy > 0 ? A : B, bot = dy > 0 ? B : A;   // top sits above bot
            const rel = top.vy - bot.vy;                           // closing speed
            top.cy -= oy * 0.75; bot.cy += oy * 0.25;
            if (rel > 0) { top.vy = bot.vy - rel * REST; if (rel > 90) bot.vy += rel * 0.1; }
            if (pass === 0) { touch(top, "y", rel); touch(bot, "y", rel); }
          }
        }
      }
      for (const L of letters) if (L.cy > floor) { L.cy = floor; if (L.vy > 0) L.vy = 0; }
    } else {
      letters.filter((L) => L.gone).forEach((L) => L.el.remove());
      letters = letters.filter((L) => !L.gone);
      if (!letters.length) start();
    }
    acc += dt;
    if (acc >= 1 / FPS) { acc = 0; frame++; noise.roll(frame); letters.forEach((L) => place(L, now)); }
  }

  /* Click: play the sequence again from the first letter. */
  const onClick = () => start();
  stage.addEventListener("click", onClick);

  start();
  raf = requestAnimationFrame(tick);
  return {
    stop() {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      stage.removeEventListener("click", onClick);
    },
  };
}
