/* ============================================================
   lab/compare/bend.js · 分段铰链翻页的试样（只给对比页用）
   把一页切成 N 条竖条，一条套一条：每条比外面那条多转 δ 度，连起来就是一道弧
   bend = 翻到一半时，外沿比书脊多翘的总角度
   ============================================================ */

const N = 14;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function makeBook(host, { bend = 30, front, back, left, right }) {
  host.innerHTML = `
    <div class="bk">
      <div class="bk-page bk-left">${left}</div>
      <div class="bk-page bk-right">${right}</div>
      <div class="bk-cast"></div>
      <div class="bk-hinge"></div>
      <svg class="bk-curl" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="curlG-${bend}" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stop-color="#b8a685"/><stop offset=".45" stop-color="#f1e7cd"/><stop offset="1" stop-color="#c9b894"/>
          </linearGradient>
        </defs>
        <path class="under" d="M0 0 Q 22 78 100 100 L0 100 Z"/>
        <path class="flap" d="M0 0 Q 22 78 100 100 Q 70 30 0 0 Z" fill="url(#curlG-${bend})"/>
      </svg>
    </div>`;
  const book = host.querySelector('.bk');
  const hinge = book.querySelector('.bk-hinge');
  const cast = book.querySelector('.bk-cast');
  const W = () => book.clientWidth / 2;

  // 搭铰链：第 0 条贴着书脊，第 i 条接在第 i-1 条的外侧
  let parent = hinge;
  const segs = [];
  for (let i = 0; i < N; i++) {
    const s = document.createElement('div');
    s.className = 'bk-seg';
    s.innerHTML = `<div class="bk-face f"><div class="bk-clip">${front}</div></div><div class="bk-face b"><div class="bk-clip">${back}</div></div><i class="bk-shade f"></i><i class="bk-shade b"></i>`;
    parent.append(s);
    segs.push(s);
    parent = s;
  }
  const place = () => {
    const w = W() / N;
    segs.forEach((s, i) => {
      s.style.width = `${w + 1.5}px`;   // 多 1.5px 互相压住，接缝处不露缝
      // 正面：露出整页从右往左第 i 条；背面：镜像位置
      s.querySelector('.bk-face.f .bk-clip').style.left = `${-(W() - (i + 1) * w)}px`;
      s.querySelector('.bk-face.b .bk-clip').style.left = `${-(i * w)}px`;
      s.querySelectorAll('.bk-clip').forEach((c) => (c.style.width = `${W()}px`));
    });
  };
  place();

  /* a：翻页角度 0（在左边）→ 180（在右边） */
  const set = (a) => {
    const sinA = Math.sin((a * Math.PI) / 180);
    const extra = bend * sinA;              // 这一刻整页要弯的总角度
    const d = extra / (N - 1);
    const a0 = a - extra / 2;               // 书脊处转得少一点，外沿多一点，平均正好是 a
    segs.forEach((s, i) => {
      const local = i === 0 ? a0 : d;
      s.style.transform = i === 0 ? `rotateY(${local}deg)` : `translateX(1.5px) rotateY(${local}deg)`;
      const abs = a0 + d * i;
      const c = Math.cos((abs * Math.PI) / 180);
      s.style.setProperty('--df', ((1 - Math.max(0, c)) * .55).toFixed(3));
      s.style.setProperty('--db', ((1 - Math.max(0, -c)) * .55).toFixed(3));
    });
    cast.style.opacity = (sinA * .5).toFixed(3);
    cast.dataset.side = a < 90 ? 'left' : 'right';
  };
  set(0);

  let a = 0, anim = 0;
  const tween = (to, ms = 900) => {
    cancelAnimationFrame(anim);
    const from = a, t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / ms, 0, 1);
      const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      a = from + (to - from) * e; set(a);
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };

  // 拖：按住左页往右拖
  let drag = null;
  book.addEventListener('pointerdown', (e) => {
    const r = book.getBoundingClientRect();
    drag = { x0: e.clientX, a0: a, w: r.width / 2 };
    book.setPointerCapture(e.pointerId);
    cancelAnimationFrame(anim);
  });
  book.addEventListener('pointermove', (e) => {
    const r = book.getBoundingClientRect();
    // 纸角提示：靠近左外沿时卷起
    const x = (e.clientX - r.left) / r.width;
    book.style.setProperty('--curl', a < 1 && !drag && x < .18 ? (1 - x / .18).toFixed(3) : 0);
    if (!drag) return;
    a = clamp(drag.a0 + ((e.clientX - drag.x0) / drag.w) * 180, 0, 180); set(a);
  });
  const up = () => { if (!drag) return; drag = null; tween(a > 90 ? 180 : 0, 380); };
  book.addEventListener('pointerup', up);
  book.addEventListener('pointercancel', up);
  book.addEventListener('pointerleave', () => book.style.setProperty('--curl', 0));
  addEventListener('resize', place);

  return { play: () => tween(a > 90 ? 0 : 180), reset: () => { cancelAnimationFrame(anim); a = 0; set(0); } };
}
