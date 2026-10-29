// ----------------------------------------------------------------------------
// zz_capture.js  —  isolated capture harness for SKIP (loaded only with ?capture)
//
// This file NEVER touches the sculpture / SDF / morph logic. It only:
//   1. reads the public handle the app exposes on window.skip (renderer, scene,
//      camera) so it can composite the WebGL stage into a recordable canvas,
//   2. drives the EXISTING Mix UI (clicks #mix-go, moves the #mix-cut / #mix-melt
//      sliders) exactly as a human would,
//   3. records a 16:9 MediaRecorder stream and POSTs the .webm back to the dev
//      server, which saves it to 05_Captures/.
//
// Everything is guarded behind ?capture, so production (yamliv.net/skip) is
// untouched. Tunables come from the query string:
//   ?capture&w=1920&h=1080&delay=7000&dur=12000&fps=60&name=mix_capture
// ----------------------------------------------------------------------------

const q = new URLSearchParams(location.search);
const OUT_W   = +q.get('w')     || 1920;
const OUT_H   = +q.get('h')     || 1080;
const START   = +q.get('delay') || 7000;   // wait for the first piece to settle
const DUR     = +q.get('dur')   || 12000;  // length of the recorded clip
const FPS     = +q.get('fps')   || 60;
const NAME    = (q.get('name') || 'mix_capture').replace(/[^\w.\-]/g, '_');
// Real camera zoom (crisp, full GL resolution on the piece) via setViewOffset.
// zoom=1 keeps the full frame; fx/fy are the focus point as fractions of the
// frame (where the mix piece sits: just below centre).
const ZOOM    = +q.get('zoom')  || 1;
const FX      = q.get('fx') != null ? +q.get('fx') : 0.505;
const FY      = q.get('fy') != null ? +q.get('fy') : 0.80;
// Turntable mode: ?capture&turntable=model-28 spins one piece slowly, alone,
// on black (no Mix UI). secPerTurn = seconds for a full 360.
const TT      = q.get('turntable') || null;
const SECPT   = +q.get('secPerTurn') || 14;
let ttPiece = null, ttStart = 0;

const log = (m) => { console.log('[capture] ' + m); };
window.__capture = { done: false, file: null, error: null };

// --- small helpers -----------------------------------------------------------
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// wait until the app has published its handle and has a real GL canvas
async function waitForApp() {
  for (let i = 0; i < 300; i++) {                 // up to ~30s
    const s = window.skip;
    if (s && s.renderer && s.renderer.domElement && s.scene && s.camera) return s;
    await wait(100);
  }
  throw new Error('window.skip never appeared');
}

// tween a range input from its current value to `to`, firing input events the
// whole way (so the piece re-carves step by step), then a final change event.
function tweenSlider(el, to, ms) {
  return new Promise((resolve) => {
    const from = parseFloat(el.value);
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; // easeInOut
      el.value = (from + (to - from) * e).toFixed(3);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      if (k < 1) requestAnimationFrame(step);
      else { el.dispatchEvent(new Event('change', { bubbles: true })); resolve(); }
    };
    requestAnimationFrame(step);
  });
}

// --- the recordable canvas ----------------------------------------------------
// A plain 2D canvas we fully control. Each frame we (a) force one render of the
// live scene into the app's GL canvas and copy it in SAME TICK (the app creates
// its renderer without preserveDrawingBuffer, so a cross-tick read would be
// blank), then (b) paint a faithful copy of the minimal Mix UI on top.
const out = document.createElement('canvas');
out.width = OUT_W; out.height = OUT_H;
// captureStream only ticks for an in-document canvas; keep it on-page but all
// but invisible and behind everything.
out.style.cssText = 'position:fixed;left:0;top:0;width:' + OUT_W + 'px;height:' +
  OUT_H + 'px;opacity:0.01;pointer-events:none;z-index:-1;';
document.body.appendChild(out);
const ctx = out.getContext('2d');
let captureTrack = null;   // set once recording starts; driven via requestFrame

const mixCut  = document.getElementById('mix-cut');
const mixMelt = document.getElementById('mix-melt');
const makeUi  = document.getElementById('make');   // "Mutant" toggle -> focus mode
const mixGo   = document.getElementById('mix-go');
let mixFlash = -1;                                 // timestamp of last Mix press

function frac(el) {
  const min = +el.min, max = +el.max;
  return (parseFloat(el.value) - min) / (max - min);
}

function drawUI(now) {
  // geometry, tuned for 1080p and scaled to whatever OUT_H is
  const S = OUT_H / 1080;
  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.font = `300 ${22 * S}px Archivo, system-ui, sans-serif`;
  ctx.fillStyle = '#fff';

  const trackW = 180 * S, gap = 34 * S;
  const label = (t) => ctx.measureText(t).width;
  const mixW = label('Mix');
  const cutW = label('Cut '), meltW = label('Melt ');
  const groupW = mixW + gap + cutW + trackW + gap + meltW + trackW;

  let x = (OUT_W - groupW) / 2;
  const y = OUT_H - 64 * S;

  // Mix button (flashes brighter for ~0.45s after a press)
  const flashK = mixFlash > 0 ? Math.max(0, 1 - (now - mixFlash) / 450) : 0;
  ctx.globalAlpha = 0.5 + 0.4 * flashK;
  ctx.fillText('Mix', x, y);
  if (flashK > 0) {                                // underline pulse
    ctx.globalAlpha = 0.5 * flashK;
    ctx.fillRect(x, y + 16 * S, mixW, 1 * S);
  }
  x += mixW + gap;

  const slider = (name, el) => {
    ctx.globalAlpha = 0.5;
    ctx.fillText(name, x, y);
    x += label(name);
    // track
    ctx.globalAlpha = 0.35;
    ctx.fillRect(x, y, trackW, 1 * S);
    // square thumb
    const tx = x + frac(el) * trackW;
    ctx.globalAlpha = 0.9;
    const ts = 7 * S;
    ctx.fillRect(tx - ts / 2, y - ts / 2, ts, ts);
    x += trackW + gap;
  };
  slider('Cut ', mixCut);
  slider('Melt ', mixMelt);

  ctx.restore();
}

let rafId = 0;
function frame() {
  const now = performance.now();
  const s = window.skip;
  const cam = s.camera, gl = s.renderer.domElement;
  let zoomUse = ZOOM, fxUse = FX, fyUse = FY;
  let camSaveX, camSaveY, camMoved = false;
  // Turntable: show only the piece, spin it via turn.yaw, centre the camera on
  // it (as the app does for a focused piece) and zoom in.
  if (TT && ttPiece) {
    for (const o of s.items) { try { o.holder.visible = (o === ttPiece); } catch (e) {} }
    const el = (now - ttStart) / 1000;
    try { ttPiece.turn.yaw = el * (Math.PI * 2 / SECPT); ttPiece.turn.vy = 0; ttPiece.turn.pitch = 0; } catch (e) {}
    try {
      camSaveX = cam.position.x; camSaveY = cam.position.y;
      cam.position.x = ttPiece.home.x; cam.position.y = ttPiece.home.y;
      camMoved = true;
    } catch (e) {}
    fxUse = 0.5; fyUse = 0.5;
    zoomUse = ZOOM > 1 ? ZOOM : 3.2;
  }
  // A view offset narrows the frustum onto the piece and renders it to the full
  // canvas (true zoom), then we clear it so the app's own loop is untouched.
  let offset = false;
  if (zoomUse > 1) {
    const W = gl.clientWidth || innerWidth, H = gl.clientHeight || innerHeight;
    const w = W / zoomUse, h = H / zoomUse;
    const x = Math.max(0, Math.min(W - w, fxUse * W - w / 2));
    const y = Math.max(0, Math.min(H - h, fyUse * H - h / 2));
    try { cam.setViewOffset(W, H, x, y, w, h); offset = true; } catch (e) {}
  }
  try { s.renderer.render(s.scene, cam); } catch (e) {}
  if (offset) { try { cam.clearViewOffset(); } catch (e) {} }
  if (camMoved) { cam.position.x = camSaveX; cam.position.y = camSaveY; }
  // cover-fit the GL canvas into our 16:9 frame
  const sa = gl.width / gl.height, da = OUT_W / OUT_H;
  let dw = OUT_W, dh = OUT_H, dx = 0, dy = 0;
  if (sa > da) { dh = OUT_H; dw = dh * sa; dx = (OUT_W - dw) / 2; }
  else         { dw = OUT_W; dh = dw / sa; dy = (OUT_H - dh) / 2; }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, OUT_W, OUT_H);
  try { ctx.drawImage(gl, dx, dy, dw, dh); } catch (e) {}
  if (!TT) drawUI(now);
  if (captureTrack && captureTrack.requestFrame) captureTrack.requestFrame();
  rafId = requestAnimationFrame(frame);
}

// --- choreography -------------------------------------------------------------
// Default beat sheet (Yam art-directs; override timings later). One Mix press,
// two slider moves that re-carve the live piece, a second press that starts a
// fresh arrival the clip rides into (reads as "a different one every press").
async function choreograph() {
  await wait(500);
  mixGo.click(); mixFlash = performance.now();         // press 1
  await wait(5300);                                    // watch it arrive
  await tweenSlider(mixMelt, 1.25, 1300);              // melt more
  await wait(250);
  await tweenSlider(mixCut, 0.12, 1100);               // shift the cut
  await wait(350);
  mixGo.click(); mixFlash = performance.now();         // press 2
  // the remaining time of DUR runs out while this one is still forming
}

// --- record -------------------------------------------------------------------
function pickMime() {
  const c = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return c.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
}

async function record() {
  // capture(0): frames are produced only by track.requestFrame(), which
  // frame() calls every rAF -> deterministic, in lockstep with our drawing.
  const stream = out.captureStream(0);
  captureTrack = stream.getVideoTracks()[0];
  const mime = pickMime();
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 16e6 } : {});
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  const stopped = new Promise((r) => (rec.onstop = r));
  rec.start(500);                       // flush a chunk twice a second
  log('recording ' + OUT_W + 'x' + OUT_H + ' @' + FPS + ' for ' + DUR + 'ms');
  if (!TT) choreograph();
  await wait(DUR);
  rec.stop();
  await stopped;
  const blob = new Blob(chunks, { type: 'video/webm' });
  log('recorded ' + (blob.size / 1e6).toFixed(2) + ' MB, saving as ' + NAME + '.webm');
  const res = await fetch('/__save?name=' + NAME + '.webm', { method: 'POST', body: blob });
  const txt = await res.text();
  window.__capture.file = NAME + '.webm';
  window.__capture.done = true;
  log('saved: ' + txt);
}

// --- go -----------------------------------------------------------------------
(async () => {
  try {
    await waitForApp();
    log('app ready, waiting ' + START + 'ms for first piece to settle');
    await wait(START);
    if (TT) {
      ttPiece = window.skip.items.find(o => o.piece && o.piece.id === TT);
      try { window.skip.carveAll && window.skip.carveAll(); } catch (e) {}
      ttStart = performance.now();
      frame();               // start compositing now (carving is async + slow)
      // poll the capture canvas until the piece actually shows (not black)
      let seen = false;
      for (let i = 0; i < 300; i++) {
        try {
          const p = ctx.getImageData(OUT_W >> 1, Math.round(OUT_H * 0.5), 1, 1).data;
          if (p[0] + p[1] + p[2] > 60) { seen = true; break; }
        } catch (e) {}
        await wait(100);
      }
      await wait(400);
      ttStart = performance.now();   // reset so the recorded clip starts at yaw 0
      log('turntable on ' + TT + (seen ? ' (piece visible)' : ' (TIMEOUT, still black)'));
    } else {
      frame();               // start compositing
    }
    await record();
    cancelAnimationFrame(rafId);
  } catch (e) {
    window.__capture.error = String(e);
    log('ERROR ' + e);
  }
})();
