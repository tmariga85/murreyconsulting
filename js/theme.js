/* ===== Dark / light theme (runs early to avoid flash; injects nav toggle) ===== */
(function () {
  'use strict';
  // 1) Apply saved/preferred theme immediately (this script is in <head>)
  try {
    var saved = localStorage.getItem('mc-theme');
    if (saved === 'dark' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (e) {}

  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function isDark() { return document.documentElement.getAttribute('data-theme') === 'dark'; }
  function setIcon(btn) { btn.innerHTML = isDark() ? SUN : MOON; btn.setAttribute('aria-pressed', String(isDark())); }

  function init() {
    var nav = document.getElementById('navLinks');
    if (!nav || document.getElementById('themeToggle')) return;
    var btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    setIcon(btn);
    var cta = nav.querySelector('.nav-cta');
    if (cta) nav.insertBefore(btn, cta); else nav.appendChild(btn);
    btn.addEventListener('click', function () {
      if (isDark()) { document.documentElement.removeAttribute('data-theme'); try { localStorage.setItem('mc-theme', 'light'); } catch (e) {} }
      else { document.documentElement.setAttribute('data-theme', 'dark'); try { localStorage.setItem('mc-theme', 'dark'); } catch (e) {} }
      setIcon(btn);
    });
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
