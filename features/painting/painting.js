/* ============================================================
   painting · 塞尚式的「构造性笔触」
   <canvas data-painting="books" data-seed="11"></canvas>
   一笔一笔平行的小色块，按层铺满，拼出形体（几何化的山、书、苹果）。
   画一次就不再动；悬停时整幅轻轻放大（CSS 做）。场景：books · games · anime · mood · mountain
   ============================================================ */

const OCHRE = ['#C9973F', '#D4A85A', '#B8863A'];
const TERRA = ['#B4572E', '#C4683C', '#9E4A26'];
const PINE = ['#4E7A62', '#5E8A6E', '#3F6A55', '#6F9475'];
const ULTRA = ['#5A6B86', '#6C7D98', '#4D5D78', '#7E8BA3'];
const IVORY = ['#EFE6D2', '#E6DCC4', '#F3ECDC', '#DCD3BF'];
const VIOLET = ['#8A7F9A', '#7A7090', '#9A90A8'];

/* 可复现的随机数：同一个 seed 永远画出同一幅 */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const ALL = () => true;
const disc = (cx, cy, r) => (u, v) => (u - cx) ** 2 + (v - cy) ** 2 < r * r;
const band = (a, b) => (u, v) => v >= a && v < b;
const rect = (u0, v0, u1, v1) => (u, v) => u >= u0 && u < u1 && v >= v0 && v < v1;
function poly(pts) {
  return (u, v) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > v) !== (yj > v) && u < (xj - xi) * (v - yi) / (yj - yi + 1e-9) + xi) inside = !inside;
    }
    return inside;
  };
}

const SCENES = {
  books: [[ALL, PINE.concat(ULTRA), .9], [band(.62, 1), IVORY.concat('#D8CFBD'), 1], [rect(.12, .38, .62, .5), TERRA, .45],
    [rect(.14, .5, .66, .62), ULTRA, .45], [rect(.1, .62, .6, .72), OCHRE, .45], [disc(.76, .62, .09), TERRA.concat('#D57A3F'), .4],
    [disc(.86, .7, .07), OCHRE.concat('#D98E3E'), .35], [disc(.72, .78, .06), ['#8EA05A', '#A1AE5E'], .3]],
  games: [[ALL, OCHRE.concat('#D9B77A'), .9], [band(.66, 1), TERRA.concat('#A55A3A'), .9],
    [poly([[.2, .42], [.8, .42], [.9, .62], [.84, .76], [.68, .7], [.32, .7], [.16, .76], [.1, .62]]), ['#3E4A5E', '#4D5D78', '#56667F'], .7],
    [disc(.33, .55, .05), IVORY, .25], [disc(.66, .52, .035), TERRA, .2], [disc(.72, .6, .035), PINE, .2]],
  anime: [[ALL, ['#7E8BA3', '#8F9CB4', '#6C7D98', '#A3AEC2'], 1], [disc(.68, .3, .14), ['#F1E3BF', '#EBD7A8', '#F6ECD2'], .5],
    [poly([[0, .78], [.4, .62], [.75, .7], [1, .64], [1, 1], [0, 1]]), PINE.concat('#3D5A4C'), .8],
    [rect(.33, .5, .37, .64), ['#2f2a33', '#3a3440'], .12], [disc(.35, .48, .025), ['#2f2a33'], .05]],
  mood: [[ALL, IVORY, .6]].concat([OCHRE, PINE, ULTRA, TERRA, VIOLET, IVORY].map((c, i) => [rect(i / 6, 0, (i + 1) / 6, 1), c, .32])),
  mountain: [[ALL, IVORY.concat('#D9DDE0', '#C9D2D8'), 1],
    [poly([[0, .7], [.18, .52], [.42, .22], [.55, .3], [.7, .2], [1, .55], [1, .75], [0, .78]]), ULTRA.concat(VIOLET), .9],
    [band(.66, 1), OCHRE.concat(PINE), .9], [poly([[0, .82], [.3, .74], [.6, .8], [1, .72], [1, 1], [0, 1]]), PINE.concat('#7E9A6A'), .7]],
};
const ANGLE = { mood: -60 };

export function paint(canvas, scene = 'books', seed = 1) {
  const layers = SCENES[scene];
  if (!layers) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = canvas.clientWidth || 240, h = canvas.clientHeight || 240;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const R = rng(seed);
  const target = 1800, L = 10, T = 4;
  const s = Math.max(.7, Math.sqrt((w * h * 1.7) / (target * L * T)));
  const L0 = L * s, T0 = T * s, base = ANGLE[scene] ?? -32;
  for (const [inside, pal, dens] of layers) {
    const cnt = Math.floor(dens * w * h / (L0 * T0) * 1.7);
    let placed = 0, tries = 0;
    while (placed < cnt && tries < cnt * 6) {
      tries++;
      const u = R(), v = R();
      if (!inside(u, v)) continue;
      placed++;
      const a = (base + (R() - .5) * 20) * Math.PI / 180;
      const l = L0 * (.75 + R() * .6), t = T0 * (.85 + R() * .4);
      ctx.save();
      ctx.translate(u * w, v * h); ctx.rotate(a);
      ctx.globalAlpha = .82 + R() * .15;
      ctx.fillStyle = pal[Math.floor(R() * pal.length)];
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(-l / 2, -t / 2, l, t, t * .35) : ctx.rect(-l / 2, -t / 2, l, t);
      ctx.fill();
      ctx.restore();
    }
  }
}

function mount(c) {
  const go = () => paint(c, c.dataset.painting, +c.dataset.seed || 1);
  // 进入视野附近才画，画一次
  new IntersectionObserver(([e], ob) => { if (e.isIntersecting) { go(); ob.disconnect(); } }, { rootMargin: '300px' }).observe(c);
}
document.querySelectorAll('canvas[data-painting]').forEach(mount);
