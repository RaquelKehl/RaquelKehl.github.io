/* ═══════════════════════════════════════════════════════════════
   LIQUID COPPER — main.js
   Hero engine (fluid · nodes · adaptive type), theme toggle,
   scroll reveals, counters, navigation. Zero dependencies.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ---------- site config (set before deploying) ---------- */
  var SITE_CONFIG = window.SITE_CONFIG = {
    githubUsername: '',            // e.g. 'raquelkehl' — fills the footer GitHub link
    workerBaseUrl: '',             // Cloudflare Worker base URL, used from Batch 5 on
    formspreeEndpoint: ''          // e.g. 'https://formspree.io/f/xxxxxxx' — until the Worker route exists
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══════════ theme toggle (250ms cross-fade via CSS transition) ═══════════ */
  var themeToggle = document.getElementById('themeToggle');
  function applyThemeButton() {
    var dark = document.documentElement.getAttribute('data-theme') !== 'light';
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggle.textContent = dark ? '◐' : '◑';
    }
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('rk-theme', next); } catch (e) { /* private mode */ }
      applyThemeButton();
    });
    applyThemeButton();
  }

  /* ═══════════ header: solid after leaving the hero ═══════════ */
  var header = document.getElementById('siteHeader');
  var headerSolid = header && header.hasAttribute('data-solid');
  function onScroll() {
    if (header) header.classList.toggle('scrolled', headerSolid || window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ═══════════ mobile nav ═══════════ */
  var navToggle = document.getElementById('navToggle');
  var siteNav = document.getElementById('siteNav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      var open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    siteNav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ═══════════ footer: year + configured GitHub link ═══════════ */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  var gh = document.getElementById('githubLink');
  if (gh && SITE_CONFIG.githubUsername) {
    gh.href = 'https://github.com/' + SITE_CONFIG.githubUsername;
    gh.hidden = false;
  }

  /* ═══════════ scroll reveals (24px translate + fade, 500ms) ═══════════ */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window && !reduced) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          revealIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { revealIO.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ═══════════ animated counters ═══════════ */
  var stats = document.querySelectorAll('.stat-num[data-count]');
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced || target === 0) { el.textContent = target + suffix; return; }
    var start = null, dur = 1100;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (stats.length && 'IntersectionObserver' in window) {
    var statIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          animateCount(en.target);
          statIO.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    stats.forEach(function (el) { statIO.observe(el); });
  }

  /* ═══════════ magnetic primary CTA (6px max) ═══════════ */
  if (!reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        var dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        btn.style.transform = 'translate(' + (dx * 6) + 'px,' + (dy * 6) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }

  /* ═══════════ film grain (static texture, generated once) ═══════════ */
  (function () {
    var grains = document.querySelectorAll('.grain');
    if (!grains.length) return;
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d'), d = x.createImageData(128, 128);
    for (var i = 0; i < d.data.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 16;
    }
    x.putImageData(d, 0, 0);
    var url = 'url(' + c.toDataURL() + ')';
    grains.forEach(function (el) { el.style.backgroundImage = url; });
  })();

  /* ═══════════ hero engine ═══════════ */
  function initHero(stage) {
    var mx = -1e4, my = -1e4, hasMouse = false;
    stage.addEventListener('mousemove', function (e) { hasMouse = true; mx = e.clientX; my = e.clientY; });
    stage.addEventListener('mouseleave', function () { mx = -1e4; my = -1e4; });

    var kEl = stage.querySelector('.K');
    var kState = kEl ? { el: kEl, w: 380, target: 380, min: 380, max: 490, slope: .6 } : null;
    var ehlLetters = Array.prototype.slice.call(stage.querySelectorAll('.ehl span'))
      .map(function (el) { return { el: el, w: 300, target: 300, min: 300, max: 420, slope: 1.1 }; });
    var raquelWord = stage.querySelector('.glowable');

    var fcanvas = stage.querySelector('canvas.fluid');
    var fctx = fcanvas ? fcanvas.getContext('2d') : null;
    var SCALE = .22, running = true, t = Math.random() * 100, cmx = .5, cmy = .5;
    var blobs = [
      { hi: '242,201,160', lo: '232,149,86', r: .46, x: .28, y: .66, ax: .20, ay: .13, fx: .58, fy: .74, p: 0, a: .66 },
      { hi: '232,149,86', lo: '199,123,61', r: .55, x: .72, y: .34, ax: .17, ay: .16, fx: .66, fy: .50, p: 2.1, a: .6 },
      { hi: '199,123,61', lo: '168, 99,42', r: .40, x: .50, y: .82, ax: .14, ay: .11, fx: .46, fy: .62, p: 4.2, a: .56 },
      { hi: '242,201,160', lo: '232,149,86', r: .20, x: .58, y: .44, ax: .24, ay: .19, fx: .82, fy: .94, p: 1.3, a: .46 }
    ];
    function fresize() {
      if (!fcanvas) return;
      fcanvas.width = Math.max(2, stage.offsetWidth * SCALE);
      fcanvas.height = Math.max(2, stage.offsetHeight * SCALE);
    }
    fresize(); window.addEventListener('resize', fresize);

    var nc = stage.querySelector('canvas.nodes');
    var nx = nc ? nc.getContext('2d') : null;
    function nresize() { if (nc) { nc.width = stage.offsetWidth; nc.height = stage.offsetHeight; } }
    nresize(); window.addEventListener('resize', nresize);
    var N = 22, nodes = [];
    for (var j = 0; j < N; j++) {
      nodes.push({
        x: Math.random(), y: Math.random(),
        vx: (Math.random() - .5) * .0005, vy: (Math.random() - .5) * .0005,
        r: 1 + Math.random() * 1.5
      });
    }

    function drawNodes(interactive) {
      var nw = nc.width, nh = nc.height;
      nx.clearRect(0, 0, nw, nh);
      var srect = stage.getBoundingClientRect();
      var lmx = mx - srect.left, lmy = my - srect.top;
      nx.lineWidth = .6;
      for (var a = 0; a < N; a++) {
        for (var b2 = a + 1; b2 < N; b2++) {
          var dx = (nodes[a].x - nodes[b2].x) * nw, dy = (nodes[a].y - nodes[b2].y) * nh;
          var dd = Math.hypot(dx, dy);
          if (dd < 125) {
            nx.strokeStyle = 'rgba(199,123,61,' + (.17 * (1 - dd / 125)).toFixed(3) + ')';
            nx.beginPath();
            nx.moveTo(nodes[a].x * nw, nodes[a].y * nh);
            nx.lineTo(nodes[b2].x * nw, nodes[b2].y * nh);
            nx.stroke();
          }
        }
      }
      for (var a2 = 0; a2 < N; a2++) {
        var n = nodes[a2], px = n.x * nw, py = n.y * nh;
        var near = interactive && hasMouse && mx > -1e3
          ? Math.max(0, 1 - Math.hypot(lmx - px, lmy - py) / 220) : 0;
        nx.fillStyle = 'rgba(' + (near > .1 ? '242,201,160' : '150,160,176') + ',' + (.28 + near * .6).toFixed(2) + ')';
        nx.beginPath(); nx.arc(px, py, n.r + near * 1.4, 0, Math.PI * 2); nx.fill();
      }
    }

    if (reduced) { if (nx) drawNodes(false); return; }

    function frame() {
      if (running) {
        t += 1 / 60;

        /* fluid — leans towards the cursor */
        if (fctx) {
          var srect0 = stage.getBoundingClientRect();
          var tmx = hasMouse && mx > -1e3 ? (mx - srect0.left) / srect0.width : .5;
          var tmy = hasMouse && my > -1e3 ? (my - srect0.top) / srect0.height : .5;
          cmx += (tmx - cmx) * .04; cmy += (tmy - cmy) * .04;
          var w = fcanvas.width, h = fcanvas.height;
          fctx.filter = 'none';
          fctx.globalCompositeOperation = 'source-over';
          fctx.fillStyle = '#0B0E14';
          fctx.fillRect(0, 0, w, h);
          fctx.filter = 'blur(' + Math.round(16 * Math.min(w / 300, 1) + 7) + 'px)';
          fctx.globalCompositeOperation = 'lighter';
          for (var i = 0; i < blobs.length; i++) {
            var b = blobs[i];
            var cx = (b.x + (cmx - .5) * .16 + Math.sin(t * b.fx * (Math.PI / 5) + b.p) * b.ax) * w;
            var cy = (b.y + (cmy - .5) * .12 + Math.cos(t * b.fy * (Math.PI / 5) + b.p) * b.ay) * h;
            var r = b.r * Math.min(w, h) * (1 + .1 * Math.sin(t * .6 + b.p));
            var g = fctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, 'rgba(' + b.hi + ',' + b.a + ')');
            g.addColorStop(.45, 'rgba(' + b.lo + ',' + (b.a * .55) + ')');
            g.addColorStop(1, 'rgba(' + b.lo + ',0)');
            fctx.fillStyle = g;
            fctx.beginPath(); fctx.arc(cx, cy, r, 0, Math.PI * 2); fctx.fill();
          }
        }

        /* adaptive type — K and ehl ride their weight axes */
        var all = (kState ? [kState] : []).concat(ehlLetters);
        for (var i2 = 0; i2 < all.length; i2++) {
          var L = all[i2], bb = L.el.getBoundingClientRect();
          var lcx = bb.left + bb.width / 2, lcy = bb.top + bb.height / 2;
          if (hasMouse && mx > -1e3) {
            var d = Math.hypot(mx - lcx, my - lcy);
            L.target = Math.max(L.min, Math.min(L.max, L.max - d * L.slope));
          } else {
            /* ambient breathing on touch devices */
            L.target = L.min + (L.max - L.min) * .3 * (.5 + .5 * Math.sin(t * .9 + i2 * .65));
          }
          L.w += (L.target - L.w) * .13;
          var gl = (L.w - L.min) / (L.max - L.min);
          L.el.style.fontVariationSettings = '"wght" ' + Math.round(L.w);
          L.el.style.textShadow = gl > .04
            ? '0 0 ' + Math.round(gl * 18) + 'px rgba(232,149,86,' + (gl * .38).toFixed(2) + ')'
            : 'none';
        }
        /* Raquel answers with glow alone — the italic stays untouched */
        if (raquelWord) {
          var bbr = raquelWord.getBoundingClientRect();
          var g3 = 0;
          if (hasMouse && mx > -1e3) {
            var d3 = Math.hypot(mx - (bbr.left + bbr.width / 2), my - (bbr.top + bbr.height / 2));
            g3 = Math.max(0, 1 - d3 / 260);
          } else {
            g3 = .12 * (.5 + .5 * Math.sin(t * .9));
          }
          raquelWord.style.textShadow = g3 > .04
            ? '0 0 ' + Math.round(g3 * 22) + 'px rgba(242,201,160,' + (g3 * .45).toFixed(2) + ')'
            : 'none';
        }

        /* node field */
        if (nx) {
          for (var a = 0; a < N; a++) {
            var n = nodes[a];
            n.x += n.vx + Math.sin(t * .3 + a) * .00012;
            n.y += n.vy + Math.cos(t * .25 + a) * .0001;
            if (n.x < 0) n.x += 1; if (n.x > 1) n.x -= 1;
            if (n.y < 0) n.y += 1; if (n.y > 1) n.y -= 1;
          }
          drawNodes(true);
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    /* pause the whole engine when the hero leaves the viewport */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { running = en[0].isIntersecting; },
        { threshold: .05 }).observe(stage);
    }
  }

  var hero = document.querySelector('.hero');
  if (hero) initHero(hero);

  /* ═══════════ portfolio: category filter ═══════════ */
  var filterBar = document.querySelector('.filter-bar');
  if (filterBar) {
    var filterBtns = filterBar.querySelectorAll('.filter-btn');
    var projCards = document.querySelectorAll('.proj-card');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        var cat = btn.getAttribute('data-filter');
        projCards.forEach(function (card) {
          var cats = (card.getAttribute('data-cats') || '').split(' ');
          card.hidden = cat !== 'all' && cats.indexOf(cat) === -1;
        });
      });
    });
  }

  /* ═══════════ contact form ═══════════ */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var submitBtn = form.querySelector('button[type="submit"]');
    function showStatus(cls, html) {
      status.className = 'form-status show ' + cls;
      status.innerHTML = html;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var endpoint = SITE_CONFIG.workerBaseUrl
        ? SITE_CONFIG.workerBaseUrl.replace(/\/+$/, '') + '/api/contact'
        : SITE_CONFIG.formspreeEndpoint;
      if (!endpoint) {
        showStatus('ok',
          '<strong>The secure contact route is being provisioned</strong> — a serverless relay that keeps ' +
          'every address off the public page. Until it goes live, the fastest way to reach me is ' +
          '<a href="https://www.linkedin.com/in/raquel-kehl-furukawa" rel="noopener" target="_blank">LinkedIn</a> — ' +
          'your message is safe to paste there.');
        return;
      }
      submitBtn.disabled = true;
      var data = new FormData(form);
      fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          showStatus('ok', 'Message sent — thank you. I usually reply within two working days.');
        } else {
          showStatus('err', 'Sending failed. Please try again, or reach me on ' +
            '<a href="https://www.linkedin.com/in/raquel-kehl-furukawa" rel="noopener" target="_blank">LinkedIn</a>.');
        }
      }).catch(function () {
        showStatus('err', 'Network error — please try again later.');
      }).finally(function () {
        submitBtn.disabled = false;
      });
    });
  }
})();
