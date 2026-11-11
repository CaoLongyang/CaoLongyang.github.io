/* ============================================================
   unroll.js — 手卷展开 + 双语切换
   ============================================================ */

(function () {
  'use strict';

  var OPEN_KEY = 'scroll-opened-v1';
  var LANG_KEY = 'scroll-lang';

  var body = document.body;
  var root = document.documentElement;
  var seal = document.getElementById('seal');
  var skip = document.getElementById('skip');
  var replay = document.getElementById('replay');
  var sealWrap = document.querySelector('.seal-wrap');
  var twineWrap = document.getElementById('twineWrap');
  var langBtns = Array.prototype.slice.call(document.querySelectorAll('[data-lang]'));

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;

  function read(key, fallback) {
    try {
      return localStorage.getItem(key) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      /* 隐私模式写不进去，忽略 */
    }
  }

  seen = read(OPEN_KEY, '') === '1';

  /* ---------------- 双语 ---------------- */

  function applyLang(lang) {
    root.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');

    Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) {
      var text = el.getAttribute('data-' + lang);
      if (text) el.textContent = text;
    });

    langBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
  }

  applyLang(read(LANG_KEY, 'en'));

  langBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var lang = b.getAttribute('data-lang');
      applyLang(lang);
      write(LANG_KEY, lang);
    });
  });

  /* ---------------- 展开 ---------------- */

  function open(instant) {
    if (body.classList.contains('opened')) return;

    if (instant) body.classList.add('instant');

    requestAnimationFrame(function () {
      body.classList.add('opened');
    });

    write(OPEN_KEY, '1');

    if (skip) skip.hidden = true;
    if (seal) seal.setAttribute('tabindex', '-1');
  }

  if (seen || reduced) open(true);

  if (seal) {
    seal.addEventListener('click', function () {
      if (body.classList.contains('opened')) return;

      // 蜡先抬起来，落下去的那一刻纸才开始动
      seal.classList.add('peeling');

      window.setTimeout(function () {
        open(false);
      }, 520);
    });
  }

  if (skip) {
    skip.addEventListener('click', function () {
      open(false);
    });
  }

  if (replay) {
    replay.addEventListener('click', function () {
      try {
        localStorage.removeItem(OPEN_KEY);
      } catch (e) {}
      window.location.reload();
    });
  }

  if (sealWrap || twineWrap) {
    window.setTimeout(function () {
      if (!body.classList.contains('opened')) return;
      if (sealWrap) sealWrap.style.visibility = 'hidden';
      if (twineWrap) twineWrap.style.visibility = 'hidden';
    }, 2400);
  }
})();
