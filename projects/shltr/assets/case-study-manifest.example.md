# SHLTR case study — manifest (example)

Use this as a checklist: file names should match what you place in this folder. Paths in `index-v1.html` are relative to the site root (e.g. `projects/SHLTR/...`).

## Layout (overlay panel)

- **Width:** max `1200px`, centered; on narrow viewports `min(1200px, 100vw - 48px)`.
- **Height:** from `navbar height + 120px` to the bottom of the viewport (fills remaining space).

## Section order (scroll)

1. **About the Project** — copy from `PROJECTS[0].description` (not files).
2. **Four frames (2×2)** — GLB previews + long tooltips: `Anthem 3D.glb` … `Fracture 3D.glb` (`qrModels` + `qrTooltips`).
3. **Concrete barriers** — copy from `SHLTR_CASE_SECTIONS.concrete`.
4. **Inner strip (4 phones)** — raster previews: `Qr1.png` … `Qr4.png` (`qrStripImages`). If you omit `qrStripImages`, the same GLBs as the grid are used.
5. **Typography** — copy from `SHLTR_CASE_SECTIONS.typography`.
6. **Composite image** — `pictue of all 4.jpg` (`pictureAllFour`) — note the spelling matches the asset name.
7. **Public space** — copy from `SHLTR_CASE_SECTIONS.publicSpace`.
8. **Exhibition** — three images: `Gravity 1.png` … `Gravity 3.png` (`exhibition`).
9. **Sketch block** — `Sketch.png` with tag (`innerTag` / default `Sketch`).
10. **Closing row** — `Video of project.mp4` + `Logo evolution.jpeg` (`heroVideo` / `heroSide`).

## Work card (home)

- **Turntable GLB on the ring card:** `Fracture 3D.glb` (`turntableModel`).

## Open questions (confirm or edit in code)

1. **Inner strip tags:** Figma sometimes shows short labels (e.g. single letter). Do you want **full names** (`Anthem`, `Passage`, …) or **abbreviations** on `/` tags above `Qr1–4`?
2. **Composite asset:** Is the file definitely `pictue of all 4.jpg` (typo), or did you rename it to e.g. `picture of all 4.jpg`? Update `pictureAllFour` if the name differs.
3. **Video:** Should `Video of project.mp4` use a **poster** image for first paint, or is autoplay-only fine?
4. **Logo evolution:** Extension `.jpeg` vs `.jpg` — confirm the exact filename on disk.
5. **Sketch block:** Is the tag text **Sketch** (as in Figma) or **Installation** (older version)?
