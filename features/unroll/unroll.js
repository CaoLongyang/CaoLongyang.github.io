/* ============================================================
   unroll · 开场编排（自动播放）
   打开页面 0.3 秒后自己开始：解绳 → 合遮幅 → 卷转正摆到右端 → 滚开 → 显字
   开场中点击 / 按键 / 滚轮：快进，0.3 秒内到位
   管：body.opened（已展开）· body.settled（可以操作）· body.closing（收卷中）· body.ff（快进中）
   听：intro:replay · scroll:rollup ；页面上 data-action="replay" / "rollup" 的按钮
   发：scroll:opened { instant } / scroll:closed
   ============================================================ */

import { EV, emit, on } from '../../core/events.js';
import { KEYS, get, set, remove } from '../../core/store.js';
import { reduced, wait } from '../../core/motion.js';

const body = document.body;
const IDLE = 300;        // 打开页面后先静置一下，让人看清这是一卷东西
const SETTLE = 2200;     // 从开始到可以操作（加上静置 = 2.5 秒）

let state = 'closed';    // closed → opening → open → closing → closed
let finish = null;       // 快进时提前结束等待

function settleAfter(ms) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    finish = () => { clearTimeout(t); resolve(); };
  });
}

async function open(instant = false) {
  if (state !== 'closed') return;
  state = 'opening';
  if (instant) body.classList.add('instant');
  await new Promise(requestAnimationFrame);

  body.classList.add('opened');
  set(KEYS.OPENED, '1');
  emit(EV.OPENED, { instant });

  await settleAfter(instant ? 30 : SETTLE);
  finish = null;
  body.classList.add('settled');
  body.classList.remove('instant');
  setTimeout(() => body.classList.remove('ff'), 400);
  state = 'open';
}

function fastForward() {
  if (state !== 'opening' || !finish) return;
  body.classList.add('ff');
  const f = finish;
  setTimeout(f, 320);
}

async function close() {
  if (state !== 'open') return;
  state = 'closing';
  emit(EV.GOTO, { id: document.querySelector('[data-panel]')?.id });
  await wait(reduced() ? 0 : 650);
  body.classList.remove('settled');
  body.classList.add('closing');
  body.classList.remove('opened');
  remove(KEYS.OPENED);
  await wait(reduced() ? 30 : 1500);
  body.classList.remove('closing');
  state = 'closed';
  emit(EV.CLOSED);
}

on(EV.ROLL_UP, close);
on(EV.INTRO_REPLAY, async () => {
  await close();
  await wait(400);
  open(false);
});

document.addEventListener('click', (e) => {
  if (e.target.closest?.('[data-action="rollup"]')) emit(EV.ROLL_UP);
  if (e.target.closest?.('[data-action="replay"]')) emit(EV.INTRO_REPLAY);
});

/* 开场中任何操作都快进 */
['pointerdown', 'keydown', 'wheel'].forEach((t) => addEventListener(t, fastForward, { passive: true }));

/* 老访客、带锚点进来的、要求减少动效的：直接是展开好的样子；其他人自动播放 */
if (get(KEYS.OPENED) === '1' || reduced() || location.hash.length > 1) open(true);
else whenQuiet().then(() => setTimeout(() => open(false), IDLE));

/* 等页面忙完再开场：段落载入、字体、图片解码都结束，主线程空下来以后才开始动。
   否则动画的前几帧正好撞上这些活，就会一卡一卡的。最多等 1.5 秒。 */
function whenQuiet() {
  const content = new Promise((r) => { on(EV.CONTENT_READY, r); });
  const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true }));
  const fonts = document.fonts?.ready || Promise.resolve();
  const idle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 400 }) : setTimeout(r, 50)));
  const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const ready = Promise.all([content, loaded, fonts]).then(idle).then(frames);
  return Promise.race([ready, wait(1500)]);
}
