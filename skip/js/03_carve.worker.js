// Carves a sculpture: samples its distance field on a grid, chisels it into
// flat facets, and extracts a mesh. Runs off the main thread.
//
// The chisel: space is divided into random cells. Inside each cell the smooth
// field is replaced by its tangent plane at one point of the surface, so every
// cell cuts one flat facet. Neighbouring planes never quite meet, and those
// small steps are the chipped edges. Cell size is the facet-scale dial.

import { compile } from './01_sdf.js';
import { byId } from './02_sculptures.js';

function hash(i, j, k, s) {
  let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1440662683) + Math.imul(s, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function carve(piece, p) {
  // A piece is either described in code (strokes and solids) or arrives with a
  // ready distance field, baked from a 3D model by 03_Tools/bake-model.mjs.
  const { sdf, min, max } = piece.field || compile(piece.strokes, { blend: piece.blend, lump: piece.lump, solids: piece.solids });
  const h = p.cell;
  const pad = h * 3 + p.facetSize * 0.25;
  const o = [min[0] - pad, min[1] - pad, min[2] - pad];
  const nx = Math.ceil((max[0] - min[0] + pad * 2) / h) + 1;
  const ny = Math.ceil((max[1] - min[1] + pad * 2) / h) + 1;
  const nz = Math.ceil((max[2] - min[2] + pad * 2) / h) + 1;

  // `wide` measures the slope over a longer distance. A baked model's field is
  // a little noisy from voxel to voxel; fitting chisel planes to that noise
  // tilts them at random and the facets tear into steps that read as holes.
  const grad = (x, y, z, out, wide) => {
    const e = piece.field ? piece.field.eps * (wide ? 4 : 1) : h * 0.5;
    let gx = sdf(x + e, y, z) - sdf(x - e, y, z);
    let gy = sdf(x, y + e, z) - sdf(x, y - e, z);
    let gz = sdf(x, y, z + e) - sdf(x, y, z - e);
    const l = Math.hypot(gx, gy, gz) || 1;
    out[0] = gx / l; out[1] = gy / l; out[2] = gz / l;
    return out;
  };

  // --- chisel -------------------------------------------------------------
  const c = p.facetSize;
  const planes = new Map();
  const g = [0, 0, 0];
  const NONE = [];
  function plane(ci, cj, ck) {
    const key = (ci + 512) + (cj + 512) * 1024 + (ck + 512) * 1048576;
    let pl = planes.get(key);
    if (pl) return pl;
    let sx = (ci + hash(ci, cj, ck, 1)) * c;
    let sy = (cj + hash(ci, cj, ck, 2)) * c;
    let sz = (ck + hash(ci, cj, ck, 3)) * c;
    // Only seeds that start near the surface strike a facet.
    if (Math.abs(sdf(sx, sy, sz)) > c) { planes.set(key, NONE); return NONE; }
    // Pull the seed onto the surface with two Newton steps.
    for (let it = 0; it < 2; it++) {
      const d = sdf(sx, sy, sz);
      grad(sx, sy, sz, g, true);
      sx -= g[0] * d; sy -= g[1] * d; sz -= g[2] * d;
    }
    grad(sx, sy, sz, g, true);
    // Some facets are struck a little deeper than others.
    pl = [sx, sy, sz, g[0], g[1], g[2], hash(ci, cj, ck, 4) * p.chip];
    planes.set(key, pl);
    return pl;
  }
  // Each point belongs to the facet whose strike point (on the surface) is
  // nearest. On a round form two tangent planes meet exactly halfway between
  // their strike points, so facets join in clean straight creases.
  function chiselled(x, y, z, d0) {
    const ci = Math.floor(x / c), cj = Math.floor(y / c), ck = Math.floor(z / c);
    let best = Infinity, bp = null;
    for (let dk = -1; dk <= 1; dk++) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const pl = plane(ci + di, cj + dj, ck + dk);
      if (pl === NONE) continue;
      const ex = pl[0] - x, ey = pl[1] - y, ez = pl[2] - z;
      const dd = ex * ex + ey * ey + ez * ez;
      if (dd < best) { best = dd; bp = pl; }
    }
    if (!bp) return d0;
    let df = (x - bp[0]) * bp[3] + (y - bp[1]) * bp[4] + (z - bp[2]) * bp[5] + bp[6];
    // A plane is only trusted close to the form it was struck from; without
    // this, a facet of one limb can slice a shard out of the air next to it.
    const lim = c * (piece.field ? 0.1 : 0.22);
    df = df < d0 - lim ? d0 - lim : df > d0 + lim ? d0 + lim : df;
    return d0 + (df - d0) * p.facetDepth;
  }

  // --- sample -------------------------------------------------------------
  // Blocks of 4x4x4 samples whose centre is far from the surface are filled in
  // one go; only the shell around the surface is sampled point by point.
  const field = new Float32Array(nx * ny * nz);
  // A facet can move the surface by at most `lim` (see chiselled), so only
  // samples that close to it need chiselling.
  const band = Math.max(c * 0.22 * 1.4, h * 2.5);
  const B = 4, reach = (B - 1) * 0.5 * h * Math.sqrt(3) + h + 0.15;
  const sample = (i, j, k) => {
    const x = o[0] + i * h, y = o[1] + j * h, z = o[2] + k * h;
    let d = sdf(x, y, z);
    if (p.facetDepth > 0 && d > -band && d < band) d = chiselled(x, y, z, d);
    field[i + j * nx + k * nx * ny] = d;
  };
  for (let k0 = 0; k0 < nz; k0 += B) for (let j0 = 0; j0 < ny; j0 += B) for (let i0 = 0; i0 < nx; i0 += B) {
    const mid = (B - 1) * 0.5;
    const d = sdf(o[0] + (i0 + mid) * h, o[1] + (j0 + mid) * h, o[2] + (k0 + mid) * h);
    const far = Math.abs(d) > reach;
    const k1 = Math.min(k0 + B, nz), j1 = Math.min(j0 + B, ny), i1 = Math.min(i0 + B, nx);
    for (let k = k0; k < k1; k++) for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      if (far) field[i + j * nx + k * nx * ny] = d; else sample(i, j, k);
    }
  }

  // --- surface nets ---------------------------------------------------------
  const sx = 1, sy = nx, sz = nx * ny;
  const cellVert = new Int32Array(nx * ny * nz).fill(-1);
  const pos = [];
  const corner = [0, sx, sy, sx + sy, sz, sx + sz, sy + sz, sx + sy + sz];
  const cOff = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const idx = i + j * sy + k * sz;
    let mask = 0;
    for (let n = 0; n < 8; n++) { v[n] = field[idx + corner[n]]; if (v[n] < 0) mask |= 1 << n; }
    if (mask === 0 || mask === 255) continue;
    let ax = 0, ay = 0, az = 0, cnt = 0;
    for (let e = 0; e < 12; e++) {
      const a = edges[e][0], b = edges[e][1];
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      ax += cOff[a][0] + (cOff[b][0] - cOff[a][0]) * t;
      ay += cOff[a][1] + (cOff[b][1] - cOff[a][1]) * t;
      az += cOff[a][2] + (cOff[b][2] - cOff[a][2]) * t;
      cnt++;
    }
    cellVert[idx] = pos.length / 3;
    pos.push(o[0] + (i + ax / cnt) * h, o[1] + (j + ay / cnt) * h, o[2] + (k + az / cnt) * h);
  }

  const index = [];
  const stride = [sx, sy, sz];
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const idx = i + j * sy + k * sz;
    const inside = field[idx] < 0;
    for (let a = 0; a < 3; a++) {
      if (inside === (field[idx + stride[a]] < 0)) continue;
      const du = stride[(a + 1) % 3], dv = stride[(a + 2) % 3];
      const c0 = cellVert[idx], c1 = cellVert[idx - du], c2 = cellVert[idx - du - dv], c3 = cellVert[idx - dv];
      if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) continue;
      if (inside) index.push(c0, c1, c2, c0, c2, c3);
      else index.push(c0, c2, c1, c0, c3, c2);
    }
  }
  // --- per-vertex finish ----------------------------------------------------
  // Normal of the smooth, un-chiselled form (the shader blends it against the
  // true faceted normal), occlusion from the distance field, and grain: a small
  // random push along the normal that tilts every triangle a little.
  const nv = pos.length / 3;
  const position = new Float32Array(pos);
  const normal = new Float32Array(nv * 3);
  const ao = new Float32Array(nv);
  // How open the sky is from each vertex along +x +y +z (shadeP) and
  // -x -y -z (shadeN). The shader blends these toward the light, which gives
  // soft shadows between the lobes that stay right as the piece turns.
  const shadeP = new Float32Array(nv * 3), shadeN = new Float32Array(nv * 3);
  const reachT = [0.1, 0.3, 0.8];
  const radii = [0.06, 0.16, 0.38, 0.8];
  for (let n = 0; n < nv; n++) {
    const x = position[n * 3], y = position[n * 3 + 1], z = position[n * 3 + 2];
    // (a baked model's field is noisy at the scale of one voxel: read its
    // slope over a wider span, or normals flip into the surface at seams and
    // the shading there goes black in patches that look like holes)
    grad(x, y, z, g, true);
    normal[n * 3] = g[0]; normal[n * 3 + 1] = g[1]; normal[n * 3 + 2] = g[2];
    let occ = 0;
    for (let r = 0; r < radii.length; r++) {
      const R = radii[r];
      const d = sdf(x + g[0] * R, y + g[1] * R, z + g[2] * R);
      occ += Math.max(0, 1 - d / R) / radii.length;
    }
    ao[n] = Math.max(1 - occ, piece.field ? 0.4 : 0);
    for (let a = 0; a < 3; a++) for (let sgn = 1; sgn >= -1; sgn -= 2) {
      let vis = 0;
      if (g[a] * sgn > -0.25) {
        vis = 1;
        // The ray leans toward the normal, so a direction that only grazes
        // the surface is not mistaken for a blocked one.
        let dx = (a === 0 ? sgn : 0) + g[0] * 0.7, dy = (a === 1 ? sgn : 0) + g[1] * 0.7, dz = (a === 2 ? sgn : 0) + g[2] * 0.7;
        const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
        for (let r = 0; r < 3 && vis > 0; r++) {
          const T = reachT[r];
          const v = sdf(x + dx * T, y + dy * T, z + dz * T) / (T * 0.4);
          if (v < vis) vis = v < 0 ? 0 : v;
        }
      }
      (sgn > 0 ? shadeP : shadeN)[n * 3 + a] = piece.field && g[a] * sgn > 0.2 ? Math.max(vis, 0.3) : vis;
    }
    const jit = (hash(Math.round(x * 4096), Math.round(y * 4096), Math.round(z * 4096), 7) - 0.5) * 2 * p.grain;
    position[n * 3] += g[0] * jit; position[n * 3 + 1] += g[1] * jit; position[n * 3 + 2] += g[2] * jit;
  }

  const Index = nv > 65535 ? Uint32Array : Uint16Array;
  return { position, normal, ao, shadeP, shadeN, index: new Index(index), min, max };
}

// The wireframe: a coarse triangle mesh that follows the form instead of a
// grid. Points are spread over the carved surface so that each new one lands as
// far as possible (walking along the surface) from all the ones before it; the
// surface is divided among them, and two points are joined by a line wherever
// their territories touch. Triangles come out irregular, sized by `edge`, with
// points on every tip and limb.
function wireMesh(position, index, edge) {
  const nv = position.length / 3, nt = index.length / 3;
  // neighbours of every vertex
  const deg = new Uint32Array(nv + 1);
  for (let i = 0; i < index.length; i++) deg[index[i] + 1] += 2;
  for (let i = 0; i < nv; i++) deg[i + 1] += deg[i];
  const nb = new Uint32Array(deg[nv]), fill = deg.slice(0, nv);
  let area = 0;
  for (let t = 0; t < nt; t++) {
    const a = index[t * 3], b = index[t * 3 + 1], c = index[t * 3 + 2];
    nb[fill[a]++] = b; nb[fill[a]++] = c; nb[fill[b]++] = a; nb[fill[b]++] = c; nb[fill[c]++] = a; nb[fill[c]++] = b;
    const ux = position[b * 3] - position[a * 3], uy = position[b * 3 + 1] - position[a * 3 + 1], uz = position[b * 3 + 2] - position[a * 3 + 2];
    const vx = position[c * 3] - position[a * 3], vy = position[c * 3 + 1] - position[a * 3 + 1], vz = position[c * 3 + 2] - position[a * 3 + 2];
    area += 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
  }
  const count = Math.max(12, Math.min(4000, Math.round(1.155 * area / (edge * edge))));

  const dist = new Float32Array(nv).fill(Infinity), owner = new Int32Array(nv).fill(-1);
  const seeds = [], queue = new Uint32Array(nv * 8);
  for (let k = 0; k < count; k++) {
    let s = 0, far = -1;
    for (let v = 0; v < nv; v++) if (dist[v] > far) { far = dist[v]; s = v; }
    if (far === 0) break;
    seeds.push(s);
    dist[s] = 0; owner[s] = k;
    let head = 0, tail = 0;
    queue[tail++] = s;
    while (head < tail) {
      const v = queue[head++], dv = dist[v];
      for (let j = deg[v]; j < deg[v + 1]; j++) {
        const w = nb[j];
        const d = dv + Math.hypot(position[w * 3] - position[v * 3], position[w * 3 + 1] - position[v * 3 + 1], position[w * 3 + 2] - position[v * 3 + 2]);
        if (d < dist[w] - 1e-6) { dist[w] = d; owner[w] = k; if (tail < queue.length) queue[tail++] = w; }
      }
    }
  }

  const pos = new Float32Array(seeds.length * 3);
  seeds.forEach((v, k) => pos.set(position.subarray(v * 3, v * 3 + 3), k * 3));
  const edges = [], seen = new Set();
  const link = (a, b) => {
    if (a === b) return;
    const key = a < b ? a * 4096 + b : b * 4096 + a;
    if (!seen.has(key)) { seen.add(key); edges.push(a, b); }
  };
  for (let t = 0; t < nt; t++) {
    const a = owner[index[t * 3]], b = owner[index[t * 3 + 1]], c = owner[index[t * 3 + 2]];
    link(a, b); link(b, c); link(c, a);
  }
  return { position: pos, edges: new Uint16Array(edges) };
}

export { carve, wireMesh };

// --- mixing -----------------------------------------------------------------------
// Each baked model comes with a small copy of its distance field (72 cubed, one
// byte per value, written by the baker).
//
// A mix works like the drawing game where one person draws the legs, the next
// the body and the next the head: one end of piece A, the middle of piece B and
// the other end of piece C. Each piece is cut along its own direction, which
// can be any direction at all (not only bottom to top), at the same share of
// its length. What makes the result one figure instead of three stacked scraps:
//   - each piece is turned so its cut faces line up with the stack,
//   - at each join the next piece is moved so that its cross-section sits
//     exactly on the cross-section before it, and
//   - it is scaled so the two cross-sections are the same size,
// so a neck always lands on a neck. Across a join each piece melts into the
// next; anything left floating free of the main body is thrown away.
const FN = 72, FLO = -2.1, FH = 4.2 / (FN - 1), FRANGE = 0.5;
const fields = new Map();
function addField(id, data) {
  // the positions of all the voxels inside the piece
  const inside = [];
  for (let k = 0, q = 0; k < FN; k++) for (let j = 0; j < FN; j++) for (let i = 0; i < FN; i++, q++) {
    if (data[q] < 0) inside.push(FLO + i * FH, FLO + j * FH, FLO + k * FH);
  }
  fields.set(id, { data, inside: new Float32Array(inside) });
}
// A piece measured along a direction u: where it starts and ends, and for
// every thin slab across u, how big the cross-section is and where its middle is.
const NB = 128, T0 = -3.7;
function profile(f, u) {
  const n = new Float32Array(NB), cx = new Float32Array(NB), cy = new Float32Array(NB), cz = new Float32Array(NB), p = f.inside;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    const t = p[i] * u[0] + p[i + 1] * u[1] + p[i + 2] * u[2], b = Math.floor((t - T0) / FH);
    n[b]++; cx[b] += p[i]; cy[b] += p[i + 1]; cz[b] += p[i + 2];
    if (t < lo) lo = t; if (t > hi) hi = t;
  }
  // the cross-section at distance t along u, averaged over a few slabs
  const at = (t) => {
    const b = Math.round((t - T0) / FH);
    let c = 0, x = 0, y = 0, z = 0;
    for (let d = -2; d <= 2; d++) { const k = b + d; if (k >= 0 && k < NB) { c += n[k]; x += cx[k]; y += cy[k]; z += cz[k]; } }
    return c > 0 ? { size: Math.sqrt(c / 5) * FH, c: [x / c, y / c, z / c] } : { size: 0.2, c: [u[0] * t, u[1] * t, u[2] * t] };
  };
  return { lo, hi, at };
}
// The turn that carries "up" in the mix onto direction u in the piece (as a 3x3 matrix, rows first).
function turnTo(u) {
  const c = u[1], ax = u[2], az = -u[0], s2 = ax * ax + az * az;      // axis = up x u = (u.z, 0, -u.x)
  if (s2 < 1e-9) return c > 0 ? [1, 0, 0, 0, 1, 0, 0, 0, 1] : [1, 0, 0, 0, -1, 0, 0, 0, -1];
  const k = (1 - c) / s2;
  return [c + ax * ax * k, -az, ax * az * k, az, c, -ax, ax * az * k, ax, c + az * az * k];
}
function sample(f, x, y, z) {
  const fx = (x - FLO) / FH, fy = (y - FLO) / FH, fz = (z - FLO) / FH;
  if (fx < 0 || fy < 0 || fz < 0 || fx >= FN - 1 || fy >= FN - 1 || fz >= FN - 1) return FRANGE;
  const i = fx | 0, j = fy | 0, k = fz | 0, u = fx - i, v = fy - j, w = fz - k, n = i + j * FN + k * FN * FN, d = f.data;
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(d[n], d[n + 1], u), l(d[n + FN], d[n + FN + 1], u), v),
    l(l(d[n + FN * FN], d[n + FN * FN + 1], u), l(d[n + FN * FN + FN], d[n + FN * FN + FN + 1], u), v), w) * (FRANGE / 127);
}
// recipe: { a, b, c, dirs (the cut direction of each piece), cut (moves both joins), melt (how wide the joins are) }
function mixPiece(r) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const f1 = clamp(0.36 + r.cut, 0.16, 0.6), f2 = clamp(0.66 + r.cut, f1 + 0.16, 0.86);
  // one part of the stack: a piece, its direction, the cross-section it is
  // anchored by (`from`), where that lands in the mix (`at`) and its scale
  const part = (id, u, share, at, fitTo) => {
    const f = fields.get(id), pr = profile(f, u), t = pr.lo + share * (pr.hi - pr.lo), sl = pr.at(t);
    return { f, pr, u, Q: turnTo(u), t, from: sl.c, size: sl.size, at, k: fitTo ? clamp(fitTo / sl.size, 0.5, 2) : 1 };
  };
  const dirs = r.dirs || [[0, 1, 0], [0, 1, 0], [0, 1, 0]];
  const A = part(r.a, dirs[0], f1, [0, 0, 0], 0);
  const B = part(r.b, dirs[1], f1, [0, 0, 0], A.size);
  // where B's second cut lands in the mix
  const bTop = B.pr.at(B.pr.lo + f2 * (B.pr.hi - B.pr.lo));
  const back = (P, v) => { const Q = P.Q; return [Q[0] * v[0] + Q[3] * v[1] + Q[6] * v[2], Q[1] * v[0] + Q[4] * v[1] + Q[7] * v[2], Q[2] * v[0] + Q[5] * v[1] + Q[8] * v[2]]; };
  const rise = back(B, [bTop.c[0] - B.from[0], bTop.c[1] - B.from[1], bTop.c[2] - B.from[2]]).map((v) => v * B.k);
  const C = part(r.c, dirs[2], f2, rise, bTop.size * B.k);
  const y2 = rise[1];
  // a point of the mix, read in a part
  const read = (P, x, y, z) => {
    const vx = (x - P.at[0]) / P.k, vy = (y - P.at[1]) / P.k, vz = (z - P.at[2]) / P.k, Q = P.Q;
    return sample(P.f, P.from[0] + Q[0] * vx + Q[1] * vy + Q[2] * vz, P.from[1] + Q[3] * vx + Q[4] * vy + Q[5] * vz, P.from[2] + Q[6] * vx + Q[7] * vy + Q[8] * vz) * P.k;
  };
  const soft = Math.max(0.04, r.melt * 0.25);
  const ramp = (p, at) => { let w = (p - (at - soft)) / (2 * soft); w = w < 0 ? 0 : w > 1 ? 1 : w; return w * w * (3 - 2 * w); };
  const sdf = (x, y, z) => {
    const w1 = ramp(y, 0), w2 = ramp(y, y2);
    let d = w1 === 0 ? read(A, x, y, z) : w1 === 1 ? read(B, x, y, z) : read(A, x, y, z) * (1 - w1) + read(B, x, y, z) * w1;
    if (w2 > 0) d = w2 === 1 ? read(C, x, y, z) : d * (1 - w2) + read(C, x, y, z) * w2;
    return d;
  };
  // room for the three parts: each piece's own voxels, carried into the mix,
  // keeping only the stretch of each that is actually used
  const min = [9, 9, 9], max = [-9, -9, -9];
  for (const [P, yLo, yHi] of [[A, -9, soft], [B, -soft, y2 + soft], [C, y2 - soft, 9]]) {
    const p = P.f.inside;
    for (let i = 0; i < p.length; i += 30) {
      const v = back(P, [p[i] - P.from[0], p[i + 1] - P.from[1], p[i + 2] - P.from[2]]).map((c, a) => P.at[a] + c * P.k);
      if (v[1] < yLo || v[1] > yHi) continue;
      for (let a = 0; a < 3; a++) { if (v[a] < min[a]) min[a] = v[a]; if (v[a] > max[a]) max[a] = v[a]; }
    }
  }
  // what was done, for the readout beside the stage: each part's cut
  // direction, where along its length it was cut, and how much it was scaled
  // to fit the join
  const spec = [[A, f1, f1], [B, f1, f2], [C, f2, f2]].map(([P, s0, s1], i) => ({
    id: [r.a, r.b, r.c][i], dir: P.u, from: s0, to: s1, k: P.k, size: P.size * P.k,
  }));
  return { id: 'mix', field: { sdf, min: min.map((v) => v - 0.15), max: max.map((v) => v + 0.15), eps: FH }, spec, joinY: y2 };
}

// Keeps the main body of a carved mesh and drops whatever floats free of it.
function keepMain(m) {
  const nv = m.position.length / 3, parent = new Int32Array(nv).map((_, i) => i);
  const find = (v) => { while (parent[v] !== v) { parent[v] = parent[parent[v]]; v = parent[v]; } return v; };
  for (let t = 0; t < m.index.length; t += 3) {
    const a = find(m.index[t]), b = find(m.index[t + 1]), c = find(m.index[t + 2]);
    parent[b] = a; parent[find(c)] = a;
  }
  const count = new Map();
  for (let v = 0; v < nv; v++) { const r = find(v); count.set(r, (count.get(r) || 0) + 1); }
  const biggest = Math.max(...count.values());
  if (count.size === 1) return m;
  const keep = new Int32Array(nv).fill(-1);
  let kept = 0;
  for (let v = 0; v < nv; v++) if (count.get(find(v)) >= biggest * 0.25) keep[v] = kept++;
  const pick = (src, w) => { const out = new src.constructor(kept * w); for (let v = 0; v < nv; v++) if (keep[v] >= 0) for (let c = 0; c < w; c++) out[keep[v] * w + c] = src[v * w + c]; return out; };
  const index = [];
  for (let t = 0; t < m.index.length; t += 3) if (keep[m.index[t]] >= 0) index.push(keep[m.index[t]], keep[m.index[t + 1]], keep[m.index[t + 2]]);
  const position = pick(m.position, 3), min = [9, 9, 9], max = [-9, -9, -9];
  for (let i = 0; i < position.length; i++) { const a = i % 3; if (position[i] < min[a]) min[a] = position[i]; if (position[i] > max[a]) max[a] = position[i]; }
  return { position, normal: pick(m.normal, 3), ao: pick(m.ao, 1), shadeP: pick(m.shadeP, 3), shadeN: pick(m.shadeN, 3), index: new Uint32Array(index), min, max };
}

export { mixPiece, addField, keepMain };

if (typeof self !== 'undefined') self.onmessage = (e) => {
  if (e.data.type === 'field') { addField(e.data.id, e.data.data); return; }
  if (e.data.type === 'mix') {
    const piece = mixPiece(e.data.recipe);
    const m = keepMain(carve(piece, e.data.params));
    const low = m.low = wireMesh(m.position, m.index, e.data.params.wireEdge);
    m.kind = 'mix'; m.gen = e.data.gen; m.slot = e.data.slot; m.spec = piece.spec; m.joinY = piece.joinY; m.rough = e.data.rough;
    self.postMessage(m, [m.position.buffer, m.normal.buffer, m.ao.buffer, m.shadeP.buffer, m.shadeN.buffer, m.index.buffer, low.position.buffer, low.edges.buffer]);
    return;
  }
  const { job, id, params } = e.data;
  const t0 = performance.now();
  const piece = byId(id);
  // A piece can ask for its own chisel (geometric pieces want small, shallow
  // facets so their true edges survive).
  Object.assign(params, piece.carve);
  const m = carve(piece, params);
  const low = m.low = wireMesh(m.position, m.index, params.wireEdge);
  m.job = job; m.id = id; m.ms = Math.round(performance.now() - t0);
  self.postMessage(m, [m.position.buffer, m.normal.buffer, m.ao.buffer, m.shadeP.buffer, m.shadeN.buffer, m.index.buffer,
    low.position.buffer, low.edges.buffer]);
};
