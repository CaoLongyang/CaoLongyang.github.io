/* ============================================================
   works/works.js · 屏风作品集
   - 往下滚：四扇从合着的状态，像真的屏风一样之字形展开（进度跟着滚动，往回滚就合上）
   - 完全展开后：悬停哪扇，哪扇变宽
   - 点一扇：那一扇铺开成作品详情（网址 #作品名，可以直接分享；Esc / 后退回到屏风）
   - 手机、减少动效：不折叠，直接是展开好的屏风
   ============================================================ */

import { loadWorks, renderPanels, wireHover, shot, mockShot } from '../features/screen/screen.js';
import { t, applyLang } from '../features/lang/lang.js';

const root = document.documentElement;
const stage = document.querySelector('.stage');
const box = document.querySelector('[data-screen="full"]');
const detail = document.querySelector('[data-detail]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 760px)');
const MAX = 84 * Math.PI / 180;            // 合着时每扇转多少度
const ease = (x) => x * x * (3 - 2 * x);
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const works = await loadWorks('../data/works.json');
let panels = [], open = null, flat = false;

function build() {
  panels = renderPanels(box, works, '#', '../');
  open = wireHover(box, panels);
  panels.forEach((p) => p.addEventListener('click', (e) => {
    const w = works.find((x) => x.id === p.dataset.id);
    if (w.href) return;                                      // 手卷：直接跳过去
    e.preventDefault();
    if (!flat && !narrow.matches) return;                    // 还没展开时点不进去
    show(w.id, true);
  }));
  paintFold();
}

/* ---------- 折叠：p = 0 合着，1 铺平 ---------- */
function progress() {
  if (reduce.matches || narrow.matches) return 1;
  const r = stage.getBoundingClientRect();
  const span = r.height - innerHeight;
  return Math.min(1, Math.max(0, -r.top / (span * .7)));
}
function paintFold() {
  const p = progress();
  const body = box.querySelector('.screen-body');
  if (!body) return;
  const isFlat = p >= .985;
  if (isFlat !== flat) {
    flat = isFlat;
    box.classList.toggle('is-flat', flat);
    if (!flat) panels.forEach((q) => q.classList.remove('is-open')); else open(panels[0]);
  }
  box.classList.toggle('is-folding', !flat);
  root.style.setProperty('--fold', p.toFixed(3));
  if (flat) { panels.forEach((q) => (q.style.transform = '')); return; }
  const th = MAX * (1 - ease(Math.min(1, p / .985)));
  const W = body.clientWidth / panels.length;
  const total = W * Math.cos(th) * panels.length;
  const off = (body.clientWidth - total) / 2;
  panels.forEach((q, i) => {
    const x = off + W * Math.cos(th) * i - W * i;           // 相对它平铺时的位置
    const z = i % 2 ? -W * Math.sin(th) : 0;
    const a = (i % 2 ? -th : th) * 180 / Math.PI;
    q.style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${a.toFixed(2)}deg)`;
  });
}

/* ---------- 详情 ---------- */
function detailHTML(w) {
  const i = works.indexOf(w), n = works.length;
  const next = works[(i + 1) % n];
  const steps = (w.steps?.en || []).map((s, k) => `<li data-en="${esc(s)}" data-zh="${esc(w.steps.zh?.[k] || s)}">${esc(t({ en: s, zh: w.steps.zh?.[k] }))}</li>`).join('');
  const status = w.status === 'private'
    ? `<span data-en="Private repository" data-zh="私有仓库">Private repository</span>`
    : (w.link ? `<a href="${esc(w.link)}" target="_blank" rel="noopener">GitHub ↗</a>` : '');
  const extra = w.mock === 'dark' ? 'light' : 'dark';
  return `
  <div class="d-bar">
    <button class="chip" type="button" data-close data-en="← All works" data-zh="← 回到屏风">← All works</button>
    <span class="d-count">0${i + 1} / 0${n}</span>
    <a class="d-next" href="#${next.id}" data-next="${next.id}"><span data-en="Next" data-zh="下一件">Next</span>: ${esc(next.title)} →</a>
  </div>
  <article class="d-sheet" style="view-transition-name:panel-${w.id}">
    <div class="d-text">
      <p class="cap cap-zhu">0${i + 1} · ${w.year}${w.progress ? ' · <span data-en="In progress" data-zh="进行中">In progress</span>' : ''}</p>
      <h1 class="d-title serif">${esc(w.title)}</h1>
      <p class="d-summary" data-en="${esc(w.summary?.en)}" data-zh="${esc(w.summary?.zh)}">${esc(t(w.summary))}</p>
      <dl class="d-meta">
        <div><dt data-en="Tags" data-zh="标签">Tags</dt><dd data-en="${esc(w.tags?.en)}" data-zh="${esc(w.tags?.zh)}">${esc(t(w.tags))}</dd></div>
        ${status ? `<div><dt data-en="Code" data-zh="代码">Code</dt><dd>${status}</dd></div>` : ''}
      </dl>
      ${steps ? `<h2 class="cap" data-en="How it was made" data-zh="怎么做的">How it was made</h2><ol class="d-steps">${steps}</ol>` : ''}
    </div>
    <div class="d-shots">
      <figure class="d-main">${shot(w, 0)}</figure>
      <figure>${w.shots?.[1] ? shot(w, 1) : mockShot(w.mock)}</figure>
      <figure>${w.shots?.[2] ? shot(w, 2) : mockShot(extra)}</figure>
    </div>
  </article>`;
}

function render(id) {
  const w = works.find((x) => x.id === id && !x.href);
  if (!w) return false;
  detail.innerHTML = detailHTML(w);
  applyLang(detail);
  detail.hidden = false;
  root.classList.add('has-detail');
  document.title = `${w.title} · Calvin Cao`;
  return true;
}
function hide() {
  detail.hidden = true;
  detail.innerHTML = '';
  root.classList.remove('has-detail');
  document.title = 'Works · Calvin Cao';
}
const vt = (fn) => (document.startViewTransition && !reduce.matches ? document.startViewTransition(fn) : fn());

function show(id, push) {
  // 那一扇和详情同名：浏览器把这一扇「铺开」成详情
  vt(() => { if (render(id) && push) history.pushState({ id }, '', '#' + id); scrollTo(0, 0); });
}
function close(push = true) {
  const id = location.hash.slice(1);
  vt(() => {
    hide();
    if (push) history.pushState({}, '', location.pathname);
    // 回到屏风铺平的位置
    const top = stage.offsetTop + (stage.offsetHeight - innerHeight) * .7 + 2;
    scrollTo(0, narrow.matches || reduce.matches ? 0 : top);
    paintFold();
    const p = panels.find((q) => q.dataset.id === id); if (p) { open(p); p.focus({ preventScroll: true }); }
  });
}

detail.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) { e.preventDefault(); close(); }
  const n = e.target.closest('[data-next]');
  if (n) { e.preventDefault(); show(n.dataset.next, true); }
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !detail.hidden) close(); });
addEventListener('popstate', () => { const id = location.hash.slice(1); if (id) render(id) || hide(); else if (!detail.hidden) close(false); });
addEventListener('scroll', () => requestAnimationFrame(paintFold), { passive: true });
addEventListener('resize', paintFold, { passive: true });
document.addEventListener('lang:change', () => { build(); const id = location.hash.slice(1); if (id && !detail.hidden) render(id); });
reduce.addEventListener('change', paintFold); narrow.addEventListener('change', paintFold);

build();
const first = location.hash.slice(1);
if (first && !render(first)) hide();
if (first) scrollTo(0, 0);
if (!first) root.classList.remove('has-detail');
