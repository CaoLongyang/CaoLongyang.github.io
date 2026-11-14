/* ============================================================
   cursor · <sc-ink-cursor>
   墨点紧跟指针，淡影晚 0.1 秒左右追上来
   触屏、减少动效时整个功能不启用
   ============================================================ */

import { finePointer, reduced } from '../../core/motion.js';
import { EV, on } from '../../core/events.js';

class ScInkCursor extends HTMLElement {
  connectedCallback() {
    if (this.dot || !finePointer() || reduced()) return;
    this.setAttribute('aria-hidden', 'true');
    this.innerHTML = '<span class="ic-trail"></span><span class="ic-dot"></span>';
    this.dot = this.querySelector('.ic-dot');
    this.trail = this.querySelector('.ic-trail');
    document.body.classList.add('has-ink-cursor');

    let mx = -100, my = -100, tx = -100, ty = -100, raf = 0;
    const loop = () => {
      tx += (mx - tx) * 0.22;
      ty += (my - ty) * 0.22;
      this.trail.style.transform = `translate3d(${tx}px,${ty}px,0)`;
      raf = Math.abs(mx - tx) + Math.abs(my - ty) > 0.2 ? requestAnimationFrame(loop) : 0;
    };

    addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      this.dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      const t = e.target;
      const onPaper = !!t.closest?.('.paper');
      this.classList.toggle('is-on', onPaper);
      this.classList.toggle('is-hot', onPaper && !!t.closest('a,button,[role="button"]'));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    const hide = () => this.classList.remove('is-on', 'is-hot');
    document.addEventListener('pointerleave', hide);
    on(EV.ROLL_UP, hide);   // 纸卷走了，墨点也该收起来
  }
}

customElements.define('sc-ink-cursor', ScInkCursor);
