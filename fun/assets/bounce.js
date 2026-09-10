/* FunType — Collection 03 / "Bounce"
   The first letter of the word is dropped in the middle of the stage,
   picks a random direction and travels in a straight line at constant
   speed. When the ink of the glyph touches a wall it reflects off it
   (angle in = angle out, speed unchanged) — and keeps going forever.

   The rest of the word arrives one letter per wall hit: the newest
   letter is the "spawner"; the first time it touches a wall, the next
   letter pops out from that collision point a beat later, travelling
   the same way, layered *behind* every letter before it. Once the word
   is complete, everything just keeps bouncing.

   Written as a plain, readable ES module (the rest of FunType is a
   minified Vite build); it plugs into the same effect contract:
     mount(stageEl, { word, palette, seed }) -> { stop() }
   Palette roles: frame = background, ink = the letter.
   card / anchor are unused for now (kept for the shuffle pill). */

const STAGE = 1080;
const FONT_SIZE = 345;          // px, in stage units (0.75 of the first cut)
const SPEED = 520;              // px / second, in stage units
const SPAWN_DELAY = 140;        // ms between a wall hit and the next letter
const FONT = `900 ${FONT_SIZE}px "Switzer", "Rubik", system-ui, sans-serif`;
const SVG_NS = "http://www.w3.org/2000/svg";

/* Palette from Yam: tarot-poster pink / teal / orange / cream / green,
   lifted to the bright, vibrant register of Collections 01–02.
   Roles: frame = background, ink = letter; card / anchor are kept
   for the shuffle pill. */
const PINK = "#FF8A80", TEAL = "#2A9BD6", ORANGE = "#FF6A1F",
      CREAM = "#FFF1DA", GREEN = "#1FA35A";
export const p = [
  { frame: PINK,   card: CREAM,  ink: TEAL,   anchor: ORANGE },
  { frame: TEAL,   card: PINK,   ink: CREAM,  anchor: ORANGE },
  { frame: ORANGE, card: TEAL,   ink: CREAM,  anchor: PINK },
  { frame: CREAM,  card: PINK,   ink: ORANGE, anchor: TEAL },
  { frame: PINK,   card: TEAL,   ink: ORANGE, anchor: GREEN },
  { frame: GREEN,  card: ORANGE, ink: PINK,   anchor: CREAM },
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

let ctx;
/* Exact ink box of the glyph, by rasterising it once and scanning the
   pixels. Browser text metrics (actualBoundingBox*) are only
   approximate — iOS in particular leaves a gap on the left — and the
   whole point is that the *letter shape* is what touches the wall. */
function measure(ch) {
  const pad = FONT_SIZE;
  const size = FONT_SIZE * 3;
  if (!ctx) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    ctx = c.getContext("2d", { willReadFrequently: true });
  }
  ctx.clearRect(0, 0, size, size);
  ctx.font = FONT;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#000";
  ctx.fillText(ch, pad, pad * 1.5);           // origin at (pad, pad*1.5)
  const d = ctx.getImageData(0, 0, size, size).data;
  let minX = size, minY = size, maxX = -1, maxY = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (d[(y * size + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { left: 0, asc: FONT_SIZE * 0.72, w: 1, h: 1 };
  return {
    left: pad - minX,                 // origin sits this far right of the ink's left edge
    asc: pad * 1.5 - minY,            // and this far below its top
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
}

/* A random heading that stays clear of the axes, so the letter never
   crawls along a wall or ping-pongs straight up and down. */
function heading(rand) {
  const quadrant = Math.floor(rand() * 4);
  const a = (20 + rand() * 50) * (Math.PI / 180);   // 20°–70°
  const base = quadrant * (Math.PI / 2);
  return base + a;
}

export function m(stage, { word = "", palette, seed = 0 } = {}) {
  const pal = palette || p[0];
  stage.innerHTML = "";
  stage.style.cssText = `position:relative;width:${STAGE}px;height:${STAGE}px;overflow:hidden;background:${pal.frame};`;

  const chars = [...String(word).trim()]
    .filter((c) => /\S/.test(c))
    .map((c) => c.toUpperCase());
  if (!chars.length) return { stop() {} };

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${STAGE} ${STAGE}`);
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
  stage.appendChild(svg);

  const rand = rng(seed);
  const boxes = chars.map(measure);
  let letters = [];          // in spawn order; letters[0] is on top
  let timers = [];
  let raf = 0, last = 0;

  function makeLetter(i, x, y, vx, vy) {
    const g = document.createElementNS(SVG_NS, "g");
    const text = document.createElementNS(SVG_NS, "text");
    text.textContent = chars[i];
    text.setAttribute("font-family", '"Switzer", "Rubik", system-ui, sans-serif');
    text.setAttribute("font-weight", "900");
    text.setAttribute("font-size", FONT_SIZE);
    text.setAttribute("fill", pal.ink);
    g.appendChild(text);
    /* Earlier letters stay on top: new ones go to the back of the
       paint order (SVG paints first child first). */
    svg.insertBefore(g, svg.firstChild);
    const L = { i, g, text, box: boxes[i], x, y, vx, vy, spawned: false };
    place(L);
    return L;
  }

  /* Place the ink box's top-left at (x, y). The text origin sits
     `left` px in from the box edge and `asc` px down from its top. */
  function place(L) {
    L.text.setAttribute("x", L.box.left);
    L.text.setAttribute("y", L.box.asc);
    L.g.setAttribute("transform", `translate(${L.x.toFixed(2)} ${L.y.toFixed(2)})`);
  }

  /* The next letter pops out of the point where the spawner hit the
     wall: same centre, same (post-bounce) direction, a beat later. */
  function spawnFrom(L) {
    L.spawned = true;
    const next = L.i + 1;
    if (next >= chars.length) return;
    const cx = L.x + L.box.w / 2, cy = L.y + L.box.h / 2;
    const vx = L.vx, vy = L.vy;
    const b = boxes[next];
    timers.push(setTimeout(() => {
      const x = Math.min(Math.max(0, cx - b.w / 2), STAGE - b.w);
      const y = Math.min(Math.max(0, cy - b.h / 2), STAGE - b.h);
      letters.push(makeLetter(next, x, y, vx, vy));
    }, SPAWN_DELAY));
  }

  function start() {
    timers.forEach(clearTimeout);
    timers = [];
    letters.forEach((L) => L.g.remove());
    letters = [];
    const b = boxes[0];
    const ang = heading(rand);
    letters.push(makeLetter(0, (STAGE - b.w) / 2, (STAGE - b.h) / 2,
      Math.cos(ang) * SPEED, Math.sin(ang) * SPEED));
  }

  /* Fonts can land after mount; re-measure so the boxes match the real
     Switzer glyphs, keeping each letter centred where it was. */
  const remeasure = () => {
    for (let i = 0; i < chars.length; i++) boxes[i] = measure(chars[i]);
    letters.forEach((L) => {
      const cx = L.x + L.box.w / 2, cy = L.y + L.box.h / 2;
      L.box = boxes[L.i];
      L.x = cx - L.box.w / 2;
      L.y = cy - L.box.h / 2;
    });
  };
  if (document.fonts) {
    document.fonts.ready.then(remeasure);
    document.fonts.load(FONT, chars.join("")).then(remeasure, () => {});
  }

  function tick(now) {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const spawner = letters[letters.length - 1];
    for (const L of letters) {
      L.x += L.vx * dt;
      L.y += L.vy * dt;
      /* Perfect elastic reflection off each wall. */
      const maxX = STAGE - L.box.w, maxY = STAGE - L.box.h;
      let hit = false;
      if (L.x < 0) { L.x = -L.x; L.vx = Math.abs(L.vx); hit = true; }
      else if (L.x > maxX) { L.x = 2 * maxX - L.x; L.vx = -Math.abs(L.vx); hit = true; }
      if (L.y < 0) { L.y = -L.y; L.vy = Math.abs(L.vy); hit = true; }
      else if (L.y > maxY) { L.y = 2 * maxY - L.y; L.vy = -Math.abs(L.vy); hit = true; }
      if (hit && L === spawner && !L.spawned) spawnFrom(L);
      place(L);
    }
    raf = requestAnimationFrame(tick);
  }

  /* Click: play the word again from the first letter. */
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
