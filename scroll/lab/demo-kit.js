/* ============================================================
   lab/demo-kit.js · 演示页工具条
   <body data-demo="火漆 · seal" data-actions="open,close,reload" data-start="open">
   - 顶部工具条：返回工坊、功能名、操作按钮
   - 右下角：实时记录 core/events.js 里的所有事件
   ============================================================ */

import { EV, emit, on } from '../core/events.js';
import { KEYS, remove } from '../core/store.js';

const body = document.body;
const cfg = body.dataset;
const depth = cfg.depth ?? '../../';

const ACTIONS = {
  open:   ['展开', () => { body.classList.add('opened'); emit(EV.OPENED, { instant: false }); setTimeout(() => body.classList.add('settled'), 2300); }],
  close:  ['卷起', () => { body.classList.remove('settled'); body.classList.add('closing'); body.classList.remove('opened'); setTimeout(() => { body.classList.remove('closing'); emit(EV.CLOSED); }, 1700); }],
  reseal: ['重新封上', () => emit(EV.CLOSED)],
  forget: ['清除记忆', () => { remove(KEYS.OPENED); location.reload(); }],
  replay: ['再显影一次', () => {
    document.querySelectorAll('.is-in,.is-inked').forEach((el) => el.classList.remove('is-in', 'is-inked'));
    setTimeout(() => document.querySelectorAll('[data-demo-target]').forEach((el) => el.classList.add('is-in')), 400);
  }],
  night:  ['昼 / 夜', () => { const r = document.documentElement; r.dataset.theme = r.dataset.theme === 'night' ? 'day' : 'night'; }],
  reload: ['重新载入', () => location.reload()],
};

const bar = document.createElement('header');
bar.className = 'dk-bar';
const [zh, en] = (cfg.demo || '演示 · demo').split('·').map((s) => s.trim());
bar.innerHTML = `<a href="${depth}lab/index.html">← 工坊</a><b>${zh}</b><span class="dk-sub">${en || ''}</span><span class="dk-actions"></span>`;
const box = bar.querySelector('.dk-actions');
(cfg.actions || 'reload').split(',').map((s) => s.trim()).filter(Boolean).forEach((k) => {
  const a = ACTIONS[k];
  if (!a) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = a[0];
  b.addEventListener('click', a[1]);
  box.append(b);
});
body.prepend(bar);

const log = document.createElement('ol');
log.className = 'dk-log';
body.append(log);
const t0 = performance.now();
Object.values(EV).forEach((name) => on(name, (detail) => {
  const li = document.createElement('li');
  const d = Object.keys(detail).length ? JSON.stringify(detail, (k, v) => (v instanceof Element ? `<${v.tagName.toLowerCase()}#${v.id}>` : v)) : '';
  li.innerHTML = `<em>${((performance.now() - t0) / 1000).toFixed(2)}s</em> <span>${name}</span> ${d}`;
  log.prepend(li);
}));

if (cfg.start === 'open') {
  body.classList.add('opened', 'settled');
  setTimeout(() => emit(EV.OPENED, { instant: true }), 60);
}
