/* ══════════════════════════════════════════════════════════════
   Neon — placeholder
   Fill in real content as you go. Delete blocks you don't need;
   reorder them; add new ones. See /V3/README.md for block types.
════════════════════════════════════════════════════════════════ */

window.__PROJECTS__['neon'] = {
  id: 'neon',
  title: 'Neon',
  tags: ['Tag 1', 'Tag 2'],
  overlayTags: ['Tag 1', 'Tag 2'],

  thumbnail: null,            // e.g. 'projects/neon/assets/thumb.jpg'
  turntableModel: null,       // e.g. 'projects/neon/assets/logo.glb'
  turntableLogo:  null,       // e.g. 'projects/neon/assets/logo.svg'

  caseStudy: {
    blocks: [
      { type: 'title' },

      { type: 'twoCol',
        heading: 'About the Project',
        cols: [
          'First column — describe what this project is and why it exists.',
          'Second column — the role you played, the scope, the outcome.'
        ]
      },

      // Example blocks — uncomment / modify as you fill this in:
      //
      // { type: 'grid4-3d',
      //   tiles: [
      //     { glb: 'projects/neon/assets/a.glb', label: 'Label A', tooltip: 'Title\n\nBody copy.' },
      //     { glb: 'projects/neon/assets/b.glb', label: 'Label B', tooltip: 'Title\n\nBody copy.' },
      //     { glb: 'projects/neon/assets/c.glb', label: 'Label C', tooltip: 'Title\n\nBody copy.' },
      //     { glb: 'projects/neon/assets/d.glb', label: 'Label D', tooltip: 'Title\n\nBody copy.' }
      //   ]
      // },
      //
      // { type: 'grid4-phones',
      //   items: [
      //     { glb: 'projects/neon/assets/p1.glb' },
      //     { glb: 'projects/neon/assets/p2.glb' },
      //     { glb: 'projects/neon/assets/p3.glb' },
      //     { glb: 'projects/neon/assets/p4.glb' }
      //   ]
      // },
      //
      // { type: 'grid4-videos-ppong',
      //   videos: [
      //     'projects/neon/assets/v1.mp4',
      //     'projects/neon/assets/v2.mp4',
      //     'projects/neon/assets/v3.mp4',
      //     'projects/neon/assets/v4.mp4'
      //   ]
      // },
      //
      // { type: 'composite-image', src: 'projects/neon/assets/composite.jpg' },
      //
      // { type: 'sketch-logo',
      //   sketch: 'projects/neon/assets/sketch.png',
      //   logoEvo: 'projects/neon/assets/logo-evo.png',
      //   sketchLabel: 'Sketch'
      // },
      //
      // { type: 'outro-video', src: 'projects/neon/assets/outro.mp4' },
      //
      // { type: 'custom', html: '<!-- free-form HTML for anything we don\'t have a block for yet -->' },

      { type: 'back-to-top' }
    ]
  }
};
