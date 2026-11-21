/* ============================================================
   screen · 屏风（一扇 = 一件作品）
   两种用法：
   1) 首页的小屏风   <div data-screen="mini" data-src="data/works.json" data-base="works/"></div>
      悬停 / 聚焦哪扇，哪扇变宽；点击进入作品集（转场：同一扇放大过去）
   2) 作品集的整座屏风  由 works/works.js 调用 renderPanels() + 自己管展开和详情
   内容来自 data/works.json：title、year、short、status、mock、shots、href
   ============================================================ */

import { t, applyLang, getLang } from '../lang/lang.js';

export async function loadWorks(src) {
  const res = await fetch(src);
  return res.json();
}

const STATUS = {
  public: { en: '', zh: '' },
  private: { en: 'Private', zh: '未公开' },
};

/* 占位截图：还没有真截图时，用一张简化的界面示意（不是假装成真截图） */
export function mockShot(kind = 'dark') {
  if (kind === 'light') return `<div class="mock mock-light" aria-hidden="true"><i class="m-bar"></i><i class="m-pill"></i>${'<i class="m-cell"></i>'.repeat(15)}</div>`;
  if (kind === 'warm') return `<div class="mock mock-warm" aria-hidden="true"><i class="m-search"></i><i class="m-card"></i><i class="m-card"></i><i class="m-card"></i></div>`;
  if (kind === 'scroll') return `<div class="mock mock-scroll" aria-hidden="true"><i class="m-rod"></i><i class="m-sheet"><b>手卷</b></i><i class="m-rod"></i></div>`;
  return `<div class="mock mock-dark" aria-hidden="true"><i class="m-side"></i><i class="m-line"></i><i class="m-line s"></i><i class="m-row"><i class="m-tag g"></i></i><i class="m-row"><i class="m-tag o"></i></i></div>`;
}
export const shot = (w, i = 0) => (w.shots?.[i]
  ? `<img src="${w.shots[i]}" alt="" loading="lazy" decoding="async">`
  : mockShot(w.mock));

export function panelHTML(w, i, base, root = '') {
  const href = w.href ? root + w.href : `${base}#${w.id}`;
  const st = STATUS[w.status] || STATUS.public;
  const zh = getLang() === 'zh';
  return `
  <a class="panel" href="${href}" data-id="${w.id}" style="view-transition-name:panel-${w.id}">
    <span class="p-open">
      <span class="p-text">
        <span class="cap cap-zhu">0${i + 1} · ${w.year}${st.en ? ` · <span data-en="${st.en}" data-zh="${st.zh}">${zh ? st.zh : st.en}</span>` : ''}</span>
        <span class="p-title serif">${w.title}</span>
        <span class="p-short" data-en="${w.short.en}" data-zh="${w.short.zh}">${t(w.short)}</span>
        <span class="p-go" data-en="${w.href ? 'Unroll it ↗' : 'Step inside →'}" data-zh="${w.href ? '展开手卷 ↗' : '进去看看 →'}">${w.href ? 'Unroll it ↗' : 'Step inside →'}</span>
      </span>
      <span class="p-shot">${shot(w)}</span>
    </span>
    <span class="p-closed" aria-hidden="true">
      <span class="cap">0${i + 1}</span>
      <span class="p-vtitle serif">${w.title}</span>
      <span class="p-year">${w.year}</span>
    </span>
  </a>`;
}

export function renderPanels(el, works, base, root = '') {
  el.innerHTML = `<div class="screen-body">${works.map((w, i) => panelHTML(w, i, base, root)).join('')}</div><div class="screen-base" aria-hidden="true"></div>`;
  applyLang(el);
  return [...el.querySelectorAll('.panel')];
}

/* 哪扇打开：悬停、聚焦都算；离开整座屏风后回到第一扇 */
export function wireHover(el, panels, defaultIndex = 0) {
  const open = (p) => panels.forEach((q) => q.classList.toggle('is-open', q === p));
  open(panels[defaultIndex]);
  panels.forEach((p) => {
    p.addEventListener('pointerenter', () => open(p));
    p.addEventListener('focus', () => open(p));
  });
  el.addEventListener('pointerleave', () => open(panels[defaultIndex]));
  return open;
}

async function mountMini(el) {
  let works;
  try { works = await loadWorks(el.dataset.src); } catch { el.remove(); return; }
  if (!works.length) { el.closest('section')?.remove(); return; }
  const panels = renderPanels(el, works, el.dataset.base || 'works/');
  wireHover(el, panels);
  document.addEventListener('lang:change', () => { const i = panels.findIndex((p) => p.classList.contains('is-open')); const ps = renderPanels(el, works, el.dataset.base || 'works/'); wireHover(el, ps, Math.max(0, i)); });
}

document.querySelectorAll('[data-screen="mini"]').forEach(mountMini);
