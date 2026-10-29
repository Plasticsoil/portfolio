// The cursor of this page only: a small solid white dot in place of the
// system arrow (the rest of the site keeps its own cursor). Not on touch
// screens, which have no pointer to replace.
(function () {
  if (window.matchMedia('(hover: none)').matches) return;
  const style = document.createElement('style');
  style.textContent = `
    html, html * { cursor: none !important; }
    #dot { position: fixed; z-index: 100000; left: 0; top: 0; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%;
      background: #fff; pointer-events: none; opacity: 0; transition: opacity 0.2s, width 0.15s, height 0.15s, margin 0.15s; }
    #dot.down { width: 7px; height: 7px; margin: -3.5px 0 0 -3.5px; }`;
  document.head.append(style);
  const dot = document.createElement('div');
  dot.id = 'dot';
  document.body.append(dot);
  addEventListener('mousemove', (e) => { dot.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; dot.style.opacity = '1'; }, { passive: true });
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; });
  addEventListener('mousedown', () => dot.classList.add('down'));
  addEventListener('mouseup', () => dot.classList.remove('down'));
})();
