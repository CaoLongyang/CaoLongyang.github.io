/* ============================================================
   roll-up · 从自序拖到目录：先把自序卷起来，再把卷子推回右边
   逻辑位置 x 从 0 走到 s1（目录的吸附点）：
     前半程（0 – SPLIT）：纸不动，一根锦缎轴从右往左扫过包首和自序，把它们卷进去
     后半程（SPLIT – 1）：卷好的轴停在接缝上，带着目录一起滑回右边，和天杆并在一起
   只改「画面位置」（core/track-map.js），吸附点、拖动手感、网址都不变
   听：drag:move · scroll:opened · content:ready · content:changed
   ============================================================ */

import { EV, on } from '../../core/events.js';
import { reduced, clamp } from '../../core/motion.js';
import { setTrackMap } from '../../core/track-map.js';

const SPLIT = 0.5;
const track = document.querySelector('[data-track]');
const paper = track?.closest('.paper');

if (track && paper) {
  const roll = document.createElement('div');
  roll.className = 'ru-roll';
  roll.setAttribute('aria-hidden', 'true');
  roll.innerHTML = '<i></i>';
  paper.append(roll);

  let about, toc, head, s1 = 0, viewW = 0, trackW = 0, H = 0, seam0 = 0, active = false, x = 0, raf = 0;

  const map = (v) => {
    if (!active || v <= 0 || v >= s1) return v;
    const u = v / s1;
    return u < SPLIT ? 0 : s1 * (u - SPLIT) / (1 - SPLIT);
  };

  const measure = () => {
    about = track.querySelector('#about');
    toc = track.querySelector('#toc');
    head = track.querySelector('.track-head');
    if (!about || !toc) { active = false; return; }
    viewW = paper.clientWidth; trackW = track.scrollWidth; H = paper.clientHeight;
    s1 = Math.max(0, trackW - toc.offsetLeft - toc.offsetWidth);
    seam0 = viewW - trackW + about.offsetLeft;
    active = !reduced() && matchMedia('(min-width:721px)').matches && s1 > 40;
    setTrackMap(active ? map : null);
    paint();
  };

  const clear = () => {
    roll.style.opacity = '0';
    paper.style.clipPath = '';
    for (const el of [about, head]) if (el) { el.style.clipPath = ''; el.style.visibility = ''; }
  };

  function paint() {
    raf = 0;
    const u = s1 ? x / s1 : 0;
    if (!active || u <= 0.001 || u >= 0.999) { clear(); return; }
    const tx = map(x);
    const k1 = clamp(u / SPLIT, 0, 1);                       // 卷了多少
    const Rr = u < SPLIT ? viewW - (viewW - seam0) * k1 : seam0 + tx;

    // 轴右边的纸已经卷进去了
    const cut = (el, pad) => {
      if (!el) return;
      const left = viewW - trackW + el.offsetLeft + tx;
      const r = Math.max(0, left + el.offsetWidth - Rr);
      el.style.visibility = r >= el.offsetWidth - 0.5 ? 'hidden' : '';
      el.style.clipPath = r > 0 ? `inset(0 ${r.toFixed(1)}px 0 ${-pad}px)` : '';
    };
    cut(about, 0);
    cut(head, 30);

    const T = H * (0.04 + 0.045 * k1);                       // 越卷越粗
    // 轴右边已经没有纸了（卷进去了 / 还没推回来）：露出桌面
    paper.style.clipPath = `inset(-40px ${Math.max(0, viewW - Rr - T / 2).toFixed(1)}px -40px -40px)`;
    roll.style.width = T.toFixed(1) + 'px';
    roll.style.transform = `translate3d(${(Rr - T / 2).toFixed(1)}px,0,0)`;
    roll.style.setProperty('--spin', (Rr * 0.9).toFixed(1) + 'px');
    // 刚开始从天杆上分出来、最后又并回天杆：两头淡入淡出
    roll.style.opacity = clamp(Math.min(u / 0.04, (1 - u) / 0.08), 0, 1).toFixed(3);
  }

  on(EV.MOVE, ({ x: nx }) => { x = nx; if (!raf) raf = requestAnimationFrame(paint); });
  on(EV.OPENED, measure);
  on(EV.CONTENT_READY, measure);
  on(EV.CONTENT_CHANGED, measure);
  on(EV.CLOSED, () => { x = 0; clear(); });
  addEventListener('resize', measure, { passive: true });
}
