/* ============================================================
   seal · <sc-seal> 火漆
   点击 → 蜡抬起、落下 → 发 seal:broken
   听到 scroll:closed → 重新封上
   属性：mark="卷"  印文（一个字）
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';

const PATH_MAIN = `M7 47 C 4 29 17 12 35 9 C 49 6.4 62 8 74 10
  C 96 13 114 26 113 47 C 112 67 99 82 79 88
  C 61 93 43 91 27 84 C 11 77 8 63 7 47 Z`;

const svg = (mark) => `
<svg class="seal-cord" viewBox="0 0 60 84" aria-hidden="true" focusable="false">
  <path d="M4 3 C 9 33, 23 56, 51 80" fill="none" stroke="#85683a" stroke-width="5.8" stroke-linecap="round"/>
  <path d="M4 3 C 9 33, 23 56, 51 80" fill="none" stroke="rgba(226,208,172,.3)" stroke-width="1.4" stroke-linecap="round" transform="translate(-1,-1)"/>
  <path d="M4 3 C 9 33, 23 56, 51 80" fill="none" stroke="rgba(40,26,10,.44)" stroke-width="5.8" stroke-linecap="round" stroke-dasharray="1.6 4"/>
</svg>
<button class="seal" type="button" data-en-label="Break the wax and unroll" data-zh-label="揭开火漆，展开手卷" aria-label="Break the wax and unroll">
  <svg class="seal-svg" viewBox="0 0 120 100" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="waxFill" gradientUnits="userSpaceOnUse" cx="44" cy="30" r="86">
        <stop offset="0" stop-color="#a63219"/><stop offset=".3" stop-color="#8a2010"/>
        <stop offset=".58" stop-color="#6b1507"/><stop offset=".82" stop-color="#520e03"/>
        <stop offset="1" stop-color="#3c0801"/>
      </radialGradient>
      <filter id="waxBlob" x="-18%" y="-18%" width="136%" height="136%">
        <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="4" seed="11" result="t"/>
        <feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="waxSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6"/></filter>
    </defs>
    <!-- 压出来溢的一小片 + 主块 -->
    <g filter="url(#waxBlob)">
      <path d="M16 76 C 4 78 0 86 5 91 C 10 96 26 95 29 88 C 31 82 26 75 16 76 Z" fill="url(#waxFill)"/>
      <path d="${PATH_MAIN}" fill="url(#waxFill)"/>
    </g>
    <!-- 印面凹下去的一块 -->
    <ellipse cx="59" cy="46" rx="34" ry="27" fill="#4a0c02" opacity=".42" filter="url(#waxSoft)"/>
    <!-- 外沿反光 -->
    <path d="${PATH_MAIN}" fill="none" stroke="#b8562e" stroke-width="3.4" opacity=".17"
          transform="translate(60,49) scale(.95) translate(-60,-49)" filter="url(#waxSoft)"/>
    <!-- 印圈 -->
    <circle cx="59" cy="46" r="26.5" fill="none" stroke="#2e0600" stroke-width="3" opacity=".42"/>
    <circle cx="59" cy="46" r="26.5" fill="none" stroke="#e08050" stroke-width="1" opacity=".26" transform="translate(0,1.6)"/>
    <!-- 印文：压进去的字，下沿留一道反光 -->
    <text x="59" y="47" text-anchor="middle" dominant-baseline="central" font-size="37" font-weight="600"
          fill="#ffb08a" opacity=".2" transform="translate(0,1.6)" font-family="Georgia,'Songti SC','SimSun',serif">${mark}</text>
    <text x="59" y="47" text-anchor="middle" dominant-baseline="central" font-size="37" font-weight="600"
          fill="#2a0500" opacity=".78" font-family="Georgia,'Songti SC','SimSun',serif">${mark}</text>
    <!-- 犹豫时裂开的一道缝 -->
    <path class="seal-crack" pathLength="1" d="M88 14 L80 27 L84 33 L74 46 L77 52 L69 62"
          fill="none" stroke="#1c0300" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
    <!-- 蜡面反光 -->
    <ellipse cx="38" cy="22" rx="20" ry="8" fill="#ff9d72" opacity=".12" transform="rotate(-16 38 22)" filter="url(#waxSoft)"/>
  </svg>
</button>`;

class ScSeal extends HTMLElement {
  connectedCallback() {
    if (this.button) return;
    this.innerHTML = svg(this.getAttribute('mark') || '卷');
    this.button = this.querySelector('.seal');

    this.button.addEventListener('click', () => this.break());

    this.off = [
      on(EV.OPENED, () => this.button.setAttribute('tabindex', '-1')),
      on(EV.CLOSED, () => this.reseal()),
    ];
  }

  disconnectedCallback() { this.off?.forEach((f) => f()); }

  break() {
    if (this.button.classList.contains('is-peeling') || document.body.classList.contains('opened')) return;
    this.button.classList.remove('is-resealing');
    this.button.classList.add('is-peeling');
    emit(EV.SEAL_BROKEN);
  }

  reseal() {
    this.button.classList.remove('is-peeling');
    void this.button.offsetWidth;            // 重启动画
    this.button.classList.add('is-resealing');
    this.button.removeAttribute('tabindex');
  }
}

customElements.define('sc-seal', ScSeal);
