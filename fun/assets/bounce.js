/* FunType — Collection 03 / "Bounce"
   The first letter of the word sits in a sticker circle, drops in at
   the middle of the stage, picks a random direction and travels in a
   straight line at constant speed. When the circle touches a wall it
   reflects off it (angle in = angle out, speed unchanged).

   The rest of the word arrives one letter per wall hit: the newest
   circle is the "spawner"; the first time it touches a wall, the next
   letter pops out from that collision point a beat later, travelling
   the same way, layered *behind* every circle before it. A space is a
   silent beat — a wall hit that spawns nothing — so words stay apart.
   The text repeats (space-separated) to fill 50 beats; then, after a
   short hold, the walls "open": each circle leaves through the next
   wall it touches, and once the stage is empty the word starts over.

   Look: same sticker circles as Collection 02's Stickers (Pack) —
   circle in card / ink / anchor, slate letter at weight 500.

   Written as a plain, readable ES module (the rest of FunType is a
   minified Vite build); it plugs into the same effect contract:
     mount(stageEl, { word, palette, seed }) -> { stop() } */

const STAGE = 1080;
const RADIUS = 120;             // sticker circle radius, in stage units
const SPEED = 520;              // px / second, in stage units
const SPAWN_DELAY = 140;        // ms between a wall hit and the next letter
const SLOTS = 50;               // the word repeats (space-separated) to fill this many beats
const HOLD_MS = 1600;           // pause once the sequence is complete, before the walls open
const SPREAD = 10;              // ± degrees a new circle deviates from its spawner's heading
const LETTER = "#4E4B5D";       // Stickers' slate letter colour
const FONT_SIZE = RADIUS * 0.75; // Stickers' ratio

/* Collection 02's palettes (same values as Dots / Stickers / Loop).
   frame = background; circles cycle card → ink → anchor, so two
   neighbouring letters never share a colour. */
export const p = [
  { frame: "#A9FF67", card: "#FFFFFF", ink: "#5BE03A", anchor: "#49C7FD" },
  { frame: "#49C7FD", card: "#FFFFFF", ink: "#5BE03A", anchor: "#A9FF67" },
  { frame: "#FFFFFF", card: "#49C7FD", ink: "#5BE03A", anchor: "#D9FF93" },
  { frame: "#5BE03A", card: "#49C7FD", ink: "#B9F1FA", anchor: "#A9FF67" },
  { frame: "#B9F1FA", card: "#A9FF67", ink: "#D9FF93", anchor: "#49C7FD" },
  { frame: "#D9FF93", card: "#5BE03A", ink: "#FFFFFF", anchor: "#49C7FD" },
];
const CIRCLE_ROLES = ["card", "ink", "anchor"];

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

/* A random heading that stays clear of the axes, so the circle never
   crawls along a wall or ping-pongs straight up and down. */
function heading(rand) {
  const quadrant = Math.floor(rand() * 4);
  const a = (20 + rand() * 50) * (Math.PI / 180);   // 20°–70°
  return quadrant * (Math.PI / 2) + a;
}

export function m(stage, { word = "", palette, seed = 0 } = {}) {
  const pal = palette || p[0];
  stage.innerHTML = "";
  stage.style.cssText = `position:relative;width:${STAGE}px;height:${STAGE}px;overflow:hidden;background:${pal.frame};`;

  /* Build the beat sequence: the typed text, uppercased, with runs of
     whitespace collapsed to one space, repeated with a space between
     repeats until it fills SLOTS beats. */
  const base = [...String(word).toUpperCase().replace(/\s+/g, " ").trim()];
  if (!base.filter((c) => c !== " ").length) return { stop() {} };
  const seq = [];
  while (seq.length < SLOTS) {
    if (seq.length) seq.push(" ");
    for (const c of base) { if (seq.length < SLOTS) seq.push(c); }
  }

  const layer = document.createElement("div");
  layer.style.cssText = "position:absolute;inset:0;";
  stage.appendChild(layer);

  const rand = rng(seed);
  const D = RADIUS * 2, MAX = STAGE - D;
  let letters = [];          // in spawn order; letters[0] is on top
  let timers = [];
  let raf = 0, last = 0;
  let cursor = 0;            // next beat in seq
  let count = 0;             // circles spawned so far (for colour cycling)
  let phase = "fill";        // fill → hold → drain → (restart)

  function makeLetter(ch, x, y, vx, vy) {
    const el = document.createElement("div");
    const fill = pal[CIRCLE_ROLES[count % CIRCLE_ROLES.length]];
    count++;
    el.style.cssText = `position:absolute;left:0;top:0;width:${D}px;height:${D}px;border-radius:50%;background:${fill};display:flex;align-items:center;justify-content:center;font-family:"Switzer","Rubik",system-ui,sans-serif;font-weight:500;font-size:${FONT_SIZE}px;line-height:1;color:${LETTER};text-transform:uppercase;letter-spacing:-0.02em;will-change:transform;`;
    el.textContent = ch;
    /* Earlier circles stay on top: new ones go to the back. */
    layer.insertBefore(el, layer.firstChild);
    const L = { el, x, y, vx, vy, spawned: false };
    place(L);
    return L;
  }

  function place(L) {
    L.el.style.transform = `translate(${L.x.toFixed(2)}px, ${L.y.toFixed(2)}px)`;
  }

  function finish() {
    phase = "hold";
    timers.push(setTimeout(() => { phase = "drain"; }, HOLD_MS));
  }

  /* The spawner touched a wall: consume one beat. A space is silent
     (the spawner keeps its role and will try again at the next wall);
     a letter pops out of the collision point a beat later — same
     spot, same post-bounce direction — and becomes the new spawner. */
  function onSpawnerHit(L) {
    if (cursor >= seq.length) { finish(); return; }
    const ch = seq[cursor++];
    if (ch === " ") return;
    L.spawned = true;
    /* Equal circles on the exact same heading would trail each other
       forever as one snake, hiding every letter but the first — so each
       new circle leaves at a slightly different angle and the train
       fans out over time. */
    const { x, y } = L;
    const ang = Math.atan2(L.vy, L.vx) + ((rand() * 2 - 1) * SPREAD * Math.PI) / 180;
    const vx = Math.cos(ang) * SPEED, vy = Math.sin(ang) * SPEED;
    timers.push(setTimeout(() => {
      letters.push(makeLetter(ch, x, y, vx, vy));
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
    letters.push(makeLetter(seq[cursor++], MAX / 2, MAX / 2,
      Math.cos(ang) * SPEED, Math.sin(ang) * SPEED));
  }

  function tick(now) {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const spawner = letters[letters.length - 1];
    for (const L of letters) {
      L.x += L.vx * dt;
      L.y += L.vy * dt;
      if (phase === "drain") {
        /* Walls are open: mark the circle gone once fully outside. */
        if (L.x + D < 0 || L.x > STAGE || L.y + D < 0 || L.y > STAGE) L.gone = true;
      } else {
        /* Perfect elastic reflection off each wall. */
        let hit = false;
        if (L.x < 0) { L.x = -L.x; L.vx = Math.abs(L.vx); hit = true; }
        else if (L.x > MAX) { L.x = 2 * MAX - L.x; L.vx = -Math.abs(L.vx); hit = true; }
        if (L.y < 0) { L.y = -L.y; L.vy = Math.abs(L.vy); hit = true; }
        else if (L.y > MAX) { L.y = 2 * MAX - L.y; L.vy = -Math.abs(L.vy); hit = true; }
        if (hit && phase === "fill" && L === spawner && !L.spawned) onSpawnerHit(L);
      }
      place(L);
    }
    if (phase === "drain") {
      letters.filter((L) => L.gone).forEach((L) => L.el.remove());
      letters = letters.filter((L) => !L.gone);
      if (!letters.length) start();
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
