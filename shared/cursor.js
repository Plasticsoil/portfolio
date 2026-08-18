/* ══════════════════════════════════════════════════════════════
   CUSTOM CURSOR — shared by every page.

   Lifted verbatim from the V4 index.html cursor system, so the feel
   is identical rather than reimplemented, then wrapped so any page
   opts in with a single tag:

     <script src="/shared/cursor.js" defer></script>

   The 39 lines of SVG markup used to be hand-written into
   index.html; they are injected from here instead, so a new page
   never has to paste them.

   Element API (unchanged — every existing data-attribute still works):
     data-cursor-tooltip="…"       label beside the anchor dot
     data-cursor-tooltip-arrow     adds the small caret
     data-cursor-tooltip-variant   "plain" → paragraph card
     data-cursor-can-press         force the filled-dot state
     data-cursor-action            the [ ▶ Play ] badge
     data-cursor-image="url"       show an image instead of a tooltip
     data-cursor-light             white tooltip over dark surfaces
════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Touch devices have no pointer to replace. Bail before injecting
  // anything so phones keep native behaviour and pay nothing for this.
  if (window.matchMedia('(hover: none)').matches) return;

  var MARKUP = `
  <div id="cursor">
    <div id="cursor-inner">

      <!-- Idle: corner brackets + × — white strokes + #cursor-inner's
           mix-blend-mode: difference produce inverted contrast on any bg. -->
      <div id="cursor-idle">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.75 24.75H24.75V18.75M6.75 24.75H0.75V18.75M0.75 6.75V0.75H6.75M18.75 0.75H24.75V6.75" stroke="#26251E" stroke-width="1.5"/>
          <path d="M12.755 6.75V18.75" stroke="#26251E" stroke-width="1.5"/>
          <path d="M18.755 12.75L6.755 12.75" stroke="#26251E" stroke-width="1.5"/>
        </svg>
      </div>

      <!-- Can press: corner brackets + filled dot -->
      <div id="cursor-canpress" style="display:none">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.75 24.75H24.75V18.75M6.75 24.75H0.75V18.75M0.75 6.75V0.75H6.75M18.75 0.75H24.75V6.75" stroke="#26251E" stroke-width="1.5"/>
          <circle cx="12.75" cy="12.75" r="4" fill="#26251E"/>
        </svg>
      </div>

      <!-- Tooltip: dot + dynamic label — innerHTML built by JS -->
      <div id="cursor-tooltip" style="display:none"></div>
      <!-- Image cursor: shown instead of the tooltip when an element has data-cursor-image="<url>" -->
      <img id="cursor-image" alt="" style="display:none; width:96px; height:auto; pointer-events:none;">

      <!-- Action: [ ▶ Play ]  — shown when hovering hover-to-play videos.
           Inherits mix-blend-mode from #cursor-inner — no local override. -->
      <div id="cursor-action" style="display:none">
        <svg width="69" height="26" viewBox="0 0 69 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.75 24.75H0.75V18.75M0.75 6.75V0.75H6.75" stroke="#26251E" stroke-width="1.5"/>
          <path d="M19.75 12.75L14.75 16.75L14.75 8.75L19.75 12.75Z" fill="#26251E"/>
          <path d="M30.623 14.299V17.25H28.673V8.579H32.079C33.262 8.579 33.886 8.748 34.445 9.242C35.043 9.775 35.381 10.568 35.381 11.504C35.381 12.297 35.134 12.986 34.64 13.506C34.12 14.052 33.457 14.299 32.456 14.299H30.623ZM30.623 12.635H32.157C32.924 12.635 33.392 12.18 33.392 11.439C33.392 10.685 32.924 10.243 32.157 10.243H30.623V12.635ZM38.5842 8.579V17.25H36.7382V8.579H38.5842ZM42.128 12.947H40.477C40.594 11.504 41.491 10.802 43.259 10.802C44.208 10.802 44.936 11.023 45.43 11.452C45.885 11.855 46.054 12.362 46.054 13.285V16.171C46.054 16.847 46.08 16.938 46.288 17.25H44.403C44.325 17.029 44.325 16.99 44.26 16.756C43.649 17.263 43.207 17.419 42.466 17.419C41.075 17.419 40.152 16.639 40.152 15.456C40.152 14.273 40.893 13.662 42.648 13.376L43.649 13.207C44.065 13.142 44.208 13.038 44.208 12.778C44.208 12.427 43.844 12.206 43.246 12.206C42.57 12.206 42.206 12.44 42.128 12.947ZM44.26 15.222V14.26C44.065 14.338 43.896 14.39 43.584 14.455L42.921 14.598C42.258 14.754 41.972 14.975 41.972 15.352C41.972 15.768 42.323 16.015 42.908 16.015C43.519 16.015 43.961 15.755 44.26 15.222ZM51.4867 10.971H53.3977L51.2137 17.302C50.8627 18.329 50.6547 18.693 50.3297 18.927C50.0307 19.148 49.6147 19.239 48.9257 19.239H47.8467V17.848H48.3927C49.0427 17.848 49.3417 17.601 49.3417 17.055C49.3417 16.834 49.3287 16.795 49.1077 16.249L47.0407 10.971H49.0167L49.9397 13.844C50.1217 14.429 50.1217 14.442 50.2647 14.962L50.3427 15.209C50.4207 14.793 50.5247 14.364 50.6677 13.805L51.4867 10.971Z" fill="#26251E"/>
          <path d="M61.75 24.75H67.75V18.75M61.75 0.75H67.75V6.75" stroke="#26251E" stroke-width="1.5"/>
        </svg>
      </div>

    </div>
  </div>
`;

  function init() {
    document.body.insertAdjacentHTML('beforeend', MARKUP);

    // base.css only hides the OS cursor once this class is present, so a
    // page where this script fails to load is never left with no cursor.
    document.documentElement.classList.add('has-custom-cursor');

    // The copied block declares its own element lookups — see below.
      // ── Tooltip SVG builder ──────────────────────────────
      // We build the SVG as a string rather than DOM nodes for
      // speed — innerHTML assignment is a single paint.
      const FONT_FAMILY  = 'Inter, system-ui, sans-serif';
      const TOOLTIP_SIZE = 16;     // font size in px
      const TOOLTIP_H    = 24;     // svg height for single-line tooltip
      const DOT_R        = 4;      // radius of the anchor dot
      const DOT_CX       = 12;     // dot center x — also the cursor anchor x
      const DOT_CY       = 12;     // dot center y — also the cursor anchor y
      const TEXT_START_X = 27;     // text starts 15px after the dot's right edge
      const TEXT_Y       = 17;     // text baseline (visual centre of TOOLTIP_H)
      const PAD_RIGHT    = 10;     // right padding inside the SVG (after arrow)
      const ARROW_GAP    = 8;      // space between text end and triangle
      const ARROW_W      = 5;      // horizontal span of right-pointing triangle

      // Hidden SVG used solely to measure text width so we can
      // size the tooltip SVG tightly around its content.
      const _mSVG  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const _mText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      _mSVG.style.cssText = 'position:absolute;visibility:hidden;top:-9999px;left:-9999px;pointer-events:none;';
      _mText.setAttribute('font-family', FONT_FAMILY);
      _mText.setAttribute('font-size', TOOLTIP_SIZE);
      _mText.setAttribute('font-weight', '400');
      _mSVG.appendChild(_mText);
      document.body.appendChild(_mSVG);

      function textWidth(str) {
        _mText.textContent = str;
        return _mText.getComputedTextLength();
      }

      function escapeSvgText(s) {
        return String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }

      /** Strip scene title line; keep paragraph body only (for QR plain tooltips). */
      function tooltipBodyOnly(full) {
        const s = String(full).trim();
        const gap = s.indexOf('\n\n');
        if (gap >= 0) return s.slice(gap + 2).trim();
        const one = s.indexOf('\n');
        if (one >= 0) return s.slice(one + 1).trim();
        return s;
      }

      /**
       * Paragraph-only tooltip (case-study QR): same font metrics as default tooltip + “my work” line
       * (Inter 16px, #26251E, 150% leading) — white card, generous padding, rounded rect; no dot/arrow.
       */
      function buildPlainTooltipSVG(label) {
        const MAX_TEXT_W = 300;
        const LINE_H     = TOOLTIP_SIZE * 1.5; /* 150% — matches default multi-line + case copy */
        const PARA_GAP   = LINE_H * 0.4;
        const PAD_X      = 24;
        const PAD_Y      = 24;
        const RX         = 10;

        const segments = String(label).trim().split(/\n+/).map(x => x.trim()).filter(Boolean);
        const lines = [];
        for (let s = 0; s < segments.length; s++) {
          if (s > 0) lines.push('');
          lines.push(...wrapTooltipWords(segments[s], MAX_TEXT_W));
        }
        const nonEmpty = lines.filter(l => l !== '');
        if (nonEmpty.length === 0) return '';

        const W       = PAD_X * 2 + MAX_TEXT_W;
        let y         = PAD_Y + TOOLTIP_SIZE * 0.85;
        const textParts = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line === '') {
            y += PARA_GAP;
            continue;
          }
          textParts.push(
            `<text x="${PAD_X}" y="${y}" font-family="${FONT_FAMILY}" font-weight="400" font-size="${TOOLTIP_SIZE}" fill="#26251E">${escapeSvgText(line)}</text>`
          );
          y += LINE_H;
        }
        const H = Math.ceil(y + PAD_Y);
        return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${RX}" fill="#FFFFFF" stroke="#E8E6E3"/>
          ${textParts.join('')}
        </svg>`;
      }

      /** Greedy word-wrap to a max text width (for tooltip lines). */
      function wrapTooltipWords(text, maxW) {
        const words = String(text).split(/\s+/).filter(Boolean);
        const lines = [];
        let current = '';
        for (const word of words) {
          const test = current ? current + ' ' + word : word;
          if (current && textWidth(test) > maxW) {
            lines.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        if (current) lines.push(current);
        return lines;
      }

      /**
       * Build a tooltip SVG string (dot + label; optional right caret).
       * Paragraphs separated by newlines; each paragraph wraps at 300px width.
       * Caret is off unless `withArrow` — opt-in via data-cursor-tooltip-arrow (hero only).
       */
      function buildTooltipSVG(label, withArrow) {
        const showCaret = !!withArrow;
        const MAX_TEXT_W = 300;
        const LINE_H     = TOOLTIP_SIZE * 1.35; // 135% line-height matches CSS convention
        const PARA_GAP   = LINE_H * 0.4;

        const segments = String(label).trim().split(/\n+/).map(s => s.trim()).filter(Boolean);
        const lines = [];
        for (let s = 0; s < segments.length; s++) {
          if (s > 0) lines.push('');
          lines.push(...wrapTooltipWords(segments[s], MAX_TEXT_W));
        }

        const nonEmpty = lines.filter(l => l !== '');
        if (nonEmpty.length === 0) return '';

        if (lines.length === 1) {
          const t          = lines[0];
          const tw         = textWidth(t);
          const textEnd    = TEXT_START_X + tw;
          const ay         = DOT_CY;
          const ax1        = textEnd + ARROW_GAP;
          const W          = textEnd + (showCaret ? ARROW_GAP + ARROW_W : 0) + PAD_RIGHT;
          const caretSvg   = showCaret
            ? `<polygon points="${ax1},${ay - 4} ${ax1 + ARROW_W},${ay} ${ax1},${ay + 4}" fill="#292929"/>`
            : '';
          /* Dot and caret say different things: the dot marks where the
             cursor is, the caret says this opens. Both at once is one
             mark too many, so the caret stands in for the dot. */
          const dotSvg     = showCaret
            ? ''
            : `<circle cx="${DOT_CX}" cy="${DOT_CY}" r="${DOT_R}" fill="#292929"/>`;
          return `<svg width="${W}" height="${TOOLTIP_H}" viewBox="0 0 ${W} ${TOOLTIP_H}" fill="none" xmlns="http://www.w3.org/2000/svg">
            ${dotSvg}
            <text x="${TEXT_START_X}" y="${TEXT_Y}" font-family="${FONT_FAMILY}" font-weight="400" font-size="${TOOLTIP_SIZE}" fill="#26251E">${escapeSvgText(t)}</text>
            ${caretSvg}
          </svg>`;
        }

        const maxTw = nonEmpty.reduce((m, line) => Math.max(m, textWidth(line)), 0);

        let y = TEXT_Y;
        const textParts = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line === '') {
            y += PARA_GAP;
            continue;
          }
          textParts.push(
            `<text x="${TEXT_START_X}" y="${y}" font-family="${FONT_FAMILY}" font-weight="400" font-size="${TOOLTIP_SIZE}" fill="#26251E">${escapeSvgText(line)}</text>`
          );
          y += LINE_H;
        }

        const bottomPad = 8;
        const H         = Math.ceil(y + bottomPad);
        const textEnd   = TEXT_START_X + maxTw;
        const arrowCy   = H / 2;
        const ax2       = textEnd + ARROW_GAP;
        const W         = textEnd + (showCaret ? ARROW_GAP + ARROW_W : 0) + PAD_RIGHT;
        const caretSvg  = showCaret
          ? `<polygon points="${ax2},${arrowCy - 4} ${ax2 + ARROW_W},${arrowCy} ${ax2},${arrowCy + 4}" fill="#292929"/>`
          : '';
        /* Dot and caret say different things: the dot marks where the
           cursor is, the caret says this opens. Both at once is one
           mark too many, so the caret stands in for the dot. */
        const dotSvg    = showCaret
          ? ''
          : `<circle cx="${DOT_CX}" cy="${DOT_CY}" r="${DOT_R}" fill="#292929"/>`;

        return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${dotSvg}
          ${textParts.join('')}
          ${caretSvg}
        </svg>`;
      }

      // ── Cursor element refs ──────────────────────────────
      const cursor         = document.getElementById('cursor');
      const cursorInner    = document.getElementById('cursor-inner');
      const cursorIdle     = document.getElementById('cursor-idle');
      const cursorCanpress = document.getElementById('cursor-canpress');
      const cursorTooltip  = document.getElementById('cursor-tooltip');
      const cursorAction   = document.getElementById('cursor-action');
      const cursorImage    = document.getElementById('cursor-image');
      /* Anchor for the image cursor — top-left of img sits a touch right/below mouse */
      const ANCHOR_IMAGE = 'translate(14px,14px)';

      // Anchor transforms:
      //   ANCHOR_26  — offsets 26×26 SVG so its visual center (13,13) is at mouse
      //   ANCHOR_DOT — offsets tooltip SVG so the dot center (DOT_CX, DOT_CY) is at mouse
      const ANCHOR_26  = 'translate(-13px,-13px)';
      const ANCHOR_DOT = `translate(-${DOT_CX}px,-${DOT_CY}px)`;
      /* Plain paragraph box: top-left of SVG near cursor (no anchor dot). */
      const ANCHOR_PLAIN = 'translate(10px,10px)';
      /* Action cursor: 69×26 SVG centered on mouse. */
      const ANCHOR_ACTION = 'translate(-34.5px,-13px)';

      function _hideAllCursorVariants() {
        cursorIdle.style.display     = 'none';
        cursorCanpress.style.display = 'none';
        cursorTooltip.style.display  = 'none';
        cursorTooltip.classList.remove('cursor-tooltip--plain');
        if (cursorAction) cursorAction.style.display = 'none';
        if (cursorImage)  cursorImage.style.display  = 'none';
      }

      function showIdle() {
        _hideAllCursorVariants();
        cursorIdle.style.display     = 'block';
        cursorInner.style.transform  = ANCHOR_26;
      }

      function showCanPress() {
        _hideAllCursorVariants();
        cursorCanpress.style.display = 'block';
        cursorInner.style.transform  = ANCHOR_26;
      }

      function showTooltip(label, variant, showArrow) {
        const plain = variant === 'plain';
        _hideAllCursorVariants();
        cursorTooltip.innerHTML      = plain ? buildPlainTooltipSVG(label) : buildTooltipSVG(label, showArrow);
        cursorTooltip.classList.toggle('cursor-tooltip--plain', plain);
        cursorTooltip.style.display  = 'block';
        cursorInner.style.transform  = plain ? ANCHOR_PLAIN : ANCHOR_DOT;
      }

      function showAction() {
        _hideAllCursorVariants();
        if (cursorAction) cursorAction.style.display = 'block';
        cursorInner.style.transform  = ANCHOR_ACTION;
      }

      /* Image cursor — small image (e.g. brand logo) follows the cursor instead of a tooltip. */
      function showImage(src) {
        if (!cursorImage) return;
        _hideAllCursorVariants();
        if (cursorImage.getAttribute('src') !== src) cursorImage.setAttribute('src', src);
        cursorImage.style.display    = 'block';
        cursorInner.style.transform  = ANCHOR_IMAGE;
      }

      /**
       * Walk up the DOM from the hovered element to find
       * the nearest ancestor that declares a cursor interaction.
       * data-cursor-tooltip takes priority over data-cursor-can-press
       * which takes priority over generic link/button tags.
       */
      function getInteraction(el) {
        let node = el;
        while (node && node !== document.body) {
          if (node.dataset && node.dataset.cursorAction !== undefined) {
            return { type: 'action' };
          }
          // Image cursor takes priority over tooltip — used for the Radiant logo on hover
          if (node.dataset && node.dataset.cursorImage !== undefined) {
            return { type: 'image', src: node.dataset.cursorImage };
          }
          if (node.dataset && node.dataset.cursorTooltip !== undefined) {
            const variant = node.dataset.cursorTooltipVariant === 'plain' ? 'plain' : 'default';
            const showArrow = variant !== 'plain' &&
              node.hasAttribute('data-cursor-tooltip-arrow') &&
              node.getAttribute('data-cursor-tooltip-arrow') !== 'false';
            return { type: 'tooltip', label: node.dataset.cursorTooltip, variant, showArrow };
          }
          if (node.dataset && node.dataset.cursorCanPress !== undefined)
            return { type: 'canPress' };
          if (node.tagName === 'A' || node.tagName === 'BUTTON')
            return { type: 'canPress' };
          node = node.parentElement;
        }
        return null;
      }

      // ── Mouse tracking ───────────────────────────────────
      document.addEventListener('mousemove', (e) => {
        cursor.style.opacity   = '1';
        cursor.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;

        const hit = getInteraction(e.target);
        if (hit?.type === 'tooltip')      showTooltip(hit.label, hit.variant, hit.showArrow);
        else if (hit?.type === 'image')    showImage(hit.src);
        else if (hit?.type === 'canPress') showCanPress();
        else if (hit?.type === 'action')   showAction();
        else                               showIdle();

        // White cursor over dark cards so the tooltip stays visible
        const light = e.target.closest && e.target.closest('[data-cursor-light]');
        cursorTooltip.classList.toggle('cursor-tooltip--light', !!light);
      });

      document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
      });

      // Click feedback — toggle .down on the cursor wrapper for the full
      // mouse press, so every click anywhere on the page registers a
      // small squish-and-spring on the custom cursor. Listening on
      // document covers buttons, links, canvas, plain background — all of
      // them. mouseup also catches releases that drift off the original
      // element (drag-and-release would otherwise leave .down stuck on).
      document.addEventListener('mousedown', () => cursor.classList.add('down'));
      document.addEventListener('mouseup',   () => cursor.classList.remove('down'));
      document.addEventListener('mouseleave',() => cursor.classList.remove('down'));

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
