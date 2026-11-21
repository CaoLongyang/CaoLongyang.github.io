/* ============================================================
   scene-router · 进出场景（所有场景共用）
   入口：页面里任何 [data-scene="名字"] 的元素，点击即进入
   场景代码在 scenes/<名字>/<名字>.js，点开时才下载；它导出
     mount(layer, { sub, from }) → { unmount(), go?(sub) }
   退出：左上角「目」、Esc、浏览器后退
   网址：#works、#works/<子项>；直接打开这样的链接会落在场景里
   发：scene:opened { name } · scene:closed { name }
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';
import { reduced, wait } from '../../core/motion.js';

const body = document.body;
const base = new URL('../../', import.meta.url);   // 站点根目录

const layer = document.createElement('div');
layer.className = 'sr-layer';
const ink = document.createElement('div');
ink.className = 'sr-ink';
ink.setAttribute('aria-hidden', 'true');
const back = document.createElement('button');
back.type = 'button';
back.className = 'sr-back';
back.innerHTML = '<b>目</b><span data-en="Contents" data-zh="回目录">Contents</span>';
document.body.append(layer, ink, back);

let active = null;        // { name, api, from }
let busy = false;
const initialHash = location.hash;

function loadCss(name) {
  const href = new URL(`scenes/${name}/${name}.css`, base).href;
  if (document.querySelector(`link[href="${href}"]`)) return Promise.resolve();
  return new Promise((res) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    l.onload = l.onerror = () => res();
    document.head.append(l);
  });
}

function originOf(el) {
  if (!el) return ['50%', '50%'];
  const r = el.getBoundingClientRect();
  return [`${r.left + r.width / 2}px`, `${r.top + r.height / 2}px`];
}

async function enter(name, { sub = '', from = null, instant = false, tint = '' } = {}) {
  if (busy || active) return;
  busy = true;
  const [ox, oy] = originOf(from);
  ink.style.setProperty('--ox', ox);
  ink.style.setProperty('--oy', oy);
  const fast = instant || reduced();

  // 墨晕开（同时去下载场景）
  const loading = Promise.all([loadCss(name), import(new URL(`scenes/${name}/${name}.js`, base).href)]);
  if (!fast) {
    ink.className = 'sr-ink' + (tint ? ' is-' + tint : '');
    void ink.offsetWidth;
    ink.classList.add('is-spread');
    await wait(560);
  }
  const [, mod] = await loading;

  body.classList.add('in-scene');
  layer.innerHTML = '';
  const fromRect = from?.getBoundingClientRect() || null;
  // 进场景记一条历史：浏览器「后退」就能回目录（直达链接进来的不用再记）
  if (!instant) history.pushState({ scene: name }, '', '#' + name + (sub ? '/' + sub : ''));
  const api = await mod.mount(layer, { sub, fromRect, instant: fast });
  active = { name, api, from };
  emit(EV.CONTENT_CHANGED);

  // 墨退去，露出场景
  if (!fast) {
    ink.classList.add('is-fade');
    await wait(420);
  }
  ink.className = 'sr-ink';
  busy = false;
  emit(EV.SCENE_OPENED, { name });
  back.focus({ preventScroll: true });
}

async function exit() {
  if (busy || !active) return;
  busy = true;
  const { name, api, from } = active;
  const fast = reduced();

  // 一把火把整个场景烧掉：从中间烧开，烧完回到目录
  // burn 是可选的：没有这个文件夹就退回到墨盖住的做法
  if (!fast) {
    try {
      const { burnAway } = await import(new URL('features/burn/burn.js', base).href);
      const target = api?.burnTarget?.() || layer.firstElementChild;
      await burnAway(target, { pad: api?.burnPad?.() || 0, duration: 1700 });
    } catch {
      const [ox, oy] = originOf(from);
      ink.style.setProperty('--ox', ox);
      ink.style.setProperty('--oy', oy);
      ink.className = 'sr-ink is-cover';
      void ink.offsetWidth;
      ink.classList.add('is-on');
      await wait(260);
    }
  }
  await api?.unmount?.();
  layer.innerHTML = '';
  body.classList.remove('in-scene');
  active = null;
  history.replaceState(null, '', '#toc');

  // 目录从灰烬后面重新浮出来
  ink.className = 'sr-ink';
  if (!fast) {
    body.classList.add('sr-return');
    setTimeout(() => body.classList.remove('sr-return'), 600);
  }
  busy = false;
  emit(EV.SCENE_CLOSED, { name });
  from?.focus?.({ preventScroll: true });
}

/* 入口：[data-scene] 的元素；或目录里做好的一章（[data-chapter][data-ready]）。
   章节入口平时由 features/toc-stamp 接管（盖印再进）；没有它时点一栏直接进 */
const entryOf = (n) => n && document.querySelector(`[data-scene="${n}"],[data-chapter="${n}"][data-ready]`);
document.addEventListener('click', (e) => {
  if (!body.classList.contains('settled')) return;
  const el = e.target.closest?.('[data-scene]');
  if (el) { e.preventDefault(); enter(el.dataset.scene, { from: el }); return; }
  const col = !document.documentElement.dataset.stamp && e.target.closest?.('[data-chapter][data-ready]');
  if (col) { e.preventDefault(); enter(col.dataset.chapter, { from: col }); }
});
back.addEventListener('click', exit);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && active) { e.preventDefault(); exit(); } });

on(EV.SCENE_ENTER, ({ name, sub, from, tint }) => enter(name, { sub, from, tint }));
on(EV.SCENE_EXIT, exit);

/* 直接打开 #works 或 #works/xxx：卷展开后直接落在场景里 */
const [hName, hSub] = initialHash.slice(1).split('/');
on(EV.OPENED, () => {
  const entry = entryOf(hName);
  if (!entry) return;
  emit(EV.GOTO, { id: entry.closest('[data-panel]')?.id, instant: true });
  setTimeout(() => enter(hName, { sub: hSub || '', from: entry, instant: true }), 80);
});
on(EV.CONTENT_READY, () => {
  // 入口在段落内容里，载入后才存在；OPENED 可能先到
  const entry = entryOf(hName);
  if (entry && !active && body.classList.contains('opened')) {
    emit(EV.GOTO, { id: entry.closest('[data-panel]')?.id, instant: true });
    setTimeout(() => enter(hName, { sub: hSub || '', from: entry, instant: true }), 80);
  }
});

/* 浏览器前进 / 后退：网址变成场景就进去，离开场景就退出 */
const onNav = () => {
  const [n, sub] = location.hash.slice(1).split('/');
  const entry = entryOf(n);
  if (entry && !active) {
    emit(EV.GOTO, { id: entry.closest('[data-panel]')?.id, instant: true });
    enter(n, { sub: sub || '', from: entry });
  } else if (active && n !== active.name) exit();
  else if (active && sub) active.api?.go?.(sub);
};
addEventListener('hashchange', onNav);
addEventListener('popstate', onNav);
