/* ============================================================
   burn/burn-canvas · 备用：没有 WebGL2 时的 Canvas 2D 版火
   burnAway(el, { duration }) → Promise（烧完时 resolve；元素保持被烧光的状态）

   做法：
   - 元素本身：每帧用 clip-path（evenodd）挖掉一个不断扩大的不规则洞，洞里就是被烧穿的地方
   - 上面盖一块 Canvas：画洞边的一圈焦黑、一道发亮的火线、往上飘的火星，以及桌面被照亮的橙光
   洞的形状由几层不同频率的正弦叠出来，还会轻微抖动，所以不是一个圆
   ============================================================ */

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function burnAway(el, { duration = 1150, pad = 0 } = {}) {
  return new Promise((done) => {
    if (!el) { done(); return; }
    if (reducedMotion()) {
      el.style.transition = 'opacity 300ms ease';
      el.style.opacity = '0';
      setTimeout(done, 320);
      return;
    }

    const r = el.getBoundingClientRect();
    const W = r.width, H = r.height;
    const cx = W / 2, cy = H / 2;
    // 洞的最小半径系数约 0.7，所以最大半径要放大到能盖住四个角
    const maxR = Math.hypot(W / 2 + pad, H / 2 + pad) * 1.45;

    const dpr = Math.min(2, devicePixelRatio || 1);
    const cv = document.createElement('canvas');
    cv.className = 'burn-canvas';
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    document.body.append(cv);
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);

    const ph = Array.from({ length: 5 }, () => Math.random() * Math.PI * 2);
    const edge = (a, R, t) => R * (1
      + 0.13 * Math.sin(a * 3 + ph[0] + t * 0.6)
      + 0.08 * Math.sin(a * 7 + ph[1] - t * 0.9)
      + 0.05 * Math.sin(a * 13 + ph[2] + t * 1.7)
      + 0.025 * Math.sin(a * 23 + ph[3] - t * 2.3));
    const SEG = 120;
    const ring = (R, t, k = 1) => {
      const pts = [];
      for (let i = 0; i < SEG; i++) {
        const a = (i / SEG) * Math.PI * 2;
        const rr = edge(a, R, t) * k;
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      }
      return pts;
    };
    const tracePath = (pts, ox = 0, oy = 0) => {
      g.moveTo(pts[0][0] + ox, pts[0][1] + oy);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0] + ox, pts[i][1] + oy);
      g.closePath();
    };

    const embers = [];
    const t0 = performance.now();
    const IGNITE = 150;                 // 先亮一下
    const SPREAD = duration - 250;      // 然后烧开

    const frame = (now) => {
      const el_t = now - t0;
      const k = clamp((el_t - IGNITE) / SPREAD, 0, 1);
      // 先慢后快：火越烧越大
      const e = k < 1 ? Math.pow(k, 1.6) : 1;
      const R = maxR * e;
      const t = el_t / 1000;

      // 1. 元素：挖掉洞
      if (R > 0.5) {
        const hole = ring(R, t);
        const d = `M${-pad} ${-pad}H${W + pad}V${H + pad}H${-pad}Z M${hole.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`;
        el.style.clipPath = `path(evenodd, "${d}")`;
      }

      // 2. Canvas：焦边、火线、火星、橙光
      g.clearRect(0, 0, innerWidth, innerHeight);
      const ox = r.left, oy = r.top;
      const flare = el_t < IGNITE ? el_t / IGNITE : 1 - k * 0.7;

      // 桌面被照亮
      const glow = g.createRadialGradient(ox + cx, oy + cy, 0, ox + cx, oy + cy, Math.max(W, H) * 0.9);
      glow.addColorStop(0, `rgba(255,150,60,${0.22 * flare})`);
      glow.addColorStop(1, 'rgba(255,150,60,0)');
      g.fillStyle = glow;
      g.fillRect(0, 0, innerWidth, innerHeight);

      // 起火点
      if (el_t < IGNITE + 200) {
        const s = clamp(el_t / IGNITE, 0, 1);
        const spark = g.createRadialGradient(ox + cx, oy + cy, 0, ox + cx, oy + cy, 40 * s + 4);
        spark.addColorStop(0, 'rgba(255,240,200,.95)');
        spark.addColorStop(.4, 'rgba(255,170,70,.7)');
        spark.addColorStop(1, 'rgba(255,120,40,0)');
        g.fillStyle = spark;
        g.beginPath(); g.arc(ox + cx, oy + cy, 40 * s + 4, 0, Math.PI * 2); g.fill();
      }

      if (R > 0.5 && k < 1) {
        g.save();
        g.beginPath(); g.rect(ox - pad, oy - pad, W + pad * 2, H + pad * 2); g.clip();   // 焦痕只画在书上

        // 外圈烤黄
        g.beginPath(); tracePath(ring(R, t, 1.28), ox, oy); tracePath(ring(R, t, 1), ox, oy);
        g.fillStyle = 'rgba(120,70,24,.32)';
        g.fill('evenodd');
        // 焦黑的一圈
        g.beginPath(); tracePath(ring(R, t, 1.075), ox, oy); tracePath(ring(R, t, 1), ox, oy);
        g.fillStyle = 'rgba(26,12,4,.94)';
        g.fill('evenodd');
        // 火线
        g.beginPath(); tracePath(ring(R, t, 1.01), ox, oy);
        g.lineWidth = 2.6;
        g.strokeStyle = `rgba(255,${150 + (Math.random() * 50) | 0},70,.95)`;
        g.shadowColor = 'rgba(255,140,40,.95)';
        g.shadowBlur = 16;
        g.stroke();
        g.restore();

        // 火星：从火线上冒出来
        const n = 5 + (R / maxR) * 8;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const rr = edge(a, R, t);
          const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
          if (x < -pad || y < -pad || x > W + pad || y > H + pad) continue;
          embers.push({ x: ox + x, y: oy + y, vx: (Math.random() - .5) * .8, vy: -.6 - Math.random() * 1.6, life: 1, s: 1 + Math.random() * 1.6 });
        }
      }
      if (embers.length > 600) embers.splice(0, embers.length - 600);

      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];
        p.x += p.vx; p.y += p.vy; p.vy -= 0.012; p.life -= 0.022;
        if (p.life <= 0) { embers.splice(i, 1); continue; }
        g.fillStyle = `rgba(255,${(140 + p.life * 100) | 0},${(60 + p.life * 40) | 0},${p.life})`;
        g.fillRect(p.x, p.y, p.s, p.s);
      }

      if (k < 1 || embers.length) requestAnimationFrame(frame);
      else { cv.remove(); done(); }
    };
    requestAnimationFrame(frame);

    // 纸烧光的那一刻就可以先回去，火星让它自己散完
    setTimeout(() => { el.style.visibility = 'hidden'; done(); }, IGNITE + SPREAD + 30);
  });
}
