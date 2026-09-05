# Depth Reveal — effect specification for a plugin port

This document is a complete, self-contained description of one image/video
effect, at one specific set of values. Everything needed to reimplement it is
here: the algorithm, a ready-to-paste fragment shader, the host-side clock
maths, and the exact parameter values. You do not need the original tool.

The effect was authored in Depth Reveal Studio (yamliv.net/jerry-dg). This is
the handoff for putting it into a different interface as a plugin.

---

## 1. What the effect does

An image or a video goes from **completely invisible to completely visible**,
and the *order* in which pixels arrive is decided by a black-and-white mask
built from the media's own luminance. It runs in two stages that share one
look but have separate clocks:

**Stage 1 — the intro. Plays once.**
Pixels turn on, dark areas of the picture first, light areas last. As each
pixel arrives it is not the photograph yet — it is a **colour from a gradient
ramp**, chosen by that pixel's place in the mask. Half a beat later the real
media replaces the colour, arriving in the same order. A soft coloured line
rides just ahead of the reveal front, leading the picture in.

**Stage 2 — the loop. Repeats forever after the intro.**
That same line makes the same pass again, at the same speed, on the same
easing curve, in the same direction — now as a translucent light pass over the
settled image. It is a loading animation: the intro is the load, the loop is
the wait.

**Nothing in this effect displaces or distorts the media.** Blur, feather and
turbulence act on the *mask* only. The photograph is always sampled at its own
coordinates. This is a hard rule of the effect, not a detail.

### At these particular values, the look is:

A wide, soft **pink band opening outward in a circle** from just below the
centre of the frame, again and again with no pause between passes. Behind it
the picture emerges as a **sky-blue → cream → amber gradient** that slides
through the mask while the intro plays, and resolves into the real footage
from the halfway point with a very wide, very soft hand-off — so the media
does not "cut in", it bleeds in across most of the second half.

---

## 2. Parameters, with the values to ship

All parameters are plain floats unless noted. The values in the last column are
the ones this preset is defined by.

### The mask — decides the ORDER pixels arrive in

| name | meaning | value |
|---|---|---|
| `invert` | 0/1. Flips the mask, so light arrives before dark | `0` |
| `contrast` | Multiplier around 0.5 on the luminance map | `1.2` |
| `bias` | Added to the map after contrast. Negative darkens | `-0.05` |
| `maskBlur` | Blur radius **in points/CSS pixels**, on the mask only | `5` |
| `mapMix` | 0 = a plain line sweeps across; 1 = the line follows luminance exactly | `0.45` |

### The line — the geometry of the moving edge

| name | meaning | value |
|---|---|---|
| `bandShape` | 0 = linear, 1 = radial | `1` (radial) |
| `angle` | Degrees, linear only. 0 = bottom to top | `0` (unused here) |
| `centreX`, `centreY` | Radial origin, 0…1 in frame space, y down | `0.5`, `0.55` |
| `reverse` | 0/1. Flips the travel direction | `0` |
| `feather` | Softness of the alpha edge, in field units | `0.2` |
| `turbAmount` | Noise added to the threshold — wobbles the LINE. **Never displaces the media** | `0.06` |
| `turbScale` | Noise frequency across the frame | `2.6` |
| `turbDetail` | Octaves, 1…6, fractional allowed | `3` |
| `turbEvolve` | How fast the noise crawls, per second of wall time | `0.3` |

### The colour — what shows before the media arrives

| name | meaning | value |
|---|---|---|
| `gradOffset` | Static shift of the ramp lookup | `0` |
| `gradScale` | Stretch of the ramp across the mask | `1` |
| `gradDrift` | The ramp slides through the mask across the intro. **Animated by stage-1 progress** | `0.25` |
| `cyclic` | 0/1. Lets the ramp wrap last→first so the drift has no seam | `1` |
| `steps` | 0 = smooth; ≥2 = posterised into that many bands | `0` |
| `palette` | Stops as flat `r,g,b,position` quads, sorted by position | see below |

```
palette = [
  0.4980, 0.6980, 0.8902, 0.00,   // #7FB2E3  sky
  0.7843, 0.8667, 0.9412, 0.30,   // #C8DDF0  pale blue
  0.9608, 0.9373, 0.8471, 0.55,   // #F5EFD8  cream
  0.9608, 0.7647, 0.2314, 0.80,   // #F5C33B  yellow
  0.9490, 0.6039, 0.1333, 1.00    // #F29A22  amber
]
```

### Stage 1 — the intro

| name | meaning | value |
|---|---|---|
| `duration` | Length of the intro | `2400 ms` |
| `easing` | Speed graph. Here it is exactly `cubic-bezier(0.5, 0, 0.5, 1)` — a symmetric ease-in-out | see §5 |
| `hold` | Share of the intro that passes before the media starts replacing the colour | `0.5` |
| `handoffFeather` | Softness of the colour→media transition. Very wide here | `0.685` |

### Stage 2 — the loop

| name | meaning | value |
|---|---|---|
| `loopEnabled` | 0/1 | `1` |
| `lineInIntro` | 0/1. Draws the same line leading the intro's reveal front | `1` |
| `gap` | Wait between passes. **0 here — the passes are continuous** | `0 ms` |
| `lineWidth` | Half-width of the band, in field units. Wide here | `0.255` |
| `lineOpacity` | | `0.72` |
| `lineColour` | `#feb8ff` → | `(0.9961, 0.7216, 1.0)` |

The loop has **no duration of its own**: it travels at the intro's `duration`
on the intro's `easing`. That is deliberate — it is the same pass repeated, not
a second animation.

### Measured, not authored

| name | meaning | value |
|---|---|---|
| `fillTimeline` | 0/1. Stretch the mask onto its measured range | `1` |
| `fieldLo`, `fieldHi` | The measured range. **Depends on the media** — see §6 | measure at load |

---

## 3. The algorithm, step by step

Everything runs per pixel in one pass. `uv` is 0…1 across the frame, **y down**.

1. **Sample coordinates.** `suv = clamp((uv - 0.5) * cover + 0.5, 0, 1)`, where
   `cover` is the aspect-fill correction (see §7). The media is sampled here
   and nowhere else.

2. **Build the mask.** Luminance (Rec.709: `0.2126, 0.7152, 0.0722`) of the
   media at `suv`, blurred by `maskBlur`, then `d = clamp((d - 0.5) * contrast
   + 0.5 + bias, 0, 1)`, then optionally inverted.

   The blur must be a **disc, not a cross.** Nine taps on the axes and
   diagonals leave their own shape in the result and read as a texture laid
   over the picture. Use sixteen taps spiralled by the golden angle (137.5°,
   i.e. 2.3999632 rad) with radii spaced by `sqrt(i/16)` so they cover the disc
   evenly. The code in §4 is the reference.

3. **Build the line.** A 0…1 ramp across the frame.
   - Linear: project onto `(sin θ, −cos θ)` and normalise so the ramp spans
     exactly 0…1 across the frame's diagonal extent for that angle.
   - Radial (this preset): distance from `(centreX, centreY)` with the x axis
     scaled by the aspect ratio so the ring is round, divided by the distance
     to the furthest corner.

4. **Combine into the threshold field.**
   `field = clamp(mix(line, mask, mapMix) + (fbm(uv * turbScale) − 0.5) * turbAmount, 0, 1)`

   Then **stretch it onto its measured range**:
   `field = clamp((field − fieldLo) / (fieldHi − fieldLo), 0, 1)`.
   Without this the animation is dead at both ends — see §6.

   `field` is the whole effect in one number: it is *when* each pixel's turn
   comes, from 0 (first) to 1 (last).

5. **Stage 1 alpha.** With `p` = eased intro progress:
   ```
   f1    = max(feather, 0.002)
   front = mix(-f1, 1 + f1, p)          // travels past both ends
   a     = smoothstep(field - f1, field + f1, front)
   ```

6. **Stage 1 hand-off.** The same pass again, delayed and wider:
   ```
   f2     = max(handoffFeather, 0.002)
   p2     = clamp((p - hold) / (1 - hold), 0, 1)
   front2 = mix(-f2, 1 + f2, p2)
   rm     = smoothstep(field - f2, field + f2, front2)   // 0 = colour, 1 = media
   ```

7. **Gradient map.** `gpos = mask * gradScale + gradOffset + gradDrift * p`,
   optionally posterised, then wrapped (`fract`) if `cyclic` else clamped, then
   looked up in the stop list with linear interpolation between neighbouring
   stops. When cyclic, the span from the last stop back to the first wraps
   through `1 → 0` so there is no seam as the drift slides.

8. **Composite.** `col = mix(gradientColour, mediaColour, rm)` and
   `alpha = a * mediaAlpha`.

9. **Stage 2, the line.** Two possible sources, take the max:
   - during the intro, centred at `front + halfW * 0.6` — slightly *ahead* of
     the reveal front, so it leads the picture in rather than sitting on it;
   - the loop, centred at `mix(-halfW, 1 + halfW, loopPhase)`.

   ```
   sw    = (1 - smoothstep(0, halfW, abs(field - centre))) * lineOpacity
   col   = mix(col, lineColour, sw)
   alpha = clamp(max(alpha, sw), 0, 1)
   ```
   The line raises alpha as well as tinting, which is what lets it be visible
   ahead of the reveal, over nothing.

10. **Output premultiplied:** `vec4(col * alpha, alpha)`.

---

## 4. Reference fragment shader (GLSL ES 3.00)

Complete and standalone — a plain `sampler2D`, no macros. Port straight across
to Metal (`vec2→float2` etc.) or HLSL; the maths is the specification.

```glsl
#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;

uniform sampler2D uTex;
uniform vec2  uSize;        // framebuffer size in pixels
uniform vec2  uCover;       // aspect-fill correction, (1,1) if the media already fills
uniform float uIntro;       // STAGE 1, eased 0..1
uniform float uLoopPhase;   // STAGE 2, 0..1, repeating
uniform float uTime;        // seconds; drives turbulence evolution only

uniform float uInvert, uContrast, uBias, uSoft, uMapMix;
uniform float uBandShape, uAngle, uBandCX, uBandCY, uBandFlip;
uniform float uFieldLo, uFieldHi;
uniform float uFeather, uHold, uRealFeather;
uniform float uTurbAmt, uTurbScale, uTurbDetail, uTurbEvolve;
uniform float uSteps, uCyclic, uGradOffset, uGradScale, uGradDrift;
uniform float uSweepW, uSweepOp, uSweepIntro, uLoopOn;
uniform vec3  uSweepCol;

uniform float uPal[32];     // r,g,b,position per stop
uniform int   uPalN;        // number of FLOATS in uPal (stops * 4)

#define SAMPLE(u) texture(uTex, clamp((u), 0.0, 1.0))
#define LUMA(u)   dot(SAMPLE(u).rgb, vec3(0.2126, 0.7152, 0.0722))
#define PALC(i)   vec3(uPal[(i) * 4], uPal[(i) * 4 + 1], uPal[(i) * 4 + 2])
#define PALP(i)   uPal[(i) * 4 + 3]
#define PALN      (uPalN / 4)

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p, float oct, float t){
  float amp = 0.5, sum = 0.0, tot = 0.0;
  for (int i = 0; i < 6; i++){
    float w = clamp(oct - float(i), 0.0, 1.0);
    if (w <= 0.0) break;
    sum += vnoise(p + t) * amp * w;
    tot += amp * w;
    p *= 2.03;
    amp *= 0.5;
  }
  return tot > 0.0 ? sum / tot : 0.5;
}

void main(){
  vec2 uv  = vec2(gl_FragCoord.x / uSize.x, 1.0 - gl_FragCoord.y / uSize.y);
  vec2 suv = clamp((uv - 0.5) * uCover + 0.5, 0.0, 1.0);

  // ---- 1. mask ---------------------------------------------------------
  float d;
  if (uSoft > 0.01) {
    vec2 r = uSoft / uSize;
    d = LUMA(suv);
    float wsum = 1.0;
    for (int i = 0; i < 16; i++){
      float fi  = float(i) + 0.5;
      float ang = fi * 2.3999632;        // golden angle
      float rad = sqrt(fi / 16.0);
      float wt  = 1.0 - rad * 0.55;
      d += LUMA(suv + vec2(cos(ang), sin(ang)) * rad * r) * wt;
      wsum += wt;
    }
    d /= wsum;
  } else {
    d = LUMA(suv);
  }
  d = clamp((d - 0.5) * uContrast + 0.5 + uBias, 0.0, 1.0);
  d = mix(d, 1.0 - d, uInvert);

  // ---- 2. the line -----------------------------------------------------
  float band;
  if (uBandShape > 0.5) {
    float ar = uSize.x / uSize.y;
    vec2 pc = vec2((uv.x - uBandCX) * ar, uv.y - uBandCY);
    float maxR = length(vec2(max(uBandCX, 1.0 - uBandCX) * ar,
                             max(uBandCY, 1.0 - uBandCY)));
    band = clamp(length(pc) / max(0.0001, maxR), 0.0, 1.0);
  } else {
    float ca = cos(uAngle), sa = sin(uAngle);
    vec2 dir = vec2(sa, -ca);
    band = dot(uv - 0.5, dir) / max(0.0001, abs(sa) + abs(ca)) + 0.5;
  }
  band = mix(band, 1.0 - band, uBandFlip);

  // ---- 3. field --------------------------------------------------------
  float nz = fbm(uv * uTurbScale, uTurbDetail, uTurbEvolve * uTime) - 0.5;
  float field = clamp(mix(band, d, uMapMix) + nz * uTurbAmt, 0.0, 1.0);
  field = clamp((field - uFieldLo) / max(0.0001, uFieldHi - uFieldLo), 0.0, 1.0);

  // ---- 4. stage 1 alpha ------------------------------------------------
  float f1 = max(uFeather, 0.002);
  float front = mix(-f1, 1.0 + f1, uIntro);
  float a = smoothstep(field - f1, field + f1, front);

  // ---- 5. stage 1 hand-off ---------------------------------------------
  float f2 = max(uRealFeather, 0.002);
  float p2 = clamp((uIntro - uHold) / max(0.0001, 1.0 - uHold), 0.0, 1.0);
  float front2 = mix(-f2, 1.0 + f2, p2);
  float rm = smoothstep(field - f2, field + f2, front2);

  // ---- 6. gradient map -------------------------------------------------
  float gpos = d * uGradScale + uGradOffset + uGradDrift * uIntro;
  if (uSteps >= 2.0) gpos = floor(gpos * uSteps) / max(1.0, uSteps - 1.0);
  float gx = (uCyclic > 0.5) ? fract(gpos) : clamp(gpos, 0.0, 1.0);
  int gn = PALN;
  vec3 gcol = PALC(0);
  float wrapSpan = 1.0 - PALP(gn - 1) + PALP(0);
  if (gx <= PALP(0)) {
    gcol = (uCyclic > 0.5 && wrapSpan > 0.0001)
         ? mix(PALC(gn - 1), PALC(0), (gx + 1.0 - PALP(gn - 1)) / wrapSpan)
         : PALC(0);
  } else if (gx >= PALP(gn - 1)) {
    gcol = (uCyclic > 0.5 && wrapSpan > 0.0001)
         ? mix(PALC(gn - 1), PALC(0), (gx - PALP(gn - 1)) / wrapSpan)
         : PALC(gn - 1);
  } else {
    for (int i = 0; i < 7; i++){
      if (i + 1 >= gn) break;
      float s0 = PALP(i), s1 = PALP(i + 1);
      if (gx >= s0 && gx <= s1){
        gcol = mix(PALC(i), PALC(i + 1), s1 > s0 ? (gx - s0) / (s1 - s0) : 0.0);
        break;
      }
    }
  }

  // ---- 7. composite ----------------------------------------------------
  vec4 src = SAMPLE(suv);
  vec3 col = mix(gcol, src.rgb, rm);
  float alpha = a * src.a;

  // ---- 8. stage 2, the line -------------------------------------------
  float sw = 0.0;
  float halfW = max(uSweepW, 0.002);
  if (uSweepIntro > 0.5)
    sw = max(sw, 1.0 - smoothstep(0.0, halfW, abs(field - (front + halfW * 0.6))));
  if (uLoopOn > 0.5) {
    float lfront = mix(-halfW, 1.0 + halfW, uLoopPhase);
    sw = max(sw, 1.0 - smoothstep(0.0, halfW, abs(field - lfront)));
  }
  sw *= uSweepOp;
  col = mix(col, uSweepCol, sw);
  alpha = clamp(max(alpha, sw), 0.0, 1.0);

  fragColor = vec4(col * alpha, alpha);   // premultiplied
}
```

### Uniform values for this preset

```
uInvert     0.0        uBandShape   1.0        uFeather      0.2
uContrast   1.2        uAngle       0.0        uHold         0.5
uBias      -0.05       uBandCX      0.5        uRealFeather  0.685
uSoft       5.0 * dpr  uBandCY      0.55       uTurbAmt      0.06
uMapMix     0.45       uBandFlip    0.0        uTurbScale    2.6
                                               uTurbDetail   3.0
uSteps      0.0        uSweepW      0.255      uTurbEvolve   0.3
uCyclic     1.0        uSweepOp     0.72
uGradOffset 0.0        uSweepIntro  1.0        uGradScale    1.0
uGradDrift  0.25       uLoopOn      1.0        uSweepCol     (0.9961, 0.7216, 1.0)
```

`uSoft` is authored in points. Multiply by the device pixel ratio before
sending it, so the blur is the same fraction of the frame at every scale.

---

## 5. The easing curve

The speed graph for this preset is a single cubic Bézier segment from (0,0) to
(1,1) with control points at **(0.5, 0)** and **(0.5, 1)** — that is exactly
CSS `cubic-bezier(0.5, 0, 0.5, 1)`, a symmetric ease-in-out. If the host has a
Bézier easing type, use it directly.

Otherwise, solve it the usual way: binary-search `t` so that `X(t) = x`, then
return `Y(t)`.

```js
const bez = (a, b, c, d, t) => {
  const m = 1 - t;
  return m*m*m*a + 3*m*m*t*b + 3*m*t*t*c + t*t*t*d;
};
function ease(x){
  x = Math.min(1, Math.max(0, x));
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 22; i++){
    if (bez(0, 0.5, 0.5, 1, t) < x) lo = t; else hi = t;
    t = (lo + hi) / 2;
  }
  return bez(0, 0, 1, 1, t);
}
```

The same curve drives both stages. There is no separate loop easing.

---

## 6. Host side, per frame

Two clocks off one elapsed time, in seconds since the effect started.

```js
const DURATION = 2.400;   // seconds
const GAP      = 0.0;     // seconds between loop passes

// STAGE 1 — plays once, clamps at 1
const intro = ease(Math.min(1, Math.max(0, elapsed / DURATION)));

// STAGE 2 — the same pass, repeated, on the same duration and easing.
// Parks at 1 (off-canvas) before the intro ends and during the gap.
function loopPhase(sinceIntro){
  if (sinceIntro <= 0) return 1;
  const cycle = DURATION + GAP;
  const inCycle = sinceIntro % cycle;
  return inCycle >= DURATION ? 1 : ease(inCycle / DURATION);
}
const loop = loopPhase(elapsed - DURATION);

// turbulence evolution runs on wall time
const time = elapsed;
```

With `GAP = 0` the loop pass restarts the instant it finishes, so the band is
continuous.

### Measuring `fieldLo` / `fieldHi` — do not skip this

Mixing the line with a photograph's luminance almost never produces a true 0 or
a true 1 anywhere in the frame. Left unstretched, the animation sits dead at
both ends: on the reference clip the first pixel did not appear until 108 ms
into a 2400 ms intro — a third of the timeline wasted.

Measure the real range once when the media loads (and every few hundred ms for
video, since the range moves):

1. Render the shader to a small buffer — 64 × 64 is plenty — outputting
   `field` as greyscale, with `uFieldLo = 0` and `uFieldHi = 1` so you measure
   the **raw** field.
2. Read the buffer back.
3. Sort the values; take the **0.5th and 99.5th percentiles** as `fieldLo` and
   `fieldHi`. Percentiles, not min/max, so one stray pixel cannot flatten the
   whole range.
4. If `fieldHi - fieldLo < 0.04`, fall back to `0` and `1` — the mask is
   effectively flat and stretching it would explode the noise.

Do not try to derive the range from the media's luminance histogram instead.
The field is the line *and* the mask together and their extremes rarely land on
the same pixel; guessing from luminance alone leaves dead time.

### Aspect fill (`uCover`)

If the render target's aspect differs from the media's, crop rather than
stretch:

```js
const ma = mediaW / mediaH, ca = canvasW / canvasH;
const cover = ca > ma ? [1, ma / ca] : [ca / ma, 1];
```

If the host already fits the media to the frame, pass `(1, 1)`.

---

## 7. Integration checklist

The host must provide:

- [ ] A texture or layer holding the media, sampleable at arbitrary UVs.
- [ ] The frame size in pixels, and the device pixel ratio for `uSoft`.
- [ ] Elapsed seconds since the effect started, and a way to restart it.
- [ ] A float array uniform for the palette (or 5 separate `vec4`s if arrays
      are awkward — this preset has exactly 5 stops).
- [ ] Premultiplied-alpha output, or an unpremultiply step if the host wants
      straight alpha.

Notes for specific hosts:

- **If the media arrives premultiplied** (SwiftUI's `SwiftUI::Layer`, most
  compositors), unpremultiply after sampling — `rgb / a` when `a > 0` — before
  computing luminance, or the mask will be wrong wherever the source is
  partially transparent.
- **Video:** upload a fresh frame each render. For frame-accurate offline
  rendering, pause the video and seek per frame — a playing video overtakes
  every seek and the output ends up as a handful of unrelated moments.
- **If the host exports GIF:** GIF alpha is one bit, so a feathered reveal must
  be composited over a real background colour, not left transparent.
- **If the host exports video:** give it a generous bitrate. A soft gradient
  reveal is exactly what a low bitrate destroys — it bands, then smears.
  24 Mbps at 1080 × 1920 is a sane floor.

---

## 8. Things that will look wrong if you get them subtly different

1. **Blurring the media instead of the mask.** `maskBlur` exists so the reveal
   edge does not crumble in fine detail. It must never reach the output image.
   Same for turbulence: it is added to a threshold *number*, not to a sampling
   *position*.
2. **A cross-shaped blur kernel.** It leaves its own shape in the picture and
   reads as a texture. Use the golden-angle disc in §4.
3. **Skipping the field stretch.** See §6. This is the difference between the
   animation starting on frame one and starting a tenth of a second late.
4. **Giving the loop its own duration.** It must reuse the intro's duration and
   easing, or it stops reading as the same pass repeating.
5. **Centring the intro line on the reveal front** instead of slightly ahead of
   it (`+ halfW * 0.6`). On the front it looks like a highlight on what has
   already arrived; ahead of it, it leads.
6. **Straight instead of premultiplied output.** The line raises alpha as well
   as colour, so the two have to travel together.

---

## Appendix — the preset as authored

The source of truth this document was written from. Field names here are the
studio's; the tables above give the meaning of each one.

```json
{
  "resolution": "fit", "showMask": 1,
  "invert": 0, "contrast": 1.2, "bias": -0.05, "soft": 5, "mapMix": 0.45,
  "angle": 0, "bandShape": 1, "bandCX": 0.5, "bandCY": 0.55, "bandFlip": 0,
  "feather": 0.2, "fillTimeline": 1,
  "turbOn": 1, "turbAmt": 0.06, "turbScale": 2.6, "turbDetail": 3, "turbEvolve": 0.3,
  "gradOffset": 0, "gradScale": 1, "gradDrift": 0.25, "cyclic": 1,
  "stepsOn": 0, "steps": 6,
  "stops": [
    { "c": "#7FB2E3", "p": 0 },
    { "c": "#C8DDF0", "p": 0.3 },
    { "c": "#F5EFD8", "p": 0.55 },
    { "c": "#F5C33B", "p": 0.8 },
    { "c": "#F29A22", "p": 1 }
  ],
  "duration": 2400, "hold": 0.5, "realFeather": 0.685,
  "ease": [
    { "x": 0, "y": 0, "ho": { "x": 0.5, "y": 0 } },
    { "x": 1, "y": 1, "hi": { "x": 0.5, "y": 1 } }
  ],
  "loopOn": 1, "sweepIntro": 1, "loopGap": 0,
  "sweepW": 0.255, "sweepOp": 0.72, "sweepCol": "#feb8ff"
}
```

Two fields are studio-only and have no plugin equivalent: `resolution` (the
studio's canvas preset) and `showMask` (its side-by-side mask preview).
`stepsOn` is 0, so `steps: 6` is inert — posterisation is off.
