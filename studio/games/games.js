/* studio/games/games.js · 游戏页：数据来自 data/steam.json（每天由 GitHub Action 从 Steam 同步） */

import { applyLang, getLang } from '../../features/lang/lang.js';
import { paint } from '../../features/painting/painting.js';
import { watch } from '../../features/reveal/reveal.js';

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const both = (en, zh) => `data-en="${esc(en)}" data-zh="${esc(zh)}"`;
const h = (x) => (x >= 100 ? Math.round(x) : x.toFixed(1).replace(/\.0$/, ''));
// 右上角的成就角标：拿了几个 / 一共几个；全拿到了换成朱红
const ach = (g) => g.ach?.total ? `<span class="g-ach${g.ach.got === g.ach.total ? ' is-full' : ''}" title="Achievements · 成就"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2h8v2h2v2a3 3 0 0 1-3 3h-.2A4 4 0 0 1 9 10.9V12h2v2H5v-2h2v-1.1A4 4 0 0 1 5.2 9H5a3 3 0 0 1-3-3V4h2V2Zm0 3.5H3.5V6c0 .8.6 1.5 1.4 1.5H5A4 4 0 0 1 4 5.5Zm8 0a4 4 0 0 1-1 2H11c.8 0 1.5-.7 1.5-1.5v-.5H12Z"/></svg>${g.ach.got}/${g.ach.total}</span>` : '';
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const data = await fetch('../../data/steam.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => null);
const $ = (s) => document.querySelector(s);

if (!data) {
  $('[data-recent]').innerHTML = `<p ${both('Could not load the game list.', '游戏列表没能载入。')}></p>`;
} else {
  const d = new Date(data.updated);
  const en = `Synced from Steam · ${MONTH[d.getMonth()]} ${d.getDate()}`, zh = `从 Steam 同步 · ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  $('[data-synced]').innerHTML = `<span ${both(en, zh)}>${en}</span>${data._sample ? ` <span class="s-badge" ${both('Sample', '示例数据')}>Sample</span>` : ''}`;

  // 最近两周
  const recent = (data.recent || []).slice(0, 3);   // 页面上只放最近的 3 款
  $('[data-recent]').style.gridTemplateColumns = recent.length > 1 ? `1.6fr repeat(${recent.length - 1}, 1fr)` : 'minmax(0, 720px)';
  $('[data-recent]').innerHTML = recent.length ? recent.map((g, i) => `
    <article class="now-card${i ? '' : ' is-lead'}">
      <figure class="g-img">${ach(g)}<img src="${esc(g.header)}" alt="" loading="${i ? 'lazy' : 'eager'}" decoding="async" data-app="${g.appid}"></figure>
      <div class="now-text">
        ${i ? '' : `<span class="cap cap-zhu" ${both('Now playing', '正在玩')}>Now playing</span>`}
        <h3 class="serif">${esc(g.name)}</h3>
        <p><b>${h(g.hours2w)} h</b> <span ${both('in the last two weeks', '最近两周')}>in the last two weeks</span> · <span ${both(`${h(g.hours)} h total`, `一共 ${h(g.hours)} 小时`)}>${h(g.hours)} h total</span></p>
      </div>
    </article>`).join('')
    : `<p class="empty" ${both('Nothing in the last two weeks — busy with code, probably.', '最近两周没玩——大概在写代码。')}></p>`;

  // 统计
  const s = data.stats || {};
  const stat = (n, en, zh) => `<div><dt ${both(en, zh)}>${en}</dt><dd class="serif">${n}</dd></div>`;
  const lib = (s.owned ?? 0) + (s.family ?? 0) || '—';
  $('[data-stats]').innerHTML = stat(lib, 'Games in library', '游戏库') + stat(s.played ?? '—', 'Actually played', '真正玩过') +
    stat((s.hours ?? 0) + ' h', 'Hours in total', '总时长') + stat((s.hours2w ?? 0) + ' h', 'Last two weeks', '最近两周');

  // 玩得最多：竖版封面墙
  const top = data.top || [];
  const max = Math.max(1, ...top.map((g) => g.hours));
  $('[data-top]').innerHTML = top.map((g, i) => `
    <li class="tile">
      <figure class="g-cover">${ach(g)}<img src="${esc(g.cover)}" alt="" loading="lazy" decoding="async" data-app="${g.appid}" data-fallback="${esc(g.header)}"></figure>
      <span class="tile-rank">${String(i + 1).padStart(2, '0')}</span>
      <span class="tile-name">${esc(g.name)}</span>
      <span class="tile-bar" style="--w:${(g.hours / max * 100).toFixed(1)}%"></span>
      <span class="tile-hours">${h(g.hours)} h</span>
    </li>`).join('');

  if (data.profile?.url) { const a = $('[data-profile]'); a.href = data.profile.url; a.textContent = (data.profile.name || 'Steam') + ' ↗'; }
}

// 图片挂了：先换横版图，再不行就画一幅塞尚小画顶上
document.addEventListener('error', (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.dataset.app) return;
  if (img.dataset.fallback) { const f = img.dataset.fallback; delete img.dataset.fallback; img.src = f; return; }
  const c = document.createElement('canvas');
  img.replaceWith(c);
  requestAnimationFrame(() => paint(c, 'games', +img.dataset.app));
}, true);

applyLang();
watch();
