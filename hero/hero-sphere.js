/* ══════════════════════════════════════════════════════════════
   HERO SPHERE
   A lightweight 2D-canvas wireframe sphere for the hero collage.
   Deliberately simpler than the /sphere app + work-card (which use
   three.js + noise): here we want a clean, slowly-rotating sphere
   with LOWER line density and THICKER strokes so it reads well in a
   busy hero. It renders dark strokes on a transparent canvas; the
   `.ring-card-sphere` CSS filter flattens that to a grey silhouette
   (idle) and swaps in #mv-gradient-tint on hover — identical to the
   SHLTR / Radiant silhouettes. Depth is conveyed by per-segment
   alpha (which the grey filter preserves), so back-of-sphere lines
   read fainter than the front.

   window.initHeroSphere(canvas, opts)
     opts.lat        latitude circles        (default 9)   — lower = sparser
     opts.lon        longitude meridians      (default 13)
     opts.seg        meridian subdivisions    (default = lat)
     opts.lineWidth  base stroke width in px  (default 2.2) — thicker than card
     opts.speed      idle spin (rad / frame)  (default 0.004)
     opts.tilt       fixed X tilt (radians)   (default 0.32)
     opts.scale      radius as fraction of (min(w,h)/2)  (default 0.5)
════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Unit-sphere lat/lon line segments (pairs of [x,y,z] endpoints).
  function buildSegments(LAT, LON, SEG) {
    var segs = [];
    function P(theta, phi) {
      var s = Math.sin(phi);
      return [s * Math.cos(theta), Math.cos(phi), s * Math.sin(theta)];
    }
    var i, j;
    for (i = 1; i < LAT; i++) {                       // latitude circles
      var phi = Math.PI * i / LAT;
      for (j = 0; j < LON; j++) {
        segs.push([P(2 * Math.PI * j / LON, phi),
                   P(2 * Math.PI * (j + 1) / LON, phi)]);
      }
    }
    for (j = 0; j < LON; j++) {                       // longitude meridians
      var theta = 2 * Math.PI * j / LON;
      for (i = 0; i < SEG; i++) {
        segs.push([P(theta, Math.PI * i / SEG),
                   P(theta, Math.PI * (i + 1) / SEG)]);
      }
    }
    return segs;
  }

  window.initHeroSphere = function (canvas, opts) {
    opts = opts || {};
    if (canvas._heroSphere) return;                   // guard against double-init
    canvas._heroSphere = true;

    var LAT   = opts.lat || 9;
    var LON   = opts.lon || 13;
    var SEG   = opts.seg || LAT;
    var LINE  = opts.lineWidth || 2.2;
    var SPEED = opts.speed != null ? opts.speed : 0.004;
    var TILT  = opts.tilt  != null ? opts.tilt  : 0.32;
    var FILL  = opts.scale != null ? opts.scale : 0.5;

    var segs  = buildSegments(LAT, LON, SEG);
    var ctx   = canvas.getContext('2d');
    var stage = canvas.parentElement;                 // .ring-card-stage (232×248)
    var card  = canvas.closest('.ring-card');
    var dpr   = Math.min(window.devicePixelRatio || 1, 2);

    var W = 0, H = 0, R = 0, cx = 0, cy = 0;
    function resize() {
      var w = stage.clientWidth || 232, h = stage.clientHeight || 248;
      W = w; H = h;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R  = Math.min(w, h) * 0.5 * FILL;
      cx = w / 2; cy = h / 2;
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage);
    resize();

    // Hover (mirrors the card :hover state) → spin a little faster.
    var hover = false;
    if (card) {
      card.addEventListener('pointerenter', function () { hover = true; });
      card.addEventListener('pointerleave', function () { hover = false; });
    }

    // Pause the RAF loop when the hero scrolls out of view.
    var visible = true;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; },
        { threshold: 0.01 }).observe(canvas);
    }

    var ct = Math.cos(TILT), st = Math.sin(TILT);
    function rot(p, cosY, sinY) {
      var x  = p[0] * cosY + p[2] * sinY;             // rotate around Y (spin)
      var z  = -p[0] * sinY + p[2] * cosY;
      var y2 = p[1] * ct - z * st;                    // fixed tilt around X
      var z2 = p[1] * st + z * ct;
      return [x, y2, z2];
    }

    var angle = 0, spin = SPEED;
    function frame() {
      requestAnimationFrame(frame);
      if (!visible || !R) return;
      var goal = hover ? SPEED * 2.3 : SPEED;
      spin += (goal - spin) * 0.05;                   // ease toward target speed
      angle += spin;

      var cosY = Math.cos(angle), sinY = Math.sin(angle);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';
      for (var k = 0; k < segs.length; k++) {
        var a = rot(segs[k][0], cosY, sinY);
        var b = rot(segs[k][1], cosY, sinY);
        var zMid = (a[2] + b[2]) / 2;                 // -1 (back) … +1 (front)
        var t = (zMid + 1) / 2;
        // Alpha carries depth; the grey filter keeps alpha, so back lines stay
        // fainter even once flattened. RGB is irrelevant (contrast(0) greys it).
        ctx.strokeStyle = 'rgba(38,37,30,' + (0.30 + 0.65 * t).toFixed(3) + ')';
        ctx.lineWidth   = LINE * (0.72 + 0.5 * t);    // front strokes a touch thicker
        ctx.beginPath();
        ctx.moveTo(cx + a[0] * R, cy - a[1] * R);
        ctx.lineTo(cx + b[0] * R, cy - b[1] * R);
        ctx.stroke();
      }
    }
    frame();
  };
})();
