/* ══════════════════════════════════════════════════════════════
   RADIANT
   Motion / brand / web — SOC platform.
   All assets live in ./assets (Lottie JSON + SVG + MP4).
   Section order + copy follow ./content.pdf (the Figma export).
════════════════════════════════════════════════════════════════ */

window.__PROJECTS__['radiant'] = {
  id: 'radiant',
  title: 'Radiant',
  tags: ['Web', 'Motion', 'Brand Design'],
  overlayTags: ['Web', 'Motion', 'Brand Design'],

  // Flat image thumbnail for the grid card
  thumbnail: 'projects/radiant/assets/Project cover/Thumbnail.png',
  turntableLogo: null,

  // Share-modal preview: force the running-mascot thumbnail (not the outro video)
  shareImage: 'projects/radiant/assets/Project cover/Thumbnail.png',

  // Hover cursor: small Radiant logo follows the mouse instead of the "See More" tooltip
  cursorImage: 'projects/radiant/assets/Project cover/logo.svg',

  caseStudy: {
    blocks: [
      { type: 'title' },

      // ── Solution nav bar — base SVG with 12 animated Lottie icons overlaid on
      //    the icon slots. Coordinates are in the SVG's own viewBox (960×474);
      //    each slot is a 33.33×33.33 rounded square (see "the frame.svg"
      //    paths starting at M358.667 / M538.667 / M718.667 for the 3 columns,
      //    and y = 104.667 / 151.333 / 198 / 244.667 for the 4 rows). ──
      { type: 'solution-nav-bar',
        src: 'projects/radiant/assets/Solution nav bar/the frame.webp',
        viewBox: [960, 474],
        icons: (function () {
          const NAV = 'projects/radiant/assets/Solution nav bar/';
          const SIZE = 33.33;
          const cols = [375.33, 555.33, 735.33];   // icon centers x (col 1/2/3)
          const rows = [121.33, 168, 214.67, 261.33]; // icon centers y (row 1/2/3/4)
          const grid = [
            ['SIEM',         'WAF',       'DLP'         ],
            ['Cloud',        'Identity',  'Insider'     ],
            ['Endpoint',     'Network',   'OTIOT'       ],
            ['Dark Web',     'Email',     'Supply Chain']
          ];
          const out = [];
          for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < cols.length; c++) {
              out.push({ src: `${NAV}${grid[r][c]}.json`, cx: cols[c], cy: rows[r], size: SIZE });
            }
          }
          return out;
        })(),
        // ── Interactive hover hit-zones (viewBox space). Mirrors the live
        //    radiantsecurity.ai behavior: pink-tint gradient on hover for the
        //    top-nav buttons (Platform / Solutions / Customers / Company /
        //    Resources + Login + Book a Demo) and for each of the 12 dropdown
        //    cells in the Solutions panel. Coordinates derived from the SVG:
        //    chevrons at x=338, 411, 549, 627; CTA rects at x=704 w=93.33 and
        //    x=807.33 w=59.33 (y=20 h=26.67); dropdown panel x=345.33 w=553.33
        //    (3 cols × 184.44 wide), rows 46.67 apart starting at icon_cy=121.33.
        // Hover hit-zones — only for the 12 dropdown cells inside the Solutions
        // panel. Top-nav buttons and CTAs are intentionally left alone (the
        // placement around the baked text looked off, per user feedback).
        // No tooltip on the hits so the parent's `data-cursor-hide` wins and
        // the small generic arrow cursor stays in effect inside the frame.
        // Cells are sized to the visible card (icon + label) — narrower than
        // the full panel third so the gradient doesn't bleed into empty space.
        hits: (function () {
          const cols = [375.33, 555.33, 735.33];   // icon centers x
          const iconRows = [121.33, 168, 214.67, 261.33]; // icon centers y
          const CELL_W = 140;                      // visible card width
          const CELL_H = 40;                       // visible card height
          const ICON_OFFSET = 24;                  // icon sits this far from card-left
          const out = [];
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
              out.push({
                x: cols[c] - ICON_OFFSET,
                y: iconRows[r] - CELL_H / 2,
                w: CELL_W,
                h: CELL_H
              });
            }
          }
          return out;
        })()
      },

      // ── Icon library — wrapped grid of 80×80 white tiles, 18 icons (2 rows × 9).
      //    Order matches the Figma "icons library" frame. All lotties live in the
      //    Solution nav bar folder, except "Log Management" which is reused from
      //    the Why Radiant set (no copy in this folder yet — move/copy if desired). ──
      { type: 'icon-library',
        icons: (function () {
          const NAV = 'projects/radiant/assets/Solution nav bar/';
          return [
            { src: `${NAV}Cloud.json`,        tooltip: 'Cloud' },
            { src: `${NAV}Dark Web.json`,     tooltip: 'Dark Web' },
            { src: `${NAV}WAF.json`,          tooltip: 'WAF' },
            { src: `${NAV}Identity.json`,     tooltip: 'Identity' },
            { src: `${NAV}Network.json`,      tooltip: 'Network' },
            { src: `${NAV}Email.json`,        tooltip: 'Email' },
            { src: `${NAV}DLP.json`,          tooltip: 'DLP' },
            { src: `${NAV}Insider.json`,      tooltip: 'Insider' },
            { src: `${NAV}Contact Us.json`,   tooltip: 'Contact Us' },
            { src: `${NAV}Newsroom.json`,     tooltip: 'Newsroom' },
            { src: `${NAV}Overview.json`,     tooltip: 'Overview' },
            { src: `${NAV}Webinar.json`,      tooltip: 'Webinars' },
            { src: `${NAV}About Us.json`,     tooltip: 'About Us' },
            { src: `${NAV}Integrations.json`, tooltip: 'Integrations' },
            { src: `${NAV}Carrers.json`,      tooltip: 'Careers' },
            { src: `${NAV}SOC Academy.json`,  tooltip: 'SOC Academy' },
            { src: `${NAV}Partnership.json`,  tooltip: 'Partnerships' },
            // Log Management lottie was authored at card-size, so its native
            // artwork overflows an 80×80 tile — scale down to ~70%.
            { src: 'projects/radiant/assets/Why Radiant/Log Management.json', tooltip: 'Log Management', scale: 0.7 }
          ];
        })()
      },

      // ── About Radiant ─────────────────────────────────────
      { type: 'twoCol',
        heading: 'About Radiant',
        cols: [
          'Radiant is an AI-driven cybersecurity company, building a platform that helps security teams investigate and respond to alerts more efficiently across complex systems.',
          'I work with Radiant on an ongoing basis, designing web and marketing assets across multiple touchpoints, from website components to campaign materials.'
        ]
      },

      // ── The Radiant Advantage — 4-tile animation gallery (no heading copy) ──
      { type: 'grid4-lottie',
        tiles: [
          { src: 'projects/radiant/assets/The Radiant Advantage/Integrated Log Management at no extra cost.json',         tooltip: 'Integrated Log Management at no extra cost' },
          { src: 'projects/radiant/assets/The Radiant Advantage/AI triage for every alert that hits your SOC.json',       tooltip: 'AI triage for every alert that hits your SOC' },
          { src: 'projects/radiant/assets/The Radiant Advantage/120+ integrations across your security stack V02.json',   tooltip: '120+ integrations across your security stack' },
          { src: 'projects/radiant/assets/The Radiant Advantage/Centralized operations with built-in response.json',      tooltip: 'Centralized operations with built-in response' }
        ]
      },

      // ── Working Within a System ───────────────────────────
      { type: 'twoCol',
        heading: 'Working Within a System',
        cols: [
          'Designing within an existing brand requires maintaining a clear visual language — keeping consistency across typography, color, and structure while ensuring everything feels cohesive and recognizable.',
          'At the same time, each piece is an opportunity to evolve the system. I approach it like a logic puzzle — using the same building blocks, but rearranging them to create new compositions that communicate different ideas within the same brand.'
        ]
      },

      // ── Executable Response Plans ─────────────────────────
      { type: 'lottie-single',
        variant: 'transparent',
        small: true,
        tooltip: 'Executable response plans',
        src: 'projects/radiant/assets/Executable response plans/Lottie Section - Executable response plans 8.json'
      },

      // ── Role of Motion ────────────────────────────────────
      { type: 'twoCol',
        heading: 'Role of Motion',
        cols: [
          'Motion is used as a tool to communicate complex ideas in a clear and accessible way. Instead of relying on static visuals, animations help break down flows, highlight key actions, and guide the user through different states of the product.',
          'At the same time, motion adds a layer of engagement to the experience. Subtle interactions and transitions make the interface feel more responsive and alive, creating a balance between clarity and a more dynamic, approachable user experience.'
        ]
      },

      // ── SOC pain-points 4-tile grid (framed: white outer + EAEEFB inner) ──
      { type: 'grid4-lottie',
        framed: true,
        tiles: [
          { src: 'projects/radiant/assets/The SOC was never supposed to work this way/Alert fatigue is the norm, not the exception.json',         tooltip: 'Alert fatigue is the norm, not the exception' },
          { src: 'projects/radiant/assets/The SOC was never supposed to work this way/Real threats slip through while analysts chase noise.json', tooltip: 'Real threats slip through while analysts chase noise' },
          { src: "projects/radiant/assets/The SOC was never supposed to work this way/SOCs can't scale without adding headcount.json",            tooltip: "SOCs can't scale without adding headcount" },
          { src: 'projects/radiant/assets/The SOC was never supposed to work this way/SecOps costs are skyrocketing without solving the problem.json', tooltip: 'SecOps costs are skyrocketing without solving the problem' }
        ]
      },

      // ── Ongoing Impact ────────────────────────────────────
      { type: 'twoCol',
        heading: 'Ongoing Impact',
        cols: [
          'There’s something uniquely satisfying in seeing work go live continuously — assets I design becoming part of the site in real time, shaping the experience as it evolves.',
          'Working with an existing brand allows for a much faster feedback loop. Instead of long phases of research and alignment before production, ideas move quickly into execution. This creates a more immediate connection between design and outcome, highlighting the strength and impact of marketing-driven design.'
        ]
      },

      // ── Pre-Footer ────────────────────────────────────────
      { type: 'lottie-single',
        variant: 'transparent',
        src: 'projects/radiant/assets/Pre-Footer/Prefooter Animation 2026_03.json'
      },

      // ── Why Radiant — EAEEFB panel with title + subtitle + 2×2 white cards ──
      { type: 'panel-cards',
        heading: 'Why Radiant',
        sub: 'The only AI platform that centralizes, automates, and adapts every SOC workflow for speed, scale, and accuracy, without overloading your team or your budget.',
        cards: [
          { src: 'projects/radiant/assets/Why Radiant/Log Management.json',
            title: 'Log Management',
            desc:  'Built-in log management captures and analyzes every security event without the SIEM tax, giving analysts the full context they need to investigate faster.' },
          { src: 'projects/radiant/assets/Why Radiant/Unbounded alert overage.json',
            title: 'Unbounded alert overage',
            desc:  'Radiant was built to triage 100% of alert types, including the complex, and cross-domain alerts that other solutions leave untouched.' },
          { src: 'projects/radiant/assets/Why Radiant/120+ Integrations.json',
            title: '120+ Integrations',
            desc:  'Connects to your entire security stack out of the box with no custom engineering required.' },
          { src: 'projects/radiant/assets/Why Radiant/Integrated response plans.json',
            title: 'Integrated response plans',
            desc:  'Every escalated threat comes with a ready-to-execute response plan, so analysts can go from investigation to resolution in one click.' }
        ]
      },

      // ── Added Capabilities ────────────────────────────────
      { type: 'twoCol',
        heading: 'Added Capabilities',
        cols: [
          'Motion design, especially web-based and Lottie animations, plays a key role in making complex ideas more accessible and engaging. It allows interfaces to communicate states, flows, and interactions more clearly within the product and website.',
          'Combined with AI-driven tools for faster iteration and visual generation, this approach enables efficient production of high-quality assets. It supports a fast-paced environment like Radiant’s, where clarity, speed, and consistency are essential.'
        ]
      },

      // ── LI banner outro ───────────────────────────────────
      { type: 'outro-video',
        src: 'projects/radiant/assets/LI banner/LI Banner - Merry Christmas - Dec 2025.mp4',
        noControls: true,
        tooltip: 'A small sample of AI generated video, recreating the mascot in a 3D-like render. Included as an additional exploration of production tools.'
      },

      { type: 'back-to-top' }
    ]
  }
};
