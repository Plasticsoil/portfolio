/* ══════════════════════════════════════════════════════════════
   PractiTest — placeholder
   Fill in real content as you go. Delete blocks you don't need;
   reorder them; add new ones. See /V3/README.md for block types.
════════════════════════════════════════════════════════════════ */

window.__PROJECTS__['practitest'] = {
  id: 'practitest',
  title: 'PractiTest',
  tags: ['Tag 1', 'Tag 2'],
  overlayTags: ['Tag 1', 'Tag 2'],

  thumbnail: null,            // e.g. 'projects/practitest/assets/thumb.jpg'
  turntableModel: null,       // e.g. 'projects/practitest/assets/logo.glb'
  turntableLogo:  null,       // e.g. 'projects/practitest/assets/logo.svg'

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

      { type: 'back-to-top' }
    ]
  }
};
