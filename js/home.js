/* js/home.js · 首页里由数据生成的几块：文章、想法、画室窗、联系方式
   没有内容的块整块不显示 */

import { t, applyLang } from '../features/lang/lang.js';
import { paint } from '../features/painting/painting.js';
import { watch } from '../features/reveal/reveal.js';

const get = (p) => fetch(p).then((r) => (r.ok ? r.json() : null)).catch(() => null);
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const both = (o) => `data-en="${esc(o?.en ?? o)}" data-zh="${esc(o?.zh ?? o?.en ?? o)}"`;
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ym = (s) => { const [y, m] = s.split('-'); return { en: `${MONTH[+m - 1]} ${y}`, zh: `${y} 年 ${+m} 月` }; };
const md = (s) => { const [, m, d] = s.split('-'); return { en: `${MONTH[+m - 1]} ${+d}`, zh: `${+m} 月 ${+d} 日` }; };

async function writing() {
  const [w, th] = await Promise.all([get('data/writing.json'), get('data/thoughts.json')]);
  const posts = w?.posts || [], items = th?.items || [];
  const sec = document.getElementById('writing');
  if (!posts.length && !items.length) { sec.remove(); return; }
  const ol = sec.querySelector('[data-posts]');
  ol.innerHTML = posts.slice(0, 3).map((p, i) => {
    const d = ym(p.date), tag = p.url ? 'a' : 'div';
    return `<li><${tag} class="post${i ? '' : ' is-lead'}"${p.url ? ` href="${esc(p.url)}"` : ''}>
      <span class="post-title serif" ${both(p.title)}>${esc(t(p.title))}</span>
      <span class="post-meta"><span ${both(d)}>${d.en}</span> · <span ${both({ en: p.minutes + ' min', zh: p.minutes + ' 分钟' })}>${p.minutes} min</span></span>
      ${!i && p.excerpt ? `<span class="post-ex" ${both(p.excerpt)}>${esc(t(p.excerpt))}</span>` : ''}
    </${tag}></li>`;
  }).join('');
  if (!posts.length) ol.remove();
  const tl = sec.querySelector('[data-thoughts]');
  tl.innerHTML = items.slice(0, 3).map((x, i) => { const d = md(x.date);
    return `<li><span class="th-date${i ? '' : ' is-new'}" ${both(d)}>${d.en}</span><span class="th-text" ${both(x.text)}>${esc(t(x.text))}</span></li>`; }).join('');
  if (!items.length) sec.querySelector('.thoughts').remove();
  applyLang(sec);
}

async function studio() {
  const s = await get('data/studio.json');
  const sec = document.getElementById('studio');
  const keys = [['books', 'Books', '书', 11], ['games', 'Games', '游戏', 22], ['anime', 'Anime', '动漫', 33], ['mood', 'Mood', '心情', 44]]
    .filter(([k]) => s?.[k]?.title);
  if (!keys.length) { sec.remove(); return; }
  const ul = sec.querySelector('[data-windows]');
  ul.innerHTML = keys.map(([k, en, zh, seed]) => { const x = s[k];
    return `<li class="win" tabindex="0">
      <span class="moon"><canvas data-scene="${k}" data-seed="${seed}" aria-hidden="true"></canvas></span>
      <span class="win-name serif" ${both({ en, zh })}>${en}</span>
      <span class="cap" ${both(x.label)}>${esc(t(x.label))}</span>
      <span class="win-val">${esc(x.title)}${x.meta ? ' · ' + esc(x.meta) : ''}</span>
    </li>`; }).join('');
  applyLang(sec);
  const io = new IntersectionObserver((es, ob) => es.forEach((e) => { if (e.isIntersecting) { paint(e.target, e.target.dataset.scene, +e.target.dataset.seed); ob.unobserve(e.target); } }), { rootMargin: '300px' });
  ul.querySelectorAll('canvas').forEach((c) => io.observe(c));
}

async function contact() {
  const s = await get('data/site.json');
  const sec = document.getElementById('contact');
  const a = sec.querySelector('[data-email]');
  if (s?.email) { a.href = 'mailto:' + s.email; a.textContent = s.email; } else a.remove();
  const links = [['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['resume', 'Résumé']].filter(([k]) => s?.[k]);
  sec.querySelector('[data-links]').innerHTML = links.map(([k, n]) => `<a href="${esc(s[k])}" target="_blank" rel="noopener">${n} ↗</a>`).join('');
}

await Promise.all([writing(), studio(), contact()]);
watch();
