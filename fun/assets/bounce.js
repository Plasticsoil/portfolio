/* FunType — Collection 03 / "Bounce" (Snake + Chaos)
   The first letter of the word sits in a rounded sticker square, drops
   in at the middle of the stage, picks a random direction and travels
   in a straight line at constant speed. When the square touches a wall
   it reflects off it (angle in = angle out, speed unchanged).

   The rest of the word arrives one letter per wall hit: the newest
   square is the "spawner"; the first time it touches a wall, the next
   letter appears a beat later and becomes the new spawner. The newest
   square is always painted on top. In Snake a space is an invisible
   tile that rides along like any letter, so words stay apart; in Chaos
   it is a silent beat — a wall hit that spawns nothing.

   Two flavours:
     Snake — the new letter pops out of the collision point on exactly
             the spawner's heading, so every letter follows the first
             one's path with a delay: one long snake. The text plays
             once, so the loop is as long as the text; when the last
             letter is in, every tile takes three more wall hits and
             then sails straight out of the frame — head first, tail
             following along the very same path.
     Chaos — the new letter starts from the centre in a fresh random
             direction. The walls are a visible inner square that
             closes in a little at every touch; the text repeats until
             the arena is down to a single tile. Then the frame keeps
             closing as a mask over the letters until nothing is left,
             and the round starts over.
             No squash here: a wall hit knocks the speed down and it
             eases back, which is the bounce feel.

   Tower — the stage is a grid of columns. Each letter drops down a
           random column (a fresh roll every round, whatever the seed) and lands exactly on the floor or on the top
           tile of that column, with a small hop. Cubes drop on a
           cadence that gets quicker with every cube.

   Pillars — shown in the studio as "Towers": each word is its own
             tower, the towers stand side by side in the middle, and
             the tile shrinks so the longest word and the number of
             words both fit. Letters drop in last-to-first so each
             tower reads top to bottom; words go left to right (right
             to left for Hebrew). Cubes come on a quickening cadence.

   (The "tower" mode — random columns — is still here for the export
   and embed pages but no longer has a card.)

   Both end with a quake: the whole ground shakes as one, gently at
   first and harder and harder, then the floor gives way and the whole
   pile drops out of the frame.

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
const SPEED = 520;              // px / second, in stage units
const SPEED_STEP = 12;          // every new letter makes everything this much faster
const SPAWN_DELAY = 230;        // ms between a wall hit and the next letter (≈120px along the path)
const SNAKE_BOUNCES = 3;        // Snake: once the last letter is in, each tile takes this many more wall hits, then sails out
const SLOTS_CHAOS = 400;        // Chaos keeps going until its arena has closed (see SHRINK); this is just "plenty"
const SLOTS_TOWER = 42;         // Tower stacks this many beats
const HOLD_MS = 1600;           // pause once the sequence is complete, before the walls open
const GRAVITY = 2200;           // Tower: px / s², in stage units
const FALL0 = 420;              // Tower: a letter's speed as it enters from the top
const REST = 0.28;              // Tower: how much bounce is left after a landing
const COLS = Math.floor(STAGE / SIZE);          // Tower: the stage is a grid of this many columns
const COL0 = (STAGE - COLS * SIZE) / 2 + SIZE / 2; // … and this is the first column's centre x
const FPS = 12;                 // stop-motion: the picture only updates this often
const JITTER = 3;               // px of hand-held wobble per frame
const OFFSET = 10;              // px: each tile sits a little off its true spot, fixed for its life
const SQUASH = 0.28;            // how much a square flattens against the wall on impact
const SQUASH_MS = 320;          // and how long the squash-and-spring lasts
const POP_MS = 260;             // a new letter pops in from small to full size
const TILT = 0;                 // ± degrees, a fixed tilt per square (off)
const LETTER = "#4E4B5D";       // Stickers' slate letter colour
const ARENA_START = 0.9;        // Chaos: the arena starts at this fraction of the stage
const SHRINK = 1.4;             // Chaos: the arena closes in this much per side at every wall touch
const CLOSE_SPEED = 90;         // Chaos: once at one tile, the frame keeps closing as a mask at this px/s per side
const ARENA_MIN = SIZE;         // … until it is exactly one tile — then the round is over
const IMPACT_MS = 260;          // Chaos: a wall hit knocks the speed down, and it eases back over this long
const IMPACT_DIP = 0.3;         // … to this fraction of full speed at the moment of impact
const GAP0 = 760;               // Tower: ms between the first two cubes
const GAP_DECAY = 0.94;         // … each cube shortens the gap by this factor
const GAP_MIN = 110;            // … down to this
const QUAKE_MS = 1100;          // Tower / Pillars ending: a quake this long, then the floor gives way
const QUAKE_MAX = 26;           // … the ground's shake grows from nothing to this many px (sideways; less up and down)
const ARENA_SAT = 0.18;         // arena colour = the background, this much more saturated…
const ARENA_LIGHT = 0.10;       // … and this much lighter (a card tint when the background is already white)

/* Collection 02's palettes (same values as Dots / Stickers / Loop),
   read with this collection's own rule: frame = background, and the
   tiles run a stepped gradient from card (first letter) to ink (last
   letter). anchor is unused. */
export const p = [
  { frame: "#A9FF67", card: "#FFFFFF", ink: "#5BE03A", anchor: "#49C7FD" },
  { frame: "#49C7FD", card: "#FFFFFF", ink: "#5BE03A", anchor: "#A9FF67" },
  { frame: "#FFFFFF", card: "#49C7FD", ink: "#5BE03A", anchor: "#D9FF93" },
  { frame: "#5BE03A", card: "#49C7FD", ink: "#B9F1FA", anchor: "#A9FF67" },
  { frame: "#B9F1FA", card: "#A9FF67", ink: "#D9FF93", anchor: "#49C7FD" },
  { frame: "#D9FF93", card: "#5BE03A", ink: "#FFFFFF", anchor: "#49C7FD" },
];


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

/* The arena tint: the background, lighter and more saturated. A white
   background can't go lighter, so it takes a tint of the card colour. */
function arenaColour(pal) {
  const c = shift(pal.frame, ARENA_SAT, ARENA_LIGHT);
  return c.toLowerCase() === pal.frame.toLowerCase() ? mix(pal.frame, pal.card, 0.35) : c;
}

export const m = (stage, opts) => mount(stage, { ...opts, mode: "snake" });
export const c = (stage, opts) => mount(stage, { ...opts, mode: "chaos" });
export const t = (stage, opts) => mount(stage, { ...opts, mode: "tower" });
export const r = (stage, opts) => mount(stage, { ...opts, mode: "pillars" });

function mount(stage, { word = "", palette, seed = 0, mode = "snake" } = {}) {
  const snake = mode === "snake", chaos = mode === "chaos", tower = mode === "tower", rows = mode === "pillars";
  const framed = chaos;                          // Chaos plays inside a closing arena
  const noScale = !snake;                        // only Snake squashes and pops
  const pal = palette || p[0];
  stage.innerHTML = "";
  stage.style.cssText = `position:relative;width:${STAGE}px;height:${STAGE}px;overflow:hidden;isolation:isolate;background:${pal.frame};`;

  /* Build the beat sequence: the typed text, uppercased, with runs of
     whitespace collapsed to one space, repeated (with a space between
     repeats) until it fills the mode's beat count. */
  const base = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  if (!base.filter((c) => c !== " ").length) return { stop() {} };
  const seq = [];
  const slots = rows ? 0 : tower ? SLOTS_TOWER : chaos ? SLOTS_CHAOS : 0;
  if (snake) seq.push(...base);                  // Snake: once through, as typed
  while (seq.length < slots) {
    if (seq.length) seq.push(" ");
    for (const c of base) { if (seq.length < slots) seq.push(c); }
  }

  /* Pillars: typeset the words as columns standing on the floor. The tile
     shrinks so the longest word (tallest column) and the number of
     words (columns) both fit. Each slot knows its column x and where
     its tile lands; letters are queued last-to-first so the finished
     column reads top to bottom. */
  let tileSize = SIZE;
  const plan = [];
  if (rows) {
    const words = base.join("").split(" ").filter(Boolean).map((w) => [...w]);
    const longest = Math.max(...words.map((w) => w.length));
    tileSize = Math.min(SIZE, Math.floor((STAGE - 40) / longest), Math.floor((STAGE - 40) / words.length));
    const rtl = /[\u0590-\u05FF\u0600-\u06FF]/.test(base.join(""));
    const x0 = (STAGE - words.length * tileSize) / 2;
    words.forEach((w, wi) => {
      const col = rtl ? words.length - 1 - wi : wi;
      const cx = x0 + col * tileSize + tileSize / 2;
      const t = words.length > 1 ? col / (words.length - 1) : 0;   // colour: one step per tower, left to right
      for (let i = w.length - 1; i >= 0; i--) {
        const fromFloor = w.length - 1 - i;                 // last letter lands first, on the floor
        plan.push({ ch: w[i], cx, landCy: STAGE - tileSize / 2 - fromFloor * tileSize, t });
      }
    });
    seq.push(...plan.map((p) => p.ch));
  }

  /* Frame variant: the arena is a visible inner square that closes in. */
  const INSET0 = (STAGE * (1 - ARENA_START)) / 2;
  let inset = INSET0;
  let arenaEl = null;
  if (framed) {
    arenaEl = document.createElement("div");
    arenaEl.style.cssText = `position:absolute;inset:${INSET0}px;background:${arenaColour(pal)};`;
    stage.appendChild(arenaEl);
  }
  function shrinkArena() {
    if (phase !== "fill") return;                  // once closing, hits no longer steer the frame
    const max = (STAGE - ARENA_MIN) / 2;
    inset = Math.min(inset + SHRINK, max);
    arenaEl.style.inset = inset.toFixed(1) + "px";
    if (inset >= max && phase === "fill") phase = "close";   // one tile left: the frame closes as a mask
    for (const L of letters) {
      L.cx = Math.min(Math.max(inset + L.half, L.cx), STAGE - inset - L.half);
      L.cy = Math.min(Math.max(inset + L.half, L.cy), STAGE - inset - L.half);
    }
  }
  /* How many painted tiles a loop holds, for the gradient steps. */
  const steps = rows ? plan.length : seq.filter((c) => c !== " ").length;

  const layer = document.createElement("div");
  layer.style.cssText = "position:absolute;inset:0;";
  stage.appendChild(layer);
  const noise = grain(stage);

  /* Tower ignores the seed on purpose: every building must differ. */
  const rand = rng(tower ? 0 : seed);
  let letters = [];          // in spawn order; the last one is on top
  let timers = [];
  let raf = 0, last = 0;
  let cursor = 0;            // next beat in seq
  let count = 0;             // squares spawned so far (wobble id, pace)
  let hue = 0;               // visible letters so far (gradient step)
  let phase = "fill";        // fill → hold → drain → (restart)
  let acc = 0, frame = 0;    // stop-motion clock
  let speed = SPEED;         // current pace, shared by every square

  /* Set everyone to the current pace, keeping their headings. */
  function repace() {
    for (const L of letters) {
      const v = Math.hypot(L.vx, L.vy);
      if (!v) continue;
      const k = speed / v;
      L.vx *= k; L.vy *= k;
    }
  }

  /* Squares are tracked by their centre. A tilted square is wider than
     SIZE on the axes, so each keeps its own half-extent for the walls:
     the real shape touches the wall, corners included. */
  function makeLetter(ch, cx, cy, vx, vy) {
    const sz = tileSize;
    const el = document.createElement("div");
    /* A blank (Snake's space) is an invisible tile: present in the
       chain, so the gap is real, but never painted. Every other tile is
       one step of the gradient: Snake steps by letter over the text,
       Towers gives each tower one step (left to right), and Chaos,
       whose loop length is set by the closing arena, steps with the
       arena. */
    const blank = ch === " ";
    let t = 0;
    if (chaos) t = (inset - INSET0) / ((STAGE - ARENA_MIN) / 2 - INSET0);
    else if (rows) t = towerT;                    // Towers: one colour per tower
    else t = steps > 1 ? hue / (steps - 1) : 0;
    if (!blank) hue++;
    const fill = blank ? "transparent" : mix(pal.card, pal.ink, Math.min(1, Math.max(0, t)));
    const tilt = (rand() * 2 - 1) * TILT;
    const rad = (tilt * Math.PI) / 180;
    const half = (sz / 2) * (Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad)));
    el.style.cssText = `position:absolute;left:${-sz / 2}px;top:${-sz / 2}px;width:${sz}px;height:${sz}px;border-radius:${CORNER}px;background:${fill};display:flex;align-items:center;justify-content:center;will-change:transform;`;
    /* The letter is its own element so the tile can squash and pop
       around it while the glyph itself stays rigid. */
    const glyph = document.createElement("span");
    glyph.style.cssText = `position:relative;font-family:"Switzer","Rubik",system-ui,sans-serif;font-weight:500;font-size:${(FONT_SIZE * sz) / SIZE}px;line-height:1;color:${LETTER};text-transform:uppercase;letter-spacing:-0.02em;will-change:transform;`;
    glyph.textContent = ch;
    el.appendChild(glyph);
    layer.appendChild(el);                         // newest on top
    const L = { el, glyph, id: count++, cx, cy, vx, vy, tilt, half, spawned: false,
                ox: (rand() * 2 - 1) * OFFSET, oy: (rand() * 2 - 1) * OFFSET,   // hand-placed offset (visual only)
                born: performance.now(), hitAt: -1e9, hitAxis: "x", asleep: false, lastHits: 0, free: false };
    letters.push(L);
    if (!tower && !rows) { speed = SPEED + SPEED_STEP * (count - 1); repace(); }
    place(L, performance.now());
    return L;
  }

  /* Bounce feel, on top of the straight-line physics:
     - impact: the square squashes along the wall's normal and stretches
       along the wall, then springs back (a half-sine over SQUASH_MS);
     - birth: a new square pops in from 40% with a little overshoot. */
  function place(L, now) {
    const jx = L.ox + wobble(L.id, frame, 0) * JITTER, jy = L.oy + wobble(L.id, frame, 1) * JITTER;
    let sx = 1, sy = 1;
    const th = noScale ? 1 : (now - L.hitAt) / SQUASH_MS;   // cube versions: no scale bounce at all
    if (th >= 0 && th < 1) {
      const k = Math.sin(th * Math.PI) * SQUASH;
      if (L.hitAxis === "x") { sx = 1 - k; sy = 1 + k; } else { sx = 1 + k; sy = 1 - k; }
    }
    const tb = noScale ? 1 : (now - L.born) / POP_MS;
    if (tb < 1) {
      const pop = 0.4 + 0.6 * (1 + 1.8 * Math.pow(tb - 1, 3) + 0.8 * Math.pow(tb - 1, 2)); // ease-out-back
      sx *= pop; sy *= pop;
    }
    L.el.style.transform = `translate(${(L.cx + jx).toFixed(1)}px, ${(L.cy + jy).toFixed(1)}px) rotate(${L.tilt.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    /* Undo the tile's scale on the glyph so only the frame bounces. */
    L.glyph.style.transform = sx === 1 && sy === 1 ? "" : `scale(${(1 / sx).toFixed(3)}, ${(1 / sy).toFixed(3)})`;
  }

  function finish() {
    if (snake) { phase = "hold"; return; }         // tiles free themselves one by one, see tick()
    if (tower || rows) {
      phase = "quake";
      quakeAt = performance.now();
      timers.push(setTimeout(() => { phase = "drain"; layer.style.transform = ""; }, QUAKE_MS));
      return;
    }
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
  const heights = new Array(COLS).fill(0);       // Tower: tiles stacked per column
  function dropIn(ch) {
    const open = heights.map((h, i) => (h < COLS ? i : -1)).filter((i) => i >= 0);
    if (!open.length) { cursor = seq.length; finish(); return; }
    const col = open[Math.floor(rand() * open.length)];
    const L = makeLetter(ch, COL0 + col * SIZE, -SIZE / 2, 0, FALL0);
    L.col = col;
    L.landCy = STAGE - SIZE / 2 - heights[col] * SIZE;
    heights[col]++;                               // reserved: the next one in this column lands on top
  }
  /* Pillars: drop the next planned letter down its column. */
  let towerT = 0;
  function slideIn(i) {
    const p = plan[i];
    towerT = p.t;
    const L = makeLetter(p.ch, p.cx, -tileSize / 2, 0, FALL0);
    L.landCy = p.landCy;
  }
  /* Tower and Pillars: cubes come on their own cadence, and every cube
     shortens the gap to the next one (gravity stays the same). A space
     is a silent beat: one gap with no cube. */
  let gap = GAP0;
  let quakeAt = 0;
  function scheduleDrop() {
    if (cursor >= seq.length) { finish(); return; }
    const ch = seq[cursor++];
    timers.push(setTimeout(() => {
      if (ch !== " ") { if (rows) slideIn(cursor - 1); else dropIn(ch); gap = Math.max(GAP_MIN, gap * GAP_DECAY); }
      if (cursor >= seq.length) finish(); else scheduleDrop();
    }, gap));
  }

  function onSpawnerHit(L) {
    if (tower || rows) return;                      // these run on their own clock
    if (cursor >= seq.length) { finish(); return; }
    const ch = seq[cursor++];
    if (ch === " " && !snake) return;              // Chaos: a silent beat. Snake: a blank tile rides along.
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
    hue = 0;
    phase = "fill";
    layer.style.transform = "";
    if (arenaEl) { inset = INSET0; arenaEl.style.inset = INSET0 + "px"; layer.style.clipPath = ""; }
    if (tower) { heights.fill(0); gap = GAP0; dropIn(seq[cursor++]); scheduleDrop(); return; }
    if (rows) { gap = GAP0; slideIn(cursor++); scheduleDrop(); return; }
    const ang = heading(rand);
    makeLetter(seq[cursor++], STAGE / 2, STAGE / 2, Math.cos(ang) * SPEED, Math.sin(ang) * SPEED);
  }

  function tick(now) {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const spawner = letters[letters.length - 1];
    if (tower) { tickTower(dt, now, spawner); raf = requestAnimationFrame(tick); return; }
    if (rows) { tickTower(dt, now, spawner); raf = requestAnimationFrame(tick); return; }
    for (const L of letters) {
      /* Chaos: right after a wall hit the tile moves at a fraction of
         its speed and eases back up — the "bounce" without any scale. */
      let k = 1;
      if (chaos) {
        const ti = (now - L.hitAt) / IMPACT_MS;
        if (ti >= 0 && ti < 1) k = IMPACT_DIP + (1 - IMPACT_DIP) * (1 - Math.pow(1 - ti, 3));
      }
      L.cx += L.vx * k * dt;
      L.cy += L.vy * k * dt;
      if (phase === "drain" || L.free) {
        /* Walls are open: mark the square gone once fully outside. */
        if (L.cx + L.half < 0 || L.cx - L.half > STAGE || L.cy + L.half < 0 || L.cy - L.half > STAGE) L.gone = true;
      } else {
        /* Perfect elastic reflection off each wall (the arena's, in
           the frame variant — and every touch pulls the arena in). */
        const wall = Math.min(inset, (STAGE - ARENA_MIN) / 2);
        const lo = wall + L.half, hi = STAGE - wall - L.half;
        let hit = false;
        if (L.cx < lo) { L.cx = 2 * lo - L.cx; L.vx = Math.abs(L.vx); hit = "x"; }
        else if (L.cx > hi) { L.cx = 2 * hi - L.cx; L.vx = -Math.abs(L.vx); hit = "x"; }
        if (L.cy < lo) { L.cy = 2 * lo - L.cy; L.vy = Math.abs(L.vy); hit = "y"; }
        else if (L.cy > hi) { L.cy = 2 * hi - L.cy; L.vy = -Math.abs(L.vy); hit = "y"; }
        if (hit) {
          L.hitAt = now; L.hitAxis = hit;
          if (arenaEl) shrinkArena();
          /* Snake, text complete: count this tile's hits; after the
             last allowed one it stops reflecting and leaves. */
          if (snake && phase === "hold" && ++L.lastHits >= SNAKE_BOUNCES) L.free = true;
        }
        if (hit && phase === "fill" && L === spawner && !L.spawned) onSpawnerHit(L);
      }
    }
    if (phase === "drain" || (snake && phase === "hold")) {
      letters.filter((L) => L.gone).forEach((L) => L.el.remove());
      letters = letters.filter((L) => !L.gone);
      if (!letters.length) start();
    }
    /* Chaos ending: the frame keeps closing past one tile, now as a
       mask over the still-bouncing letters, until it is gone. */
    if (phase === "close") {
      inset += CLOSE_SPEED * dt;
      if (inset >= STAGE / 2) { start(); return void (raf = requestAnimationFrame(tick)); }
      arenaEl.style.inset = inset.toFixed(1) + "px";
      layer.style.clipPath = `inset(${inset.toFixed(1)}px)`;
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

  /* Tower physics: each tile falls straight down its column under
     gravity to a landing height fixed when it was dropped (the floor,
     or the top of that column's stack). A fast landing hops a little;
     a slow one puts the tile to sleep. The newest tile's first landing
     drops the next letter. When the walls open, everything falls out. */
  function touch(L, axis, speedAlong) {
    if (Math.abs(speedAlong) > 90) { L.hitAt = now_; L.hitAxis = axis; }
    if (L === spawner_ && !L.spawned && phase === "fill") onSpawnerHit(L);
  }
  let now_ = 0, spawner_ = null;
  function tickTower(dt, now, spawner) {
    now_ = now; spawner_ = spawner;
    for (const L of letters) {
      if (phase === "drain") L.asleep = false;
      if (L.asleep) continue;
      L.vy += GRAVITY * dt;
      L.cy += L.vy * dt;
      if (phase === "drain") { if (L.cy - tileSize / 2 > STAGE) L.gone = true; continue; }
      if (L.cy >= L.landCy) {
        const v = L.vy;
        L.cy = L.landCy;
        if (v > 160) { L.vy = -v * REST; }
        else { L.vy = 0; L.asleep = true; }
        touch(L, "y", v);
      }
    }
    if (phase === "drain") {
      letters.filter((L) => L.gone).forEach((L) => L.el.remove());
      letters = letters.filter((L) => !L.gone);
      if (!letters.length) start();
    }
    acc += dt;
    if (acc >= 1 / FPS) {
      acc = 0; frame++; noise.roll(frame);
      letters.forEach((L) => place(L, now));
      /* The quake moves the whole ground as one: a shared offset that
         ramps up from nothing, mostly sideways. */
      if (phase === "quake") {
        const t = Math.min(1, (now - quakeAt) / QUAKE_MS);
        const amp = QUAKE_MAX * t * t;
        layer.style.transform = `translate(${(wobble(7, frame, 0) * amp).toFixed(1)}px, ${(wobble(7, frame, 1) * amp * 0.4).toFixed(1)}px)`;
      }
    }
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
