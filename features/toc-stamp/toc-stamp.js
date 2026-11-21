/* ============================================================
   toc-stamp · 章名落印
   目录里每一栏 <li data-chapter="works" data-ready> 就是一章：
   - 悬停 / 聚焦：章名旁浮出一方朱印（刻章名两个字）
   - 点击：印压下去、抬起，纸上留一个斑驳的印痕；朱色从印痕处晕开，进入那一章
   - 还没做的章（没有 data-ready）：浮出一方淡灰的空印，点了只轻轻一顿
   - 从场景回来：那一章旁留一个淡淡的印痕，表示看过了（只在这次浏览里）
   卷上的目录和「目」字布带抽出的目录笺都会补上印
   发：scene:enter { name, from, tint:'zhu' }   听：content:ready · content:changed · scene:closed
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';
import { reduced } from '../../core/motion.js';

const PRESS = 430;                     // 从点下到朱色开始晕开
const visited = new Set();
document.documentElement.dataset.stamp = '1';   // 告诉 scene-router：章节入口由这里接管

function decorate(root = document) {
  root.querySelectorAll('[data-chapter]').forEach((col) => {
    const wrap = col.querySelector('.toc-namewrap');
    if (!wrap || wrap.querySelector('.toc-seal')) return;
    const name = (col.querySelector('.toc-name')?.textContent || '').trim();
    const seal = document.createElement('span');
    seal.className = 'toc-seal';
    seal.setAttribute('aria-hidden', 'true');
    seal.innerHTML = `<span class="toc-seal-face">${[...name].map((c) => `<i>${c}</i>`).join('')}</span>`;
    const mark = document.createElement('span');
    mark.className = 'toc-imprint';
    mark.setAttribute('aria-hidden', 'true');
    mark.innerHTML = seal.innerHTML;
    wrap.append(mark, seal);
    col.classList.toggle('is-visited', visited.has(col.dataset.chapter));
  });
}

function stamp(col) {
  const name = col.dataset.chapter;
  if (!col.hasAttribute('data-ready')) {
    col.classList.remove('is-nudge'); void col.offsetWidth; col.classList.add('is-nudge');
    return;
  }
  const mark = col.querySelector('.toc-imprint') || col;
  // 动画中再点一下：直接进去
  if (col.classList.contains('is-stamping') || reduced()) { go(col, name, mark); return; }
  col.classList.add('is-stamping');
  col._t = setTimeout(() => go(col, name, mark), PRESS);
}

function go(col, name, mark) {
  clearTimeout(col._t);
  if (col._gone) return;
  col._gone = true;
  visited.add(name);
  document.querySelectorAll(`[data-chapter="${name}"]`).forEach((c) => c.classList.add('is-visited'));
  emit(EV.SCENE_ENTER, { name, from: mark, tint: 'zhu' });
  setTimeout(() => { col.classList.remove('is-stamping'); col._gone = false; }, 900);
}

document.addEventListener('click', (e) => {
  const hit = e.target.closest?.('.toc-hit');
  const col = hit?.closest('[data-chapter]');
  if (!col || !document.body.classList.contains('settled')) return;
  e.preventDefault();
  stamp(col);
});

on(EV.CONTENT_READY, () => decorate());
on(EV.CONTENT_CHANGED, () => decorate());
on(EV.SCENE_CLOSED, ({ name }) => {
  document.querySelectorAll(`[data-chapter="${name}"]`).forEach((c) => c.classList.add('is-visited'));
});
decorate();
