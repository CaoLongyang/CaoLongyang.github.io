/* ============================================================
   sections/fragments.js · 把 data/fragments.json 渲染成纸条
   段落载入后执行，渲染完发 content:changed 让尺寸重算
   ============================================================ */

import { EV, emit, on } from '../core/events.js';

const ROT = [-2.2, 1.6, -0.8, 2.4, -1.6, 0.9, -2.8, 1.2];

async function render() {
  const box = document.querySelector('[data-fragments]');
  if (!box || box.dataset.rendered) return;
  box.dataset.rendered = '1';
  try {
    const items = await (await fetch(box.dataset.fragments)).json();
    box.innerHTML = items.map((it, i) => `
      <article class="slip ${it.kind === 'note' ? 'is-note' : ''}" data-float style="--i:${i};--r:${ROT[i % ROT.length]}deg">
        <time datetime="${it.date}">${it.date.replaceAll('-', ' · ')}</time>
        <p data-en="${esc(it.en)}" data-zh="${esc(it.zh)}">${esc(it.en)}</p>
        ${it.stamp ? `<span class="slip-stamp" aria-hidden="true">${esc(it.stamp)}</span>` : ''}
      </article>`).join('');
    const count = document.querySelector('[data-fragments-count]');
    if (count) count.dataset.count = String(items.length);
  } catch (err) {
    console.warn('[fragments]', err);
  }
  emit(EV.CONTENT_CHANGED);
}

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

on(EV.CONTENT_READY, render);
