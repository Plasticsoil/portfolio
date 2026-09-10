/* FunType — Collection 03 / "Bounce"
   The first letter of the word is dropped in the middle of the stage,
   picks a random direction and travels in a straight line at constant
   speed. When the ink box of the glyph touches a wall it reflects off
   it (angle in = angle out, speed unchanged) — and keeps going forever.

   Written as a plain, readable ES module (the rest of FunType is a
   minified Vite build); it plugs into the same effect contract:
     mount(stageEl, { word, palette, seed }) -> { stop() }
   Palette roles: frame = background, ink = the letter.
   card / anchor are unused for now (kept for the shuffle pill). */

const STAGE = 1080;
const FONT_SIZE = 460;          // px, in stage units
const SPEED = 520;              // px / second, in stage units
const FONT = `900 ${FONT_SIZE}px "Switzer", "Rubik", system-ui, sans-serif`;
const SVG_NS = "http://www.w3.org/2000/svg";

/* Grayscale starter palettes (a proper one is coming from Yam). */
export const p = [
  { frame: "#EBEBEB", card: "#FFFFFF", ink: "#141414", anchor: "#8A8A8A" },
  { frame: "#141414", card: "#2B2B2B", ink: "#F2F2F2", anchor: "#8A8A8A" },
  { frame: "#FFFFFF", card: "#EBEBEB", ink: "#4D4D4D", anchor: "#B3B3B3" },
  { frame: "#4D4D4D", card: "#8A8A8A", ink: "#FFFFFF", anchor: "#EBEBEB" },
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
/* Tight ink box of the glyph, from canvas text metrics. */
function measure(ch) {
  ctx || (ctx = document.createElement("canvas").getContext("2d"));
  ctx.font = FONT;
  const m = ctx.measureText(ch);
  const left = m.actualBoundingBoxLeft || 0;
  const right = m.actualBoundingBoxRight || m.width;
  const asc = m.actualBoundingBoxAscent || FONT_SIZE * 0.72;
  const desc = m.actualBoundingBoxDescent || 0;
  return { left, asc, w: Math.max(1, left + right), h: Math.max(1, asc + desc) };
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

  const chars = [...String(word).trim()].filter((c) => /\S/.test(c));
  if (!chars.length) return { stop() {} };
  const ch = chars[0].toUpperCase();

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${STAGE} ${STAGE}`);
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
  const g = document.createElementNS(SVG_NS, "g");
  const text = document.createElementNS(SVG_NS, "text");
  text.textContent = ch;
  text.setAttribute("font-family", '"Switzer", "Rubik", system-ui, sans-serif');
  text.setAttribute("font-weight", "900");
  text.setAttribute("font-size", FONT_SIZE);
  text.setAttribute("fill", pal.ink);
  g.appendChild(text);
  svg.appendChild(g);
  stage.appendChild(svg);

  const rand = rng(seed);
  let box = measure(ch);
  let x = (STAGE - box.w) / 2;
  let y = (STAGE - box.h) / 2;
  let ang = heading(rand);
  let vx = Math.cos(ang) * SPEED;
  let vy = Math.sin(ang) * SPEED;

  /* Place the ink box's top-left at (x, y). The text origin sits
     `left` px in from the box edge and `asc` px down from its top. */
  function place() {
    text.setAttribute("x", box.left);
    text.setAttribute("y", box.asc);
    g.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  }

  /* Fonts can land after mount; re-measure once they do so the box
     matches the real Switzer glyph, then keep the letter centred on
     the point it was at. */
  const remeasure = () => {
    const cx = x + box.w / 2, cy = y + box.h / 2;
    box = measure(ch);
    x = cx - box.w / 2;
    y = cy - box.h / 2;
  };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);

  let raf = 0, last = 0;
  function tick(now) {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    x += vx * dt;
    y += vy * dt;

    /* Perfect elastic reflection off each wall. */
    const maxX = STAGE - box.w, maxY = STAGE - box.h;
    if (x < 0) { x = -x; vx = Math.abs(vx); }
    else if (x > maxX) { x = 2 * maxX - x; vx = -Math.abs(vx); }
    if (y < 0) { y = -y; vy = Math.abs(vy); }
    else if (y > maxY) { y = 2 * maxY - y; vy = -Math.abs(vy); }

    place();
    raf = requestAnimationFrame(tick);
  }

  /* Click: re-launch in a new random direction from where it is. */
  const onClick = () => {
    ang = heading(rand);
    vx = Math.cos(ang) * SPEED;
    vy = Math.sin(ang) * SPEED;
  };
  stage.addEventListener("click", onClick);

  place();
  raf = requestAnimationFrame(tick);
  return {
    stop() {
      cancelAnimationFrame(raf);
      stage.removeEventListener("click", onClick);
    },
  };
}
