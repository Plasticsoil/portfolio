/* ══════════════════════════════════════════════════════════════
   SHLTR
   Full case-study — reference implementation for all other projects.
   All assets live inside this folder (./assets) so the project is
   self-contained. Paths are written relative to V3/index.html.
════════════════════════════════════════════════════════════════ */

window.__PROJECTS__['shltr'] = {
  id: 'shltr',
  title: 'SHLTR',
  tags: ['VR', '3D', 'Collab', 'Video Edit'],
  overlayTags: ['Virtual Reality', '3D', 'Collaboration', 'Video Editing'],

  // Card in the grid
  thumbnail: null,
  turntableModel: 'projects/shltr/assets/Fracture 3D.glb',
  turntableLogo:  'projects/shltr/assets/shltr-logo.svg',

  // Ordered list of case-study blocks — rendered top-to-bottom
  caseStudy: {
    blocks: [
      { type: 'title' },

      { type: 'twoCol',
        heading: 'About the Project',
        cols: [
          'An AR art project by Yam Livnat and Emri Passi, exploring the fracture in personal and national security following the events of October 7th.',
          'The project features four urban scenes placed across the city, experienced through mobile devices by scanning QR codes in public space. It was created as a direct response to the situation in Israel and was later presented as part of the Gravity Exhibition.'
        ]
      },

      { type: 'grid4-3d',
        tiles: [
          { glb: 'projects/shltr/assets/Anthem 3D.glb',   label: 'Anthem 3D',   tooltip: 'Anthem\n\nA concrete barrier featuring the Israeli national anthem, referencing the practice of painting it onto structures used for military ceremonies. The piece reframes a temporary construction element as a fixed, symbolic object.' },
          { glb: 'projects/shltr/assets/Passage 3D.glb',  label: 'Passage 3D',  tooltip: 'Passage\n\nA narrowing corridor constructed from concrete blocks, guiding movement forward while limiting the possibility of exit. The structure creates a controlled path with restricted visibility and no clear endpoint.' },
          { glb: 'projects/shltr/assets/Dreams 3D.glb',   label: 'Dreams 3D',   tooltip: 'Dreams\n\nA grid of concrete barriers arranged like a field, each marked with a handwritten personal dream. The repetition forms a collective absence, with the overall structure encoding the date October 7th.' },
          { glb: 'projects/shltr/assets/Fracture 3D.glb', label: 'Fracture 3D', tooltip: 'Fracture\n\nTwo large concrete barriers split by a central crack, emphasizing separation within a solid mass. The form represents division and instability within what is typically perceived as protective infrastructure.' }
        ]
      },

      { type: 'twoCol',
        heading: 'Concrete Barriers',
        cols: [
          'Each scene is built from the same concrete barrier — a mundane, protective object that gains new meaning through placement and gesture.',
          'The language of the barriers is raw and industrial; the interventions painted on them are personal, fragile, and political. The contrast is the message.'
        ]
      },

      // Narrow row — the four QR stickers that appear in public space.
      { type: 'grid4-phones',
        items: [
          { img: 'projects/shltr/assets/Qr1.png' },
          { img: 'projects/shltr/assets/Qr2.png' },
          { img: 'projects/shltr/assets/Qr3.png' },
          { img: 'projects/shltr/assets/Qr4.png' }
        ]
      },

      { type: 'twoCol',
        heading: 'Typography',
        cols: [
          'The typography echoes the handmade, stencilled quality of text seen on real military barriers — a hand-painted layer on top of poured concrete.',
          'The logotype was developed through iteration: from loose sketches to a final geometric form that holds together visually while referencing the crack itself.'
        ]
      },

      { type: 'grid4-videos-ppong',
        videos: [
          'projects/shltr/assets/Vid anthem.mp4',
          'projects/shltr/assets/Vid passage.mp4',
          'projects/shltr/assets/Vid dreams.mp4',
          'projects/shltr/assets/Vid fracture.mp4'
        ]
      },

      { type: 'twoCol',
        heading: 'Public Space',
        cols: [
          'The work lives in public space. QR codes scattered across the city invite passersby to experience the sculptures through their own phones — locating the work in the everyday.',
          'The viewer becomes the camera; the city becomes the gallery.'
        ]
      },

      { type: 'composite-image', src: 'projects/shltr/assets/pictue of all 4.jpg' },

      { type: 'sketch-logo',
        sketch: 'projects/shltr/assets/Sketch.png',
        logoEvo: 'projects/shltr/assets/Logo evolution.jpeg',
        sketchLabel: 'Sketch'
      },

      { type: 'outro-video', src: 'projects/shltr/assets/Video of project.mp4' },

      { type: 'back-to-top' }
    ]
  }
};
