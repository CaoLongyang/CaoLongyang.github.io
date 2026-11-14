/* ============================================================
   core/filters.js — 全站共用的 SVG 滤镜
   纸边、焦边、墨边、绳边、蜡边。只注入一次，CSS 用 filter:url(#id) 引用。
   ============================================================ */

const DEFS = `
<filter id="roughen" x="-10%" y="-10%" width="120%" height="120%">
  <feTurbulence type="fractalNoise" baseFrequency="0.024 0.032" numOctaves="4" seed="9" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="burnEdge" x="-8%" y="-8%" width="116%" height="116%">
  <feTurbulence type="fractalNoise" baseFrequency="0.04 0.055" numOctaves="5" seed="3" result="n"/>
  <feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="inkEdge" x="-20%" y="-20%" width="140%" height="140%">
  <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="3" seed="4" result="m"/>
  <feDisplacementMap in="SourceGraphic" in2="m" scale="40" xChannelSelector="R" yChannelSelector="G"/>
  <feGaussianBlur stdDeviation="1.4"/>
</filter>
<filter id="bandEdge" x="-10%" y="-14%" width="120%" height="128%">
  <feTurbulence type="fractalNoise" baseFrequency="0.02 0.07" numOctaves="3" seed="17" result="b"/>
  <feDisplacementMap in="SourceGraphic" in2="b" scale="5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="waxEdge" x="-22%" y="-22%" width="144%" height="144%">
  <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="4" seed="23" result="w"/>
  <feDisplacementMap in="SourceGraphic" in2="w" scale="12" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="slipEdge" x="-6%" y="-6%" width="112%" height="112%">
  <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="31" result="s"/>
  <feDisplacementMap in="SourceGraphic" in2="s" scale="4" xChannelSelector="R" yChannelSelector="G"/>
</filter>`;

export function ensureFilters() {
  if (document.getElementById('sc-filters')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'sc-filters';
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML = `<defs>${DEFS}</defs>`;
  document.body.prepend(svg);
}

ensureFilters();
