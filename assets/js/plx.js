/* ═══════════════════════════════════════════════════════════════
   LIQUID COPPER — plx.js
   Shared parallax engine for .plx bands: places .plx-shape from
   data-pos="x,y" (percentages) and drifts each .plx-layer by its
   data-plx speed on scroll. CSSOM only — strict CSP, no inline styles.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var bands = document.querySelectorAll('.plx');
  if (!bands.length) return;

  bands.forEach(function (band) {
    band.querySelectorAll('.plx-shape').forEach(function (s) {
      var p = (s.getAttribute('data-pos') || '0,0').split(',');
      s.style.left = p[0] + '%';
      s.style.top = p[1] + '%';
    });
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ticking = false;
  function update() {
    ticking = false;
    bands.forEach(function (band) {
      var r = band.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var progress = r.top - window.innerHeight / 2;
      band.querySelectorAll('.plx-layer').forEach(function (l) {
        var speed = parseFloat(l.getAttribute('data-plx')) || 0;
        l.style.transform = 'translate3d(0,' + (-progress * speed).toFixed(1) + 'px,0)';
      });
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();
