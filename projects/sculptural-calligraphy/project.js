/* ══════════════════════════════════════════════════════════════
   Sculptural Calligraphy — placeholder
   Fill in real content as you go. Delete blocks you don't need;
   reorder them; add new ones. See /V3/README.md for block types.
════════════════════════════════════════════════════════════════ */

window.__PROJECTS__['sculptural-calligraphy'] = {
  id: 'sculptural-calligraphy',
  title: 'Sculptural Calligraphy',
  tags: ['Tag 1', 'Tag 2'],
  overlayTags: ['Tag 1', 'Tag 2'],

  thumbnail: null,            // e.g. 'projects/sculptural-calligraphy/assets/thumb.jpg'
  turntableModel: null,       // e.g. 'projects/sculptural-calligraphy/assets/logo.glb'
  turntableLogo:  null,       // e.g. 'projects/sculptural-calligraphy/assets/logo.svg'

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
      //     { glb: 'projects/sculptural-calligraphy/assets/a.glb', label: 'Label A', tooltip: 'Title\n\nBody copy.' },
      //     { glb: 'projects/sculptural-calligraphy/assets/b.glb', label: 'Label B', tooltip: 'Title\n\nBody copy.' },
      //     { glb: 'projects/sculptural-calligraphy/assets/c.glb', label: 'Label C', tooltip: 'Title\n\nBody copy.' },
      //     { glb: 'projects/sculptural-calligraphy/assets/d.glb', label: 'Label D', tooltip: 'Title\n\nBody copy.' }
      //   ]
      // },
      //
      // { type: 'grid4-phones',
      //   items: [
      //     { glb: 'projects/sculptural-calligraphy/assets/p1.glb' },
      //     { glb: 'projects/sculptural-calligraphy/assets/p2.glb' },
      //     { glb: 'projects/sculptural-calligraphy/assets/p3.glb' },
      //     { glb: 'projects/sculptural-calligraphy/assets/p4.glb' }
      //   ]
      // },
      //
      // { type: 'grid4-videos-ppong',
      //   videos: [
      //     'projects/sculptural-calligraphy/assets/v1.mp4',
      //     'projects/sculptural-calligraphy/assets/v2.mp4',
      //     'projects/sculptural-calligraphy/assets/v3.mp4',
      //     'projects/sculptural-calligraphy/assets/v4.mp4'
      //   ]
      // },
      //
      // { type: 'composite-image', src: 'projects/sculptural-calligraphy/assets/composite.jpg' },
      //
      // { type: 'sketch-logo',
      //   sketch: 'projects/sculptural-calligraphy/assets/sketch.png',
      //   logoEvo: 'projects/sculptural-calligraphy/assets/logo-evo.png',
      //   sketchLabel: 'Sketch'
      // },
      //
      // { type: 'outro-video', src: 'projects/sculptural-calligraphy/assets/outro.mp4' },
      //
      // { type: 'custom', html: '<!-- free-form HTML for anything we don\'t have a block for yet -->' },

      { type: 'back-to-top' }
    ]
  }
};
