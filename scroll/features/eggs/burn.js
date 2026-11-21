/* ============================================================
   eggs/burn.js · 纸角烧穿一块（Canvas），然后慢慢复原
   只有敲了 burn 才会被下载
   ============================================================ */

export function burn(paper) {
  return new Promise((done) => {
    const r = paper.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cv = document.createElement('canvas');
    cv.className = 'egg-burn';
    cv.width = r.width * dpr;
    cv.height = r.height * dpr;
    cv.style.width = r.width + 'px';
    cv.style.height = r.height + 'px';
    paper.append(cv);
    const g = cv.getContext('2d');
    g.scale(dpr, dpr);

    // 起火点：右下角往里一点
    const ox = r.width - 46, oy = r.height - 38;
    const maxR = Math.min(r.width, r.height) * 0.32;
    const phase = Array.from({ length: 5 }, () => Math.random() * Math.PI * 2);
    const edge = (a, rad) => rad * (1
      + 0.16 * Math.sin(a * 3 + phase[0])
      + 0.10 * Math.sin(a * 7 + phase[1])
      + 0.06 * Math.sin(a * 13 + phase[2])
      + 0.03 * Math.sin(a * 23 + phase[3]));

    const embers = [];
    const t0 = performance.now();
    const GROW = 1700, HOLD = 1500;

    const blob = (rad, k = 1) => {
      g.beginPath();
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        const rr = edge(a, rad) * k;
        const px = ox + Math.cos(a) * rr, py = oy + Math.sin(a) * rr;
        i ? g.lineTo(px, py) : g.moveTo(px, py);
      }
      g.closePath();
    };

    const frame = (t) => {
      const el = t - t0;
      const k = Math.min(1, el / GROW);
      const rad = maxR * (1 - Math.pow(1 - k, 3));
      g.clearRect(0, 0, r.width, r.height);

      // 外圈焦黄
      blob(rad, 1.32);
      const sc = g.createRadialGradient(ox, oy, rad * 0.8, ox, oy, rad * 1.4);
      sc.addColorStop(0, 'rgba(92,50,16,.55)');
      sc.addColorStop(1, 'rgba(160,108,54,0)');
      g.fillStyle = sc; g.fill();

      // 炭化层
      blob(rad, 1.08);
      g.fillStyle = 'rgba(30,14,4,.92)'; g.fill();

      // 烧穿的洞：看到下面的木桌
      blob(rad, 0.94);
      const hole = g.createRadialGradient(ox, oy, 0, ox, oy, rad);
      hole.addColorStop(0, '#3a2a1a');
      hole.addColorStop(1, '#1d130a');
      g.fillStyle = hole; g.fill();

      // 还在烧的那圈红边
      if (k < 1 || el < GROW + 500) {
        blob(rad, 1.02);
        g.save();
        g.lineWidth = 3;
        g.strokeStyle = `rgba(255,${120 + Math.random() * 60 | 0},40,${0.85 * (1 - Math.max(0, el - GROW) / 500)})`;
        g.shadowColor = 'rgba(255,140,40,.9)';
        g.shadowBlur = 14;
        g.stroke();
        g.restore();
        // 火星
        for (let i = 0; i < 4; i++) {
          const a = Math.random() * Math.PI * 2;
          const rr = edge(a, rad);
          embers.push({ x: ox + Math.cos(a) * rr, y: oy + Math.sin(a) * rr, vx: (Math.random() - .5) * .6, vy: -.4 - Math.random() * 1.2, life: 1 });
        }
      }
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i];
        e.x += e.vx; e.y += e.vy; e.vy -= 0.01; e.life -= 0.018;
        if (e.life <= 0) { embers.splice(i, 1); continue; }
        g.fillStyle = `rgba(255,${150 + e.life * 80 | 0},60,${e.life})`;
        g.fillRect(e.x, e.y, 1.6, 1.6);
      }

      if (el < GROW + HOLD || embers.length) requestAnimationFrame(frame);
      else {
        cv.classList.add('is-healing');
        setTimeout(() => { cv.remove(); done(); }, 1300);
      }
    };
    requestAnimationFrame(frame);
  });
}
