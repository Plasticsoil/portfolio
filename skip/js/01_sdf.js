// Signed-distance building blocks for the sculptures.
// A sculpture is a list of strokes and solids. A stroke is a spline of
// [x, y, z, radius] points: soft, hand-drawn forms. A solid is a geometric
// body with flat faces and true edges: a tapered block or a crescent. Segments of one stroke are joined with a hard min (they share
// endpoints, so the union is already seamless); strokes are joined to each
// other with a smooth min, which is what makes the whole thing one monolith.

export function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

// Smooth 3D noise, 0..1. Used to push the surface in and out a little so a
// boulder is never a perfect ball.
function hash(i, j, k) {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1440662683)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
  let u = x - i, v = y - j, w = z - k;
  u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(hash(i, j, k), hash(i + 1, j, k), u), l(hash(i, j + 1, k), hash(i + 1, j + 1, k), u), v),
    l(l(hash(i, j, k + 1), hash(i + 1, j, k + 1), u), l(hash(i, j + 1, k + 1), hash(i + 1, j + 1, k + 1), u), v),
    w);
}

// --- solids -------------------------------------------------------------------
// box:  { type: 'box', c: [x, y, z], half: [hx, hy, hz], taper, taperZ, bevel }
//       a block; `taper` is how wide the bottom is compared with the top
//       (1 = straight sides), `taperZ` the same for its depth.
// lune: { type: 'lune', c: [x, y, z], width, rise, thick, hz, bevel }
//       a crescent with its tips up: `width` tip to tip, `rise` how far the
//       tips stand above the lowest point, `thick` its height at the middle,
//       `hz` half its depth. It is the gap between two circles, pushed through
//       in depth.
// blob: { type: 'blob', c: [x, y, z], r: [rx, ry, rz] }
//       a soft ellipsoid; make one radius small for a flat pool.
// Box and lune edges are cut with a flat 45-degree bevel, never rounded.
const S2 = Math.SQRT1_2;
function solidDist(s, x, y, z) {
  const px = x - s.c[0], py = y - s.c[1], pz = Math.abs(z - s.c[2]), c = s.bevel;
  if (s.type === 'blob') {
    const qx = (x - s.c[0]) / s.r[0], qy = (y - s.c[1]) / s.r[1], qz = (z - s.c[2]) / s.r[2];
    const k0 = Math.hypot(qx, qy, qz), k1 = Math.hypot(qx / s.r[0], qy / s.r[1], qz / s.r[2]);
    return k1 > 0 ? k0 * (k0 - 1) / k1 : -Math.min(s.r[0], s.r[1], s.r[2]);
  }
  if (s.type === 'box') {
    let t = (py + s.half[1]) / (2 * s.half[1]); t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = Math.abs(px) - s.half[0] * (s.taper + (1 - s.taper) * t);
    const dy = Math.abs(py) - s.half[1];
    const dz = pz - s.half[2] * (s.taperZ + (1 - s.taperZ) * t);
    return Math.max(dx, dy, dz, (dx + dy + c) * S2, (dy + dz + c) * S2, (dx + dz + c) * S2);
  }
  // The tips are cut off square a little before they would come to a point.
  const d2 = Math.max(Math.hypot(px, py - s.y1) - s.R1, s.R2 - Math.hypot(px, py - s.y2), Math.abs(px) - s.cut);
  const dz = pz - s.hz;
  return Math.max(d2, dz, (d2 + dz + c) * S2);
}
function prepareSolid(s) {
  const o = { bevel: 0.08, blend: 0.012, taper: 1, taperZ: 1, ...s };
  if (o.type === 'blob') {
    o.min = o.c.map((v, a) => v - o.r[a]);
    o.max = o.c.map((v, a) => v + o.r[a]);
  } else if (o.type === 'box') {
    o.min = [o.c[0] - o.half[0], o.c[1] - o.half[1], o.c[2] - o.half[2]];
    o.max = [o.c[0] + o.half[0], o.c[1] + o.half[1], o.c[2] + o.half[2]];
  } else {
    // Two circles through the tips: the lower edge and the upper edge.
    const a = o.width / 2, lowSag = o.rise, upSag = o.rise - o.thick;
    o.R1 = (a * a + lowSag * lowSag) / (2 * lowSag); o.y1 = o.R1;
    o.R2 = (a * a + upSag * upSag) / (2 * upSag); o.y2 = o.thick + o.R2;
    o.cut = a * 0.93;
    o.min = [o.c[0] - a, o.c[1], o.c[2] - o.hz];
    o.max = [o.c[0] + a, o.c[1] + o.rise, o.c[2] + o.hz];
  }
  return o;
}

// Catmull-Rom through the control points, `sub` segments per span.
function sampleSpline(pts, sub, closed) {
  const n = pts.length;
  const at = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out = [];
  const spans = closed ? n : n - 1;
  for (let s = 0; s < spans; s++) {
    const p0 = at(s - 1), p1 = at(s), p2 = at(s + 1), p3 = at(s + 2);
    for (let j = 0; j < sub; j++) {
      const t = j / sub, t2 = t * t, t3 = t2 * t;
      const q = [0, 0, 0, 0];
      for (let c = 0; c < 4; c++) {
        q[c] = 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t +
          (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 +
          (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3);
      }
      out.push(q);
    }
  }
  out.push(closed ? out[0] : pts[n - 1].slice());
  return out;
}

// Turns stroke definitions into flat typed arrays the distance function can
// walk quickly, plus a bounding sphere per stroke for early rejection.
export function compile(strokes = [], { blend = 0.18, sub = 5, lump = 0, solids = [] } = {}) {
  const bodies = solids.map(prepareSolid);
  const compiled = strokes.map((st) => {
    const pts = sampleSpline(st.pts, st.sub || sub, !!st.closed);
    const segs = new Float32Array((pts.length - 1) * 8);
    let cx = 0, cy = 0, cz = 0;
    for (const p of pts) { cx += p[0]; cy += p[1]; cz += p[2]; }
    cx /= pts.length; cy /= pts.length; cz /= pts.length;
    let R = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      R = Math.max(R, Math.hypot(p[0] - cx, p[1] - cy, p[2] - cz) + p[3]);
      if (i < pts.length - 1) segs.set([...p, ...pts[i + 1]], i * 8);
    }
    return { segs, cx, cy, cz, R, blend: st.blend ?? blend };
  });

  // Bounds from the actual segment ends (the bounding spheres are too loose).
  const tmin = [Infinity, Infinity, Infinity], tmax = [-Infinity, -Infinity, -Infinity];
  for (const s of compiled) {
    for (let i = 0; i < s.segs.length; i += 4) {
      const r = s.segs[i + 3];
      for (let a = 0; a < 3; a++) {
        tmin[a] = Math.min(tmin[a], s.segs[i + a] - r);
        tmax[a] = Math.max(tmax[a], s.segs[i + a] + r);
      }
    }
  }
  for (const b of bodies) for (let a = 0; a < 3; a++) {
    tmin[a] = Math.min(tmin[a], b.min[a]);
    tmax[a] = Math.max(tmax[a], b.max[a]);
  }

  function strokeDist(s, x, y, z) {
    const g = s.segs;
    let best = Infinity;
    for (let i = 0; i < g.length; i += 8) {
      const ax = g[i], ay = g[i + 1], az = g[i + 2], ra = g[i + 3];
      const bx = g[i + 4] - ax, by = g[i + 5] - ay, bz = g[i + 6] - az, rb = g[i + 7];
      const px = x - ax, py = y - ay, pz = z - az;
      const bb = bx * bx + by * by + bz * bz;
      let t = bb > 0 ? (px * bx + py * by + pz * bz) / bb : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = px - bx * t, dy = py - by * t, dz = pz - bz * t;
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * t);
      if (d < best) best = d;
    }
    return best;
  }

  function sdf(x, y, z) {
    let d = Infinity;
    for (let i = 0; i < compiled.length; i++) {
      const s = compiled[i];
      const lb = Math.hypot(x - s.cx, y - s.cy, z - s.cz) - s.R;
      if (lb > d + s.blend) continue;
      const ds = strokeDist(s, x, y, z);
      d = d === Infinity ? ds : smin(d, ds, s.blend);
    }
    for (let i = 0; i < bodies.length; i++) {
      const ds = solidDist(bodies[i], x, y, z);
      d = d === Infinity ? ds : smin(d, ds, bodies[i].blend);
    }
    // Lumps: one broad swell and a smaller one on top, only near the surface.
    if (lump > 0 && d < 0.6 && d > -0.6) {
      d += lump * ((noise(x * 1.15 + 3.1, y * 1.15, z * 1.15) - 0.5) * 2 + (noise(x * 2.9, y * 2.9 + 7.7, z * 2.9) - 0.5) * 0.8);
    }
    return d;
  }

  return { sdf, min: tmin, max: tmax };
}
