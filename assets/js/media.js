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
          '<a class="vc-cover" rel="noopener noreferrer" target="_blank"></a>' +
          '<h3></h3><p></p>' +
          '<div class="vc-meta"><span class="vc-kind"></span><span class="vc-platform"></span></div>' +
          '<a class="vc-btn" rel="noopener noreferrer" target="_blank"></a>';
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
          '<a rel="noopener noreferrer" target="_blank"></a>';
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
          '<a rel="noopener noreferrer" target="_blank"></a>';
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

  /* gallery — instagram-style grid: uniform square tiles, quiet captions,
     the whole tile links out when the entry has a url. */
  function renderGallery(items) {
    var featured = items.filter(function (g) { return !g.archived; });
    var archived = items.filter(function (g) { return g.archived; });

    if (featured.length) {
      var wrap = document.getElementById('photoGrid');
      var ph = wrap.querySelector('.media-placeholder');
      if (ph) ph.remove();
      var grid = document.createElement('div');
      grid.className = 'ig-grid';
      featured.forEach(function (g, i) {
        var linked = safeUrl(g.url);
        var tile = document.createElement(linked ? 'a' : 'figure');
        tile.className = 'ig-tile';
        if (linked) {
          tile.href = linked;
          tile.rel = 'noopener noreferrer';
          tile.target = '_blank';
          tile.setAttribute('aria-label', (g.title || 'Photo') + ' — view more');
        }
        var img = document.createElement('img');
        img.loading = i < 3 ? 'eager' : 'lazy';
        img.src = g.file;
        img.alt = g.title || 'Photo';
        tile.appendChild(img);
        var cap = document.createElement('span');
        cap.className = 'ig-cap';
        var b = document.createElement('b');
        b.textContent = (g.title || '') + (linked ? ' ↗' : '');
        var it = document.createElement('i');
        it.textContent = [g.year, g.tag].filter(Boolean).join(' · ');
        cap.appendChild(b);
        cap.appendChild(it);
        tile.appendChild(cap);
        grid.appendChild(tile);
      });
      wrap.appendChild(grid);
    }

    if (archived.length) {
      var empty = document.getElementById('gaEmpty');
      var ul = document.getElementById('gaList');
      if (empty) empty.remove();
      ul.hidden = false;
      archived.forEach(function (g) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="va-title"></span><span class="va-kind"></span>' +
          '<a rel="noopener noreferrer" target="_blank"></a>';
        li.querySelector('.va-title').textContent = g.title;
        li.querySelector('.va-kind').textContent = [g.year, g.tag].filter(Boolean).join(' · ');
        var a = li.querySelector('a');
        a.href = g.url || g.file;
        a.textContent = 'view ↗';
        ul.appendChild(li);
      });
    }
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
