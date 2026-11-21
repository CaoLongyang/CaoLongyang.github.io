/* ============================================================
   brush · 名字下面的一笔飞白
   <div data-brush></div>  打开页面后，这一笔从左往右「写」出来，墨再从边缘慢慢晕开
   做法：一条带干笔纹理的粗线（SVG 滤镜，只算一次），外面套一层遮罩；
         动的只是遮罩线的 stroke-dashoffset，所以很省
   ============================================================ */

const D = 'M 14 34 C 104 16, 214 22, 314 19 S 474 12, 528 28';
let n = 0;

export function mountBrush(el) {
  const id = 'br' + (++n);
  el.innerHTML = `
  <svg class="brush" viewBox="0 0 540 56" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <filter id="${id}-dry" x="-5%" y="-80%" width="110%" height="260%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.55" numOctaves="2" seed="4" result="t"/>
        <feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 1.75" result="m"/>
        <feComposite in="SourceGraphic" in2="m" operator="in" result="c"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="2" result="n"/>
        <feDisplacementMap in="c" in2="n" scale="5"/>
      </filter>
      <filter id="${id}-soft" x="-10%" y="-100%" width="120%" height="300%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="5" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="10" result="d"/><feGaussianBlur in="d" stdDeviation="3"/>
      </filter>
      <mask id="${id}-m" maskUnits="userSpaceOnUse" x="0" y="0" width="540" height="56">
        <path class="brush-hand" d="${D}" pathLength="1" fill="none" stroke="#fff" stroke-width="30" stroke-linecap="round"/>
      </mask>
    </defs>
    <g mask="url(#${id}-m)">
      <path class="brush-bleed" d="${D}" fill="none" stroke="currentColor" stroke-width="22" stroke-linecap="round" filter="url(#${id}-soft)"/>
      <path class="brush-ink" d="${D}" fill="none" stroke="currentColor" stroke-width="15" stroke-linecap="round" filter="url(#${id}-dry)"/>
    </g>
  </svg>`;
  requestAnimationFrame(() => el.classList.add('is-writing'));
}

document.querySelectorAll('[data-brush]').forEach(mountBrush);
