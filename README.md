# Portfolio — V3

A templated, data-driven version of the portfolio. Projects are defined as
**ordered lists of blocks**; the renderer walks the list and emits HTML.

Adding or editing a project never requires touching `index.html` — only the
project's own `project.js` and its `assets/` folder.

---

## Folder map

```
V3/
├── index.html                 ← Main page (shell, styles, cursor, overlay, all JS)
├── blocks.js                  ← renderBlock() — turns a block object into HTML
├── README.md                  ← (this file)
│
├── hero/
│   └── hero-config.js         ← Which project's 3D model appears in the hero ring-card
│
└── projects/
    ├── index.js               ← Load order for all projects
    │
    ├── shltr/                 ← Each project lives in its own folder
    │   ├── project.js         ← Data: title, tags, blocks
    │   └── assets/            ← GLBs, videos, images for this project
    │
    ├── radiant/
    │   ├── project.js
    │   └── assets/
    │
    └── …17 more
```

---

## Adding a new project

1. Create `projects/<slug>/project.js` — copy any existing project as a starting point.
2. Drop your assets into `projects/<slug>/assets/`.
3. Add `<slug>` to `projects/index.js` in the order you want it to appear in the grid.
4. Done. Reload the page.

---

## Block types (the shared design language)

Every case-study page is a **list of blocks** with order you choose. Each block
type has a fixed visual template — so the design stays uniform across projects.

| Type                    | What it renders                                              | Shape |
|-------------------------|--------------------------------------------------------------|-------|
| `title`                 | Large Serif 88px project title (uses `project.title`)        | `{ type: 'title' }` |
| `twoCol`                | "/ Heading" + two text columns                               | `{ type: 'twoCol', heading, cols: [a, b] }` |
| `grid4-3d`              | 4 interactive 3D tiles (460×320) with labels + tooltips      | `{ type: 'grid4-3d', tiles: [{glb, label, tooltip}] }` |
| `grid4-phones`          | 4 vertical phone frames (1–4) with inner 3D models           | `{ type: 'grid4-phones', items: [{glb}] }` |
| `grid4-videos-ppong`    | 4 videos (225×400). Static by default; hover = Action cursor + ping-pong | `{ type: 'grid4-videos-ppong', videos: [src] }` |
| `composite-image`       | Large composite image (960×540)                              | `{ type: 'composite-image', src }` |
| `sketch-logo`           | Sketch (502×525) + logo evolution (217×330) side-by-side     | `{ type: 'sketch-logo', sketch, logoEvo, sketchLabel }` |
| `outro-video`           | Closing video with Fullscreen + Mute controls                | `{ type: 'outro-video', src }` |
| `back-to-top`           | "Back to Top" button with smooth scroll                      | `{ type: 'back-to-top' }` |
| `custom`                | **Meta-block** — free-form HTML for anything that doesn't fit yet | `{ type: 'custom', html }` |

When a "custom" pattern starts repeating, promote it to its own block type.

---

## Global design rules (locked for V3 — change here = change everywhere)

- **Fonts**: Instrument Serif (hero / 88px headings), Nimbus Sans (all else)
- **Palette**: `#F8F6F3` bg · `#FBFAF9` surface · `#A3A09B` muted · `#26251E` ink
- **Accent gradient**: cyan `#60FBFF` → yellow `#F8FF7B` → pink `#FF6EFD`
- **Navbar**: 60px fixed, 3 links, logo left
- **Overlay panel**: 1320×600, 60px below navbar
- **Overlay actions**: Exit + Share, 32×88 stack, right:10 top:10
- **Footer gradient**: 91px, name left + tags right
- **Cursor states**: idle / canPress / tooltip / action (shared `data-cursor-*` attributes)
- **Share modal + Video fullscreen modal**: identical across all projects

---

## Hero ring-card

The hero shows ONE project's 3D model as a floating card. To change which
project is featured, edit `hero/hero-config.js` — it's a pointer to a project
slug + which asset in that project to show. No files move.
