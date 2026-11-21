/* ============================================================
   lab/compare/paper-sim.js · 有重量的纸
   把一页纸的横截面当成一条软链：书脊固定，16 段，每段长度不变
   每帧：重力往桌面拉 · 空气阻力让它飘 · 很弱的弯曲回弹 · 不能穿过桌面
   手（拖动 / 悬停 / 自动翻页）只是牵着外沿的一个点；松手后交给物理
   显示：把这一页切成 16 条竖条（分段铰链），每条转到模拟算出来的角度
   ============================================================ */

const N = 12;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const PRESETS = {
  xuan: { label: '宣纸', g: 2300, drag: .085, stiff: .025 },   // 很轻、很软、飘
  page: { label: '书页', g: 2500, drag: .05,  stiff: .08 },
  card: { label: '卡纸', g: 2700, drag: .025, stiff: .32 },    // 挺括
};

export function makePaperBook(host, { preset = 'xuan', front, back, left, right }) {
  const P = PRESETS[preset];
  host.innerHTML = `
    <div class="bk">
      <div class="bk-page bk-left">${left}</div>
      <div class="bk-page bk-right">${right}</div>
      <div class="bk-cast" data-side="left"></div><div class="bk-cast" data-side="right"></div>
      <div class="bk-hinge"></div>
    </div>`;
  const book = host.querySelector('.bk');
  const hinge = book.querySelector('.bk-hinge');
  const [castL, castR] = book.querySelectorAll('.bk-cast');

  // 竖条
  let parent = hinge;
  const strips = [];
  for (let i = 0; i < N; i++) {
    const s = document.createElement('div');
    s.className = 'bk-seg';
    s.innerHTML = `<div class="bk-face f"><div class="bk-clip">${front}</div></div><div class="bk-face b"><div class="bk-clip">${back}</div></div><i class="bk-shade f"></i><i class="bk-shade b"></i>`;
    parent.append(s); strips.push(s); parent = s;
  }
  let L = 1;
  const layout = () => {
    L = book.clientWidth / 2;
    const w = L / N;
    strips.forEach((s, i) => {
      s.style.width = `${w + 4}px`;
      s.querySelector('.bk-face.f .bk-clip').style.left = `${-(L - (i + 1) * w)}px`;
      s.querySelector('.bk-face.b .bk-clip').style.left = `${-(i * w)}px`;
      s.querySelectorAll('.bk-clip').forEach((c) => (c.style.width = `${L}px`));
    });
  };
  layout();

  /* ---------- 软链 ---------- */
  // 坐标：u 沿书宽（书脊 = 0，左页为负），v 是离桌面的高度
  const u = new Float32Array(N + 1), v = new Float32Array(N + 1);
  const pu = new Float32Array(N + 1), pv = new Float32Array(N + 1);
  const flat = (side) => {   // side = -1 左边，+1 右边
    for (let i = 0; i <= N; i++) { u[i] = pu[i] = side * i * (L / N); v[i] = pv[i] = 0; }
  };
  flat(-1);

  let hand = null;           // { u, v, k }  k = 牵得多紧（1 = 钉死）
  let running = false, raf = 0, rest = 0;

  const step = (dt) => {
    const seg = L / N;
    const damp = 1 - P.drag;
    for (let i = 1; i <= N; i++) {
      const vu = (u[i] - pu[i]) * damp, vv = (v[i] - pv[i]) * damp;
      pu[i] = u[i]; pv[i] = v[i];
      u[i] += vu; v[i] += vv - P.g * dt * dt;
    }
    for (let it = 0; it < 12; it++) {
      // 手牵着外沿
      if (hand) {
        u[N] += (hand.u - u[N]) * hand.k;
        v[N] += (hand.v - v[N]) * hand.k;
      }
      // 每段长度不变
      for (let i = 0; i < N; i++) {
        const du = u[i + 1] - u[i], dv = v[i + 1] - v[i];
        const d = Math.hypot(du, dv) || 1e-6, diff = (d - seg) / d;
        if (i === 0) { u[1] -= du * diff; v[1] -= dv * diff; }
        else { u[i] += du * diff * .5; v[i] += dv * diff * .5; u[i + 1] -= du * diff * .5; v[i + 1] -= dv * diff * .5; }
      }
      // 弯曲回弹：把每个点往两邻的中点拉一点
      for (let i = 1; i < N; i++) {
        const mu = (u[i - 1] + u[i + 1]) / 2, mv = (v[i - 1] + v[i + 1]) / 2;
        u[i] += (mu - u[i]) * P.stiff; v[i] += (mv - v[i]) * P.stiff;
      }
      // 桌面（以及下面那叠纸）
      for (let i = 1; i <= N; i++) if (v[i] < 0) { v[i] = 0; pu[i] = u[i] - (u[i] - pu[i]) * .4; pv[i] = 0; }
      u[0] = 0; v[0] = 0;
    }
  };

  /* ---------- 画：每条竖条转到对应那一段的角度 ---------- */
  const draw = () => {
    let prev = 0, hL = 0, hR = 0, nL = 0, nR = 0, aPrev = 180 - (Math.atan2(v[1] - v[0], u[1] - u[0]) * 180) / Math.PI;
    for (let i = 0; i < N; i++) {
      const phi = Math.atan2(v[i + 1] - v[i], u[i + 1] - u[i]);   // 0 = 指向右，π = 指向左
      const a = 180 - (phi * 180) / Math.PI;                         // 0 = 平躺在左，180 = 平躺在右
      const s = strips[i];
      s.style.transform = i === 0 ? `rotateY(${a.toFixed(2)}deg)` : `translateX(4px) rotateY(${(a - prev).toFixed(2)}deg)`;
      prev = a;
      // 明暗：按这一条两端的朝向做渐变，条与条之间就是连续的，不会一条条分段
      const aNext = i + 1 < N ? 180 - (Math.atan2(v[i + 2] - v[i + 1], u[i + 2] - u[i + 1]) * 180) / Math.PI : a;
      const shadeF = (x) => ((1 - Math.max(0, Math.cos((x * Math.PI) / 180))) * .5).toFixed(3);
      const shadeB = (x) => ((1 - Math.max(0, -Math.cos((x * Math.PI) / 180))) * .5).toFixed(3);
      const aMid = (a + aPrev) / 2, aEnd = (a + aNext) / 2;
      s.style.setProperty('--df0', shadeF(aMid)); s.style.setProperty('--df1', shadeF(aEnd));
      s.style.setProperty('--db0', shadeB(aMid)); s.style.setProperty('--db1', shadeB(aEnd));
      aPrev = a;
      const mu = (u[i] + u[i + 1]) / 2, mv = (v[i] + v[i + 1]) / 2;
      if (mu < 0) { hL += mv; nL++; } else { hR += mv; nR++; }
    }
    // 纸越贴近下面那页，投影越深；完全平躺时没有投影
    const shadow = (h, n, side) => (n ? clamp(1 - h / n / (L * .5), 0, 1) * .5 : 0) * (side ? 1 : 1);
    const moving = Math.max(...v) > 1;
    castL.style.opacity = moving && nR ? shadow(hL, nL).toFixed(3) : '0';
    castR.style.opacity = moving && nL ? shadow(hR, nR).toFixed(3) : '0';
  };

  let lastT = 0;
  const loop = (t) => {
    // 按真实经过的时间推进（掉帧时也不会变慢），每帧拆成 3 小步
    const frameDt = lastT ? Math.min(1 / 30, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    for (let k = 0; k < 3; k++) step(frameDt / 3);
    draw();
    // 停稳了：完全平躺，几乎不动
    let maxV = 0, maxH = 0;
    for (let i = 1; i <= N; i++) { maxV = Math.max(maxV, Math.abs(u[i] - pu[i]) + Math.abs(v[i] - pv[i])); maxH = Math.max(maxH, v[i]); }
    rest = !hand && maxV < .05 && maxH < .5 ? rest + 1 : 0;
    if (rest > 20) { running = false; lastT = 0; flat(u[N] > 0 ? 1 : -1); draw(); return; }
    raf = requestAnimationFrame(loop);
  };
  const wake = () => { if (!running) { running = true; rest = 0; raf = requestAnimationFrame(loop); } };

  /* ---------- 手 ---------- */
  const rect = () => book.getBoundingClientRect();
  // 指针的横向位置 → 手在弧上的位置；翻到一半时手靠近书脊一点，纸就有松量塌下去
  const handAt = (x) => {
    const r = rect();
    const p = clamp((x - (r.left + r.width / 2)) / (r.width / 2), -1, 1);
    const th = Math.acos(-p);
    const rad = L * (.97 - .12 * Math.sin(th));
    return { u: -Math.cos(th) * rad, v: Math.sin(th) * rad };
  };

  let drag = null;
  book.addEventListener('pointerdown', (e) => {
    book.setPointerCapture(e.pointerId);
    drag = true;
    hand = { ...handAt(e.clientX), k: .5 };
    wake();
  });
  book.addEventListener('pointermove', (e) => {
    const r = rect();
    if (drag) { Object.assign(hand, handAt(e.clientX)); wake(); return; }
    // 悬停在外沿：轻轻掀起一点
    const x = (e.clientX - r.left) / r.width;
    const side = u[N] > 0 ? 1 : -1;
    const near = side < 0 ? x < .2 : x > .8;
    if (near) {
      const prox = side < 0 ? 1 - x / .2 : 1 - (1 - x) / .2;
      const th = .35 * prox;
      hand = { u: side * Math.cos(th) * L * .985, v: Math.sin(th) * L * .985, k: .15 };
      wake();
    } else if (hand) { hand = null; wake(); }
  });
  const up = () => { if (!drag) return; drag = null; hand = null; wake(); };
  book.addEventListener('pointerup', up);
  book.addEventListener('pointercancel', up);
  book.addEventListener('pointerleave', () => { if (!drag && hand) { hand = null; wake(); } });
  addEventListener('resize', () => { layout(); flat(u[N] > 0 ? 1 : -1); draw(); });

  /* 自动翻：一只看不见的手把外沿提起来、送过去，然后松手 */
  const autoFlip = () => {
    const side = u[N] > 0 ? 1 : -1;
    const t0 = performance.now(), dur = 520;
    const from = side < 0 ? 0 : Math.PI, to = side < 0 ? Math.PI * .78 : Math.PI * .22;
    const tick = (t) => {
      const k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 2);
      const th = from + (to - from) * e;
      const rad = L * (.97 - .12 * Math.sin(th));
      hand = { u: -Math.cos(th) * rad, v: Math.sin(th) * rad, k: .35 };
      wake();
      if (k < 1) requestAnimationFrame(tick); else hand = null;
    };
    requestAnimationFrame(tick);
  };

  draw();
  return { play: autoFlip, reset: () => { hand = null; flat(-1); draw(); } };
}
