/* ═══════════════════════════════════════════════════════════════
   PIPELINE — a data-flow puzzle (game.js)
   Rotate scrambled network tiles until every endpoint connects to
   the core. Vanilla Canvas 2D, zero dependencies, theme-aware,
   keyboard-playable, LocalStorage best scores.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- directions as bitmask: N=1 E=2 S=4 W=8 ---------- */
  var DIRS = [1, 2, 4, 8];
  var DX = { 1: 0, 2: 1, 4: 0, 8: -1 };
  var DY = { 1: -1, 2: 0, 4: 1, 8: 0 };
  var OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
  function rotCW(mask) { return ((mask << 1) | (mask >> 3)) & 15; }
  function rotN(mask, n) { for (var i = 0; i < n; i++) mask = rotCW(mask); return mask; }

  /* ---------- levels ---------- */
  var LEVELS = [
    { w: 5, h: 4 }, { w: 6, h: 5 }, { w: 7, h: 5 }, { w: 8, h: 6 }, { w: 9, h: 6 }
  ];
  var level = 0, W = 0, H = 0;
  var sol = [], cur = [], startRot = [];      /* solution masks, current masks, initial scrambled */
  var src = 0, endpoints = [], connected = [];
  var moves = 0, par = 0, solved = false;
  var cursor = { x: 0, y: 0 };
  var packets = [], animId = null, lastTs = 0;

  /* ---------- theme colors from tokens ---------- */
  var C = {};
  function readColors() {
    var s = getComputedStyle(document.documentElement);
    function v(n) { return s.getPropertyValue(n).trim(); }
    C = {
      live: v('--chart-1'), core: v('--chart-2'), packet: v('--chart-3'),
      dead: v('--faint'), cellLine: v('--line'), cellBg: v('--surface'),
      cursor: v('--accent'), text: v('--text')
    };
  }

  /* ---------- maze generation (randomised DFS spanning tree) ---------- */
  function generate() {
    W = LEVELS[level].w; H = LEVELS[level].h;
    var n = W * H;
    sol = new Array(n); cur = new Array(n); startRot = new Array(n);
    for (var i = 0; i < n; i++) sol[i] = 0;

    var visited = new Array(n), stack = [];
    for (i = 0; i < n; i++) visited[i] = false;
    src = Math.floor(H / 2) * W + Math.floor(W / 2);
    visited[src] = true; stack.push(src);
    while (stack.length) {
      var c = stack[stack.length - 1];
      var cx = c % W, cy = Math.floor(c / W);
      var options = [];
      for (var d = 0; d < 4; d++) {
        var dir = DIRS[d], nx = cx + DX[dir], ny = cy + DY[dir];
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && !visited[ny * W + nx]) {
          options.push(dir);
        }
      }
      if (!options.length) { stack.pop(); continue; }
      var pick = options[(Math.random() * options.length) | 0];
      var ni = (cy + DY[pick]) * W + (cx + DX[pick]);
      sol[c] |= pick; sol[ni] |= OPP[pick];
      visited[ni] = true; stack.push(ni);
    }

    /* endpoints = leaves of the tree (degree 1), excluding the core */
    endpoints = [];
    for (i = 0; i < n; i++) {
      var deg = 0;
      for (d = 0; d < 4; d++) if (sol[i] & DIRS[d]) deg++;
      if (deg === 1 && i !== src) endpoints.push(i);
    }

    /* scramble + compute par (minimal CW rotations back to the solution shape) */
    par = 0;
    for (i = 0; i < n; i++) {
      var r = (Math.random() * 4) | 0;
      cur[i] = rotN(sol[i], r);
      startRot[i] = cur[i];
      var need = 4;
      for (var k = 0; k < 4; k++) if (rotN(cur[i], k) === sol[i]) { need = k; break; }
      par += need;
    }
    /* a fully-solved scramble is a dull level — nudge one tile */
    if (par === 0 && n > 1) {
      var t = (src + 1) % n;
      cur[t] = rotCW(cur[t]); startRot[t] = cur[t];
      for (k = 0; k < 4; k++) if (rotN(cur[t], k) === sol[t]) { par = k; break; }
    }

    moves = 0; solved = false; packets = [];
    cursor.x = src % W; cursor.y = Math.floor(src / W);
    updateConnectivity();
    hud();
    hideOverlay();
  }

  /* ---------- connectivity (BFS from the core) ---------- */
  function updateConnectivity() {
    var n = W * H;
    connected = new Array(n);
    for (var i = 0; i < n; i++) connected[i] = false;
    var q = [src]; connected[src] = true;
    while (q.length) {
      var c = q.shift(), cx = c % W, cy = Math.floor(c / W);
      for (var d = 0; d < 4; d++) {
        var dir = DIRS[d];
        if (!(cur[c] & dir)) continue;
        var nx = cx + DX[dir], ny = cy + DY[dir];
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        var ni = ny * W + nx;
        if (connected[ni] || !(cur[ni] & OPP[dir])) continue;
        connected[ni] = true; q.push(ni);
      }
    }
    var all = true;
    for (i = 0; i < n; i++) if (!connected[i]) { all = false; break; }
    if (all && !solved) win();
  }

  /* ---------- win ---------- */
  function bestKey() { return 'rk-pipeline-best-' + level; }
  function win() {
    solved = true;
    var best = parseInt(localStorage.getItem(bestKey()) || '0', 10);
    var isRecord = !best || moves < best;
    if (isRecord) { try { localStorage.setItem(bestKey(), String(moves)); } catch (e) {} }
    var eff = Math.min(100, Math.round((par / Math.max(1, moves)) * 100));
    var stats = moves + ' moves · par ' + par + ' · efficiency ' + eff + '%' +
      (isRecord ? ' · new personal best' : ' · best ' + best);
    document.getElementById('ovStats').textContent = stats;
    hud();
    buildPackets();
    showOverlayLater();
    if (!reduced && !animId) { lastTs = 0; animId = requestAnimationFrame(tick); }
    render();
  }
  var overlayTimer = null;
  function showOverlayLater() {
    /* let the player watch the packets flow for a beat before the dialog */
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(function () {
      document.getElementById('gameOverlay').classList.add('show');
      document.getElementById('btnNext').focus();
    }, reduced ? 0 : 1400);
  }
  function hideOverlay() {
    clearTimeout(overlayTimer);
    document.getElementById('gameOverlay').classList.remove('show');
  }

  /* ---------- packets (win animation) ---------- */
  function buildPackets() {
    packets = [];
    if (reduced) return;
    /* BFS parents over the solved network */
    var n = W * H, parent = new Array(n), seen = new Array(n);
    for (var i = 0; i < n; i++) { parent[i] = -1; seen[i] = false; }
    var q = [src]; seen[src] = true;
    while (q.length) {
      var c = q.shift(), cx = c % W, cy = Math.floor(c / W);
      for (var d = 0; d < 4; d++) {
        var dir = DIRS[d];
        if (!(cur[c] & dir)) continue;
        var nx = cx + DX[dir], ny = cy + DY[dir];
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
        var ni = ny * W + nx;
        if (seen[ni] || !(cur[ni] & OPP[dir])) continue;
        seen[ni] = true; parent[ni] = c; q.push(ni);
      }
    }
    endpoints.forEach(function (ep, idx) {
      var path = [], node = ep;
      while (node !== -1) { path.unshift(node); node = parent[node]; }
      packets.push({ path: path, p: -(idx * 0.7), speed: 3 });
    });
  }
  function tick(ts) {
    if (!solved) { animId = null; return; }
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, (ts - lastTs) / 1000); lastTs = ts;
    packets.forEach(function (pk) {
      pk.p += pk.speed * dt;
      if (pk.p > pk.path.length - 1 + 1.5) pk.p = -0.5;
    });
    render();
    animId = requestAnimationFrame(tick);
  }

  /* ---------- rendering ---------- */
  var tile = 0, pad = 0, dpr = 1;
  function resize() {
    var cssW = canvas.parentElement.getBoundingClientRect().width - 2 * 17.6; /* stage padding */
    cssW = Math.max(240, Math.min(cssW, 820));
    dpr = window.devicePixelRatio || 1;
    tile = Math.floor(cssW / W);
    var cssH = tile * H;
    canvas.style.width = (tile * W) + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = tile * W * dpr;
    canvas.height = cssH * dpr;
    render();
  }
  function center(i) {
    return { x: (i % W) * tile + tile / 2, y: Math.floor(i / W) * tile + tile / 2 };
  }
  function render() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, tile * W, tile * H);
    var lw = Math.max(4, tile * 0.16);

    for (var i = 0; i < W * H; i++) {
      var cx = (i % W) * tile, cy = Math.floor(i / W) * tile;
      /* cell */
      ctx.strokeStyle = C.cellLine;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + .5, cy + .5, tile - 1, tile - 1);
      /* pipes */
      var live = connected[i];
      ctx.strokeStyle = live ? C.live : C.dead;
      ctx.globalAlpha = live ? 1 : .55;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      var mx = cx + tile / 2, my = cy + tile / 2;
      for (var d = 0; d < 4; d++) {
        var dir = DIRS[d];
        if (!(cur[i] & dir)) continue;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + DX[dir] * tile / 2, my + DY[dir] * tile / 2);
        ctx.stroke();
      }
      /* node */
      ctx.globalAlpha = 1;
      if (i === src) {
        ctx.fillStyle = C.core;
        ctx.beginPath(); ctx.arc(mx, my, lw * 1.15, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.core; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(mx, my, lw * 1.8, 0, Math.PI * 2); ctx.stroke();
      } else if (endpoints.indexOf(i) !== -1) {
        ctx.fillStyle = live ? C.live : C.dead;
        var s = lw * 1.5;
        ctx.fillRect(mx - s / 2, my - s / 2, s, s);
      } else {
        ctx.fillStyle = live ? C.live : C.dead;
        ctx.beginPath(); ctx.arc(mx, my, lw * .55, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* packets */
    if (solved && packets.length) {
      ctx.fillStyle = C.packet;
      packets.forEach(function (pk) {
        if (pk.p < 0 || pk.p > pk.path.length - 1) return;
        var a = Math.floor(pk.p), b = Math.min(pk.path.length - 1, a + 1);
        var f = pk.p - a;
        var pa = center(pk.path[a]), pb = center(pk.path[b]);
        var px = pa.x + (pb.x - pa.x) * f, py = pa.y + (pb.y - pa.y) * f;
        ctx.beginPath(); ctx.arc(px, py, Math.max(3, tile * .08), 0, Math.PI * 2); ctx.fill();
      });
    }

    /* keyboard cursor */
    if (document.activeElement === canvas) {
      ctx.strokeStyle = C.cursor;
      ctx.lineWidth = 2;
      ctx.strokeRect(cursor.x * tile + 2, cursor.y * tile + 2, tile - 4, tile - 4);
    }
  }

  /* ---------- HUD ---------- */
  function hud() {
    document.getElementById('hudLevel').textContent = String(level + 1);
    document.getElementById('hudMoves').textContent = String(moves);
    document.getElementById('hudPar').textContent = String(par);
    var best = localStorage.getItem(bestKey());
    document.getElementById('hudBest').textContent = best ? best + ' moves' : '—';
  }

  /* ---------- input ---------- */
  function rotateAt(x, y) {
    if (solved) return;
    var i = y * W + x;
    cur[i] = rotCW(cur[i]);
    moves++;
    updateConnectivity();
    hud();
    render();
  }
  canvas.addEventListener('click', function (e) {
    var r = canvas.getBoundingClientRect();
    var x = Math.floor((e.clientX - r.left) / tile);
    var y = Math.floor((e.clientY - r.top) / tile);
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    cursor.x = x; cursor.y = y;
    rotateAt(x, y);
  });
  canvas.addEventListener('keydown', function (e) {
    var handled = true;
    switch (e.key) {
      case 'ArrowUp':    cursor.y = Math.max(0, cursor.y - 1); break;
      case 'ArrowDown':  cursor.y = Math.min(H - 1, cursor.y + 1); break;
      case 'ArrowLeft':  cursor.x = Math.max(0, cursor.x - 1); break;
      case 'ArrowRight': cursor.x = Math.min(W - 1, cursor.x + 1); break;
      case 'Enter': case ' ': rotateAt(cursor.x, cursor.y); break;
      case 'r': case 'R': restart(); break;
      case 'n': case 'N': generate(); resize(); break;
      default: handled = false;
    }
    if (handled) { e.preventDefault(); render(); }
  });
  canvas.addEventListener('focus', render);
  canvas.addEventListener('blur', render);

  /* ---------- controls ---------- */
  function restart() {
    cur = startRot.slice();
    moves = 0; solved = false; packets = [];
    updateConnectivity(); hud(); hideOverlay(); render();
  }
  document.getElementById('btnRestart').addEventListener('click', restart);
  document.getElementById('btnNew').addEventListener('click', function () { generate(); resize(); });
  document.getElementById('btnReplay').addEventListener('click', restart);
  document.getElementById('btnNext').addEventListener('click', function () {
    level = (level + 1) % LEVELS.length;
    generate(); resize();
    canvas.focus();
  });

  /* ---------- theme + resize ---------- */
  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      setTimeout(function () { readColors(); render(); }, 60);
    });
  }
  window.addEventListener('resize', resize);

  /* ---------- parallax intro (CSSOM only — strict CSP) ---------- */
  (function () {
    var plx = document.querySelector('.plx');
    if (!plx) return;
    /* place the decorative shapes from data-pos="x,y" (percentages) */
    plx.querySelectorAll('.plx-shape').forEach(function (s) {
      var p = (s.getAttribute('data-pos') || '0,0').split(',');
      s.style.left = p[0] + '%';
      s.style.top = p[1] + '%';
    });
    if (reduced) return;
    var layers = plx.querySelectorAll('.plx-layer');
    var ticking = false;
    function update() {
      ticking = false;
      var r = plx.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var progress = r.top - window.innerHeight / 2;
      layers.forEach(function (l) {
        var speed = parseFloat(l.getAttribute('data-plx')) || 0;
        l.style.transform = 'translate3d(0,' + (-progress * speed).toFixed(1) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---------- boot ---------- */
  readColors();
  generate();
  resize();

  /* dev-only test hook — inert outside local preview */
  if (/^(127\.0\.0\.1|localhost)$/.test(window.location.hostname)) {
    window.__pipeline = {
      solve: function () { cur = sol.slice(); updateConnectivity(); render(); },
      state: function () { return { level: level, moves: moves, par: par, solved: solved }; }
    };
  }
})();
