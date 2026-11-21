/* ============================================================
   scenes/works · 册页场景
   由 scene-router 按需加载：mount(layer, { sub, fromRect, instant }) → { unmount }
   内容来自 data/works.json，加一条就多一开

   叶的编排（L = 作品数 + 2 叶）：
     叶 0     正面：封面          背面：扉页
     叶 1     正面：目次          背面：作品 1
     叶 k+1   正面：作品 k 的做法  背面：作品 k+1
     叶 N+1   正面：作品 N 的做法  背面：封底
   第 s 开 = 已翻过 s 叶：右页是叶 s-1 的背面，左页是叶 s 的正面
   翻页方向：左页绕书脊往右翻 = 下一开（和手卷「往右拖是往前」一致）
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';
import { createSheet } from './sheet.js';

const base = new URL('../../', import.meta.url);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const t2 = (o) => `data-en="${esc(o.en)}" data-zh="${esc(o.zh)}"`;
const grain = '<span class="wk-paper-grain"></span>';

function faces(works) {
  const N = works.length;
  const intro = (w, i) => `
    <div class="wk-page">
      <span class="wk-no">${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}</span>
      <h3 class="wk-name">${esc(w.title)}</h3>
      <p class="wk-meta"><span>${esc(w.year)}</span> · <span ${t2(w.tags)}>${esc(w.tags.en)}</span></p>
      <div class="wk-frame"><svg viewBox="0 0 200 140" data-draw aria-hidden="true"><path pathLength="1" d="${esc(w.glyph)}"/></svg></div>
      <p class="wk-summary" ${t2(w.summary)}>${esc(w.summary.en)}</p>
      <div class="wk-foot">
        ${w.link
          ? `<a href="${esc(w.link)}" target="_blank" rel="noopener">GitHub ↗</a>`
          : `<span class="private" data-en="Private repository" data-zh="私有仓库">Private repository</span>`}
        ${w.progress ? `<span class="wk-tag" data-en="In progress" data-zh="进行中">In progress</span>` : ''}
      </div>
    </div>`;
  const method = (w) => `
    <div class="wk-page">
      <p class="wk-kicker" data-en="How it was made" data-zh="做法">How it was made</p>
      <ol class="wk-steps">
        ${w.steps.en.map((s, i) => `<li data-en="${esc(s)}" data-zh="${esc(w.steps.zh[i] || s)}">${esc(s)}</li>`).join('')}
      </ol>
      <p class="wk-hint" aria-hidden="true" data-en="drag this page to the right →" data-zh="把这一页往右翻 →">drag this page to the right →</p>
    </div>`;

  const leaves = [];
  leaves.push({
    front: `<div class="wk-face wk-front wk-cover"><span class="wk-slip"><b>画心</b><i></i></span></div>`,
    back: `<div class="wk-face wk-back wk-title-page">${grain}<div class="wk-page">
             <p class="wk-kicker" data-en="Album" data-zh="册页">Album</p>
             <h2 class="wk-big">画心</h2>
             <p class="wk-sub" data-en="Works — ${N} things I have made." data-zh="作品——做过的 ${N} 件东西。">Works — ${N} things I have made.</p>
             <span class="wk-seal" aria-hidden="true">卷</span>
           </div></div>`,
  });
  leaves.push({
    front: `<div class="wk-face wk-front">${grain}<div class="wk-page">
              <p class="wk-kicker" data-en="Contents" data-zh="目次">Contents</p>
              <ol class="wk-index">
                ${works.map((w, i) => `<li><button type="button" data-goto-work="${i}">
                  <span class="n">${String(i + 1).padStart(2, '0')}</span>
                  <span class="t">${esc(w.title)}</span>
                  <span class="y">${esc(w.year)}</span></button></li>`).join('')}
              </ol>
              <p class="wk-hint" aria-hidden="true" data-en="drag the page to the right, or press ←" data-zh="把纸往右翻，或按 ←">drag the page to the right, or press ←</p>
            </div></div>`,
    back: `<div class="wk-face wk-back">${grain}${intro(works[0], 0)}</div>`,
  });
  for (let k = 0; k < N; k++) {
    leaves.push({
      front: `<div class="wk-face wk-front">${grain}${method(works[k])}</div>`,
      back: k + 1 < N
        ? `<div class="wk-face wk-back">${grain}${intro(works[k + 1], k + 1)}</div>`
        : `<div class="wk-face wk-back wk-end">${grain}<div class="wk-page">
             <h2 class="wk-big" data-en="未完待续" data-zh="未完待续">未完待续</h2>
             <p class="wk-sub" data-en="More leaves are still drying." data-zh="还有几页，墨未干。">More leaves are still drying.</p>
             <span class="wk-seal" aria-hidden="true">终</span>
           </div></div>`,
    });
  }
  return leaves;
}

export async function mount(layer, { sub = '', fromRect = null, instant = false } = {}) {
  const works = await (await fetch(new URL('data/works.json', base))).json();
  const leavesHtml = faces(works);
  const L = leavesHtml.length;

  layer.innerHTML = `
    <div class="wk-stage">
      <div class="wk-album" role="region" aria-label="Works album">
        <div class="wk-board"></div>
        <div class="wk-base">${grain}<div class="wk-page" style="justify-content:flex-end;align-items:flex-start"><span class="wk-seal" aria-hidden="true">卷</span></div></div>
        ${leavesHtml.map((l, i) => `<div class="wk-leaf" data-i="${i}">${l.front}${l.back}</div>`).join('')}
        <div class="wk-cast" aria-hidden="true"></div>
        <span class="wk-curl wk-curl--left" aria-hidden="true"><i class="under"></i><i class="flap"></i></span>
        <span class="wk-curl wk-curl--right" aria-hidden="true"><i class="under"></i><i class="flap"></i></span>
      </div>
      <p class="wk-out" aria-hidden="true" data-en="click anywhere outside the album to go back" data-zh="点书外任意处，返回目录">click anywhere outside the album to go back</p>
    </div>`;

  const album = layer.querySelector('.wk-album');
  const leaves = [...album.querySelectorAll('.wk-leaf')];
  let s = 0;                 // 已翻过的叶数
  let anim = 0;

  /* ---------- 画一叶 ---------- */
  const cast = album.querySelector('.wk-cast');
  const setAngle = (j, deg) => {
    const el = leaves[j];
    el.style.setProperty('--a', `${deg}deg`);
    const k = Math.sin((deg * Math.PI) / 180);
    el.style.setProperty('--sh', (k * 0.55).toFixed(3));
    // 光泽带随角度扫过纸面；翻起来的纸在下面那页投下影子
    el.style.setProperty('--sheen', (deg / 180).toFixed(3));
    if (deg > 0.5 && deg < 179.5) {
      cast.style.opacity = (k * 0.55).toFixed(3);
      cast.dataset.side = deg < 90 ? 'left' : 'right';
    } else cast.style.opacity = '0';
  };
  const restack = (moving = -1) => {
    leaves.forEach((el, j) => {
      el.style.zIndex = j === moving ? 200 : j < s ? j + 1 : L - j + 1;
      el.style.visibility = (j < s - 2 || j > s + 1) && j !== moving ? 'hidden' : 'visible';
    });
  };
  const show = () => {
    album.querySelectorAll('.wk-face.is-shown').forEach((f) => f.classList.remove('is-shown'));
    leaves[s - 1]?.querySelector('.wk-back')?.classList.add('is-shown');
    leaves[s]?.querySelector('.wk-front')?.classList.add('is-shown');
    const w = s >= 2 && s - 2 < works.length ? works[s - 2] : null;
    history.replaceState(null, '', '#works' + (w ? '/' + w.id : ''));
  };
  const layout = () => { leaves.forEach((_, j) => setAngle(j, j < s ? 180 : 0)); restack(); show(); };

  /* ---------- 补间翻一叶 ---------- */
  const tween = (j, from, to, ms) => new Promise((res) => {
    cancelAnimationFrame(anim);
    if (reduced() || ms <= 0) { setAngle(j, to); res(); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = clamp((t - t0) / ms, 0, 1);
      const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      setAngle(j, from + (to - from) * e);
      if (k < 1) anim = requestAnimationFrame(step); else res();
    };
    anim = requestAnimationFrame(step);
  });

  let turning = false;
  const turn = async (dir, ms = 620, fromDeg) => {
    if (dir > 0 && s >= L) return;
    if (dir < 0 && s <= 1) return;        // 封面只在离开场景时合上
    turning = true;
    const j = dir > 0 ? s : s - 1;
    restack(j);
    await tween(j, fromDeg ?? (dir > 0 ? 0 : 180), dir > 0 ? 180 : 0, ms);
    s += dir;
    restack(); show();
    turning = false;
  };
  const go = async (target) => {
    target = clamp(target, 1, L);
    const many = Math.abs(target - s) > 1;
    while (s !== target) await turn(Math.sign(target - s), many ? 160 : 620);
    prefetch?.();
  };

  /* ============================================================
     有重量的书页（WebGL）。不支持时退回下面的 CSS 翻页
     ============================================================ */
  const sheet = reduced() ? { ok: false } : createSheet(album);
  if (sheet.ok) album.classList.add('has-sheet');
  const offLang = on(EV.LANG, () => sheet.ok && sheet.clear());

  const sideOf = (j) => (j < s ? 1 : -1);                 // 这一叶现在躺在哪边
  const spineX = () => { const r = album.getBoundingClientRect(); return r.left + r.width / 2; };
  // 指针的横向位置 → 手在弧上的位置；翻到一半时手离书脊近一点，纸有松量，中间就塌成弧
  const handAt = (x, k = .5) => {
    const r = album.getBoundingClientRect();
    const p = clamp((x - spineX()) / (r.width / 2), -1, 1);
    const th = Math.acos(-p), rad = sheet.L * (.97 - .14 * Math.sin(th));
    return { u: -Math.cos(th) * rad, v: Math.sin(th) * rad, k };
  };
  const prefetch = () => {
    if (!sheet.ok) return;
    if (s < L) sheet.prepare(leaves[s]);
    if (s > 1) sheet.prepare(leaves[s - 1]);
  };

  let session = null;     // 正在被物理接管的那一叶：{ j, side, mode: 'hover' | 'drag' | 'auto' }
  const begin = async (j, mode) => {
    const side = sideOf(j);
    session = { j, side, mode };
    turning = true;
    restack(j);
    let end;
    try {
      end = await sheet.start(leaves[j], side, () => { leaves[j].style.visibility = 'hidden'; });
    } catch (err) {
      // 这个浏览器不让把页面快照交给 WebGL（比如 Safari）：以后都用 CSS 翻页
      console.warn('[works] 书页物理不可用，改用 CSS 翻页', err);
      sheet.ok = false; album.classList.remove('has-sheet');
      leaves[j].style.visibility = ''; session = null; turning = false; restack();
      if (mode === 'auto') turn(side < 0 ? 1 : -1);
      return;
    }
    // 落定：换回网页
    if (end !== side) s += side < 0 ? 1 : -1;
    setAngle(j, end > 0 ? 180 : 0);
    leaves[j].style.visibility = '';
    session = null;
    turning = false;
    restack(); show(); prefetch();
  };

  /* 自动翻（点击、键盘）：一只看不见的手把外沿提起来、送过去，然后松手 */
  const autoTurn = (dir) => {
    if (dir > 0 && s >= L) return;
    if (dir < 0 && s <= 1) return;
    const j = dir > 0 ? s : s - 1;
    const side = sideOf(j);
    if (session && session.j === j) session.mode = 'auto';   // 悬停时已经掀起来了，直接接着送过去
    else if (!session) begin(j, 'auto');
    else return;
    const from = side < 0 ? 0 : Math.PI, to = side < 0 ? Math.PI * .8 : Math.PI * .2;
    const t0 = performance.now(), dur = 460;
    const tick = (t) => {
      if (session?.mode !== 'auto') return;
      const k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 2), th = from + (to - from) * e;
      const rad = sheet.L * (.97 - .14 * Math.sin(th));
      sheet.hand({ u: -Math.cos(th) * rad, v: Math.sin(th) * rad, k: .3 });
      if (k < 1) requestAnimationFrame(tick); else sheet.release();
    };
    requestAnimationFrame(tick);
  };

  /* ---------- CSS 翻页（后备，以及目次里一下翻好几页） ---------- */
  const ZONE = 0.16;
  const setCurl = (side, v) => album.style.setProperty(side === 'left' ? '--curlL' : '--curlR', v.toFixed(3));

  /* ---------- 指针 ---------- */
  let drag = null;
  album.addEventListener('pointermove', (e) => {
    const r = album.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (drag) {
      const dx = e.clientX - drag.x0;
      if (!drag.moved && Math.abs(dx) > 4) {
        drag.moved = true;
        album.classList.add('is-grabbing');
        if (sheet.ok) {
          if (session?.j === drag.j) session.mode = 'drag';      // 悬停掀起的那一叶，直接接着拖
          else if (!session) begin(drag.j, 'drag');
        } else restack(drag.j);
      }
      if (!drag.moved) return;
      if (sheet.ok) { sheet.hand(handAt(e.clientX)); return; }
      const deg = drag.onLeft ? clamp((dx / drag.w) * 180, 0, 180) : 180 - clamp((-dx / drag.w) * 180, 0, 180);
      setAngle(drag.j, deg);
      drag.deg = deg;
      drag.last.push([performance.now(), e.clientX]);
      if (drag.last.length > 5) drag.last.shift();
      return;
    }
    // 悬停在外沿：纸被轻轻掀起一点
    const nearL = s < L && x < ZONE, nearR = s > 1 && x > 1 - ZONE;
    if (!sheet.ok) { setCurl('left', nearL ? 1 - x / ZONE : 0); setCurl('right', nearR ? 1 - (1 - x) / ZONE : 0); return; }
    if (nearL || nearR) {
      const j = nearL ? s : s - 1, side = sideOf(j);
      if (!session && !turning) begin(j, 'hover');
      if (session?.mode === 'hover' && session.j === j) {
        const prox = nearL ? 1 - x / ZONE : 1 - (1 - x) / ZONE, th = .3 * prox;
        sheet.hand({ u: side * Math.cos(th) * sheet.L * .985, v: Math.sin(th) * sheet.L * .985, k: .12 });
      }
    } else if (session?.mode === 'hover') sheet.release();
  });
  album.addEventListener('pointerleave', () => {
    setCurl('left', 0); setCurl('right', 0);
    if (session?.mode === 'hover') sheet.release();
  });

  album.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('a,button')) return;
    if (turning && !(session?.mode === 'hover')) return;
    const r = album.getBoundingClientRect();
    const onLeft = e.clientX < r.left + r.width / 2;
    const j = onLeft ? s : s - 1;
    if (onLeft ? s >= L : s <= 1) return;
    drag = { j, onLeft, x0: e.clientX, w: r.width / 2, moved: false, last: [[performance.now(), e.clientX]] };
    album.setPointerCapture(e.pointerId);
  });
  const release = async (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    album.classList.remove('is-grabbing');
    if (!d.moved) {
      // 没拖，只点了一下：点左页往后翻，点右页往前翻
      if (e.target.closest?.('a,button')) return;
      if (sheet.ok) autoTurn(d.onLeft ? 1 : -1);
      else turn(d.onLeft ? 1 : -1);
      return;
    }
    if (sheet.ok) { sheet.release(); return; }                // 交给重力
    const [[t1, x1]] = d.last, [t2, x2] = d.last[d.last.length - 1];
    const v = t2 > t1 ? (x2 - x1) / (t2 - t1) : 0;
    const done = d.onLeft ? d.deg > 90 || v > 0.6 : d.deg < 90 || v < -0.6;
    if (done) await turn(d.onLeft ? 1 : -1, 360, d.deg);
    else { await tween(d.j, d.deg, d.onLeft ? 0 : 180, 360); restack(); }
  };
  album.addEventListener('pointerup', release);
  album.addEventListener('pointercancel', release);

  /* ---------- 点书外任意处：返回目录（烧掉） ---------- */
  const stage = layer.querySelector('.wk-stage');
  stage.addEventListener('click', (e) => {
    if (!album.contains(e.target)) emit(EV.SCENE_EXIT);
  });

  /* ---------- 目次、键盘 ---------- */
  album.addEventListener('click', (e) => {
    const b = e.target.closest('[data-goto-work]');
    if (b) go(+b.dataset.gotoWork + 2);
  });
  const onKey = (e) => {
    if (turning) return;
    const map = { ArrowLeft: 1, PageDown: 1, ArrowRight: -1, PageUp: -1 };
    if (map[e.key]) { e.preventDefault(); sheet.ok ? autoTurn(map[e.key]) : turn(map[e.key]); }
    if (e.key === 'Home') { e.preventDefault(); go(1); }
    if (e.key === 'End') { e.preventDefault(); go(L); }
  };
  addEventListener('keydown', onKey);

  /* ---------- 进场：从目录上那本册页的位置放大过来，再翻开封面 ---------- */
  const subIndex = works.findIndex((w) => w.id === sub);
  const start = subIndex >= 0 ? subIndex + 2 : 1;

  if (instant || reduced()) {
    s = start;
    album.classList.add('is-open');
    layout();
    setTimeout(prefetch, 50);
  } else {
    s = 0;
    layout();
    if (fromRect) {
      const r = album.getBoundingClientRect();
      const cover = { left: r.left, top: r.top, width: r.width / 2, height: r.height };
      const sx = fromRect.width / cover.width, sy = fromRect.height / cover.height;
      const dx = fromRect.left - cover.left, dy = fromRect.top - cover.top;
      album.style.transformOrigin = '0 0';
      album.style.transform = `translate(${dx}px,${dy}px) scale(${sx},${sy})`;
      void album.offsetWidth;
      album.classList.add('is-flip');
      album.style.transform = '';
      setTimeout(() => album.classList.remove('is-flip'), 500);
    }
    setTimeout(async () => {
      album.classList.add('is-open');
      await turn(1, 560);
      if (start > 1) await go(start);
      prefetch();
    }, fromRect ? 360 : 120);
  }

  return {
    burnTarget: () => album,
    burnPad: () => album.getBoundingClientRect().width * 0.03,
    go: (id) => { const i = works.findIndex((w) => w.id === id); if (i >= 0) go(i + 2); },
    unmount() { removeEventListener('keydown', onKey); cancelAnimationFrame(anim); offLang(); },
  };
}
