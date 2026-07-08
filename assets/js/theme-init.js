/* Runs synchronously in <head> so the stored theme applies before first paint. */
(function () {
  try {
    var t = localStorage.getItem('rk-theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) { /* storage unavailable — keep the dark default */ }
})();
