// The limestone. One material for every piece in the collection.
//
// What makes it read as stone, in order of how much each one matters:
//   1. facets   — the true flat normal of each triangle, blended against the
//                 smooth normal of the form (uFlat). The big chisel planes are
//                 in the geometry; this decides how crisply they catch light.
//   2. occlusion — baked per vertex from the distance field (uAo); it is what
//                 puts the darkness between the lobes.
//   3. micro    — a cellular pattern in object space that tilts the normal per
//                 cell (uMicro) and drills the occasional pore (uPits).
//   4. mottling — slow, low-contrast colour drift so it is not one flat grey.
//   5. shadows  — baked per vertex for six directions and blended toward the
//                 light (uShadow), so lobes shade each other as the piece turns.
// Light is one fixed soft key from the upper left, plus a faint cool rim.

import * as THREE from 'three';

// The change between view modes happens everywhere at once, with no direction.
// uMix goes from 0 (the old mode) to 1 (the new one); wipeShow() is how much of
// this layer is visible on the way.
const WIPE = /* glsl */ `
uniform float uMix, uShowL, uShowR;
float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wipeMix() { return uMix; }
float wipeShow() { return mix(uShowR, uShowL, uMix); }
`;

const vertexShader = /* glsl */ `
attribute float ao;
attribute vec3 shadeP, shadeN;
varying vec3 vShadeP, vShadeN;
varying vec3 vObj;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vAo;
void main() {
  vObj = position;
  vNormal = normal;
  vAo = ao;
  vShadeP = shadeP; vShadeN = shadeN;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const fragmentShader = /* glsl */ `
precision highp float;
uniform mat3 uRot;
uniform vec3 uKeyDir;
uniform vec3 uTint;
uniform float uFlat, uMicro, uMicroScale, uPits, uAo, uRim, uExposure, uReveal, uShadow;
${WIPE}
varying vec3 vShadeP, vShadeN;
varying vec3 vObj;
varying vec3 vNormal;
varying vec3 vWorld;
varying float vAo;

vec3 hash3(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float vnoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(mix(hash3(i).x, hash3(i + vec3(1, 0, 0)).x, f.x),
                mix(hash3(i + vec3(0, 1, 0)).x, hash3(i + vec3(1, 1, 0)).x, f.x), f.y);
  float b = mix(mix(hash3(i + vec3(0, 0, 1)).x, hash3(i + vec3(1, 0, 1)).x, f.x),
                mix(hash3(i + vec3(0, 1, 1)).x, hash3(i + vec3(1, 1, 1)).x, f.x), f.y);
  return mix(a, b, f.z);
}
float fbm(vec3 p) {
  return vnoise(p) * 0.55 + vnoise(p * 2.1 + 7.3) * 0.3 + vnoise(p * 4.3 + 1.7) * 0.15;
}
// Nearest cell: returns its random id in xyz... and distance to its centre.
vec4 cells(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  float best = 9.0;
  vec3 id = vec3(0.0);
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(float(x), float(y), float(z));
    vec3 h = hash3(i + o);
    vec3 d = o + h - f;
    float dd = dot(d, d);
    if (dd < best) { best = dd; id = h; }
  }
  return vec4(id, sqrt(best));
}

void main() {
  // Changing view mode: uShowR says whether the surface belongs to the old
  // mode, uShowL to the new one. The surface is opaque, so it comes and goes
  // by thinning out pixel by pixel, like grain.
  if (wHash(gl_FragCoord.xy) >= wipeShow()) discard;

  // 1. facets
  vec3 smoothN = normalize(vNormal);
  vec3 flatN = normalize(cross(dFdx(vObj), dFdy(vObj)));
  if (dot(flatN, smoothN) < 0.0) flatN = -flatN;
  vec3 n = normalize(mix(smoothN, flatN, uFlat));

  // 3. micro: a cell pattern tilts the normal chip by chip, and a finer noise
  // on top gives the tooth of the stone when you look closely.
  vec4 cell = cells(vObj * uMicroScale);
  vec3 fine = vec3(vnoise(vObj * uMicroScale * 3.7), vnoise(vObj * uMicroScale * 3.7 + 19.0), vnoise(vObj * uMicroScale * 3.7 + 41.0)) - 0.5;
  n = normalize(n + (cell.xyz - 0.5) * uMicro + fine * uMicro * 0.9);
  float pit = step(cell.z, uPits * 0.07) * smoothstep(0.18 + 0.3 * cell.x, 0.05, cell.w);

  vec3 N = normalize(uRot * n);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 L = normalize(uKeyDir);

  // 2. occlusion
  float ao = mix(1.0, vAo, uAo);
  ao *= ao;

  // 5. shadows: the light direction in the piece's own space picks which of
  // the six baked directions to read.
  vec3 Lo = L * uRot;
  vec3 wP = max(Lo, 0.0), wN = max(-Lo, 0.0);
  float open = dot(wP * wP, vShadeP) + dot(wN * wN, vShadeN);
  float shadow = mix(1.0, smoothstep(0.08, 0.7, open), uShadow);

  // 4. mottling
  vec3 albedo = uTint;
  albedo *= 0.88 + 0.22 * fbm(vObj * 2.3);
  albedo = mix(albedo, albedo * vec3(0.93, 0.88, 0.8), smoothstep(0.45, 0.8, fbm(vObj * 0.8 + 11.0)) * 0.5);
  albedo *= 0.93 + 0.14 * cell.y;
  albedo *= 0.94 + 0.12 * (fine.x + 0.5);
  albedo *= mix(0.72, 1.0, ao);
  albedo *= 1.0 - 0.75 * pit;

  float ndl = dot(N, L);
  float key = smoothstep(-0.05, 1.0, ndl) * shadow;
  vec3 light = vec3(1.0, 0.985, 0.96) * 1.55 * key * mix(0.45, 1.0, ao);
  light += vec3(0.075, 0.08, 0.09) * ao * (0.6 + 0.4 * N.y);
  vec3 rimDir = normalize(vec3(0.6, 0.35, -0.7));
  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * smoothstep(-0.2, 0.7, dot(N, rimDir));
  light += vec3(0.62, 0.74, 1.0) * rim * uRim * ao;

  vec3 col = albedo * light;
  // A dry, broad glint where a facet faces the light: stone, not plastic.
  vec3 Hh = normalize(L + V);
  col += vec3(0.05) * pow(max(dot(N, Hh), 0.0), 18.0) * key;

  // Filmic curve: highlights roll off instead of clipping, blacks stay deep.
  col *= uExposure;
  col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  col *= uReveal;
  col += (hash3(vec3(gl_FragCoord.xy, 1.0)).x - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

export function createStone() {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uRot: { value: new THREE.Matrix3() },
      uKeyDir: { value: new THREE.Vector3(-0.38, 0.62, 0.68).normalize() },
      uTint: { value: new THREE.Color(0.86, 0.85, 0.82) },
      uFlat: { value: 0.85 },
      uMicro: { value: 0.3 },
      uMicroScale: { value: 38 },
      uPits: { value: 0.5 },
      uAo: { value: 1 },
      uRim: { value: 0.35 },
      uExposure: { value: 1.15 },
      uReveal: { value: 0 },
      uShadow: { value: 1 },
      uMix: { value: 1 },
      uShowL: { value: 1 },
      uShowR: { value: 1 },
    },
  });
}

// Particles: dust held to the shell of the form as if by a magnet. Every vertex
// is a grain. Nearly all of them sit right on the surface; a thin haze reaches
// further out and thins to nothing (uSpread). They read as measured data, not
// as magic: every grain the same size, hard-edged, holding its place and only
// trembling with a small random jitter that updates 12 times a second, like
// noise in a reading. Nothing hides the far side, so the form reads as a cloud.
// The pointer is a magnet: half the grains are drawn toward it and half are
// pushed away, more strongly the closer it passes (uRayDir is the line from
// the eye through the pointer, uMagnet its strength, uReach how far it acts). It fades in and out with the mode change.
export function createPoints() {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    transparent: true,
    vertexShader: /* glsl */ `
      uniform float uTime, uSpread, uPx, uDensity, uReveal, uMagnet, uReach, uScatter;
      uniform vec3 uRayDir;
      varying float vTone;
      vec3 hash3(vec3 p) {
        p = fract(p * vec3(0.1031, 0.1030, 0.0973));
        p += dot(p, p.yxz + 33.33);
        return fract((p.xxy + p.yxx) * p.zyx);
      }
      void main() {
        vec3 a = hash3(position * 91.7), b = hash3(position * 37.3 + 5.0);
        float away = pow(a.x, 16.0);
        vec3 dir = normalize(normal + (b - 0.5) * 1.8);
        vec3 jitter = hash3(position * 53.1 + floor(uTime * 12.0) * 0.731) - 0.5;
        vec3 p = position + dir * away * uSpread * 0.6 + jitter * (0.006 + 0.05 * away);
        // uScatter throws every grain off the shell, each to its own distance;
        // bringing it back to 0 is dust settling into the shape of the piece
        p += dir * uScatter * (0.25 + 1.5 * a.y * a.y);
        vec4 world = modelMatrix * vec4(p, 1.0);
        // the magnet: how far this grain is from the line of the pointer, and
        // which way is straight away from it
        vec3 rel = world.xyz - cameraPosition;
        vec3 off = rel - uRayDir * dot(rel, uRayDir);
        float gap = length(off);
        float pull = exp(-(gap * gap) / (uReach * uReach)) * uMagnet;
        vec3 out_ = off / max(gap, 1e-4);
        world.xyz += a.z > 0.5
          ? out_ * pull * uReach * 0.55                         // pushed away
          : -out_ * min(gap * 0.85, pull * uReach * 0.7);       // drawn in
        vec4 mv = viewMatrix * world;
        gl_Position = projectionMatrix * mv;
        // So the form can be read: grains gather where the surface turns away
        // from the eye (its outline and its folds) and thin out on the parts
        // that face it.
        float edge = 1.0 - abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
        edge *= edge;
        if (b.z > uDensity * mix(0.3, 3.2, edge)) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        gl_PointSize = uPx;
        // Grains far from the shell are fainter, so the haze fades out.
        vTone = (0.2 + 0.12 * b.x) * mix(0.7, 1.5, edge) * (1.0 - 0.8 * smoothstep(0.0, 0.5, away)) * uReveal;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${WIPE}
      varying float vTone;
      void main() {
        float show = wipeShow();
        if (show <= 0.0) discard;
        vec2 d = gl_PointCoord - 0.5;
        float r = dot(d, d);
        if (r > 0.25) discard;
        gl_FragColor = vec4(vec3(1.0), vTone * show);
      }`,
    uniforms: {
      uTime: { value: 0 },
      uSpread: { value: 0.9 },
      uPx: { value: 1.3 },
      uDensity: { value: 0.2 },
      uMagnet: { value: 0 },
      uScatter: { value: 0 },
      uReach: { value: 1 },
      uRayDir: { value: new THREE.Vector3(0, 0, -1) },
      uMix: { value: 1 },
      uShowL: { value: 1 },
      uShowR: { value: 1 },
      uReveal: { value: 0 },
    },
  });
}

// The skeleton lines of the wireframe view: a soft, see-through white, fading
// in and out with the mode change.
export function createLines() {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    transparent: true,
    vertexShader: /* glsl */ `
      void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${WIPE}
      uniform float uWhite;
      void main() {
        float show = wipeShow();
        if (show <= 0.0) discard;
        gl_FragColor = vec4(vec3(uWhite), show);
      }`,
    uniforms: {
      uMix: { value: 1 },
      uShowL: { value: 1 },
      uShowR: { value: 1 },
      uWhite: { value: 0.5 },
    },
  });
}

// Stroke: a thin, even, grey-white contour of the piece's own edges — its
// silhouette and the creases of its form, not just the outer outline. Unlike
// the wireframe it does depth-test, so a companion depth-only pass of the solid
// mesh (written just behind, by polygon offset) hides every line on the far
// side: the fill stays empty but the back never shows through.
// Stroke: the piece drawn as a line drawing. Every edge of the mesh carries
// how sharp a crease it is (aAngle, degrees; the silhouette's own edges count
// as 180), how long it is, and the total length of the chain of creases it
// belongs to (aChain). The three thresholds are plain uniforms, so the drawing
// can be tuned live, line by line, with no geometry rebuilt: uMinAngle keeps
// only the creases sharp enough to read, uMinChain drops the specks (short,
// lonely chains), uMinLen drops single tiny edges. Lines are one pixel wide.
export function createStroke() {
  return new THREE.ShaderMaterial({
    depthTest: true,
    depthWrite: false,
    transparent: true,
    vertexShader: /* glsl */ `
      attribute float aAngle, aLen, aChain;
      uniform float uMinAngle, uMinLen, uMinChain;
      void main() {
        if (aAngle < uMinAngle || uMinAngle >= 180.0 || aLen < uMinLen || aChain < uMinChain) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${WIPE}
      uniform float uWhite, uAlpha;
      void main() {
        float show = wipeShow();
        if (show <= 0.0) discard;
        gl_FragColor = vec4(vec3(uWhite), show * uAlpha);
      }`,
    uniforms: {
      uMix: { value: 1 },
      uShowL: { value: 1 },
      uShowR: { value: 1 },
      uWhite: { value: 0.72 },
      uAlpha: { value: 1 },
      uMinAngle: { value: 24 },
      uMinLen: { value: 0 },
      uMinChain: { value: 0.2 },
    },
  });
}

// The outline of the Stroke view: the piece drawn again, inside out, every
// vertex pushed outward on screen by uPx pixels, so a band of even width shows
// around the silhouette once the black fill is drawn over the front. Even in
// pixels whatever the piece's size or distance.
export function createHull() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthTest: true,
    depthWrite: true,
    transparent: true,
    vertexShader: /* glsl */ `
      uniform float uPx;
      uniform vec2 uResolution;
      void main() {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize((projectionMatrix * modelViewMatrix * vec4(normal, 0.0)).xyz);
        vec2 dir = normalize(n.xy + vec2(1e-6, 0.0));
        clip.xy += dir * uPx * 2.0 / uResolution * clip.w;
        gl_Position = clip;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${WIPE}
      uniform float uWhite, uAlpha;
      void main() {
        float show = wipeShow();
        if (show <= 0.0) discard;
        gl_FragColor = vec4(vec3(uWhite), show * uAlpha);
      }`,
    uniforms: {
      uMix: { value: 1 },
      uShowL: { value: 1 },
      uShowR: { value: 1 },
      uWhite: { value: 0.72 },
      uAlpha: { value: 1 },
      uPx: { value: 1.5 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
  });
}

// The black fill of the Stroke view, and the drawing's long lines. The front of
// the piece is painted the colour of the page (hiding the far side's lines and
// the inside of the outline), and over it run contour lines: the places where
// the surface turns a set amount away from the eye. Those are level lines of
// one smooth quantity, so they are long and connected by nature, follow the
// form like a topographic map, and never break into specks. uLevels is how
// many of them there are; uFacet lets the chiselled facets bend them a little.
// Where the form turns away from a fixed light, hatching fills the shade, and
// it follows the form: the lines run down the surface the way the normal tilts
// (meridians, uGap of them around the form), crossed where it is darkest by
// finer contour lines. uHatch is how dark the shade gets.
// Width is held to uLinePx pixels whatever the size of the piece.
export function createFill() {
  return new THREE.ShaderMaterial({
    depthTest: true,
    depthWrite: true,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    vertexShader: /* glsl */ `
      attribute vec3 aSmooth;
      varying vec3 vObj, vNormal, vWorld;
      void main() {
        vObj = position; vNormal = aSmooth;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      ${WIPE}
      uniform mat3 uRot;
      uniform float uAlpha, uWhite, uLevels, uFacet, uLinePx, uHatch, uGap;
      varying vec3 vObj, vNormal, vWorld;
      void main() {
        float show = wipeShow();
        if (show <= 0.0) discard;
        vec3 smoothN = normalize(vNormal);
        vec3 flatN = normalize(cross(dFdx(vObj), dFdy(vObj)));
        if (dot(flatN, smoothN) < 0.0) flatN = -flatN;
        vec3 N = normalize(uRot * normalize(mix(smoothN, flatN, uFacet)));
        vec3 V = normalize(cameraPosition - vWorld);
        // how far the surface has turned from facing the eye: 0 facing, 1 edge-on
        float f = 1.0 - max(dot(N, V), 0.0);
        float line = 0.0;
        if (uLevels > 0.5) {
          float t = f * uLevels;                       // levels at every 1/uLevels
          float d = abs(fract(t) - 0.5);               // distance to the nearest level, in level units
          float w = fwidth(t) * uLinePx;               // one line = uLinePx pixels
          line = smoothstep(w, 0.0, 0.5 - d);
          // the very first level (f near 0, the part facing the eye) is skipped
          if (t < 0.5) line = 0.0;
        }
        if (uHatch > 0.001) {
          vec3 L = normalize(vec3(-0.45, 0.8, 0.4));
          float dark = smoothstep(0.35, 0.95, 1.0 - dot(N, L)) * uHatch;
          // meridians: lines of equal tilt direction, running from the facing
          // point out to the silhouette
          vec3 Nv = (viewMatrix * vec4(N, 0.0)).xyz;
          float ang = atan(Nv.y, Nv.x) / 6.2831853;
          float s = ang * uGap;
          float hd = abs(fract(s) - 0.5);
          float hw = fwidth(s) * uLinePx * 0.8;
          float hatch = smoothstep(hw, 0.0, 0.5 - hd) * smoothstep(0.03, 0.15, f);
          // crossing them where it is darkest: contour lines at twice the density
          float t2 = f * max(uLevels, 1.0) * 2.0 + 0.5;
          float d2 = abs(fract(t2) - 0.5);
          float w2 = fwidth(t2) * uLinePx * 0.8;
          float hatch2 = smoothstep(w2, 0.0, 0.5 - d2) * smoothstep(0.6, 1.0, dark);
          line = max(line, max(hatch * smoothstep(0.0, 0.5, dark), hatch2));
        }
        gl_FragColor = vec4(vec3(uWhite * line), show * max(uAlpha, line));
      }`,
    uniforms: {
      uMix: { value: 1 },
      uShowL: { value: 1 },
      uShowR: { value: 1 },
      uAlpha: { value: 1 },
      uWhite: { value: 0.72 },
      uLevels: { value: 4 },
      uFacet: { value: 0.15 },
      uLinePx: { value: 1.2 },
      uHatch: { value: 0 },
      uGap: { value: 24 },
      uRot: { value: new THREE.Matrix3() },
    },
  });
}
