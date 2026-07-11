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

  function card() {
    var el = document.createElement('article');
    el.className = 'media-card reveal in';
    return el;
  }

  function renderVideos(items) {
    var list = document.getElementById('videoList');
    if (!items.length) return;
    var ph = list.querySelector('.media-placeholder');
    if (ph) ph.remove();
    items.forEach(function (v) {
      var c = card();
      c.innerHTML = '<span class="date"></span><h3></h3><p></p>' +
        '<a class="ext" rel="noopener" target="_blank">Watch ↗</a>';
      c.querySelector('.date').textContent = fmtDate(v.date);
      c.querySelector('h3').textContent = v.title;
      c.querySelector('p').textContent = v.description || '';
      var a = c.querySelector('a');
      if (/^https:\/\//.test(v.url || '')) {
        a.href = v.url;
        a.textContent = 'Watch on ' + (v.platform || 'YouTube') + ' ↗';
      } else {
        a.remove();
      }
      list.appendChild(c);
    });
  }

  function renderAudio(items) {
    var list = document.getElementById('audioList');
    if (!items.length) return;
    var ph = list.querySelector('.media-placeholder');
    if (ph) ph.remove();
    items.forEach(function (a, i) {
      var row = document.createElement('li');
      row.className = 'edition-row reveal in';
      row.innerHTML = '<span class="no" aria-hidden="true"></span>' +
        '<div class="ebody"><span class="meta"></span><h3></h3><p></p>' +
        '<audio controls preload="none"></audio></div>';
      row.querySelector('.no').textContent = ('00' + (i + 1)).slice(-3);
      row.querySelector('.meta').textContent =
        fmtDate(a.date) + (a.duration ? ' · ' + a.duration : '');
      row.querySelector('h3').textContent = a.title;
      row.querySelector('p').textContent = a.description || '';
      row.querySelector('audio').src = a.file;
      list.appendChild(row);
    });
  }

  function renderGallery(items) {
    var grid = document.getElementById('photoGrid');
    if (!items.length) return;
    var ph = grid.querySelector('.media-placeholder');
    if (ph) ph.remove();
    grid.classList.remove('media-grid');
    grid.classList.add('media-photos');
    items.forEach(function (g) {
      var fig = document.createElement('figure');
      var img = document.createElement('img');
      img.loading = 'lazy';
      img.src = g.file;
      img.alt = g.caption || g.title || 'Photo';
      var cap = document.createElement('figcaption');
      cap.textContent = g.caption || g.title || '';
      fig.appendChild(img);
      fig.appendChild(cap);
      grid.appendChild(fig);
    });
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
