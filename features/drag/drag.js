/* ============================================================
   drag · 用手推纸
   - 按住拖：纸 1:1 跟手（往右拖，把纸从左边的卷里拉出来，和真手卷一样）
   - 松手：按速度继续滑，然后吸附到最近的接缝（隔水）
   - 拖到头：橡皮筋，松手弹回
   - 滚轮 / 触控板：直接推，停下 160ms 后吸附
   - 键盘：← 下一段 · → 上一段 · Home / End
   只对外报告位置：发 drag:move { x, maxX }；听 nav:goto { id }
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';
import { reduced, clamp } from '../../core/motion.js';

const track = document.querySelector('[data-track]');
const surface = document.querySelector('.view');
const body = document.body;

if (track && surface) {
  const paper = track.closest('.paper') || track.parentElement;
  let x = 0, maxX = 0, snaps = [0], ids = [];
  let anim = 0, settleTimer = 0;
  let enabled = false;

  /* ---------- 量尺寸：每段右边对齐纸右边的位置，就是一个吸附点 ---------- */
  const measure = () => {
    const viewW = paper.clientWidth;
    const trackW = track.scrollWidth;
    maxX = Math.max(0, trackW - viewW);
    // 第一段的吸附点是 0：连同最右边的包首一起露出来
    const list = [...track.querySelectorAll('[data-panel]')].map((el, i) => ({
      id: el.id, s: i === 0 ? 0 : clamp(Math.round(trackW - el.offsetLeft - el.offsetWidth), 0, maxX),
    }));
    snaps = [...new Set(list.map((p) => p.s).concat(maxX))].sort((a, b) => a - b);
    ids = list;
    set(clamp(x, 0, maxX));
  };

  const set = (v) => { x = v; emit(EV.MOVE, { x, maxX }); body.classList.toggle('is-moved', x > 30); };
  const rubber = (v) => (v < 0 ? v * 0.32 : v > maxX ? maxX + (v - maxX) * 0.32 : v);
  const nearest = (v) => snaps.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), snaps[0]);
  const stop = () => { cancelAnimationFrame(anim); anim = 0; };

  /* 补间：任何距离都 ≤ 1 秒 */
  const animateTo = (to, ms) => {
    stop();
    to = clamp(to, 0, maxX);
    const from = x, d = to - from;
    if (Math.abs(d) < 0.5 || reduced()) { set(to); return; }
    const dur = ms ?? clamp(Math.abs(d) * 0.55, 320, 1000);
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      set(from + d * e);
      anim = k < 1 ? requestAnimationFrame(step) : 0;
    };
    anim = requestAnimationFrame(step);
  };

  /* ---------- 按住拖 ---------- */
  let down = null;      // { id, x0, p0, samples, moved }
  surface.addEventListener('pointerdown', (e) => {
    if (!enabled || e.button !== 0) return;
    stop();
    down = { id: e.pointerId, x0: e.clientX, p0: x, samples: [[performance.now(), e.clientX]], moved: false };
  });

  addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const dx = e.clientX - down.x0;
    if (!down.moved && Math.abs(dx) > 4) {
      down.moved = true;
      surface.setPointerCapture?.(e.pointerId);
      body.classList.add('is-dragging');
    }
    if (!down.moved) return;
    set(rubber(down.p0 + dx));
    const now = performance.now();
    down.samples.push([now, e.clientX]);
    while (down.samples.length > 2 && now - down.samples[0][0] > 90) down.samples.shift();
  });

  const release = (e) => {
    if (!down || e.pointerId !== down.id) return;
    const d = down; down = null;
    body.classList.remove('is-dragging');
    if (!d.moved) return;
    // 松手速度（px/ms）→ 惯性往前多滑一段 → 吸附
    const [t1, x1] = d.samples[0], [t2, x2] = d.samples[d.samples.length - 1];
    const v = t2 > t1 ? (x2 - x1) / (t2 - t1) : 0;
    const raw = d.p0 + (x2 - d.x0);
    animateTo(nearest(clamp(raw + v * 260, -1, maxX + 1)));
    // 拖过之后，这次抬手不当作点击
    const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => removeEventListener('click', swallow, { capture: true }), 0);
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  /* ---------- 滚轮 / 触控板 ---------- */
  addEventListener('wheel', (e) => {
    if (!enabled) return;
    e.preventDefault();
    stop();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? -e.deltaX : e.deltaY;
    const unit = e.deltaMode === 1 ? 32 : 1;
    set(clamp(x + delta * unit, 0, maxX));
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => animateTo(nearest(x), 420), 160);
  }, { passive: false });

  /* ---------- 键盘 ---------- */
  addEventListener('keydown', (e) => {
    if (!enabled || e.target.closest?.('input,textarea,[contenteditable]')) return;
    if (e.key === ' ' && e.target.closest?.('a,button')) return;
    const i = snaps.indexOf(nearest(x));
    const go = { ArrowLeft: i + 1, PageDown: i + 1, ' ': i + 1, ArrowRight: i - 1, PageUp: i - 1, Home: 0, End: snaps.length - 1 }[e.key];
    if (go === undefined) return;
    e.preventDefault();
    animateTo(snaps[clamp(go, 0, snaps.length - 1)]);
  });

  /* 页面里 data-goto="某段 id" 的链接：卷过去 */
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('[data-goto]');
    if (!a) return;
    e.preventDefault();
    emit(EV.GOTO, { id: a.dataset.goto });
  });

  /* ---------- 对外 ---------- */
  on(EV.GOTO, ({ id, instant }) => {
    const p = ids.find((q) => q.id === id);
    if (p) instant ? (stop(), set(p.s)) : animateTo(p.s);
  });
  on(EV.OPENED, () => { measure(); });
  on(EV.CONTENT_READY, measure);
  on(EV.CONTENT_CHANGED, measure);
  addEventListener('resize', measure, { passive: true });

  // 展开动画走完才能推
  new MutationObserver(() => { enabled = body.classList.contains('settled') && !body.classList.contains('in-scene') && !body.classList.contains('slip-open'); })
    .observe(body, { attributes: true, attributeFilter: ['class'] });
  on(EV.CLOSED, () => { stop(); set(0); });

  measure();
}
