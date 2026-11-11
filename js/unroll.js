/* ============================================================
   unroll.js — 手卷展开逻辑
   P0：只有"点燃火漆 → 展开 → 显影"这一条时间线
   ============================================================ */

(function () {
  'use strict';

  var STORE_KEY = 'scroll-opened-v1';

  var body = document.body;
  var seal = document.getElementById('seal');
  var skip = document.getElementById('skip');
  var replay = document.getElementById('replay');
  var sealWrap = document.querySelector('.seal-wrap');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;

  try {
    seen = localStorage.getItem(STORE_KEY) === '1';
  } catch (e) {
    seen = false;
  }

  function remember() {
    try {
      localStorage.setItem(STORE_KEY, '1');
    } catch (e) {
      /* 隐私模式下写不进去，忽略即可 */
    }
  }

  /**
   * 展开手卷。
   * @param {boolean} instant 直接跳到展开状态，不播动画
   */
  function open(instant) {
    if (body.classList.contains('opened')) return;

    if (instant) body.classList.add('instant');

    // 先让纸动起来，内容显影的延迟在 CSS 里控制
    requestAnimationFrame(function () {
      body.classList.add('opened');
    });

    remember();

    if (skip) skip.hidden = true;
    if (seal) seal.setAttribute('tabindex', '-1');
  }

  /* 二次访问或用户要求减弱动效：直接展开，不重播 */
  if (seen || reduced) {
    open(true);
  }

  /* 点火漆 */
  if (seal) {
    seal.addEventListener('click', function () {
      if (body.classList.contains('opened')) return;

      seal.classList.add('breaking');

      // 蜡碎掉之后纸才开始动，这个间隔就是"仪式感"的来源
      window.setTimeout(function () {
        open(false);
      }, 380);
    });
  }

  /* 跳过 */
  if (skip) {
    skip.addEventListener('click', function () {
      open(false);
    });
  }

  /* 重看 */
  if (replay) {
    replay.addEventListener('click', function () {
      try {
        localStorage.removeItem(STORE_KEY);
      } catch (e) {}
      window.location.reload();
    });
  }

  /* 火漆在展开后隐藏，避免残留焦点 */
  if (sealWrap) {
    window.setTimeout(function () {
      if (body.classList.contains('opened')) {
        sealWrap.style.visibility = 'hidden';
      }
    }, 2400);
  }
})();
