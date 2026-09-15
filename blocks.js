/* ══════════════════════════════════════════════════════════════
   BLOCK RENDERER
   A single entry point: renderBlock(block, project) → HTML string.
   index.html iterates project.caseStudy.blocks and concatenates
   the result — no per-project HTML lives in index.html.

   To add a new block type:
     1. Add a case in the switch below.
     2. Add matching CSS in index.html (look for "CASE STUDY" block).
     3. Document it in README.md under "Block types".

   Tiny helpers (escapeHtml, attrUrl, etc) are defined globally in
   index.html's main script and reused here via window.*
════════════════════════════════════════════════════════════════ */

(function () {

  /** Strip the first line and all blank-preceding lines from a tooltip body
   *  (the title is shown as a tile tag; the cursor tooltip only needs the body). */
  function tooltipBodyOnly(full) {
    const lines = String(full).split('\n');
    let i = 0;
    while (i < lines.length && lines[i].trim() !== '') i++;
    while (i < lines.length && lines[i].trim() === '') i++;
    return lines.slice(i).join('\n').trim() || String(full);
  }

  // ── Block renderers ─────────────────────────────────────────

  function block_title(b, project) {
    return `<h1 class="overlay-case-title">${window.escapeHtml(project.title || '')}</h1>`;
  }

  function block_twoCol(b) {
    const cols = (b.cols || []).map(c =>
      `<div class="overlay-case-col">${window.escapeHtml(c)}</div>`).join('');
    return `
      <section class="overlay-case-section">
        <h3 class="overlay-case-subhead"><span class="overlay-case-subhead-slash">/</span> ${window.escapeHtml(b.heading || '')}</h3>
        <div class="overlay-case-cols">${cols}</div>
      </section>`;
  }

  /* ────────────────────────────────────────────────────────────
     TWO-COL WITH PER-COLUMN SUBHEADS
     Figma pattern: 960-wide row, two 456-wide columns, each with its
     own subheading + one paragraph (no shared heading above them).
     b: { cols: [{ heading, text }, { heading, text }] }
  ──────────────────────────────────────────────────────────── */
  function block_twoCol_subheads(b) {
    const cols = (b.cols || []).map(c => `
      <div class="overlay-case-subcol">
        <h3 class="overlay-case-subhead"><span class="overlay-case-subhead-slash">/</span> ${window.escapeHtml(c.heading || '')}</h3>
        <div class="overlay-case-col">${window.escapeHtml(c.text || '')}</div>
      </div>`).join('');
    return `
      <section class="overlay-case-section overlay-case-section--subheads">
        <div class="overlay-case-subcols">${cols}</div>
      </section>`;
  }

  /* ────────────────────────────────────────────────────────────
     2×2 VIDEO GRID (autoplay loops, no hover interaction)
     Figma: 960-wide, 2 rows × 2 cols of 460×320 video tiles, 40px gap.
     Used for Globe "Logo changes / Export / Motion buttons / Colors
     and data" snapshots of the vibe-coding process.
     b: { videos: [src, src, src, src] }
  ──────────────────────────────────────────────────────────── */
  function block_grid2x2_videos(b) {
    const vids = (b.videos || []).map(src =>
      `<video class="overlay-case-grid2x2-vid" src="${window.attrUrl(src)}"
              muted playsinline loop autoplay preload="auto"></video>`
    ).join('');
    return `
      <section class="overlay-case-section" aria-label="Process videos">
        <div class="overlay-case-grid2x2">${vids}</div>
      </section>`;
  }

  /* ────────────────────────────────────────────────────────────
     WIDE VIDEO (960×440 full-width autoplay loop, no controls)
     Plain edition of outro-video — no framed styling, no controls.
  ──────────────────────────────────────────────────────────── */
  function block_wide_video(b) {
    if (!b.src) return '';
    const tipAttr = b.tooltip ? ` data-cursor-tooltip="${window.escapeDataAttr(b.tooltip)}"` : '';
    return `
      <section class="overlay-case-section" aria-label="Project video">
        <video class="overlay-case-wide-vid" src="${window.attrUrl(b.src)}"
               muted playsinline loop autoplay preload="auto"${tipAttr}></video>
      </section>`;
  }

  /* ────────────────────────────────────────────────────────────
     TWO-IMAGE ROW (960-wide, two 460×320 tiles side-by-side, 40px gap)
     b: { images: [src, src] }
  ──────────────────────────────────────────────────────────── */
  function block_grid2_images(b) {
    const imgs = (b.images || []).map(src =>
      `<img class="overlay-case-grid2-img" src="${window.attrUrl(src)}" alt="" loading="lazy"/>`
    ).join('');
    return `
      <section class="overlay-case-section" aria-label="Project images">
        <div class="overlay-case-grid2">${imgs}</div>
      </section>`;
  }

  /* ────────────────────────────────────────────────────────────
     GLOBE CODE — scroll-driven sticky iframe that scales from the
     regular 960-block size up to full viewport, then back down as
     the visitor continues scrolling. The embedded HTML (the actual
     vibe-coding experiment) stays interactive at the peak via a
     lightweight "Click to interact" affordance added later.
     b: { src: 'projects/globe/assets/Globe Code.html' }
  ──────────────────────────────────────────────────────────── */
  function block_globe_code(b) {
    if (!b.src) return '';
    return `
      <section class="overlay-case-globe-scroll" aria-label="Globe code experiment">
        <div class="overlay-case-globe-stage">
          <div class="overlay-case-globe-inner">
            <iframe class="overlay-case-globe-frame"
                    src="${window.attrUrl(b.src)}"
                    title="Globe interactive experiment"
                    loading="lazy"></iframe>
          </div>
        </div>
      </section>`;
  }

  function block_grid4_3d(b) {
    const tiles = (b.tiles || []).map(t => {
      const bodyTip = (t.tooltip || '').trim() ? tooltipBodyOnly(t.tooltip) : '';
      const tipAttr = bodyTip ? ` data-cursor-tooltip="${window.escapeDataAttr(bodyTip)}"` : '';
      let media, badge = '';
      if (t.glb) {
        media = `<model-viewer
            class="overlay-case-qr-mv"
            src="${window.attrUrl(t.glb)}"
            camera-controls
            touch-action="pan-y"
            interaction-prompt="none"
            shadow-intensity="0"
            shadow-softness="0"
            exposure="1"
            environment-image="neutral"
            min-field-of-view="5deg"
            max-field-of-view="70deg"
            min-camera-orbit="auto auto 10%"
            max-camera-orbit="auto auto 200%"
            camera-orbit="0deg 78deg 75%"></model-viewer>`;
        badge = `<span class="overlay-case-tile-3d" data-cursor-tooltip="Interactive 3D Object">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="32" height="32" rx="16" fill="#A3A09B" fill-opacity="0.2"/>
              <path d="M9.5 11.9999L16 15.4999M16 15.4999L22.5 11.9999M16 15.4999V22.9999M15.76 8.62985L9.76 11.8599C9.6 11.9499 9.5 12.1099 9.5 12.2999V19.6999C9.5 19.8799 9.6 20.0499 9.76 20.1399L15.76 23.3699C15.91 23.4499 16.09 23.4499 16.23 23.3699L22.23 20.1399C22.39 20.0499 22.49 19.8799 22.49 19.6999V12.2999C22.49 12.1199 22.39 11.9499 22.23 11.8599L16.23 8.62985C16.1579 8.59047 16.0771 8.56982 15.995 8.56982C15.9129 8.56982 15.8321 8.59047 15.76 8.62985Z" stroke="#A3A09B"/>
            </svg>
          </span>`;
      } else if (t.img) {
        media = `<img class="overlay-case-qr-img" src="${window.attrUrl(t.img)}" alt="${window.escapeDataAttr(t.label || '')}" loading="lazy"/>`;
      } else {
        media = `<div class="overlay-case-qr-placeholder" aria-hidden="true"></div>`;
      }
      return `
        <div class="overlay-case-tile"${tipAttr}>
          <div class="overlay-case-tile-tag"><span>/</span> ${window.escapeHtml(t.label || '')}</div>
          ${media}
          ${badge}
        </div>`;
    }).join('');
    return `<section class="overlay-case-grid4" aria-label="Scene frames">${tiles}</section>`;
  }

  function block_grid4_phones(b) {
    const phones = (b.items || []).map((it, i) => {
      const num = it.num || (i + 1);
      let media;
      if (it.img) {
        media = `<img class="overlay-case-inner-phone-img" src="${window.attrUrl(it.img)}" alt="" loading="lazy"/>`;
      } else if (it.glb) {
        media = `<model-viewer
             class="overlay-case-inner-phone-mv"
             src="${window.attrUrl(it.glb)}"
             camera-controls
             touch-action="pan-y"
             interaction-prompt="none"
             shadow-intensity="0"
             shadow-softness="0"
             exposure="1"
             environment-image="neutral"
             min-field-of-view="5deg"
             max-field-of-view="70deg"
             min-camera-orbit="auto auto 10%"
             max-camera-orbit="auto auto 200%"
             camera-orbit="0deg 78deg 75%"></model-viewer>`;
      } else {
        media = `<div class="overlay-case-inner-phone-placeholder" aria-hidden="true"></div>`;
      }
      return `
        <div class="overlay-case-inner-phone">
          <div class="overlay-case-inner-phone-tag"><span class="overlay-case-inner-phone-slash">/</span>${num}</div>
          ${media}
        </div>`;
    }).join('');
    return `
      <section class="overlay-case-section" aria-label="Inner frames">
        <div class="overlay-case-inner-phones">
          <div class="overlay-case-inner-phones-row">${phones}</div>
        </div>
      </section>`;
  }

  function block_grid4_videos_ppong(b) {
    const vids = (b.videos || []).map(src =>
      `<video class="overlay-case-scene-vid" data-hover-ppong data-cursor-action src="${window.attrUrl(src)}" muted playsinline preload="auto"></video>`
    ).join('');
    return `
      <section class="overlay-case-section" aria-label="Scene videos">
        <div class="overlay-case-scene-videos">${vids}</div>
      </section>`;
  }

  function block_composite_image(b) {
    if (!b.src) return '';
    const cls = b.natural ? 'overlay-case-picture-all overlay-case-picture-all--natural' : 'overlay-case-picture-all';
    return `
      <section class="overlay-case-section" aria-label="Composite image">
        <img class="${cls}" src="${window.attrUrl(b.src)}" alt="" loading="lazy"/>
      </section>`;
  }

  function block_sketch_logo(b) {
    return `
      <section class="overlay-case-section" aria-label="Sketch and logo">
        <div class="overlay-case-sketch-logo">
          <div class="overlay-case-sketch-wrap">
            <div class="overlay-case-tile-tag"><span>/</span> ${window.escapeHtml(b.sketchLabel || 'Sketch')}</div>
            ${b.sketch ? `<img class="overlay-case-sketch-img" src="${window.attrUrl(b.sketch)}" alt="" loading="lazy"/>` : ''}
          </div>
          ${b.logoEvo ? `<img class="overlay-case-logo-evo" src="${window.attrUrl(b.logoEvo)}" alt="" loading="lazy"/>` : ''}
        </div>
      </section>`;
  }

  function block_outro_video(b) {
    if (!b.src) return '';
    const tipAttr = b.tooltip ? ` data-cursor-tooltip="${window.escapeDataAttr(b.tooltip)}"` : '';
    const isVid = /\.(mp4|webm|ogg)(\?.*)?$/i.test(b.src);
    if (!isVid) {
      return `<section class="overlay-case-section overlay-case-outro-video" aria-label="Project video">
                <img class="overlay-case-img overlay-case-img--video" src="${window.attrUrl(b.src)}" alt="" loading="lazy"${tipAttr}/>
              </section>`;
    }
    // `noControls: true` hides the sound + fullscreen buttons (set in project.js)
    const controls = b.noControls ? '' : `
          <div class="overlay-case-video-controls" aria-label="Video controls">
            <button type="button" class="overlay-case-video-btn" data-video-action="fullscreen" data-cursor-tooltip="Fullscreen" aria-label="Fullscreen">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M9 9L12.8889 12.85M9 9V12.5M9 9H12.5M9 22.9611L12.8889 19.1111M23 22.9611L19.15 19.1111M22.9611 9L19.1111 12.85M19.5 9H23V12.5M23 19.5V23H19.5M12.5 23H9V19.5" stroke="currentColor"/>
              </svg>
            </button>
            <button type="button" class="overlay-case-video-btn" data-video-action="mute" data-cursor-tooltip="Sound" aria-label="Toggle sound" aria-pressed="true">
              <svg class="icon-muted" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M19 13.6667L23.5 18.3333M23.5 13.6667L19 18.3333M8.5 12.8889V19.1111H12.3242L16.75 23V9L12.25 12.8889H8.5Z" stroke="currentColor"/>
              </svg>
              <svg class="icon-unmuted" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M8.5 12.8889V19.1111H12.3242L16.75 23V9L12.25 12.8889H8.5Z" stroke="currentColor"/>
                <path d="M19.5 13.5c1 1 1 4 0 5M22 11c1.8 1.8 1.8 7.2 0 10" stroke="currentColor" stroke-linecap="round"/>
              </svg>
            </button>
          </div>`;
    return `
      <section class="overlay-case-section overlay-case-outro-video" aria-label="Project video">
        <div class="overlay-case-video-wrap"${tipAttr}>
          <video class="overlay-case-img overlay-case-img--video" src="${window.attrUrl(b.src)}" muted playsinline loop autoplay></video>${controls}
        </div>
      </section>`;
  }

  /* ── Lottie blocks ──────────────────────────────────────────
     lottie-single : single animation in a framed section
     grid4-lottie  : 2×2 grid of Lottie tiles (optional captions)
     lottie-strip  : responsive grid of small Lottie icons
  ──────────────────────────────────────────────────────────── */

  function block_lottie_single(b) {
    if (!b.src) return '';
    const head = b.heading
      ? `<h3 class="overlay-case-subhead"><span class="overlay-case-subhead-slash">/</span> ${window.escapeHtml(b.heading)}</h3>`
      : '';
    // Optional `variant`: 'white' | 'transparent' | undefined (default beige)
    // Optional `small: true` shrinks the inner lottie (e.g. Executable Response Plans)
    const variantCls = (b.variant ? ` overlay-case-lottie-single-frame--${b.variant}` : '')
      + (b.small  ? ' overlay-case-lottie-single-frame--small'             : '');
    // Optional `tooltip`: shows custom cursor tooltip on hover over the frame
    const tipAttr = b.tooltip ? ` data-cursor-tooltip="${window.escapeDataAttr(b.tooltip)}"` : '';
    return `
      <section class="overlay-case-section" aria-label="${window.escapeDataAttr(b.heading || 'Animation')}">
        ${head}
        <div class="overlay-case-lottie-single-frame${variantCls}"${tipAttr}>
          <lottie-player src="${window.attrUrl(b.src)}" autoplay loop background="transparent" speed="1" renderer="svg"></lottie-player>
        </div>
      </section>`;
  }

  function block_grid4_lottie(b) {
    const hasCaption = (b.tiles || []).some(t => t && t.caption);
    const tiles = (b.tiles || []).map(t => {
      const label = t.label
        ? `<div class="overlay-case-tile-tag"><span>/</span> ${window.escapeHtml(t.label)}</div>`
        : '';
      const caption = t.caption
        ? `<div class="overlay-case-tile-caption">${window.escapeHtml(t.caption)}</div>`
        : '';
      const lottieEl = t.src
        ? `<lottie-player class="overlay-case-lottie-tile" src="${window.attrUrl(t.src)}" autoplay loop background="transparent" speed="1" renderer="svg"></lottie-player>`
        : `<div class="overlay-case-qr-placeholder" aria-hidden="true"></div>`;
      // `framed` wraps the lottie in an inner EAEEFB frame (Figma SOC pain-points spec)
      const media = b.framed
        ? `<div class="overlay-case-tile-frame">${lottieEl}</div>`
        : lottieEl;
      const tipAttr = t.tooltip ? ` data-cursor-tooltip="${window.escapeDataAttr(t.tooltip)}"` : '';
      return `
        <div class="overlay-case-tile"${tipAttr}>
          ${label}
          ${media}
          ${caption}
        </div>`;
    }).join('');
    const extras = [
      hasCaption ? 'overlay-case-grid4--captioned' : '',
      b.framed   ? 'overlay-case-grid4--framed'    : ''
    ].filter(Boolean).join(' ');
    const extraCls = extras ? ` ${extras}` : '';
    return `<section class="overlay-case-grid4${extraCls}" aria-label="${window.escapeDataAttr(b.heading || 'Animations')}">${tiles}</section>`;
  }

  /* panel-cards : EAEEFB framed panel with title + subtitle + 2×2 white cards
     Each card: { src, title, desc }  (src = Lottie icon) */
  function block_panel_cards(b) {
    const cards = (b.cards || []).map(c => {
      const icon = c.src
        ? `<div class="overlay-case-panel-card-icon"><lottie-player src="${window.attrUrl(c.src)}" autoplay loop background="transparent" speed="1" renderer="svg"></lottie-player></div>`
        : '';
      return `
        <div class="overlay-case-panel-card">
          ${icon}
          <div class="overlay-case-panel-card-spacer"></div>
          <h4 class="overlay-case-panel-card-title">${window.escapeHtml(c.title || '')}</h4>
          <p class="overlay-case-panel-card-desc">${window.escapeHtml(c.desc || '')}</p>
        </div>`;
    }).join('');
    return `
      <section class="overlay-case-panel-cards" aria-label="${window.escapeDataAttr(b.heading || 'Why')}">
        <div class="overlay-case-panel-cards-head">
          <h2 class="overlay-case-panel-cards-title">${window.escapeHtml(b.heading || '')}</h2>
          ${b.sub ? `<p class="overlay-case-panel-cards-sub">${window.escapeHtml(b.sub)}</p>` : ''}
        </div>
        <div class="overlay-case-panel-cards-grid">${cards}</div>
      </section>`;
  }

  function block_lottie_strip(b) {
    const items = (b.items || []).map(it => {
      if (!it || !it.src) return '';
      return `<lottie-player src="${window.attrUrl(it.src)}" autoplay loop background="transparent" speed="1" renderer="svg" title="${window.escapeDataAttr(it.label || '')}"></lottie-player>`;
    }).join('');
    const head = b.heading
      ? `<h3 class="overlay-case-subhead"><span class="overlay-case-subhead-slash">/</span> ${window.escapeHtml(b.heading)}</h3>`
      : '';
    return `
      <section class="overlay-case-section" aria-label="${window.escapeDataAttr(b.heading || 'Animation strip')}">
        ${head}
        <div class="overlay-case-lottie-strip">${items}</div>
      </section>`;
  }

  function block_feature_row_lottie(b) {
    const rows = (b.rows || []).map((r, i) => {
      if (!r) return '';
      const reverse = (i % 2 === 1) ? ' overlay-case-feature-row--reverse' : '';
      const media = r.src
        ? `<lottie-player class="overlay-case-feature-row-lottie" src="${window.attrUrl(r.src)}" autoplay loop background="transparent" speed="1" renderer="svg"></lottie-player>`
        : '';
      const title = r.title ? `<h4 class="overlay-case-feature-row-title">${window.escapeHtml(r.title)}</h4>` : '';
      const desc  = r.desc  ? `<p class="overlay-case-feature-row-desc">${window.escapeHtml(r.desc)}</p>`   : '';
      return `
        <div class="overlay-case-feature-row${reverse}">
          <div class="overlay-case-feature-row-media">${media}</div>
          <div class="overlay-case-feature-row-text">${title}${desc}</div>
        </div>`;
    }).join('');
    return `<section class="overlay-case-feature-rows" aria-label="${window.escapeDataAttr(b.heading || 'Features')}">${rows}</section>`;
  }

  function block_back_to_top() {
    return `<button type="button" class="overlay-case-back-to-top" data-cursor-tooltip="Scroll to top" aria-label="Back to top">Back to top</button>`;
  }

  function block_custom(b) {
    // Meta-block: raw HTML passthrough. Trust the caller.
    return `<section class="overlay-case-section overlay-case-custom" aria-label="Custom block">${b.html || ''}</section>`;
  }

  /* ────────────────────────────────────────────────────────────
     SOLUTION NAV BAR (Radiant)
     Renders a base SVG of the navbar, then overlays animated
     Lotties on the icon slots. Each `icon` has viewBox-space
     coordinates (cx, cy, size) so positions stay locked even
     when the SVG is responsively scaled.
     b: { src (svg), viewBox: [w,h], icons: [{src, cx, cy, size}] }
  ──────────────────────────────────────────────────────────── */

  function block_solution_nav_bar(b) {
    if (!b.src) return '';
    const vbW = (b.viewBox && b.viewBox[0]) || 960;
    const vbH = (b.viewBox && b.viewBox[1]) || 474;
    const icons = (b.icons || []).map(i => {
      // Convert viewBox units → percentages of the rendered SVG box.
      const leftPct = (i.cx / vbW) * 100;
      const topPct  = (i.cy / vbH) * 100;
      // Width is a % of the parent's width; height matches via aspect-ratio:1
      // (the parent enforces aspect-ratio: vbW/vbH so x and y scale together).
      const wPct    = (i.size / vbW) * 100;
      return `
        <div class="overlay-case-solnav-icon"
             style="left:${leftPct}%; top:${topPct}%; width:${wPct}%;">
          <lottie-player src="${window.attrUrl(i.src)}" autoplay loop
                         background="transparent" speed="1" renderer="svg"></lottie-player>
        </div>`;
    }).join('');
    // Interactive hover hit-zones (top nav buttons + dropdown cells). Each hit
    // is a viewBox-space rect {x,y,w,h}; rendered as a transparent div that
    // shows the brand pink-tint gradient on hover (per radiantsecurity.ai).
    const hits = (b.hits || []).map(h => {
      const leftPct = (h.x / vbW) * 100;
      const topPct  = (h.y / vbH) * 100;
      const wPct    = (h.w / vbW) * 100;
      const hPct    = (h.h / vbH) * 100;
      // No data-cursor-tooltip here — the parent solnav uses data-cursor-hide
      // to suppress the custom cursor in favor of a small system arrow, and a
      // tooltip on the child would override that and bring the custom cursor
      // back. If a tooltip is needed in the future, also set data-cursor-hide
      // on the hit to keep cursor behavior consistent.
      return `
        <div class="overlay-case-solnav-hit"
             style="left:${leftPct}%; top:${topPct}%; width:${wPct}%; height:${hPct}%;"></div>`;
    }).join('');
    return `
      <section class="overlay-case-section" aria-label="Solution nav bar">
        <div class="overlay-case-solnav" style="aspect-ratio:${vbW} / ${vbH};">
          <img class="overlay-case-solnav-bg" src="${window.attrUrl(b.src)}" alt="" loading="lazy"/>
          ${hits}
          ${icons}
        </div>
      </section>`;
  }

  /* ────────────────────────────────────────────────────────────
     ICON LIBRARY
     Figma: flex-wrap row, 30px gap, 960×190 container, 80×80 white
     rounded-8px tiles (9 per row → 2 rows of 9 = 18 icons).
     b: { icons: [{ src, tooltip? }] }
  ──────────────────────────────────────────────────────────── */

  function block_icon_library(b) {
    // Single-row marquee carousel with fade-out edges. Track is duplicated so
    // the translate animation can loop seamlessly (-50% wraps to 0).
    const renderTile = i => {
      const tip = i.tooltip ? ` data-cursor-tooltip="${window.escapeDataAttr(i.tooltip)}"` : '';
      const styleAttr = (typeof i.scale === 'number' && i.scale !== 1)
        ? ` style="transform: scale(${i.scale}); transform-origin: 50% 50%;"`
        : '';
      return `
        <div class="overlay-case-icon-library-tile"${tip}>
          <lottie-player src="${window.attrUrl(i.src)}" autoplay loop
                         background="transparent" speed="1" renderer="svg"${styleAttr}></lottie-player>
        </div>`;
    };
    const list = (b.icons || []);
    const oneSet = list.map(renderTile).join('');
    // Duration scales with item count so the per-item speed stays constant.
    const dur = b.durationSec || Math.max(20, list.length * 2.5);
    return `
      <section class="overlay-case-section" aria-label="Icon library">
        <div class="overlay-case-icon-library">
          <div class="overlay-case-icon-library-track" style="animation-duration:${dur}s;">
            ${oneSet}
            ${oneSet}
          </div>
        </div>
      </section>`;
  }

  // ── Dispatcher ──────────────────────────────────────────────

  const REGISTRY = {
    'title':                block_title,
    'twoCol':               block_twoCol,
    'grid4-3d':             block_grid4_3d,
    'grid4-phones':         block_grid4_phones,
    'grid4-videos-ppong':   block_grid4_videos_ppong,
    'composite-image':      block_composite_image,
    'sketch-logo':          block_sketch_logo,
    'outro-video':          block_outro_video,
    'lottie-single':        block_lottie_single,
    'grid4-lottie':         block_grid4_lottie,
    'lottie-strip':         block_lottie_strip,
    'panel-cards':          block_panel_cards,
    'feature-row-lottie':   block_feature_row_lottie,
    'solution-nav-bar':     block_solution_nav_bar,
    'icon-library':         block_icon_library,
    'twoCol-subheads':      block_twoCol_subheads,
    'grid2x2-videos':       block_grid2x2_videos,
    'wide-video':           block_wide_video,
    'grid2-images':         block_grid2_images,
    'globe-code':           block_globe_code,
    'back-to-top':          block_back_to_top,
    'custom':               block_custom
  };

  window.renderBlock = function renderBlock(block, project) {
    if (!block || !block.type) return '';
    const fn = REGISTRY[block.type];
    if (!fn) {
      console.warn('[blocks.js] Unknown block type:', block.type);
      return `<!-- unknown block: ${block.type} -->`;
    }
    return fn(block, project);
  };

  window.renderBlocks = function renderBlocks(blocks, project) {
    if (!Array.isArray(blocks)) return '';
    return `<div class="overlay-case-inner">${
      blocks.map(b => window.renderBlock(b, project)).join('\n')
    }</div>`;
  };

})();
