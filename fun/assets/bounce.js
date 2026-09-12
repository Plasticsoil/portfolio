/* FunType — Collection 03: Snake, Shrink, Towers.

   One simulation engine, two renderers. The engine runs on a virtual
   clock (so the studio can drive it in real time and the export page
   can drive it frame by frame, deterministically from a seed); the DOM
   renderer paints it live in the studio and the embed page; the canvas
   renderer paints one frame at a time for the export page.

   Snake  — the first letter sits in a sticker square, drops in at the
            middle, picks a random direction and travels in a straight
            line at constant speed, reflecting off the walls. Every wall
            hit of the newest tile pops the next letter out of that
            point on the very same heading, a beat behind: one long
            snake on one path. A space is an invisible tile, so the gap
            is real. The text plays once; then the head takes three more
            hits and the whole snake leaves through that same wall,
            fading out. Wall hits squash the tile against the wall and
            briefly slow it, so the gaps squeeze and stretch.
   Shrink — each new letter starts from the centre in a fresh random
            direction, inside a visible inner arena that closes in a
            little at every wall touch. The text repeats until the arena
            is one tile; then the frame keeps closing as a mask until
            nothing is left. No squash: a hit knocks the speed down and
            it eases back.
   Towers — each word is a tower of cubes, side by side in the middle
            (the tile shrinks so the longest word and the word count
            both fit). Cubes drop on a cadence that quickens with every
            cube, land exactly on the stack, hop a little, and sleep.
            Letters drop last-to-first so a tower reads top to bottom;
            Hebrew orders the towers right to left. The build stands a
            moment, the whole ground quakes harder and harder, then the
            floor gives way.

   Shared: Collection 02's sticker language (Switzer 500, slate letter),
   12 fps stop-motion, animated grain, a small fixed offset per tile and
   a per-frame wobble, a random colour per tile drawn from a pool of
   three (seeded, so it repeats with the seed) — no gradient.

   Effect contract (studio / embed):  mount(stage, { word, palette, seed }) → { stop() }
   Export contract:                   scene({ word, palette, seed, grain… }) → { draw(ctx, size, frame, total), n, grain } */

const STAGE = 1080;
const SIZE = 150;               // sticker square side, in stage units
const FONT_SIZE = 72;           // letter size inside the square
const SPEED = 520;              // px / second, in stage units
const SPEED_STEP = 12;          // Snake / Shrink: every new letter makes everything this much faster
const SPAWN_DELAY = 230;        // ms between a wall hit and the next letter
const SLOTS_CHAOS = 400;        // Shrink keeps going until its arena has closed; this is just "plenty"
const SLOTS_TOWER = 42;         // (random-column Tower, no card) stacks this many beats
const SNAKE_BOUNCES = 3;        // Snake: once the last letter is in, the head takes this many more wall hits, then sails out
const HOLD_MS = 1600;           // generic pause once a sequence is complete, before the walls open
const FPS = 12;                 // stop-motion: the picture only updates this often
const JITTER = 3;               // px of hand-held wobble per frame
const OFFSET = 10;              // px: each tile sits a little off its true spot, fixed for its life
const SQUASH = 0.28;            // Snake: how much a square flattens against the wall on impact
const SQUASH_MS = 320;          // … and how long the squash-and-spring lasts
const POP_MS = 260;             // Snake: a new letter pops in from small to full size
const IMPACT_MS = 260;          // Snake / Shrink: a wall hit knocks the speed down, and it eases back over this long
const IMPACT_DIP = 0.3;         // … to this fraction of full speed at the moment of impact
const EXIT_FADE = 700;          // ms: on the way out, every card also fades its tiles to nothing
const LETTER = "#4E4B5D";       // Stickers' slate letter colour
/* Shrink */
const ARENA_START = 0.9;        // the arena starts at this fraction of the stage
const SHRINK = 1.4;             // the arena closes in this much per side at every wall touch
const ARENA_MIN = SIZE;         // … until it is exactly one tile — then the round is over
const CLOSE_SPEED = 90;         // once at one tile, the frame keeps closing as a mask at this px/s per side
const ARENA_SAT = 0.08;         // arena colour = the background, a touch more saturated…
const ARENA_LIGHT = 0.05;       // … and a touch lighter (a card tint when the background is already white)
/* Towers */
const GRAVITY = 2200;           // px / s², in stage units
const FALL0 = 420;              // a cube's speed as it enters from the top
const REST = 0.28;              // how much hop is left after a landing
const GAP0 = 820;               // ms between the first two cubes
const GAP_DECAY = 0.9;          // … each cube shortens the gap by this factor
const GAP_MIN = 90;             // … down to this
const TOWER_HOLD = 1500;        // the finished build stands still this long…
const QUAKE_MS = 1100;          // … then a quake this long, then the floor gives way
const QUAKE_MAX = 26;
/* Interaction */
const PULSE_MS = 450;           // Snake click: the tiles' hand-placed offsets pulse out and settle over this long
const PULSE_K = 4;              // … up to this many times their usual size
const HOP = 260;                // Towers click: every cube gets this much upward speed (px/s)
const TURN_RATE = 6;            // Snake hover: the head turns toward the pointer at up to this many rad/s
const GLIDE = 6;                // Towers hover: a cube entering at the pointer's x eases to its column at this rate (1/s)
const ARENA_MOVE = 7;           // Shrink click: the arena eases to its new spot at this rate (1/s)
const TRAIL_KEEP = 1400;        // Snake: how many head states to remember for the body to replay while hovering           // the ground's shake grows from nothing to this many px (sideways; less up and down)
const COLS = Math.floor(STAGE / SIZE);            // random-column Tower: grid columns
const COL0 = (STAGE - COLS * SIZE) / 2 + SIZE / 2;

/* Colour rule, the studio's way: a palette is { frame, card, ink,
   anchor } — frame is the background, the tiles draw at random from
   the other three (seeded, so a given seed always draws the same
   sequence). Exactly like every other collection: whatever the pill
   shows is what every card in the section uses, and the shuffle deals
   each card a different entry from this list. The first four entries
   are the four rotations of the collection's own colours (blue · pink
   · yellow · white); Snake, Shrink and Towers default to the first
   three. The rest are Collection 02's and Collection 01's palettes. */
export const p = [
  { frame: "#49C7FD", card: "#FA8EFA", ink: "#FFFF66", anchor: "#FFFFFF" },   // Snake:  blue ground
  { frame: "#FA8EFA", card: "#FFFF66", ink: "#FFFFFF", anchor: "#49C7FD" },   // Shrink: pink ground
  { frame: "#FFFF66", card: "#FFFFFF", ink: "#49C7FD", anchor: "#FA8EFA" },   // Towers: yellow ground
  { frame: "#FFFFFF", card: "#49C7FD", ink: "#FA8EFA", anchor: "#FFFF66" },   //         white ground
  { frame: "#A9FF67", card: "#FFFFFF", ink: "#5BE03A", anchor: "#49C7FD" },   // Collection 02, from here down
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
  { frame: "#FF7300", card: "#FA8EFA", ink: "#FFFFFF", anchor: "#FFFF66" },
];
/* The palette is used as given — no per-card rotation, so the studio's
   pill, shuffle and overrides behave exactly as in the other sections. */
function dealPalette(mode, given) { return given; }

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
/* Deterministic hash → [-1, 1], the same one the other effects use for
   per-frame wobble: (element, frame, axis) always gives the same nudge. */
function wobble(i, frame, axis) {
  let d = (i * 73856093) ^ (frame * 19349663) ^ (axis * 83492791);
  d = Math.imul(d ^ (d >>> 13), 2246822507);
  d = (d ^ (d >>> 16)) >>> 0;
  return (d / 4294967296) * 2 - 1;
}
/* A random heading that stays clear of the axes. */
function heading(rand) {
  const quadrant = Math.floor(rand() * 4);
  const a = (20 + rand() * 50) * (Math.PI / 180);   // 20°–70°
  return quadrant * (Math.PI / 2) + a;
}
/* Mix two hex colours: t = 0 → a, t = 1 → b. */
function mix(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
  const ch = (sh) => Math.round(((A >> sh) & 255) * (1 - t) + ((B >> sh) & 255) * t);
  return "#" + [16, 8, 0].map((sh) => ch(sh).toString(16).padStart(2, "0")).join("");
}
/* Nudge a hex colour's saturation and lightness (HSL), clamped. */
function shift(hex, ds, dl) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, sat = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  sat = Math.min(1, Math.max(0, sat + ds));
  l = Math.min(1, Math.max(0, l + dl));
  const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, p2 = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p2 + (q - p2) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p2 + (q - p2) * (2 / 3 - t) * 6 : p2; };
  const to = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  return "#" + to(f(h + 1 / 3)) + to(f(h)) + to(f(h - 1 / 3));
}
/* The arena tint: the background, a touch lighter and more saturated.
   A white background can't go lighter, so it takes a tint of the card. */
function arenaColour(pal) {
  const c = shift(pal.frame, ARENA_SAT, ARENA_LIGHT);
  return c.toLowerCase() === pal.frame.toLowerCase() ? mix(pal.frame, pal.card, 0.2) : c;
}

/* ---------- the engine ---------- */

/* Runs the whole piece on a virtual clock. step(dt) advances it;
   snapshot(frame) describes what to paint for stop-motion frame
   `frame`. `loops` counts completed rounds. */
function engine(mode, { word = "", palette, seed = 0, shrink = SHRINK } = {}) {
  const snake = mode === "snake", chaos = mode === "chaos", tower = mode === "tower", rows = mode === "pillars";
  const noScale = !snake;
  const pal = dealPalette(mode, palette || p[0]);
  const arena = chaos ? arenaColour(pal) : null;

  /* The beat sequence: the text, uppercased, whitespace collapsed. */
  const base = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  const empty = !base.filter((c) => c !== " ").length;
  const seq = [];
  const slots = rows ? 0 : tower ? SLOTS_TOWER : chaos ? SLOTS_CHAOS : 0;
  if (snake) seq.push(...base);
  while (!empty && seq.length < slots) {
    if (seq.length) seq.push(" ");
    for (const c of base) { if (seq.length < slots) seq.push(c); }
  }
  /* Towers: typeset the words as columns standing on the floor. */
  let tileSize = SIZE;
  const plan = [];
  if (rows && !empty) {
    const words = base.join("").split(" ").filter(Boolean).map((w) => [...w]);
    const longest = Math.max(...words.map((w) => w.length));
    tileSize = Math.min(SIZE, Math.floor((STAGE - 40) / longest), Math.floor((STAGE - 40) / words.length));
    const rtl = /[֐-׿؀-ۿ]/.test(base.join(""));
    const x0 = (STAGE - words.length * tileSize) / 2;
    words.forEach((w, wi) => {
      const col = rtl ? words.length - 1 - wi : wi;
      const cx = x0 + col * tileSize + tileSize / 2;
      for (let i = w.length - 1; i >= 0; i--) {
        const fromFloor = w.length - 1 - i;
        plan.push({ ch: w[i], cx, landCy: STAGE - tileSize / 2 - fromFloor * tileSize });
      }
    });
    seq.push(...plan.map((q) => q.ch));
  }
  const HALF0 = STAGE / 2 - (STAGE * (1 - ARENA_START)) / 2;   // Shrink: the arena's half-size at the start
  const HALF_MIN = ARENA_MIN / 2;                              // … and at one tile

  let rand = rng(seed);
  let now = 0;               // virtual ms
  let timers = [];           // { at, fn }
  let letters = [];
  let cursor = 0, count = 0;
  let phase = "fill";        // fill → hold → (quake) → drain | close → restart
  let speed = SPEED;
  let ax = STAGE / 2, ay = STAGE / 2, half = HALF0;   // Shrink: the arena — a square by centre and half-size
  let arenaTo = null;        // Shrink click: where the arena is gliding to
  let gap = GAP0;
  let quakeAt = 0, drainAt = 0, freeAt = null;
  let loops = 0;
  let lastFill = null, lastFillRun = 0;
  const heights = new Array(COLS).fill(0);
  /* Interaction state */
  let pointer = null;        // { x, y } in stage units while hovering, else null
  let pulseAt = -1e9;        // Snake click
  let trailing = false;      // Snake hover: the body replays the head's trail
  const trail = [];          // Snake: the head's recent states, oldest first

  const after = (ms, fn) => timers.push({ at: now + ms, fn });
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

  function repace() {
    for (const L of letters) {
      const v = Math.hypot(L.vx, L.vy);
      if (!v) continue;
      const k = speed / v;
      L.vx *= k; L.vy *= k;
    }
  }

  const POOL = [pal.card, pal.ink, pal.anchor];
  function pickFill() {
    const choices = lastFillRun >= 2 ? POOL.filter((c) => c !== lastFill) : POOL;
    const pool = choices.length ? choices : POOL;
    const c = pool[Math.floor(rand() * pool.length)];
    lastFillRun = c === lastFill ? lastFillRun + 1 : 1;
    lastFill = c;
    return c;
  }
  function makeLetter(ch, cx, cy, vx, vy) {
    const blank = ch === " ";
    const fill = blank ? null : pickFill();
    const prev = letters[letters.length - 1];
    const L = {
      id: count, idx: count, ch, blank, fill, size: tileSize, half: tileSize / 2,
      cx, cy, vx, vy, spawned: false, asleep: false, gone: false,
      ox: (rand() * 2 - 1) * OFFSET, oy: rows ? 0 : (rand() * 2 - 1) * OFFSET,
      born: now, hitAt: -1e9, hitAxis: "x", hitSide: -1, hits: 0, lastHits: 0, free: false, freedAt: 0, landCy: 0,
      tx: cx,                                       // Towers: the column it glides to while falling
      delay: trailing && prev ? prev.delay + SPAWN_DELAY : 0,   // Snake trail: how far behind the head it rides
      lastReplayHit: -1e9,
    };
    count++;
    letters.push(L);
    if (!tower && !rows) { speed = SPEED + SPEED_STEP * (count - 1); repace(); }
    return L;
  }

  function finish() {
    if (snake) { phase = "hold"; return; }
    if (tower || rows) {
      phase = "hold";
      after(TOWER_HOLD, () => {
        phase = "quake"; quakeAt = now;
        after(QUAKE_MS, () => { phase = "drain"; drainAt = now; });
      });
      return;
    }
    phase = "hold";
    after(HOLD_MS, () => { phase = "drain"; drainAt = now; });
  }
  /* Shrink: keep every tile inside the arena. */
  function fence() {
    const h = Math.max(half, HALF_MIN);
    for (const L of letters) {
      L.cx = clamp(L.cx, ax - h + L.half, ax + h - L.half);
      L.cy = clamp(L.cy, ay - h + L.half, ay + h - L.half);
    }
  }
  function shrinkArena() {
    if (phase !== "fill") return;
    half = Math.max(half - shrink, HALF_MIN);
    if (half <= HALF_MIN) phase = "close";
    fence();
  }
  function dropIn(ch) {
    const open = heights.map((h, i) => (h < COLS ? i : -1)).filter((i) => i >= 0);
    if (!open.length) { cursor = seq.length; finish(); return; }
    const col = open[Math.floor(rand() * open.length)];
    const x = COL0 + col * SIZE;
    const L = makeLetter(ch, pointer ? clamp(pointer.x, SIZE / 2, STAGE - SIZE / 2) : x, -SIZE / 2, 0, FALL0);
    L.tx = x;
    L.landCy = STAGE - SIZE / 2 - heights[col] * SIZE;
    heights[col]++;
  }
  function slideIn(i) {
    const q = plan[i];
    /* Hover: the cube enters at the pointer's x and glides to its column. */
    const L = makeLetter(q.ch, pointer ? clamp(pointer.x, tileSize / 2, STAGE - tileSize / 2) : q.cx, -tileSize / 2, 0, FALL0);
    L.tx = q.cx;
    L.landCy = q.landCy;
  }
  function scheduleDrop() {
    if (cursor >= seq.length) { finish(); return; }
    const ch = seq[cursor++];
    after(gap, () => {
      if (ch !== " ") { if (rows) slideIn(cursor - 1); else dropIn(ch); gap = Math.max(GAP_MIN, gap * GAP_DECAY); }
      if (cursor >= seq.length) finish(); else scheduleDrop();
    });
  }
  function onSpawnerHit(L) {
    if (tower || rows) return;
    if (cursor >= seq.length) { finish(); return; }
    const ch = seq[cursor++];
    if (ch === " " && !snake) return;
    L.spawned = true;
    /* Snake: out of the collision point on the spawner's heading.
       Shrink: from the arena's centre — or, while hovering, from the
       pointer, kept inside the arena. */
    let cx = L.cx, cy = L.cy;
    if (chaos) {
      const h = Math.max(half, HALF_MIN) - tileSize / 2;
      cx = pointer ? clamp(pointer.x, ax - h, ax + h) : ax;
      cy = pointer ? clamp(pointer.y, ay - h, ay + h) : ay;
    }
    const ang = snake ? Math.atan2(L.vy, L.vx) : heading(rand);
    const vx = Math.cos(ang) * speed, vy = Math.sin(ang) * speed;
    after(SPAWN_DELAY, () => {
      makeLetter(ch, cx, cy, vx, vy);
      if (cursor >= seq.length) finish();
    });
  }

  function start() {
    timers = []; letters = []; trail.length = 0; trailing = false;
    cursor = 0; count = 0; freeAt = null; lastFill = null; lastFillRun = 0;
    phase = "fill"; ax = STAGE / 2; ay = STAGE / 2; half = HALF0; arenaTo = null; gap = GAP0; speed = SPEED;
    heights.fill(0);
    if (empty) return;
    if (tower) { dropIn(seq[cursor++]); scheduleDrop(); return; }
    if (rows) { slideIn(cursor++); scheduleDrop(); return; }
    const ang = heading(rand);
    makeLetter(seq[cursor++], STAGE / 2, STAGE / 2, Math.cos(ang) * SPEED, Math.sin(ang) * SPEED);
  }
  /* Every fresh round reshuffles from a brand-new random seed — the first
     round still honours the seed it was given (so a shared link or an
     export replays identically), but restarts never repeat the exact
     same colour draw forever. */
  function restart() { loops++; rand = rng((Math.random() * 4294967296) >>> 0); start(); }

  /* ----- interaction ----- */

  /* Pointer in stage units, or null when it leaves. */
  function setPointer(pt) {
    const was = pointer;
    pointer = pt ? { x: pt.x, y: pt.y } : null;
    if (!snake) return;
    if (pointer && !was) beginTrail();
    if (!pointer && was) trailing = false;         // the body carries on from where it is, on its own physics
  }
  /* Snake hover starts: work out how far behind the head each tile is
     (the trail entry nearest to it), so it can ride the head's path. */
  function beginTrail() {
    if (!trail.length || letters.length < 2) { trailing = !!trail.length; return; }
    for (let i = 1; i < letters.length; i++) {
      const L = letters[i];
      let best = 0, bd = Infinity;
      for (let j = trail.length - 1; j >= 0; j--) {
        const h = trail[j];
        const d = (h.x - L.cx) ** 2 + (h.y - L.cy) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      L.delay = Math.max(1, now - trail[best].t);
      L.lastReplayHit = trail[best].hitAt;
    }
    trailing = true;
  }
  /* Click, in stage units. */
  function click(pt) {
    if (snake) { pulseAt = now; return; }
    if (tower || rows) {
      for (const L of letters) if (L.asleep || L.vy === 0) { L.asleep = false; L.vy = -HOP; }
      return;
    }
    if (chaos) {
      const h = Math.max(half, HALF_MIN);
      arenaTo = { x: h + rand() * (STAGE - 2 * h), y: h + rand() * (STAGE - 2 * h) };
    }
  }
  /* Read the head's state `delayMs` ago from the trail (interpolated). */
  function trailAt(delayMs) {
    const t = now - delayMs;
    let j = trail.length - 1;
    while (j > 0 && trail[j].t > t) j--;
    const a = trail[j], b = trail[Math.min(j + 1, trail.length - 1)];
    const span = b.t - a.t || 1;
    const f = clamp((t - a.t) / span, 0, 1);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, vx: b.vx, vy: b.vy, hitAt: b.hitAt, hitAxis: b.hitAxis, hitSide: b.hitSide };
  }

  function stepBounce(dt) {
    const spawner = letters[letters.length - 1];
    const head = letters[0];
    /* Snake hover: the head turns toward the pointer. */
    if (snake && pointer && head && !head.free) {
      const want = Math.atan2(pointer.y - head.cy, pointer.x - head.cx);
      const cur = Math.atan2(head.vy, head.vx);
      let d = want - cur;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      const turn = clamp(d, -TURN_RATE * dt, TURN_RATE * dt);
      const v = Math.hypot(head.vx, head.vy) || speed;
      head.vx = Math.cos(cur + turn) * v; head.vy = Math.sin(cur + turn) * v;
    }
    /* Shrink click: the arena glides to its new spot. */
    if (chaos && arenaTo) {
      const k = Math.min(1, ARENA_MOVE * dt);
      ax += (arenaTo.x - ax) * k; ay += (arenaTo.y - ay) * k;
      if (Math.abs(arenaTo.x - ax) + Math.abs(arenaTo.y - ay) < 0.5) { ax = arenaTo.x; ay = arenaTo.y; arenaTo = null; }
      fence();
    }
    const wh = chaos ? Math.max(half, HALF_MIN) : STAGE / 2;
    const cxA = chaos ? ax : STAGE / 2, cyA = chaos ? ay : STAGE / 2;
    for (const L of letters) {
      /* Snake hover: everyone but the head rides the head's trail. */
      if (snake && trailing && L !== head && !L.free && trail.length > 1) {
        const h = trailAt(L.delay);
        L.cx = h.x; L.cy = h.y; L.vx = h.vx; L.vy = h.vy;
        if (h.hitAt !== L.lastReplayHit) {          // the head hit a wall here: so do we, now
          L.lastReplayHit = h.hitAt;
          L.hitAt = now; L.hitAxis = h.hitAxis; L.hitSide = h.hitSide;
          L.hits++;
          if (freeAt !== null && !L.free && L.hits >= freeAt - L.idx) { L.free = true; L.freedAt = now; }
          if (phase === "fill" && L === spawner && !L.spawned) onSpawnerHit(L);
        }
        continue;
      }
      let k = 1;
      const ti = (now - L.hitAt) / IMPACT_MS;
      if (ti >= 0 && ti < 1) k = IMPACT_DIP + (1 - IMPACT_DIP) * (1 - Math.pow(1 - ti, 3));
      L.cx += L.vx * k * dt;
      L.cy += L.vy * k * dt;
      if (phase === "drain" || L.free) {
        if (L.cx + L.half < 0 || L.cx - L.half > STAGE || L.cy + L.half < 0 || L.cy - L.half > STAGE) L.gone = true;
        continue;
      }
      const lox = cxA - wh + L.half, hix = cxA + wh - L.half, loy = cyA - wh + L.half, hiy = cyA + wh - L.half;
      let hit = false;
      if (L.cx < lox) { L.cx = 2 * lox - L.cx; L.vx = Math.abs(L.vx); hit = "x"; }
      else if (L.cx > hix) { L.cx = 2 * hix - L.cx; L.vx = -Math.abs(L.vx); hit = "x"; }
      if (L.cy < loy) { L.cy = 2 * loy - L.cy; L.vy = Math.abs(L.vy); hit = "y"; }
      else if (L.cy > hiy) { L.cy = 2 * hiy - L.cy; L.vy = -Math.abs(L.vy); hit = "y"; }
      if (hit) {
        L.hitAt = now; L.hitAxis = hit;
        L.hitSide = hit === "x" ? (L.vx > 0 ? -1 : 1) : (L.vy > 0 ? -1 : 1);
        if (chaos) shrinkArena();
        L.hits++;
        if (snake) {
          if (freeAt === null && phase === "hold" && L.idx === 0 && ++L.lastHits >= SNAKE_BOUNCES) freeAt = L.hits;
          if (freeAt !== null && !L.free && L.hits >= freeAt - L.idx) { L.free = true; L.freedAt = now; }
        }
        if (phase === "fill" && L === spawner && !L.spawned) onSpawnerHit(L);
      }
    }
    /* Snake: remember the head's state for the body to replay. */
    if (snake && head) {
      trail.push({ t: now, x: head.cx, y: head.cy, vx: head.vx, vy: head.vy, hitAt: head.hitAt, hitAxis: head.hitAxis, hitSide: head.hitSide });
      if (trail.length > TRAIL_KEEP) trail.splice(0, trail.length - TRAIL_KEEP);
    }
    if (phase === "drain" || (snake && phase === "hold")) {
      letters = letters.filter((L) => !L.gone);
      if (!letters.length) restart();
    }
    if (phase === "close") {
      half -= CLOSE_SPEED * dt;
      if (half <= 0) restart();
    }
  }
  function stepTower(dt) {
    for (const L of letters) {
      if (phase === "drain") L.asleep = false;
      if (L.asleep) continue;
      L.vy += GRAVITY * dt;
      L.cy += L.vy * dt;
      /* Glide sideways to the column while falling. */
      if (L.cx !== L.tx) { L.cx += (L.tx - L.cx) * Math.min(1, GLIDE * dt); if (Math.abs(L.tx - L.cx) < 0.5) L.cx = L.tx; }
      if (phase === "drain") { if (L.cy - L.half > STAGE) L.gone = true; continue; }
      if (L.cy >= L.landCy) {
        const v = L.vy;
        L.cy = L.landCy; L.cx = L.tx;
        if (v > 160) L.vy = -v * REST; else { L.vy = 0; L.asleep = true; }
        if (v > 90) { L.hitAt = now; L.hitAxis = "y"; }
      }
    }
    if (phase === "drain") {
      letters = letters.filter((L) => !L.gone);
      if (!letters.length) restart();
    }
  }

  /* Advance the virtual clock by dt seconds. */
  function step(dt) {
    now += dt * 1000;
    if (timers.length) {
      timers.sort((a, b) => a.at - b.at);
      while (timers.length && timers[0].at <= now) timers.shift().fn();
    }
    if (empty) return;
    if (tower || rows) stepTower(dt); else stepBounce(dt);
  }

  /* What to paint for stop-motion frame `frame`, at the current time. */
  function snapshot(frame) {
    const tiles = [];
    /* Snake click: the hand-placed offsets pulse out and settle. */
    const tp = (now - pulseAt) / PULSE_MS;
    const amp = tp >= 0 && tp < 1 ? 1 + PULSE_K * (1 - tp) * (1 - tp) : 1;
    const wh = chaos ? Math.max(half, HALF_MIN) : STAGE / 2;
    const cxA = chaos ? ax : STAGE / 2, cyA = chaos ? ay : STAGE / 2;
    for (const L of letters) {
      let jx = (L.ox + wobble(L.id, frame, 0) * JITTER) * amp, jy = (L.oy + wobble(L.id, frame, 1) * JITTER) * amp;
      let sx = 1, sy = 1;
      const th = noScale ? 1 : (now - L.hitAt) / SQUASH_MS;
      if (th >= 0 && th < 1) {
        const k = Math.sin(th * Math.PI) * SQUASH;
        if (L.hitAxis === "x") { sx = 1 - k; sy = 1 + k; } else { sx = 1 + k; sy = 1 - k; }
        if (L.hitAxis === "x") jx += (1 - sx) * L.half * -L.hitSide; else jy += (1 - sy) * L.half * -L.hitSide;
      }
      if (!tower && !rows && phase !== "drain" && !L.free) {
        const lox = cxA - wh + L.half, hix = cxA + wh - L.half, loy = cyA - wh + L.half, hiy = cyA + wh - L.half;
        if (now - L.hitAt < 1000 / FPS + 20) {
          if (L.hitAxis === "x") jx = (L.hitSide < 0 ? lox : hix) - L.cx + (th < 1 ? (1 - sx) * L.half * -L.hitSide : 0);
          else jy = (L.hitSide < 0 ? loy : hiy) - L.cy + (th < 1 ? (1 - sy) * L.half * -L.hitSide : 0);
        }
        jx = clamp(L.cx + jx, lox, hix) - L.cx;
        jy = clamp(L.cy + jy, loy, hiy) - L.cy;
      }
      const tb = noScale ? 1 : (now - L.born) / POP_MS;
      if (tb < 1) {
        const pop = 0.4 + 0.6 * (1 + 1.8 * Math.pow(tb - 1, 3) + 0.8 * Math.pow(tb - 1, 2));
        sx *= pop; sy *= pop;
      }
      let alpha = 1;
      if (L.free) alpha = 1 - (now - L.freedAt) / EXIT_FADE;
      else if (phase === "drain") alpha = 1 - (now - drainAt) / EXIT_FADE;
      tiles.push({ id: L.id, ch: L.ch, blank: L.blank, fill: L.fill, size: L.size, x: L.cx + jx, y: L.cy + jy, sx, sy, alpha: Math.max(0, Math.min(1, alpha)) });
    }
    let gx = 0, gy = 0;
    if (phase === "quake") {
      const t = Math.min(1, (now - quakeAt) / QUAKE_MS);
      const a = QUAKE_MAX * t * t;
      gx = wobble(7, frame, 0) * a; gy = wobble(7, frame, 1) * a * 0.4;
    }
    const closing = phase === "close";
    const hv = Math.max(half, 0);
    return {
      bg: pal.frame,
      arena: chaos ? { x: ax - hv, y: ay - hv, size: 2 * hv, colour: arena, clip: closing, alpha: closing ? clamp(hv / HALF_MIN, 0, 1) : 1 } : null,
      ground: { x: gx, y: gy },
      tiles,
    };
  }

  start();
  return { step, snapshot, restart, setPointer, click, get loops() { return loops; }, get now() { return now; }, get phase() { return phase; }, pal, empty };
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

function mount(stage, mode, { word = "", palette, seed = 0 } = {}) {
  const eng = engine(mode, { word, palette, seed });
  const pal = eng.pal;
  stage.innerHTML = "";
  stage.style.cssText = `position:relative;width:${STAGE}px;height:${STAGE}px;overflow:hidden;isolation:isolate;background:${pal.frame};`;
  if (eng.empty) return { stop() {} };

  let arenaEl = null;
  if (mode === "chaos") {
    arenaEl = document.createElement("div");
    arenaEl.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;";
    stage.appendChild(arenaEl);
  }
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
    if (arenaEl) {
      const A = s.arena;
      arenaEl.style.left = A.x.toFixed(1) + "px"; arenaEl.style.top = A.y.toFixed(1) + "px";
      arenaEl.style.width = A.size.toFixed(1) + "px"; arenaEl.style.height = A.size.toFixed(1) + "px";
      arenaEl.style.background = A.colour;
      layer.style.clipPath = A.clip ? `inset(${A.y.toFixed(1)}px ${(STAGE - A.x - A.size).toFixed(1)}px ${(STAGE - A.y - A.size).toFixed(1)}px ${A.x.toFixed(1)}px)` : "";
      layer.style.opacity = A.clip ? A.alpha.toFixed(2) : "";
    }
    layer.style.transform = s.ground.x || s.ground.y ? `translate(${s.ground.x.toFixed(1)}px, ${s.ground.y.toFixed(1)}px)` : "";
    const seen = new Set();
    for (const t of s.tiles) {
      seen.add(t.id);
      let e = els.get(t.id);
      if (!e) {
        const el = document.createElement("div");
        el.style.cssText = `position:absolute;left:${-t.size / 2}px;top:${-t.size / 2}px;width:${t.size}px;height:${t.size}px;background:${t.blank ? "transparent" : t.fill};display:flex;align-items:center;justify-content:center;will-change:transform;`;
        const glyph = document.createElement("span");
        glyph.style.cssText = `position:relative;font-family:"Switzer","Rubik",system-ui,sans-serif;font-weight:500;font-size:${(FONT_SIZE * t.size) / SIZE}px;line-height:1;color:${LETTER};text-transform:uppercase;letter-spacing:-0.02em;will-change:transform;`;
        glyph.textContent = t.ch;
        el.appendChild(glyph);
        layer.appendChild(el);                       // newest on top
        e = { el, glyph };
        els.set(t.id, e);
      }
      e.el.style.transform = `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) scale(${t.sx.toFixed(3)}, ${t.sy.toFixed(3)})`;
      e.el.style.opacity = t.alpha >= 1 ? "" : t.alpha.toFixed(2);
      e.glyph.style.transform = t.sx === 1 && t.sy === 1 ? "" : `scale(${(1 / t.sx).toFixed(3)}, ${(1 / t.sy).toFixed(3)})`;
    }
    for (const [id, e] of els) if (!seen.has(id)) { e.el.remove(); els.delete(id); }
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
  /* Pointer and click, converted from screen pixels to stage units
     (the stage is scaled with a CSS transform). */
  const toStage = (ev) => {
    const r = stage.getBoundingClientRect();
    const k = r.width / STAGE || 1;
    return { x: (ev.clientX - r.left) / k, y: (ev.clientY - r.top) / k };
  };
  const onMove = (ev) => { if (ev.pointerType === "touch") return; eng.setPointer(toStage(ev)); };
  const onLeave = () => eng.setPointer(null);
  const onClick = (ev) => eng.click(toStage(ev));
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerleave", onLeave);
  stage.addEventListener("click", onClick);
  paint(0);
  raf = requestAnimationFrame(tick);
  return { stop() { cancelAnimationFrame(raf); stage.removeEventListener("pointermove", onMove); stage.removeEventListener("pointerleave", onLeave); stage.removeEventListener("click", onClick); } };
}

export const m = (stage, opts) => mount(stage, "snake", opts);
export const c = (stage, opts) => mount(stage, "chaos", opts);
export const r = (stage, opts) => mount(stage, "pillars", opts);
export const t = (stage, opts) => mount(stage, "tower", opts);

/* ---------- canvas renderer (export page) ---------- */

/* The export page plays a fixed loop (7.5 s at 12 fps); it asks for
   frame i of `total`. We simulate one full round from the seed, find
   how long it took, and spread those `total` frames over it — so the
   exported loop always contains exactly one complete round. Shrink's
   round is long, so its arena closes faster for export. */
const EXPORT_SEED = 20260606, SIM_DT = 1 / 120, SIM_MAX_S = 90;
function scene(mode, { word = "", palette, seed, grain = true, grainOpacity = 0.5, grainScale = 1.2 } = {}) {
  const s0 = (seed | 0) || EXPORT_SEED;
  const opts = { word, palette, seed: s0, shrink: mode === "chaos" ? SHRINK * 2.4 : SHRINK };
  const pal = dealPalette(mode, palette || p[0]);
  let frames = null, cachedTotal = 0;
  function build(total) {
    /* Pass 1: how long is one round? */
    let e = engine(mode, opts);
    let dur = SIM_MAX_S;
    if (!e.empty) {
      let t = 0;
      while (e.loops < 1 && t < SIM_MAX_S) { e.step(SIM_DT); t += SIM_DT; }
      dur = Math.max(1, e.now / 1000);
    }
    /* Pass 2: sample `total` frames across it. */
    e = engine(mode, opts);
    frames = [];
    let simT = 0;
    for (let i = 0; i < total; i++) {
      const target = (i / total) * dur;
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
    if (s.arena) {
      const A = s.arena;
      ctx.fillStyle = A.colour;
      ctx.fillRect(A.x * k, A.y * k, A.size * k, A.size * k);
      if (A.clip) {
        ctx.beginPath(); ctx.rect(A.x * k, A.y * k, A.size * k, A.size * k); ctx.clip();
        ctx.globalAlpha = A.alpha;
      }
    }
    ctx.translate(s.ground.x * k, s.ground.y * k);
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const baseAlpha = ctx.globalAlpha;
    for (const t of s.tiles) {
      if (t.blank) continue;
      const x = t.x * k, y = t.y * k, half = (t.size / 2) * k;
      ctx.globalAlpha = baseAlpha * t.alpha;
      ctx.save();
      ctx.translate(x, y); ctx.scale(t.sx, t.sy);
      ctx.fillStyle = t.fill;
      ctx.fillRect(-half, -half, half * 2, half * 2);
      ctx.restore();
      ctx.fillStyle = LETTER;
      ctx.font = `500 ${((FONT_SIZE * t.size) / SIZE) * k}px "Switzer","Rubik",system-ui,sans-serif`;
      ctx.fillText(t.ch, x, y);
    }
    ctx.restore();
  }
  return { draw, n: 90, pal, grain: grain ? { opacity: grainOpacity, scale: grainScale, animated: true } : null };
}
export const x = {
  bounce: (o) => scene("snake", o),
  "bounce-chaos": (o) => scene("chaos", o),
  "bounce-pillars": (o) => scene("pillars", o),
};

/* Exposed so the export page can sample a single still frame (SVG) straight
   off the real simulation instead of re-implementing it. */
export { engine };
