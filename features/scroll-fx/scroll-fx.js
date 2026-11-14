/* ============================================================
   scroll-fx · 跟着纸的位置发生的动效
   位置来自 drag（drag:move { x }）；这里只负责「画」：
   - .track 的平移；.scroll 上的 --spin（卷轴转动）；每段的 --p（0–1 进入程度）
   - 某段第一次进入视野：加 .is-in（浮出、画线、数字滚动、墨迹显影都挂在它上面）
   发：panel:in { id, el } · section:change { id }
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';
import { reduced, clamp, easeOut } from '../../core/motion.js';

const track = document.querySelector('[data-track]');
const spinEl = document.querySelector('[data-scroll]');

if (track) {
  const paper = track.closest('.paper') || track.parentElement;
  let panels = [], viewW = 0, trackW = 0, x = 0;
  let current = '', canReveal = false, raf = 0;

  const measure = () => {
    viewW = paper.clientWidth;
    trackW = track.scrollWidth;
    panels = [...track.querySelectorAll('[data-panel]')].map((el) => ({ el, id: el.id, left: el.offsetLeft, w: el.offsetWidth }));
    paint();
  };

  /* 某段在纸里的左边 = (纸宽 - 长卷宽) + 段的 offsetLeft + 已送出的距离 */
  const paint = () => {
    raf = 0;
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    spinEl?.style.setProperty('--spin', (x * 0.9).toFixed(1));
    let best = null, bestOverlap = -1;
    for (const p of panels) {
      const left = viewW - trackW + p.left + x;
      const overlap = Math.max(0, Math.min(left + p.w, viewW) - Math.max(left, 0));
      const ratio = overlap / Math.min(p.w, viewW || 1);
      p.el.style.setProperty('--p', clamp(ratio * 1.4, 0, 1).toFixed(3));
      if (overlap > bestOverlap) { bestOverlap = overlap; best = p; }
      if (canReveal && ratio > 0.32 && !p.el.classList.contains('is-in')) reveal(p);
    }
    if (best && best.id !== current) {
      current = best.id;
      emit(EV.SECTION, { id: current });
      if (canReveal) history.replaceState(null, '', current === panels[0]?.id ? location.pathname : '#' + current);
    }
  };

  const reveal = (p) => {
    p.el.classList.add('is-in');
    emit(EV.PANEL_IN, { id: p.id, el: p.el });
    countUp(p.el);
    setTimeout(() => p.el.classList.add('is-done'), 1600);
  };

  function countUp(root) {
    root.querySelectorAll('[data-count]').forEach((el) => {
      const to = parseInt(el.dataset.count, 10) || 0;
      const pad = (n) => String(n).padStart(2, '0');
      if (reduced()) { el.textContent = pad(to); return; }
      const t0 = performance.now(), dur = 1000;
      const step = (t) => {
        const k = clamp((t - t0) / dur, 0, 1);
        el.textContent = pad(Math.round(easeOut(k) * to));
        if (k < 1) requestAnimationFrame(step);
      };
      setTimeout(() => requestAnimationFrame(step), 300);
    });
  }

  on(EV.MOVE, ({ x: nx }) => { x = nx; if (!raf) raf = requestAnimationFrame(paint); });
  on(EV.OPENED, ({ instant }) => {
    measure();
    if (location.hash.length > 1) emit(EV.GOTO, { id: location.hash.slice(1), instant: true });
    // 扉页的字在卷快滚完时显影
    setTimeout(() => { canReveal = true; paint(); }, instant ? 0 : 1700);
  });
  on(EV.CLOSED, () => {
    canReveal = false; x = 0;
    panels.forEach((p) => p.el.classList.remove('is-in', 'is-done'));
    measure();
  });
  on(EV.CONTENT_READY, () => {
    measure();
    if (canReveal && location.hash.length > 1) emit(EV.GOTO, { id: location.hash.slice(1), instant: true });
  });
  on(EV.CONTENT_CHANGED, measure);
  addEventListener('resize', measure, { passive: true });
}
