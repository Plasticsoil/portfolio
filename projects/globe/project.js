/* ══════════════════════════════════════════════════════════════
   GLOBE
   First vibe-coding experiment — an AI-assisted, code-based
   interactive web piece (a responsive sphere). The case study
   embeds the live experiment at the top as a scroll-driven sticky
   frame that grows to fill the viewport and shrinks back as the
   visitor keeps scrolling.
   All assets live in ./assets (HTML + MP4 + PNG).
   Section order mirrors the Figma content export.
════════════════════════════════════════════════════════════════ */

window.__PROJECTS__['globe'] = {
  id: 'globe',
  title: 'Globe',
  tags: ['AI', 'Vibecoding', 'Web'],
  overlayTags: ['AI', 'Vibecoding', 'Web'],

  // Placeholder thumbnail — swap with a final flat image when it's ready.
  thumbnail: 'projects/globe/assets/first version.png',
  turntableLogo: null,

  caseStudy: {
    blocks: [
      { type: 'title' },

      // ── Live experiment — sticky scroll-driven frame ─────────
      // Starts at the regular 960-wide block size; grows to viewport
      // as the visitor scrolls; holds at full size for a beat; then
      // shrinks back. The iframe is non-interactive during the scale
      // phases so it doesn't capture the page's scroll.
      { type: 'globe-code',
        src: 'projects/globe/assets/Globe Code.html'
      },

      // ── About the Project ────────────────────────────────────
      { type: 'twoCol',
        heading: 'About the project',
        cols: [
          'An interactive 3D web playground built around a simple idea — control a system and see what happens. Users can change things like density, scale, and motion, and the visuals update in real time.',
          'It’s not a fixed design, but something that keeps changing based on interaction. It sits somewhere between a tool and an experience.'
        ]
      },

      // ── 2×2 process grid ─────────────────────────────────────
      { type: 'grid2x2-videos',
        videos: [
          'projects/globe/assets/Logo changes.mp4',
          'projects/globe/assets/Export.mp4',
          'projects/globe/assets/Motion buttons.mp4',
          'projects/globe/assets/Colors and data.mp4'
        ]
      },

      // ── Process & Approach ───────────────────────────────────
      { type: 'twoCol',
        heading: 'Process & Approach',
        cols: [
          'The project was built using a vibe coding approach — fast, intuitive, and without a strict plan. A big part of the process was describing behavior in words instead of building everything manually.',
          'It became a way to test limits — between control and randomness. Working without a clear goal made it more open, more playful, and more about exploration.'
        ]
      },

      // ── Wide video: Shuffle – loop ───────────────────────────
      { type: 'wide-video',
        src: 'projects/globe/assets/Shuffle - loop.mp4'
      },

      // ── Interaction / System — two columns, each with its own head ──
      { type: 'twoCol-subheads',
        cols: [
          { heading: 'Interaction',
            text:    'The system reacts in real time to user input. Small changes create very different outcomes, encouraging exploration through interaction.' },
          { heading: 'System',
            text:    'Built as a set of simple rules that generate complex visuals. Each parameter affects the whole system, not just a single element.' }
        ]
      },

      // ── Wide video: Perspectives big ─────────────────────────
      { type: 'wide-video',
        src: 'projects/globe/assets/perspectives big.mp4'
      },

      // ── Control & Randomness / Context ───────────────────────
      { type: 'twoCol-subheads',
        cols: [
          { heading: 'Control & Randomness',
            text:    'The project balances between control and unpredictability. You can guide the result, but never fully control it.' },
          { heading: 'Context',
            text:    'A small exploration of how design shifts when the output is no longer fixed, but generated.' }
        ]
      },

      // ── Cursor + first version stills ────────────────────────
      { type: 'grid2-images',
        images: [
          'projects/globe/assets/cursor 1.png',
          'projects/globe/assets/first version.png'
        ]
      },

      { type: 'back-to-top' }
    ]
  }
};
