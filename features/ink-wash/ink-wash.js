/* ============================================================
   ink-wash · 墨：飞白一笔、几滴墨点
   段落载入后，往指定位置补上几处墨迹（纯装饰，aria-hidden）
   删掉这个文件夹（以及 index.html 里的两行引用）就回到没有墨的样子
   ============================================================ */

import { EV, on } from '../../core/events.js';
import { initSignature } from './signature.js';

// 一笔横向的干笔：右边起笔重，往左收笔渐细
const STROKE = `
<svg viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
  <path d="M6 31 C60 26 150 18 260 14 C380 10 480 8 560 6 C590 5 598 22 596 34
           C594 48 586 55 560 55 C470 54 370 50 260 46 C160 42 70 38 6 33 Z"/>
</svg>`;

// 墨点：一大几小，一滴甩出细尾
const DOTS = `
<svg viewBox="0 0 120 80" aria-hidden="true">
  <circle cx="34" cy="40" r="9"/>
  <circle cx="58" cy="30" r="3.2"/>
  <circle cx="70" cy="52" r="2.2"/>
  <circle cx="16" cy="58" r="1.6"/>
  <circle cx="82" cy="22" r="1.4"/>
  <path d="M44 34 C62 24 86 14 108 8 C88 18 66 30 46 40 Z" opacity=".75"/>
</svg>`;

function add(host, cls, svg, before) {
  if (!host || host.querySelector(':scope > .' + cls.split(' ')[0])) return;
  const el = document.createElement('span');
  el.className = cls;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = svg;
  before ? host.prepend(el) : host.append(el);
}

function run() {
  initSignature();
  add(document.querySelector('.about-lead'), 'ink-stroke ink-stroke--title', STROKE, true);
  add(document.querySelector('.about'), 'ink-wash-blot', '', true);
  add(document.querySelector('.about-sign'), 'ink-dots ink-dots--sign', DOTS);
  add(document.querySelector('.end'), 'ink-stroke ink-stroke--end', STROKE, true);
  add(document.querySelector('.end'), 'ink-dots ink-dots--end', DOTS);
}

on(EV.CONTENT_READY, run);
on(EV.CONTENT_CHANGED, run);
run();
