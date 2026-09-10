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
             direction. The text plays once.

   Once the sequence is complete, after a short hold, the walls "open":
   each square leaves through the next wall it touches, and once the
   stage is empty the word starts over.

   Look: Collection 02's sticker language (card / ink / anchor fills,
   slate letter at weight 500) on rounded squares, with the house
   hand-made finish: 12 fps stop-motion, animated grain, ±2px jitter
   and a fixed small tilt per square.

   Written as a plain, readable ES module (the rest of FunType is a
   minified Vite build); it plugs into the same effect contract:
     mount(stageEl, { word, palette, seed }) -> { stop() } */

const STAGE = 1080;
const SIZE = 150;               // sticker square side, in stage units
const CORNER = 28;              // its corner radius
const FONT_SIZE = 100;          // letter size — tight inside the square
const SPEED = 520;              // px / second, in stage units
const SPAWN_DELAY = 230;        // ms between a wall hit and the next letter (≈120px along the path)
const SLOTS = 50;               // the word repeats (space-separated) to fill this many beats
const HOLD_MS = 1600;           // pause once the sequence is complete, before the walls open
const FPS = 12;                 // stop-motion: the picture only updates this often
const JITTER = 2;               // px of hand-held wobble per frame
const TILT = 9;                 // ± degrees, a fixed tilt per square
const LETTER = "#4E4B5D";       // Stickers' slate letter colour

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

/* Film grain: the same overlay the other collections use. Returns the
   turbulence node so the seed can be re-rolled every frame. */
function grain(stage) {
  const id = "fxg" + Math.floor(Math.random() * 1e6);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 1080 1080");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;mix-blend-mode:overlay;opacity:0.5;z-index:9;";
  svg.innerHTML = `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" stitchTiles="stitch" seed="1"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0" intercept="1"/></feComponentTransfer></filter><rect width="1080" height="1080" filter="url(#${id})"/>`;
  stage.appendChild(svg);
  return svg.querySelector("feTurbulence");
}

export const m = (stage, opts) => mount(stage, { ...opts, mode: "snake" });
export const c = (stage, opts) => mount(stage, { ...opts, mode: "chaos" });

function mount(stage, { word = "", palette, seed = 0, mode = "snake" } = {}) {
  const snake = mode === "snake";
  const pal = palette || p[0];
  stage.innerHTML = "";
  stage.style.cssText = `position:relative;width:${STAGE}px;height:${STAGE}px;overflow:hidden;isolation:isolate;background:${pal.frame};`;

  /* Build the beat sequence: the typed text, uppercased, with runs of
     whitespace collapsed to one space. Snake repeats it (with a space
     between repeats) until it fills SLOTS beats; Chaos plays it once. */
  const base = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  if (!base.filter((c) => c !== " ").length) return { stop() {} };
  const seq = [];
  if (snake) {
    while (seq.length < SLOTS) {
      if (seq.length) seq.push(" ");
      for (const c of base) { if (seq.length < SLOTS) seq.push(c); }
    }
  } else {
    seq.push(...base);
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

  /* Squares are tracked by their centre. A tilted square is wider than
     SIZE on the axes, so each keeps its own half-extent for the walls:
     the real shape touches the wall, corners included. */
  function makeLetter(ch, cx, cy, vx, vy) {
    const el = document.createElement("div");
    const fill = pal[ROLES[count % ROLES.length]];
    const tilt = (rand() * 2 - 1) * TILT;
    const rad = (tilt * Math.PI) / 180;
    const half = (SIZE / 2) * (Math.abs(Math.cos(rad)) + Math.abs(Math.sin(rad)));
    el.style.cssText = `position:absolute;left:${-SIZE / 2}px;top:${-SIZE / 2}px;width:${SIZE}px;height:${SIZE}px;border-radius:${CORNER}px;background:${fill};display:flex;align-items:center;justify-content:center;font-family:"Switzer","Rubik",system-ui,sans-serif;font-weight:500;font-size:${FONT_SIZE}px;line-height:1;color:${LETTER};text-transform:uppercase;letter-spacing:-0.02em;will-change:transform;`;
    el.textContent = ch;
    layer.appendChild(el);                         // newest on top
    const L = { el, id: count++, cx, cy, vx, vy, tilt, half, spawned: false };
    place(L);
    return L;
  }

  function place(L) {
    const jx = wobble(L.id, frame, 0) * JITTER, jy = wobble(L.id, frame, 1) * JITTER;
    L.el.style.transform = `translate(${(L.cx + jx).toFixed(1)}px, ${(L.cy + jy).toFixed(1)}px) rotate(${L.tilt.toFixed(1)}deg)`;
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
  function onSpawnerHit(L) {
    if (cursor >= seq.length) { finish(); return; }
    const ch = seq[cursor++];
    if (ch === " ") return;
    L.spawned = true;
    const cx = snake ? L.cx : STAGE / 2, cy = snake ? L.cy : STAGE / 2;
    const ang = snake ? Math.atan2(L.vy, L.vx) : heading(rand);
    const vx = Math.cos(ang) * SPEED, vy = Math.sin(ang) * SPEED;
    timers.push(setTimeout(() => {
      letters.push(makeLetter(ch, cx, cy, vx, vy));
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
    const ang = heading(rand);
    letters.push(makeLetter(seq[cursor++], STAGE / 2, STAGE / 2,
      Math.cos(ang) * SPEED, Math.sin(ang) * SPEED));
  }

  function tick(now) {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const spawner = letters[letters.length - 1];
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
        if (L.cx < lo) { L.cx = 2 * lo - L.cx; L.vx = Math.abs(L.vx); hit = true; }
        else if (L.cx > hi) { L.cx = 2 * hi - L.cx; L.vx = -Math.abs(L.vx); hit = true; }
        if (L.cy < lo) { L.cy = 2 * lo - L.cy; L.vy = Math.abs(L.vy); hit = true; }
        else if (L.cy > hi) { L.cy = 2 * hi - L.cy; L.vy = -Math.abs(L.vy); hit = true; }
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
      noise.setAttribute("seed", frame % 97);
      letters.forEach(place);
    }
    raf = requestAnimationFrame(tick);
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
