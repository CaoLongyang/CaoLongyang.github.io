/* ============================================================
   lab/compare/burn-variants.js · 三种火的试样（只给对比页用）
   A 朱红纸灰 · B 金箔 · C 墨散
   底子相同：元素每帧用 clip-path 挖一个不规则的洞；上面一块画布画洞边
   ============================================================ */

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function burn(el, style = 'A', { duration = 1050 } = {}) {
  return new Promise((done) => {
    const r = el.getBoundingClientRect();
    const W = r.width, H = r.height, cx = W / 2, cy = H / 2;
    const maxR = Math.hypot(W / 2, H / 2) * 1.45;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:50';
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    document.body.append(cv);
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const ox = r.left, oy = r.top;

    const ph = Array.from({ length: 4 }, () => Math.random() * 6.28);
    const edge = (a, R, t) => R * (1 + .13 * Math.sin(a * 3 + ph[0] + t * .6) + .08 * Math.sin(a * 7 + ph[1] - t * .9)
      + .05 * Math.sin(a * 13 + ph[2] + t * 1.7) + .025 * Math.sin(a * 23 + ph[3] - t * 2.3));
    const SEG = 120;
    const ring = (R, t, k = 1) => Array.from({ length: SEG }, (_, i) => {
      const a = (i / SEG) * 6.2832, rr = edge(a, R, t) * k;
      return [ox + cx + Math.cos(a) * rr, oy + cy + Math.sin(a) * rr];
    });
    const trace = (pts) => { g.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) g.lineTo(...pts[i]); g.closePath(); };
    const band = (R, t, k1, k2, fill, blur = 0) => {
      g.save(); if (blur) g.filter = `blur(${blur}px)`;
      g.beginPath(); trace(ring(R, t, k2)); trace(ring(R, t, k1));
      g.fillStyle = fill; g.fill('evenodd'); g.restore();
    };
    const line = (R, t, k, color, width, glow, blurColor) => {
      g.save(); g.beginPath(); trace(ring(R, t, k));
      g.lineWidth = width; g.strokeStyle = color; g.shadowColor = blurColor || color; g.shadowBlur = glow; g.stroke(); g.restore();
    };

    const parts = [];
    const emit = (R, t, n) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.2832, rr = edge(a, R, t);
        const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        if (x < 0 || y < 0 || x > W || y > H) continue;
        const p = { x: ox + x, y: oy + y, life: 1, rot: Math.random() * 6.28, spin: (Math.random() - .5) * .12, seed: Math.random() * 6.28 };
        if (style === 'A') Object.assign(p, { vx: (Math.random() - .5) * .5, vy: -.35 - Math.random() * .7, s: 2 + Math.random() * 4.5, decay: .011 + Math.random() * .01, sides: 3 + (Math.random() * 3 | 0), tone: Math.random() });
        if (style === 'B') Object.assign(p, { vx: Math.cos(a) * (.6 + Math.random()), vy: Math.sin(a) * (.6 + Math.random()) - .8, s: .8 + Math.random() * 1.4, decay: .016 + Math.random() * .012 });
        if (style === 'C') Object.assign(p, { vx: (Math.random() - .5) * .3, vy: -.25 - Math.random() * .5, s: 10 + Math.random() * 16, decay: .009 + Math.random() * .008, stretch: 1.6 + Math.random() * 1.6 });
        parts.push(p);
      }
    };

    const t0 = performance.now(), IGNITE = 100, SPREAD = duration - 200;
    const frame = (now) => {
      const el_t = now - t0, t = el_t / 1000;
      const k = clamp((el_t - IGNITE) / SPREAD, 0, 1);
      const R = maxR * (k < 1 ? Math.pow(k, 1.5) : 1);
      if (R > .5) {
        const hole = ring(R, t).map(([x, y]) => `${(x - ox).toFixed(1)} ${(y - oy).toFixed(1)}`).join('L');
        el.style.clipPath = `path(evenodd, "M0 0H${W}V${H}H0Z M${hole}Z")`;
      }
      g.clearRect(0, 0, innerWidth, innerHeight);

      // 起火点
      if (el_t < IGNITE + 120) {
        const s = clamp(el_t / IGNITE, 0, 1);
        const col = style === 'A' ? '200,85,58' : style === 'B' ? '242,196,109' : '30,22,14';
        const rg = g.createRadialGradient(ox + cx, oy + cy, 0, ox + cx, oy + cy, 14 * s + 3);
        rg.addColorStop(0, `rgba(${col},.95)`); rg.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = rg; g.beginPath(); g.arc(ox + cx, oy + cy, 14 * s + 3, 0, 6.29); g.fill();
      }

      if (R > .5 && k < 1) {
        g.save(); g.beginPath(); g.rect(ox, oy, W, H); g.clip();
        if (style === 'A') {
          band(R, t, 1, 1.09, 'rgba(160,110,55,.26)');           // 烤黄，很窄
          band(R, t, 1, 1.035, 'rgba(120,70,30,.38)');
          line(R, t, 1.012, '#f0c987', 1.2, 4);                  // 淡金
          line(R, t, 1.0, '#c8553a', 2, 6);                      // 朱红
          emit(R, t, 4 + (R / maxR) * 6);
        }
        if (style === 'B') {
          line(R, t, 1.03, 'rgba(150,110,40,.6)', 1, 0);
          line(R, t, 1.0, '#f6d58a', 2.4, 14, 'rgba(242,196,109,.9)');
          emit(R, t, 3 + (R / maxR) * 5);
        }
        if (style === 'C') {
          band(R, t, .96, 1.05, 'rgba(22,16,10,.6)', 7);          // 墨把硬边晕开
          band(R, t, 1.05, 1.2, 'rgba(40,30,20,.16)', 12);
          emit(R, t, 1 + (R / maxR) * 2);
        }
        g.restore();
      }
      if (style === 'B' && k > 0 && k < 1) {
        const rg = g.createRadialGradient(ox + cx, oy + cy, 0, ox + cx, oy + cy, Math.max(W, H));
        rg.addColorStop(0, 'rgba(242,196,109,.08)'); rg.addColorStop(1, 'rgba(242,196,109,0)');
        g.fillStyle = rg; g.fillRect(0, 0, innerWidth, innerHeight);
      }

      if (parts.length > 300) parts.splice(0, parts.length - 300);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= p.decay;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        if (style === 'A') {
          // 纸灰：灰白碎片，边飘边转、左右摆
          p.x += p.vx + Math.sin(t * 4 + p.seed) * .35; p.y += p.vy; p.rot += p.spin;
          const c = p.tone > .7 ? '190,182,168' : '226,219,204';
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.beginPath();
          for (let j = 0; j < p.sides; j++) { const a = (j / p.sides) * 6.28; const rr = p.s * (.6 + .4 * Math.sin(p.seed + j * 2.1)); g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * .7); }
          g.closePath(); g.fillStyle = `rgba(${c},${p.life * .9})`; g.fill(); g.restore();
        }
        if (style === 'B') {
          // 金粉：先弹出去，再往下落
          p.x += p.vx; p.y += p.vy; p.vx *= .96; p.vy += .045;
          g.fillStyle = `rgba(255,${(200 + p.life * 40) | 0},${(110 + p.life * 60) | 0},${p.life})`;
          g.beginPath(); g.arc(p.x, p.y, p.s, 0, 6.29); g.fill();
        }
        if (style === 'C') {
          // 墨烟：拉长的淡墨，往上散开、变大
          p.x += p.vx; p.y += p.vy; p.s *= 1.012;
          g.save(); g.translate(p.x, p.y); g.rotate(Math.sin(p.seed + t) * .4); g.scale(1, p.stretch);
          const rg = g.createRadialGradient(0, 0, 0, 0, 0, p.s);
          rg.addColorStop(0, `rgba(25,18,12,${.16 * p.life})`); rg.addColorStop(1, 'rgba(25,18,12,0)');
          g.fillStyle = rg; g.beginPath(); g.arc(0, 0, p.s, 0, 6.29); g.fill(); g.restore();
        }
      }
      if (k < 1 || parts.length) requestAnimationFrame(frame); else { cv.remove(); done(); }
    };
    requestAnimationFrame(frame);
  });
}
