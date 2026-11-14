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
      </div>
    </div>`;

  const album = layer.querySelector('.wk-album');
  const leaves = [...album.querySelectorAll('.wk-leaf')];
  let s = 0;                 // 已翻过的叶数
  let anim = 0;

  /* ---------- 画一叶 ---------- */
  const setAngle = (j, deg) => {
    const el = leaves[j];
    el.style.setProperty('--a', `${deg}deg`);
    const k = Math.sin((deg * Math.PI) / 180);
    el.style.setProperty('--sh', (k * 0.55).toFixed(3));
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
  };

  /* ---------- 拖 ---------- */
  let drag = null;
  album.addEventListener('pointerdown', (e) => {
    if (turning || e.button !== 0 || e.target.closest('a,button')) return;
    const r = album.getBoundingClientRect();
    const onLeft = e.clientX < r.left + r.width / 2;
    const j = onLeft ? s : s - 1;
    if (onLeft ? s >= L : s <= 1) return;
    drag = { j, onLeft, x0: e.clientX, w: r.width / 2, moved: false, last: [[performance.now(), e.clientX]] };
    album.setPointerCapture(e.pointerId);
  });
  album.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x0;
    if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; album.classList.add('is-grabbing'); restack(drag.j); }
    if (!drag.moved) return;
    const deg = drag.onLeft ? clamp((dx / drag.w) * 180, 0, 180) : 180 - clamp((-dx / drag.w) * 180, 0, 180);
    setAngle(drag.j, deg);
    drag.deg = deg;
    drag.last.push([performance.now(), e.clientX]);
    if (drag.last.length > 5) drag.last.shift();
  });
  const release = async (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    album.classList.remove('is-grabbing');
    if (!d.moved) {
      // 没拖，只点了一下：点左页往后翻，点右页往前翻
      if (!e.target.closest?.('a,button')) turn(d.onLeft ? 1 : -1);
      return;
    }
    const [[t1, x1]] = d.last, [t2, x2] = d.last[d.last.length - 1];
    const v = t2 > t1 ? (x2 - x1) / (t2 - t1) : 0;
    const done = d.onLeft ? d.deg > 90 || v > 0.6 : d.deg < 90 || v < -0.6;
    const ms = 360;
    if (done) await turn(d.onLeft ? 1 : -1, ms, d.deg);
    else { await tween(d.j, d.deg, d.onLeft ? 0 : 180, ms); restack(); }
  };
  album.addEventListener('pointerup', release);
  album.addEventListener('pointercancel', release);

  /* ---------- 目次、键盘 ---------- */
  album.addEventListener('click', (e) => {
    const b = e.target.closest('[data-goto-work]');
    if (b) go(+b.dataset.gotoWork + 2);
  });
  const onKey = (e) => {
    if (turning) return;
    const map = { ArrowLeft: 1, PageDown: 1, ArrowRight: -1, PageUp: -1 };
    if (map[e.key]) { e.preventDefault(); turn(map[e.key]); }
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
      if (start > 1) go(start);
    }, fromRect ? 360 : 120);
  }

  return {
    go: (id) => { const i = works.findIndex((w) => w.id === id); if (i >= 0) go(i + 2); },
    unmount() { removeEventListener('keydown', onKey); cancelAnimationFrame(anim); },
  };
}
