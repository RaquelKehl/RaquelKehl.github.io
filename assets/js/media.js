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

  /* gallery — film-strip reel: snap-scrolling frames, active title, dots.
     CSSOM only (strict CSP); depth effect off under prefers-reduced-motion. */
  function renderGallery(items) {
    var featured = items.filter(function (g) { return !g.archived; });
    var archived = items.filter(function (g) { return g.archived; });

    if (featured.length) {
      var ph = document.querySelector('#photoGrid .media-placeholder');
      if (ph) ph.remove();
      var reel = document.getElementById('photoReel');
      reel.hidden = false;
      var strip = document.getElementById('reelStrip');
      var dots = document.getElementById('reelDots');
      var titleEl = document.getElementById('reelTitle');
      var tagEl = document.getElementById('reelTag');
      var linkEl = document.getElementById('reelLink');
      var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var frames = [], active = -1;

      featured.forEach(function (g, i) {
        var fig = document.createElement('figure');
        fig.className = 'frame';
        var img = document.createElement('img');
        img.loading = i < 2 ? 'eager' : 'lazy';
        img.src = g.file;
        img.alt = g.title || 'Photo';
        fig.appendChild(img);
        strip.appendChild(fig);
        frames.push(fig);
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'reel-dot';
        d.setAttribute('tabindex', '-1');
        d.addEventListener('click', function () { goTo(i); });
        dots.appendChild(d);
      });

      function setActive(i) {
        if (i === active) return;
        active = i;
        var g = featured[i];
        titleEl.textContent = g.title || '';
        tagEl.textContent = [g.year, g.tag].filter(Boolean).join(' · ');
        if (g.url) { linkEl.href = g.url; linkEl.hidden = false; }
        else { linkEl.hidden = true; }
        var ds = dots.children;
        for (var k = 0; k < ds.length; k++) ds[k].classList.toggle('on', k === i);
      }

      function update() {
        ticking = false;
        var mid = strip.getBoundingClientRect().left + strip.clientWidth / 2;
        var best = 0, bestD = Infinity;
        frames.forEach(function (f, i) {
          var r = f.getBoundingClientRect();
          var d = Math.abs(r.left + r.width / 2 - mid);
          if (d < bestD) { bestD = d; best = i; }
          if (!reduced) {
            var t = Math.min(1, d / strip.clientWidth);
            f.style.transform = 'scale(' + (1 - t * 0.08).toFixed(3) + ')';
            f.style.opacity = String(1 - t * 0.35);
          }
        });
        setActive(best);
      }
      var ticking = false;
      strip.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      }, { passive: true });
      window.addEventListener('resize', update);

      function goTo(i) {
        i = Math.max(0, Math.min(frames.length - 1, i));
        var f = frames[i];
        strip.scrollTo({
          left: f.offsetLeft - (strip.clientWidth - f.offsetWidth) / 2,
          behavior: reduced ? 'auto' : 'smooth'
        });
        setActive(i); /* update the head immediately — don't trail the scroll */
      }
      document.getElementById('reelPrev').addEventListener('click', function () { goTo(active - 1); });
      document.getElementById('reelNext').addEventListener('click', function () { goTo(active + 1); });
      strip.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { goTo(active - 1); e.preventDefault(); }
        if (e.key === 'ArrowRight') { goTo(active + 1); e.preventDefault(); }
      });
      update();
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
