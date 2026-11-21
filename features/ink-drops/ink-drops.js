/* ============================================================
   ink-drops · 首屏旁边三滴淡墨（在做 / 在哪 / 心情）
   <div data-drops data-src="data/now.json" data-avoid=".hero-core"></div>
   - 慢慢漂，互相轻碰后弹开；不会漂进中间的文字区（data-avoid）
   - 鼠标靠近会让开
   - 手机、减少动效：不动，排成一行放在按钮下面（由 CSS 控制）
   ============================================================ */

import { t, applyLang } from '../lang/lang.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 760px)');

export async function mountDrops(box) {
  let now;
  try { now = await (await fetch(box.dataset.src)).json(); } catch { return; }
  const items = now.drops || [];
  if (!items.length) return;

  box.innerHTML = items.map((d) => `
    <a class="drop" href="${d.href || '#'}" style="--r:${d.r || 60}px">
      <span class="cap ${d.accent ? 'cap-zhu' : ''}" data-en="${d.label.en}" data-zh="${d.label.zh}">${d.label.en}</span>
      <span class="drop-val">${d.dot ? `<i style="background:${d.dot}"></i>` : ''}<span data-en="${d.value.en}" data-zh="${d.value.zh}">${d.value.en}</span></span>
    </a>`).join('');
  applyLang(box);

  const els = [...box.querySelectorAll('.drop')];
  // 初始位置：相对首屏的比例
  const P = els.map((el, i) => ({ el, u: items[i].at[0], v: items[i].at[1], r: items[i].r || 60, x: 0, y: 0, vx: 0, vy: 0, seed: i * 1.7 + .3 }));
  let W = 0, H = 0, avoid = null, mouse = null, raf = 0, last = 0, placed = false;

  const measure = () => {
    const b = box.getBoundingClientRect();
    W = b.width; H = b.height;
    const a = document.querySelector(box.dataset.avoid)?.getBoundingClientRect();
    avoid = a ? { x0: a.left - b.left - 24, y0: a.top - b.top - 12, x1: a.right - b.left + 24, y1: a.bottom - b.top + 12 } : null;
    if (!placed) { P.forEach((p) => { p.x = p.u * W; p.y = p.v * H; }); placed = true; }
    draw();
  };
  const draw = () => P.forEach((p) => { p.el.style.transform = `translate3d(${Math.round(p.x - p.r * 1.12)}px,${Math.round(p.y - p.r)}px,0)`; });

  const step = (now) => {
    raf = requestAnimationFrame(step);
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    const tt = now / 1000;
    for (const p of P) {
      // 漂：一个缓慢转动的方向
      const ang = Math.sin(tt * .13 + p.seed) * 2.2 + p.seed;
      p.vx += Math.cos(ang) * 6 * dt; p.vy += Math.sin(ang) * 6 * dt;
      // 回到自己的「家」附近，不漂远
      p.vx += (p.u * W - p.x) * .05 * dt; p.vy += (p.v * H - p.y) * .05 * dt;
      // 鼠标让开
      if (mouse) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy), R = p.r + 90;
        if (d < R && d > 1) { const f = (1 - d / R) * 420 * dt; p.vx += dx / d * f; p.vy += dy / d * f; }
      }
    }
    // 互相碰撞：软的弹开
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = a.r + b.r + 8;
      if (d < min && d > .1) {
        const push = (min - d) / 2, nx = dx / d, ny = dy / d;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (rel < 0) { a.vx += rel * nx * .8; a.vy += rel * ny * .8; b.vx -= rel * nx * .8; b.vy -= rel * ny * .8; }
      }
    }
    for (const p of P) {
      p.vx *= .94; p.vy *= .94;
      const sp = Math.hypot(p.vx, p.vy), max = 60;
      if (sp > max) { p.vx *= max / sp; p.vy *= max / sp; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      // 不进文字区：从最近的边推出去
      if (avoid && p.x + p.r > avoid.x0 && p.x - p.r < avoid.x1 && p.y + p.r > avoid.y0 && p.y - p.r < avoid.y1) {
        const opts = [p.x + p.r - avoid.x0, avoid.x1 - (p.x - p.r), p.y + p.r - avoid.y0, avoid.y1 - (p.y - p.r)];
        const k = opts.indexOf(Math.min(...opts));
        if (k === 0) { p.x -= opts[0]; p.vx = -Math.abs(p.vx) * .5; }
        if (k === 1) { p.x += opts[1]; p.vx = Math.abs(p.vx) * .5; }
        if (k === 2) { p.y -= opts[2]; p.vy = -Math.abs(p.vy) * .5; }
        if (k === 3) { p.y += opts[3]; p.vy = Math.abs(p.vy) * .5; }
      }
      // 边界
      p.x = Math.min(W - p.r, Math.max(p.r, p.x)); p.y = Math.min(H - p.r, Math.max(p.r, p.y));
    }
    draw();
  };

  const start = () => { cancelAnimationFrame(raf); if (reduce.matches || narrow.matches) { box.classList.add('is-still'); P.forEach((p) => (p.el.style.transform = '')); return; } box.classList.remove('is-still'); measure(); last = performance.now(); raf = requestAnimationFrame(step); };
  box.closest('section')?.addEventListener('pointermove', (e) => { const b = box.getBoundingClientRect(); mouse = { x: e.clientX - b.left, y: e.clientY - b.top }; });
  box.closest('section')?.addEventListener('pointerleave', () => { mouse = null; });
  addEventListener('resize', () => { placed = false; start(); }, { passive: true });
  reduce.addEventListener('change', start); narrow.addEventListener('change', start);
  // 看不见时停下来
  new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); else cancelAnimationFrame(raf); }).observe(box);
  document.fonts?.ready.then(() => { placed = false; start(); });
  start();
}

document.querySelectorAll('[data-drops]').forEach(mountDrops);
