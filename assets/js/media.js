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
    items.forEach(function (a) {
      var c = card();
      c.innerHTML = '<span class="date"></span><h3></h3><p></p>' +
        '<audio controls preload="none"></audio>';
      c.querySelector('.date').textContent =
        fmtDate(a.date) + (a.duration ? ' · ' + a.duration : '');
      c.querySelector('h3').textContent = a.title;
      c.querySelector('p').textContent = a.description || '';
      c.querySelector('audio').src = a.file;
      list.appendChild(c);
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
})();
