/* ═══════════════════════════════════════════════════════════════
   LIQUID COPPER — media.js
   Renders the media library from data/media.json: video link-outs,
   self-hosted audio (native player), and a photo gallery. Sections
   stay hidden until they have content — the in-development block
   tells the truth in the meantime.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function fmtDate(iso) {
    if (!iso) return '';
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB',
      { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function safeUrl(u) { return /^https:\/\//.test(u || '') ? u : null; }

  function renderVideos(items) {
    var list = document.getElementById('videoList');
    var featured = items.filter(function (v) { return !v.archived && safeUrl(v.url); });
    var archived = items.filter(function (v) { return v.archived && safeUrl(v.url); });

    if (featured.length) {
      var ph = list.querySelector('.media-placeholder');
      if (ph) ph.remove();
      featured.forEach(function (v) {
        var c = document.createElement('article');
        c.className = 'video-card reveal in';
        c.innerHTML = '<span class="vc-label"></span>' +
          '<a class="vc-cover" rel="noopener" target="_blank"></a>' +
          '<h3></h3><p></p>' +
          '<div class="vc-meta"><span class="vc-kind"></span><span class="vc-platform"></span></div>' +
          '<a class="vc-btn" rel="noopener" target="_blank"></a>';
        c.querySelector('.vc-label').textContent = '(' + (v.label || v.platform || 'video') + ')';
        var cover = c.querySelector('.vc-cover');
        cover.href = v.url;
        cover.setAttribute('aria-label', 'Watch: ' + v.title + ' (' + (v.platform || 'external link') + ')');
        if (v.thumb) {
          var img = document.createElement('img');
          img.loading = 'lazy';
          img.src = v.thumb;
          img.alt = '';
          cover.appendChild(img);
        } else {
          cover.classList.add('text');
          cover.textContent = v.kind || 'Video';
        }
        c.querySelector('h3').textContent = v.title;
        c.querySelector('p').textContent = v.description || '';
        c.querySelector('.vc-kind').textContent = v.kind || 'Video';
        c.querySelector('.vc-platform').textContent = v.platform || 'external';
        var btn = c.querySelector('.vc-btn');
        btn.href = v.url;
        btn.textContent = 'Watch on ' + (v.platform || 'the source') + ' ↗';
        list.appendChild(c);
      });
    }

    if (archived.length) {
      var empty = document.getElementById('vaEmpty');
      var ul = document.getElementById('vaList');
      if (empty) empty.remove();
      ul.hidden = false;
      archived.forEach(function (v) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="va-title"></span><span class="va-kind"></span>' +
          '<a rel="noopener" target="_blank"></a>';
        li.querySelector('.va-title').textContent = v.title;
        li.querySelector('.va-kind').textContent = v.kind || '';
        var a = li.querySelector('a');
        a.href = v.url;
        a.textContent = 'watch ↗';
        ul.appendChild(li);
      });
    }
  }

  function renderAudio(items) {
    var list = document.getElementById('audioList');
    var featured = items.filter(function (a) { return !a.archived; });
    var archived = items.filter(function (a) { return a.archived; });

    if (featured.length) {
      var ph = list.querySelector('.media-placeholder');
      if (ph) ph.remove();
      featured.forEach(function (a) {
        var c = document.createElement('article');
        c.className = 'ao-card reveal in';
        c.innerHTML = '<div class="ao-frame">' +
          '<img class="ao-cover" loading="lazy" alt="">' +
          '<p class="ao-desc"></p>' +
          '<audio controls preload="none"></audio></div>' +
          '<div class="ao-bar"><h3></h3><span class="ao-meta"></span></div>';
        var img = c.querySelector('img');
        if (a.cover) { img.src = a.cover; } else { img.remove(); }
        c.querySelector('.ao-desc').textContent = a.description || '';
        c.querySelector('audio').src = a.file;
        c.querySelector('h3').textContent = a.title;
        c.querySelector('.ao-meta').textContent =
          ['AI-made' + (a.made ? ' · ' + a.made : ''), a.duration, fmtDate(a.date)]
            .filter(Boolean).join(' · ');
        list.appendChild(c);
      });
    }

    if (archived.length) {
      var empty = document.getElementById('aaEmpty');
      var ul = document.getElementById('aaList');
      if (empty) empty.remove();
      ul.hidden = false;
      archived.forEach(function (a) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="va-title"></span><span class="va-kind"></span>' +
          '<a rel="noopener" target="_blank"></a>';
        li.querySelector('.va-title').textContent = a.title;
        li.querySelector('.va-kind').textContent =
          [a.duration, fmtDate(a.date)].filter(Boolean).join(' · ');
        var link = li.querySelector('a');
        link.href = a.file;
        link.textContent = 'listen ↗';
        ul.appendChild(li);
      });
    }
  }

  function renderGallery(items) {
    var grid = document.getElementById('photoGrid');
    if (!items.length) return;
    var ph = grid.querySelector('.media-placeholder');
    if (ph) ph.remove();
    grid.classList.remove('media-grid');
    grid.classList.add('media-photos');
    var cols = [0.05, 0.12].map(function (speed) {
      var c = document.createElement('div');
      c.className = 'photo-col';
      c.setAttribute('data-drift', String(speed));
      grid.appendChild(c);
      return c;
    });
    items.forEach(function (g, i) {
      var fig = document.createElement('figure');
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.src = g.file;
      img.alt = g.caption || g.title || 'Photo';
      var cap = document.createElement('figcaption');
      cap.textContent = g.caption || g.title || '';
      fig.appendChild(img);
      fig.appendChild(cap);
      cols[i % 2].appendChild(fig);
    });
    enableDrift(cols);
  }

  /* gallery drift — columns slide at slightly different rates on scroll.
     CSSOM only (strict CSP); disabled under prefers-reduced-motion. */
  function enableDrift(cols) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var section = document.getElementById('gallerySection');
    if (!section) return;
    var ticking = false;
    function update() {
      ticking = false;
      var r = section.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var progress = r.top - window.innerHeight / 2;
      cols.forEach(function (c) {
        var speed = parseFloat(c.getAttribute('data-drift')) || 0;
        c.style.transform = 'translate3d(0,' + (-progress * speed).toFixed(1) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  fetch('data/media.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      renderVideos(data.videos || []);
      renderAudio(data.audio || []);
      renderGallery(data.gallery || []);
    })
    .catch(function () { /* placeholders remain; the dev-block explains */ });

  /* type selector — highlight the section currently in view */
  (function () {
    var links = document.querySelectorAll('.media-select a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (l) { map[l.getAttribute('href').slice(1)] = l; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('active'); });
        map[e.target.id].classList.add('active');
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  })();
})();
