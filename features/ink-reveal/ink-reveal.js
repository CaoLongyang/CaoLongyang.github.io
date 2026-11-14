/* ============================================================
   ink-reveal · 给 [data-ink] 编号（决定先后），
   不在 .panel 里的元素用 IntersectionObserver 自己触发
   ============================================================ */

import { EV, on } from '../../core/events.js';

function index(root = document) {
  // 每个容器内单独从 0 数起
  const groups = new Map();
  root.querySelectorAll('[data-ink]').forEach((el) => {
    const g = el.closest('[data-panel], [data-ink-group]') || document.body;
    const n = groups.get(g) || 0;
    // 长卷里按段内顺序错落；散落在长页面上的只给首屏前几个错落，后面的进视野就出现
    const i = g === document.body ? (n < 6 ? n : 0) : n;
    if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', i);
    groups.set(g, n + 1);
  });
}

const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-inked'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 })
  : null;

function watchLoose(root = document) {
  root.querySelectorAll('[data-ink]').forEach((el) => {
    if (el.closest('[data-panel]')) return;
    io ? io.observe(el) : el.classList.add('is-inked');
  });
}

function run() { index(); watchLoose(); }

on(EV.CONTENT_READY, run);
on(EV.CONTENT_CHANGED, run);
run();
